"""Reglas duras validadas en código sobre la decisión del Head Coach."""

import re

from app.models.decision import CoachDecision
from app.models.metrics import AthleteSnapshot
from app.models.rules import RulesResult, RuleViolation

# Con readiness en rojo solo se permite hasta tempo.
INTENSE_FOR_RED = {"sweet_spot", "threshold", "vo2max", "anaerobic"}
VO2 = {"vo2max", "anaerobic"}
MEDICAL_TERMS = re.compile(
    r"\b(diagn[oó]stic\w*|patolog\w*|enfermedad\w*|s[ií]ndrome|lesi[oó]n|lesionad\w*|"
    r"infecci[oó]n|medicaci[oó]n|medicament\w*|tratamiento|arritmia|sobreentrenamiento cr[oó]nico)\b",
    re.IGNORECASE,
)
SAFE_MEDICAL_CONTEXT = re.compile(
    r"(no (es|constituye) (un )?diagn[oó]stico|consult\w+ (a|con) un "
    r"profesional)",
    re.IGNORECASE,
)


def final_workout(decision: CoachDecision):
    if decision.decision == "rest":
        return None
    return decision.new_workout or decision.original_workout


def check(decision: CoachDecision, snap: AthleteSnapshot) -> RulesResult:
    violations: list[RuleViolation] = []
    workout = final_workout(decision)

    if workout and snap.readiness.band == "red" and workout.peak_intensity in INTENSE_FOR_RED:
        violations.append(
            RuleViolation(
                rule_id="red_readiness_high_intensity",
                message=f"Readiness en rojo ({snap.readiness.score}/100): no se puede indicar "
                f"intensidad {workout.peak_intensity}. Máximo permitido: tempo.",
            )
        )
    if workout and snap.days_to_race <= 7 and workout.peak_intensity in VO2:
        violations.append(
            RuleViolation(
                rule_id="vo2max_race_week",
                message=f"Faltan {snap.days_to_race} días para la carrera: no se permiten sesiones de "
                "VO2max.",
            )
        )
    text = " ".join([decision.primary_reason, decision.explanation])
    if MEDICAL_TERMS.search(SAFE_MEDICAL_CONTEXT.sub("", text)):
        violations.append(
            RuleViolation(
                rule_id="medical_tone",
                message="El texto tiene tono de diagnóstico médico. Reescribilo como recomendación de "
                "entrenamiento, sin términos clínicos.",
            )
        )
    return RulesResult(violations=violations)
