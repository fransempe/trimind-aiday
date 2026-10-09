from app.agents.base import Specialist
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinionDraft


class PerformanceAgent(Specialist):
    """Especialista beta: se suma al staff sin tocar el Head Coach."""

    name = "performance"
    description = "FTP, umbrales, progresión de rendimiento y zonas de potencia."
    factors = ("progresion_ftp", "estimulo_planificado")
    role_prompt = (
        "Sos el Performance Agent de un staff de entrenadores de triatlón. Defendés la "
        "progresión del rendimiento: evaluás cuánto aporta la sesión de hoy al FTP y a los "
        "umbrales, y qué se pierde si se recorta."
    )

    def context(self, snap: AthleteSnapshot) -> dict:
        return {
            "ftp_w": snap.profile.ftp_w,
            "w_kg": round(snap.profile.ftp_w / snap.profile.weight_kg, 2),
            "sesion_planificada": snap.planned_workout.model_dump(include={"title", "steps"}),
            "ctl": snap.load.ctl,
            "dias_a_la_carrera": snap.days_to_race,
            "readiness_banda": snap.readiness.band,
        }

    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        obs = [
            f"Con un FTP de {snap.profile.ftp_w} W, el trabajo de sweet spot sostiene el umbral.",
            "Es el último estímulo de umbral antes de la carrera.",
        ]
        if snap.readiness.band == "red":
            obs.append(
                "Recortar la sesión cuesta poco en forma, pero conviene mantener algo de "
                "intensidad."
            )
            return AgentOpinionDraft(
                recommendation="train",
                score=55,
                confidence=0.52,
                observations=obs,
                impact_factors={"progresion_ftp": "moderate"},
            )
        return AgentOpinionDraft(
            recommendation="train",
            score=80,
            confidence=0.7,
            observations=obs,
            impact_factors={"progresion_ftp": "moderate"},
        )
