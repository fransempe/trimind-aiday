from app.agents.base import Specialist, fmt_sleep
from app.models.common import ImpactLevel
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinionDraft
from app.tools.nutrition import INTENSE, day_targets


def _targets(snap: AthleteSnapshot):
    w = snap.planned_workout
    intense = any(s.intensity in INTENSE for s in w.steps)
    return day_targets(snap.profile.weight_kg, w.total_duration_min, intense, snap.days_to_race), intense


class NutritionAgent(Specialist):
    name = "nutrition"
    description = "Carbohidratos, hidratación, comidas del día y alimentación alrededor del entrenamiento."
    factors = ("disponibilidad_energetica", "recuperacion_nutricional")
    role_prompt = (
        "Sos el Nutrition Agent de un staff de entrenadores de triatlón. Evaluás si la "
        "alimentación del día puede sostener la sesión planificada: objetivo de carbohidratos y "
        "proteína (ya calculado), cuándo comer antes y después, y si el sueño o la fatiga piden "
        "priorizar la recuperación nutricional. No decidís la intensidad por tu cuenta: si la "
        "sesión es exigente y la recuperación viene floja, lo marcás para que el Head Coach lo pese."
    )

    def context(self, snap: AthleteSnapshot) -> dict:
        t, intense = _targets(snap)
        return {
            "peso_kg": snap.profile.weight_kg,
            "sesion_planificada": snap.planned_workout.title,
            "duracion_min": snap.planned_workout.total_duration_min,
            "tss_planificado": snap.planned_workout.planned_tss,
            "tiene_bloques_intensos": intense,
            "dias_a_carrera": snap.days_to_race,
            "fase": snap.race_phase,
            "sueno_horas": snap.wellness_today.sleep_hours,
            "readiness_banda": snap.readiness.band,
            "objetivo_dia": {
                "nivel": t.label,
                "carbohidratos_g": t.carbs_g,
                "carbohidratos_g_kg": t.carbs_g_per_kg,
                "proteina_g": t.protein_g,
            },
        }

    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        t, intense = _targets(snap)
        sleep = snap.wellness_today.sleep_hours
        obs = [
            f"{t.label}: {t.carbs_g[0]}-{t.carbs_g[1]} g de carbohidratos "
            f"({t.carbs_g_per_kg[0]:.0f}-{t.carbs_g_per_kg[1]:.0f} g/kg) y {t.protein_g[0]}-{t.protein_g[1]} g de proteína.",
        ]
        if intense:
            obs.append("La sesión tiene bloques intensos: llegar con 1-2 g/kg de carbohidratos 1 a 3 h antes.")
        if sleep < 6.5:
            obs.append(f"Durmió {fmt_sleep(sleep)}: conviene priorizar la comida de recuperación y la cena.")
        if snap.days_to_race <= 7:
            obs.append("Semana de carrera: comidas conocidas, nada nuevo, y subir carbohidratos los últimos 2 días.")
        weak = snap.readiness.band != "green" and intense
        factors: dict[str, ImpactLevel] = {
            "disponibilidad_energetica": "moderate" if intense else "low",
            "recuperacion_nutricional": "high" if sleep < 6 else "moderate" if weak else "low",
        }
        return AgentOpinionDraft(
            recommendation="modify" if weak and sleep < 6 else "train",
            score=55 if weak else 78,
            confidence=0.72,
            observations=obs[:4],
            impact_factors=factors,
        )
