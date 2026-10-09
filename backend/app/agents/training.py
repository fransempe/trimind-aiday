from app.agents.base import Specialist
from app.models.common import HIGH_INTENSITIES
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinionDraft


class TrainingAgent(Specialist):
    name = "training"
    description = "Carga de entrenamiento, estímulo planificado, sesiones recientes."
    factors = ("carga_reciente", "estimulo_planificado", "balance_forma")
    role_prompt = (
        "Sos el Training Agent de un staff de entrenadores de triatlón. Evaluás si la sesión "
        "planificada para hoy tiene sentido según la carga reciente (ATL, CTL, TSB) y las "
        "sesiones de los últimos días."
    )

    def context(self, snap: AthleteSnapshot) -> dict:
        return {
            "sesion_planificada": snap.planned_workout.model_dump(
                include={"title", "steps", "planned_tss"}
            ),
            "intensidad_pico_planificada": snap.planned_workout.peak_intensity,
            "carga": snap.load.model_dump(),
            "actividades_ultimos_3_dias": [
                a.model_dump(include={"date", "sport", "title", "intensity", "tss", "rpe"})
                for a in snap.recent_activities
            ],
            "ftp_w": snap.profile.ftp_w,
        }

    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        yesterday = snap.recent_activities[-1] if snap.recent_activities else None
        hard = bool(yesterday and yesterday.intensity in HIGH_INTENSITIES)
        obs = [
            f"El plan de hoy es {snap.planned_workout.title}, la sesión clave de la semana.",
            f"Carga: CTL {snap.load.ctl:.0f}, ATL {snap.load.atl:.0f}, TSB {snap.load.tsb:.1f}.",
        ]
        if hard and yesterday:
            obs.append(
                f"Ayer hizo {yesterday.title} (TSS {yesterday.tss:.0f}): dos sesiones de "
                "calidad en 24 h."
            )
        if snap.readiness.band == "red" or (hard and snap.wellness_today.sleep_hours < 6):
            return AgentOpinionDraft(
                recommendation="modify",
                score=42,
                confidence=0.78,
                observations=obs,
                impact_factors={"carga_reciente": "high", "estimulo_planificado": "moderate"},
            )
        obs.append("La carga está controlada para sostener el estímulo planificado.")
        return AgentOpinionDraft(
            recommendation="train",
            score=84 if snap.readiness.band == "green" else 64,
            confidence=0.82,
            observations=obs,
            impact_factors={
                "carga_reciente": "moderate" if hard else "low",
                "estimulo_planificado": "high",
            },
        )
