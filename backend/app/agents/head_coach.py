"""Head Coach: combina las opiniones de los especialistas y decide.

Recibe solo opiniones estructuradas y variantes candidatas, nunca datos crudos. No conoce a
los especialistas por nombre: sumar uno nuevo no requiere cambios acá.
"""

import logging

from pydantic import BaseModel

from app.agents.base import COMMON_RULES
from app.config import settings
from app.llm import LLMError, structured, to_json
from app.models.common import ImpactLevel
from app.models.decision import CoachDecision, CoachDraft, Disagreement
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinion
from app.models.rules import RuleViolation
from app.models.workout import WorkoutCandidate

log = logging.getLogger(__name__)

SYSTEM = f"""Sos el Head Coach de un staff de entrenadores de triatlón.
Recibís las opiniones estructuradas de tus especialistas y una lista de variantes de
entrenamiento ya calculadas. Tu trabajo es arbitrar cuando no coinciden y elegir UNA variante.
Criterio: la salud y la recuperación pesan más que un estímulo extra, sobre todo cerca de la
carrera. Si los especialistas coinciden en que se puede entrenar, mantené el plan.
{COMMON_RULES}
Respondé SOLO con un JSON con esta forma:
{{
  "selected_candidate_id": "<id de una variante>",
  "confidence": número 0-1,
  "primary_reason": "una frase corta, la razón principal",
  "explanation": "2 o 3 frases para el atleta, citando los números de las opiniones",
  "impact_factors": {{"<factor>": "low" | "moderate" | "high"}},
  "disagreements": [{{"agents": ["<agente>", "..."], "topic": "...", "resolution": "..."}}]
}}
disagreements va vacío si todos coinciden.
"""

ANSWER_SYSTEM = f"""Sos el Head Coach de un staff de entrenadores de triatlón. El atleta hizo
una pregunta y tus especialistas ya opinaron. Respondele en 3 a 5 frases, integrando las
opiniones y citando sus números. Si la pregunta es médica, recomendá consultar a un profesional.
{COMMON_RULES}
Respondé SOLO con un JSON: {{"answer": "..."}}
"""

LEVEL = {"low": 0, "moderate": 1, "high": 2}


class AnswerDraft(BaseModel):
    answer: str


def merge_factors(opinions: list[AgentOpinion]) -> dict[str, ImpactLevel]:
    merged: dict[str, ImpactLevel] = {}
    for o in opinions:
        for k, v in o.impact_factors.items():
            if k not in merged or LEVEL[v] > LEVEL[merged[k]]:
                merged[k] = v
    return merged


def heuristic_draft(snap: AthleteSnapshot, opinions: list[AgentOpinion]) -> CoachDraft:
    """Decisión determinista (modo fake, falla del LLM o último recurso tras las reglas)."""
    r = snap.readiness
    if r.score < 20:
        chosen = "descanso"
    elif r.band == "red" or (
        r.band == "amber" and (snap.hrv.deviation_pct <= -10 or snap.wellness_today.sleep_hours < 6)
    ):
        chosen = "z2_estimulos"
    else:
        chosen = "plan"
    decision = {"plan": "train", "z2_estimulos": "modify", "descanso": "rest"}[chosen]
    agreeing = [o for o in opinions if o.recommendation == decision] or opinions
    dissent = [o.agent for o in opinions if o.recommendation != decision]
    reasons = {
        "plan": (
            "Los indicadores acompañan: se mantiene el plan.",
            f"Readiness {r.score}/100 y HRV {snap.hrv.deviation_pct:+.0f}% respecto del "
            "baseline. El cuerpo está listo para absorber la sesión clave de la semana.",
        ),
        "z2_estimulos": (
            "Hoy la recuperación vale más que el estímulo extra.",
            f"Readiness {r.score}/100, HRV {snap.hrv.deviation_pct:+.0f}% y la "
            f"carrera a {snap.days_to_race} días. Se cambia la sesión de calidad por "
            "Z2 con estímulos cortos: mantiene la activación sin sumar fatiga.",
        ),
        "descanso": (
            "Descanso total: la recuperación está muy comprometida.",
            f"Readiness {r.score}/100. Un día libre ahora protege la semana de carrera.",
        ),
    }
    return CoachDraft(
        selected_candidate_id=chosen,
        confidence=round(sum(o.confidence for o in agreeing) / len(agreeing), 2),
        primary_reason=reasons[chosen][0],
        explanation=reasons[chosen][1],
        impact_factors=merge_factors(opinions),
        disagreements=[
            Disagreement(
                agents=dissent,
                topic="Intensidad de la sesión de hoy",
                resolution="Se prioriza la recuperación cerca de la carrera."
                if decision != "train"
                else "Los indicadores de recuperación están en verde.",
            )
        ]
        if dissent
        else [],
    )


async def decide(
    snap: AthleteSnapshot,
    opinions: list[AgentOpinion],
    candidates: list[WorkoutCandidate],
    violations: list[RuleViolation] | None = None,
    force_heuristic: bool = False,
) -> CoachDecision:
    ids = {c.id for c in candidates}
    draft: CoachDraft | None = None
    if settings.llm_mode == "live" and not force_heuristic:
        user = (
            "Opiniones de los especialistas:\n"
            f"{to_json([o.model_dump(exclude={'model', 'latency_ms'}) for o in opinions])}\n\n"
            "Variantes disponibles (elegí una por id):\n"
            f"{to_json([c.model_dump(include={'id', 'decision', 'description'}) | {'title': c.workout.title if c.workout else 'Descanso'} for c in candidates])}"  # noqa: E501
        )
        if violations:
            user += (
                "\n\nTu decisión anterior violó estas reglas. Elegí otra variante:\n"
                + "\n".join(f"- {v.message}" for v in violations)
            )
        try:
            result = await structured(CoachDraft, SYSTEM, user, settings.coach_model)
            if result.value.selected_candidate_id in ids:
                draft = result.value
            else:
                log.warning(
                    "Head Coach eligió un id inexistente: %s", result.value.selected_candidate_id
                )
        except LLMError as e:
            log.error("Head Coach usa heurística por error del LLM: %s", e)
    draft = draft or heuristic_draft(snap, opinions)

    chosen = next(c for c in candidates if c.id == draft.selected_candidate_id)
    return CoachDecision(
        decision=chosen.decision,
        original_workout=snap.planned_workout,
        new_workout=chosen.workout if chosen.decision == "modify" else None,
        confidence=draft.confidence,
        primary_reason=draft.primary_reason,
        explanation=draft.explanation,
        impact_factors=draft.impact_factors or merge_factors(opinions),
        opinions=opinions,
        disagreements=draft.disagreements,
    )


async def answer(question: str, opinions: list[AgentOpinion]) -> str:
    if settings.llm_mode == "live":
        user = f"Pregunta: {question}\n\nOpiniones:\n{to_json([o.model_dump() for o in opinions])}"
        try:
            return (
                await structured(AnswerDraft, ANSWER_SYSTEM, user, settings.coach_model)
            ).value.answer
        except LLMError as e:
            log.error("Respuesta heurística por error del LLM: %s", e)
    return " ".join(o.observations[0] for o in opinions)
