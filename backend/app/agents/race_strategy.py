"""Estrategia por segmento generada por el Race Agent.

Python calcula los objetivos y el resumen de entrenamiento; el LLM elige el enfoque de pacing
(conservador, equilibrado o agresivo) y redacta notas, nutrición y el porqué. El ajuste numérico
de cada enfoque también se aplica en código.
"""

import logging
from datetime import timedelta

from app.agents.base import COMMON_RULES
from app.config import settings
from app.llm import LLMError, structured, to_json
from app.models.strategy import (
    Pacing,
    RaceStrategy,
    RaceStrategyDraft,
    RaceStrategyRequest,
    SegmentPlan,
    StrategySegment,
    TrainingSummary,
)
from app.repositories.mock import AthleteData
from app.tools.snapshot import build_snapshot

log = logging.getLogger(__name__)

# Ajuste de intensidad por enfoque: vatios ×, ritmos ÷ (más rápido = menos s/km).
PACING_FACTOR: dict[Pacing, float] = {"conservador": 0.97, "equilibrado": 1.0, "agresivo": 1.02}

SYSTEM = f"""Sos el Race Agent de un staff de entrenadores de triatlón. Recibís una carrera, sus
segmentos con objetivos ya calculados y un resumen de cómo viene entrenando el atleta.
Elegí el enfoque de pacing (conservador, equilibrado o agresivo) según si el entrenamiento
respalda los objetivos, y escribí una nota táctica corta por segmento (en el mismo orden),
pautas de nutrición e hidratación, y el porqué citando los números del resumen.
{COMMON_RULES}
Respondé SOLO con un JSON:
{{"pacing": "conservador" | "equilibrado" | "agresivo",
  "segment_notes": ["una por segmento, en orden"],
  "nutrition": ["2 a 4 pautas"],
  "rationale": ["2 a 4 frases"]}}
"""


def training_summary(data: AthleteData) -> TrainingSummary:
    snap = build_snapshot(data)
    since = data.today - timedelta(days=42)
    recent = [a for a in data.activities if a.date >= since]
    longest = lambda sport: max((a.duration_min for a in recent if a.sport == sport), default=0)  # noqa: E731
    return TrainingSummary(
        ctl=snap.load.ctl,
        tsb=snap.load.tsb,
        readiness=snap.readiness.score,
        ftp_w=snap.profile.ftp_w,
        longest_bike_min=longest("bike"),
        longest_run_min=longest("run"),
        weekly_hours=round(sum(a.duration_min for a in recent) / 60 / 6, 1),
    )


def heuristic_draft(req: RaceStrategyRequest, t: TrainingSummary) -> RaceStrategyDraft:
    run = next((s for s in req.segments if s.sport == "run"), None)
    run_short = bool(run and t.longest_run_min < run.eta_min * 0.75)
    pacing: Pacing = (
        "conservador"
        if t.ctl < 55 or t.readiness < 40 or run_short
        else ("agresivo" if t.ctl >= 80 and t.tsb > 0 else "equilibrado")
    )
    notes = {
        "swim": "Salida controlada los primeros 200 m y buscá pies a partir de la primera boya.",
        "bike": "Mantené la potencia dentro del rango; en subidas no pases el techo del rango por más de un minuto.",
        "run": "Primer tercio a la parte lenta del rango; aceleración progresiva solo en el último tercio.",
    }
    total = sum(s.eta_min for s in req.segments)
    nutrition = (
        ["Agua y electrolitos; no hace falta carbohidrato extra en menos de 75 minutos."]
        if total < 75
        else [
            "Desayuno 3 h antes con 1,5-2 g de carbohidratos por kg.",
            "60-90 g de carbohidratos por hora a partir del minuto 30.",
            "500-750 ml de líquido por hora con sodio, más si hace calor.",
        ]
    )
    rationale = [
        f"CTL {t.ctl:.0f} y {t.weekly_hours} h por semana en las últimas 6 semanas.",
        f"Fondo más largo: bici {t.longest_bike_min:.0f}' y run {t.longest_run_min:.0f}'.",
    ]
    if run_short:
        rationale.append(
            "El run más largo queda por debajo del 75% del tiempo de carrera a pie: se corre conservador."
        )
    rationale.append(f"Enfoque {pacing}: ajusta los objetivos ×{PACING_FACTOR[pacing]}.")
    return RaceStrategyDraft(
        pacing=pacing,
        segment_notes=[notes[s.sport] for s in req.segments],
        nutrition=nutrition,
        rationale=rationale,
    )


def apply_pacing(seg: SegmentPlan, pacing: Pacing, note: str) -> StrategySegment:
    f = PACING_FACTOR[pacing]
    if seg.unit == "W":
        low, high, eta = seg.target_low * f, seg.target_high * f, seg.eta_min / f ** (1 / 3)
    else:  # ritmo: más agresivo = menos segundos
        low, high, eta = seg.target_low / f, seg.target_high / f, seg.eta_min / f
    return StrategySegment(
        **seg.model_dump(exclude={"target_low", "target_high", "eta_min"}),
        target_low=round(low),
        target_high=round(high),
        eta_min=round(eta, 1),
        notes=note,
    )


async def generate(req: RaceStrategyRequest, data: AthleteData) -> RaceStrategy:
    t = training_summary(data)
    draft: RaceStrategyDraft | None = None
    model = "heuristic"
    if settings.llm_mode == "live":
        user = f"Carrera:\n{to_json(req)}\n\nEntrenamiento reciente:\n{to_json(t)}"
        try:
            result = await structured(RaceStrategyDraft, SYSTEM, user, settings.coach_model)
            if len(result.value.segment_notes) == len(req.segments):
                draft, model = result.value, result.model
        except LLMError as e:
            log.error("Estrategia heurística por error del LLM: %s", e)
    if draft is None:
        draft = heuristic_draft(req, t)
        model = "fake" if settings.llm_mode == "fake" else "heuristic-fallback"

    segments = [
        apply_pacing(s, draft.pacing, n)
        for s, n in zip(req.segments, draft.segment_notes, strict=True)
    ]
    transitions = 4 if len(segments) > 1 else 0
    return RaceStrategy(
        race_name=req.race_name,
        pacing=draft.pacing,
        segments=segments,
        estimated_finish_min=round(sum(s.eta_min for s in segments) + transitions, 1),
        nutrition=draft.nutrition,
        rationale=draft.rationale,
        training=t,
        model=model,
    )
