"""Análisis de carreras completadas y base de conocimiento del atleta.

- Debrief: el Race Agent lee los tiempos (con ritmos calculados en Python) y el relato del atleta, y
  devuelve qué salió bien, qué mejorar y aprendizajes para el resto del staff.
- Base de conocimiento: el Head Coach resume cómo viene entrenando (datos calculados en Python), sus
  carreras y un análisis del atleta. Un resumen corto queda en memoria y se suma al contexto de los
  agentes, así lo tienen en cuenta en sus opiniones y respuestas.
"""

import logging
from datetime import timedelta

from app.agents.base import COMMON_RULES
from app.config import settings
from app.llm import LLMError, record_heuristic, structured, to_json
from app.models.knowledge import (
    KnowledgeBase,
    KnowledgeDraft,
    KnowledgeRequest,
    RaceDebrief,
    RaceDebriefDraft,
    RaceDebriefRequest,
    SegmentResult,
    SegmentStat,
    TrainingFacts,
)
from app.repositories.knowledge_store import set_context
from app.repositories.mock import AthleteData
from app.tools.snapshot import build_snapshot

log = logging.getLogger(__name__)

def fmt_time(s: int) -> str:
    h, rem = divmod(int(s), 3600)
    m, sec = divmod(rem, 60)
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def pace(seg: SegmentResult) -> str:
    if seg.sport == "bike":
        return f"{seg.distance_km / (seg.time_s / 3600):.1f} km/h"
    per = seg.time_s / (seg.distance_km * (10 if seg.sport == "swim" else 1))
    return f"{int(per // 60)}:{int(per % 60):02d} {'/100 m' if seg.sport == 'swim' else '/km'}"


# ---------------------------------------------------------------- debrief de carrera
DEBRIEF_SYSTEM = f"""Sos el Race Agent de un staff de entrenadores de triatlón. El atleta terminó una
carrera y te pasa sus tiempos (con ritmos ya calculados) y un relato de cómo le fue.
Analizá la carrera: un resumen de 2 a 3 frases, lo que salió bien, lo que conviene mejorar y
1 a 3 aprendizajes concretos sobre el atleta para que el resto del staff los tenga en cuenta.
Usá el relato del atleta: si menciona sensaciones, clima, nutrición o problemas, incorporalos.
{COMMON_RULES}
Respondé SOLO con un JSON:
{{"summary": "...", "highlights": ["..."], "improvements": ["..."], "insights": ["..."]}}
"""


def heuristic_debrief(req: RaceDebriefRequest, stats: list[SegmentStat], total: int) -> RaceDebriefDraft:
    longest = max(stats, key=lambda s: s.time_s)
    brief = req.brief.strip()
    return RaceDebriefDraft(
        summary=f"Terminó {req.race_name} en {fmt_time(total)}. El segmento más largo fue {longest.label.lower()} "
        f"({fmt_time(longest.time_s)} a {longest.pace}).",
        highlights=[f"{s.label}: {fmt_time(s.time_s)} ({s.pace})." for s in stats[:3]],
        improvements=["Revisar el ritmo de la segunda mitad del segmento más largo."]
        + (["Ajustar la estrategia de nutrición según lo que contaste del día."] if "nutri" in brief.lower() or "gel" in brief.lower() else []),
        insights=[f"Relato del atleta: {brief[:180]}"] if brief else ["Sin relato del atleta: cargar un brief suma contexto."],
    )


async def debrief(req: RaceDebriefRequest) -> RaceDebrief:
    stats = [SegmentStat(**s.model_dump(), pace=pace(s)) for s in req.segments]
    total = sum(s.time_s for s in req.segments) + req.transitions_s
    draft: RaceDebriefDraft | None = None
    model = "heuristic"
    if settings.llm_mode == "live":
        user = (
            f"Carrera: {req.race_name} ({req.distance}), hace {req.days_ago} días. Fuente de los tiempos: {req.source}.\n"
            f"Tiempo total: {fmt_time(total)} (transiciones {fmt_time(req.transitions_s)}).\n"
            f"Segmentos:\n{to_json([{**s.model_dump(), 'tiempo': fmt_time(s.time_s)} for s in stats])}\n"
            f"Relato del atleta: {req.brief or 'sin relato'}"
        )
        try:
            result = await structured(RaceDebriefDraft, DEBRIEF_SYSTEM, user, settings.specialist_model, label="race · análisis de carrera")
            draft, model = result.value, result.model
        except LLMError as e:
            log.error("Debrief heurístico por error del LLM: %s", e)
            record_heuristic("race · análisis de carrera")
    if draft is None:
        draft = heuristic_debrief(req, stats, total)
        model = "fake" if settings.llm_mode == "fake" else "heuristic-fallback"
    return RaceDebrief(**draft.model_dump(), race_name=req.race_name, total_s=total, segments=stats, model=model)


# ---------------------------------------------------------------- base de conocimiento
KNOWLEDGE_SYSTEM = f"""Sos el Head Coach de un staff de entrenadores de resistencia y escribís la base de
conocimiento de tu atleta: el documento que el resto del staff lee para conocerlo.
Recibís datos de entrenamiento ya calculados, su perfil y sus carreras (tiempos, relato y análisis).
- training_summary: 3 a 5 frases sobre cómo viene entrenando, citando los números.
- races_summary: 2 a 4 frases sobre las carreras que viene corriendo y qué muestran.
- athlete_profile: un análisis detallado (6 a 10 frases) de sus características como atleta:
  en qué disciplina es más fuerte, cómo responde a la carga, cómo se comporta en carrera.
- strengths, opportunities y next_focus: listas concretas y accionables.
{COMMON_RULES}
Respondé SOLO con un JSON:
{{"training_summary": "...", "races_summary": "...", "athlete_profile": "...",
  "strengths": ["..."], "opportunities": ["..."], "next_focus": ["..."]}}
"""


def training_facts(data: AthleteData, weight_kg: float) -> TrainingFacts:
    snap = build_snapshot(data)
    weeks = 6
    recent = [a for a in data.activities if a.date >= data.today - timedelta(days=7 * weeks)]
    sports = ("swim", "bike", "run")
    longest = lambda sport: max((a.duration_min for a in recent if a.sport == sport), default=0)  # noqa: E731
    return TrainingFacts(
        weeks=weeks,
        weekly_hours=round(sum(a.duration_min for a in recent) / 60 / weeks, 1),
        hours_by_sport={s: round(sum(a.duration_min for a in recent if a.sport == s) / 60 / weeks, 1) for s in sports},
        sessions_by_sport={s: sum(1 for a in recent if a.sport == s) for s in sports},
        ctl=round(snap.load.ctl, 1),
        tsb=round(snap.load.tsb, 1),
        ftp_w=snap.profile.ftp_w,
        ftp_w_kg=round(snap.profile.ftp_w / weight_kg, 2),
        longest_bike_min=longest("bike"),
        longest_run_min=longest("run"),
        readiness_today=snap.readiness.score,
    )


def heuristic_knowledge(req: KnowledgeRequest, f: TrainingFacts) -> KnowledgeDraft:
    top = max(f.hours_by_sport, key=f.hours_by_sport.get)
    low = min(f.hours_by_sport, key=f.hours_by_sport.get)
    name = {"swim": "natación", "bike": "ciclismo", "run": "running"}
    races = (
        " ".join(f"{r.race_name}: {fmt_time(r.total_s)} hace {r.days_ago} días." for r in req.races)
        or "Todavía no cargó resultados de carreras."
    )
    return KnowledgeDraft(
        training_summary=f"Viene entrenando {f.weekly_hours} h por semana en las últimas {f.weeks} semanas, con CTL "
        f"{f.ctl} y TSB {f.tsb:+}. La mayor parte del volumen es {name[top]} ({f.hours_by_sport[top]} h/semana).",
        races_summary=races,
        athlete_profile=f"Perfil {req.profile} con FTP {f.ftp_w} W ({f.ftp_w_kg} W/kg). Su disciplina con más volumen es "
        f"{name[top]} y la de menos, {name[low]}. Fondo más largo reciente: bici {f.longest_bike_min:.0f}' y run "
        f"{f.longest_run_min:.0f}'.",
        strengths=[f"Volumen consistente en {name[top]}.", f"FTP de {f.ftp_w_kg} W/kg."],
        opportunities=[f"Sumar volumen de {name[low]}.", "Cargar brief de cada carrera para afinar el análisis."],
        next_focus=["Mantener la consistencia semanal.", f"Una sesión técnica extra de {name[low]} por semana."],
    )


def context_text(name: str, kb: KnowledgeDraft) -> str:
    """Resumen corto para el prompt de los agentes."""
    return (
        f"Base de conocimiento de {name}. {kb.athlete_profile} "
        f"Fortalezas: {'; '.join(kb.strengths)}. Oportunidades: {'; '.join(kb.opportunities)}."
    )[:1500]


async def build_knowledge(req: KnowledgeRequest, data: AthleteData) -> KnowledgeBase:
    facts = training_facts(data, req.weight_kg)
    name = data.profile.name
    draft: KnowledgeDraft | None = None
    model = "heuristic"
    if settings.llm_mode == "live":
        user = (
            f"Atleta: {name}, {data.profile.age} años, {req.weight_kg} kg, {req.height_cm} cm. "
            f"Perfil: {req.profile}. Cómo venía entrenando: {req.fitness}.\n"
            f"Datos de entrenamiento:\n{to_json(facts)}\n"
            f"Carreras completadas:\n{to_json([r.model_dump() for r in req.races]) if req.races else 'ninguna cargada'}"
        )
        try:
            result = await structured(KnowledgeDraft, KNOWLEDGE_SYSTEM, user, settings.coach_model, label="head_coach · base de conocimiento")
            draft, model = result.value, result.model
        except LLMError as e:
            log.error("Base de conocimiento heurística por error del LLM: %s", e)
            record_heuristic("head_coach · base de conocimiento")
    if draft is None:
        draft = heuristic_knowledge(req, facts)
        model = "fake" if settings.llm_mode == "fake" else "heuristic-fallback"
    set_context(context_text(name, draft))
    return KnowledgeBase(**draft.model_dump(), athlete_name=name, facts=facts, model=model)
