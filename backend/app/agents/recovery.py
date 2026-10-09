from app.agents.base import Specialist, fmt_pct, fmt_sleep
from app.models.common import ImpactLevel
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinionDraft

LEGS = {"fresh": "frescas", "normal": "normales", "heavy": "pesadas", "sore": "cargadas"}
BAND = {"green": "verde", "amber": "ámbar", "red": "rojo"}


class RecoveryAgent(Specialist):
    name = "recovery"
    description = "Sueño, HRV, fatiga percibida, readiness y recuperación."
    factors = ("sueno", "hrv", "fatiga_percibida")
    role_prompt = (
        "Sos el Recovery Agent de un staff de entrenadores de triatlón. Evaluás si el atleta "
        "está recuperado para absorber la sesión de hoy mirando sueño, HRV respecto de su "
        "baseline, fatiga percibida y el readiness score. Readiness en rojo (<40) implica no "
        "hacer intensidad."
    )

    def context(self, snap: AthleteSnapshot) -> dict:
        return {
            "readiness": snap.readiness.model_dump(),
            "hrv": snap.hrv.model_dump(),
            "sueno_horas": snap.wellness_today.sleep_hours,
            "fc_reposo_lpm": snap.wellness_today.resting_hr_bpm,
            "fatiga_percibida_rpe": snap.wellness_today.rpe,
            "sensacion_piernas": LEGS[snap.wellness_today.legs],
            "intensidad_pico_planificada": snap.planned_workout.peak_intensity,
        }

    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        w, r, dev = snap.wellness_today, snap.readiness, snap.hrv.deviation_pct
        obs = [
            f"Durmió {fmt_sleep(w.sleep_hours)}.",
            f"HRV {snap.hrv.today_ms:.0f} ms ({fmt_pct(dev)} respecto del baseline de 30 días).",
            f"Readiness {r.score}/100 ({BAND[r.band]}).",
        ]
        if w.rpe is not None or w.legs != "normal":
            rpe = f" y fatiga percibida {w.rpe}/10" if w.rpe is not None else ""
            obs.insert(2, f"Reporta piernas {LEGS[w.legs]}{rpe}.")
        factors: dict[str, ImpactLevel] = {
            "sueno": "high" if w.sleep_hours < 6 else "moderate" if w.sleep_hours < 7 else "low",
            "hrv": "high" if dev <= -15 else "moderate" if dev <= -7 else "low",
            "fatiga_percibida": "high"
            if (w.rpe or 0) >= 7 or w.legs in ("heavy", "sore")
            else "low",
        }
        rec = "rest" if r.score < 20 else "modify" if r.band != "green" else "train"
        return AgentOpinionDraft(
            recommendation=rec,
            score=r.score,
            confidence=0.86,
            observations=obs,
            impact_factors=factors,
        )
