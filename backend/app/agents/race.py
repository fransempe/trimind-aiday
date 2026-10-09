from app.agents.base import Specialist
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinionDraft


class RaceAgent(Specialist):
    name = "race"
    description = "Carrera objetivo, periodización, taper, estrategia y ritmos de carrera."
    factors = ("proximidad_carrera", "balance_forma")
    role_prompt = (
        "Sos el Race Agent de un staff de entrenadores de triatlón. Evaluás la sesión de hoy "
        "en función de la carrera objetivo: cuántos días faltan, en qué fase está (build, taper, "
        "race_week) y si la sesión ayuda a llegar fresco. A 7 días o menos no se hace VO2max."
    )

    def context(self, snap: AthleteSnapshot) -> dict:
        return {
            "carrera": snap.race.model_dump(mode="json"),
            "dias_a_la_carrera": snap.days_to_race,
            "fase": snap.race_phase,
            "tsb": snap.load.tsb,
            "readiness_banda": snap.readiness.band,
            "sesion_planificada": snap.planned_workout.title,
            "intensidad_pico_planificada": snap.planned_workout.peak_intensity,
        }

    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        obs = [
            f"Faltan {snap.days_to_race} días para {snap.race.name} "
            f"(carrera {snap.race.priority}).",
            "Semana de carrera: la prioridad es llegar fresco, no sumar forma."
            if snap.days_to_race <= 7
            else "Todavía hay margen para sumar carga antes del taper.",
        ]
        if snap.readiness.band != "green":
            obs.append(
                "Una sesión de calidad con baja recuperación no suma forma para la carrera "
                "y sí suma fatiga."
            )
            return AgentOpinionDraft(
                recommendation="modify",
                score=48,
                confidence=0.8,
                observations=obs,
                impact_factors={"proximidad_carrera": "high"},
            )
        obs.append(
            "Un último toque de intensidad moderada mantiene la activación sin "
            "comprometer el taper."
        )
        return AgentOpinionDraft(
            recommendation="train",
            score=76,
            confidence=0.74,
            observations=obs,
            impact_factors={"proximidad_carrera": "moderate"},
        )
