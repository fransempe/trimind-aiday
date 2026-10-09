"""Variantes candidatas del entrenamiento del día.

Los vatios salen del FTP acá, en Python. El Head Coach solo elige una por id.
"""

from app.models.workout import PowerTarget, Workout, WorkoutCandidate, WorkoutStep


def _w(ftp: int, pct: float) -> int:
    """Porcentaje de FTP redondeado a múltiplos de 5 W."""
    return int(round(ftp * pct / 5) * 5)


def _power(ftp: int, low: float, high: float) -> PowerTarget:
    return PowerTarget(low_w=_w(ftp, low), high_w=_w(ftp, high))


def _tss(minutes: float, intensity_factor: float) -> float:
    return round(minutes / 60 * intensity_factor**2 * 100, 1)


def build_candidates(planned: Workout, ftp: int) -> list[WorkoutCandidate]:
    z2 = _power(ftp, 0.65, 0.70)
    stim = _w(ftp, 0.815)
    z2_with_stimuli = Workout(
        id=f"{planned.id}_z2_estimulos",
        date=planned.date,
        sport=planned.sport,
        title=f"60' Z2 a {z2.low_w}-{z2.high_w} W + 3x2' a {stim} W",
        steps=[
            WorkoutStep(duration_min=60, intensity="endurance", power=z2),
            WorkoutStep(
                repeat=3,
                duration_min=2,
                intensity="tempo",
                power=PowerTarget(low_w=stim - 5, high_w=stim + 5),
                recovery_min=3,
            ),
        ],
        planned_tss=_tss(60, 0.68) + _tss(6, 0.81),
    )
    easy = _power(ftp, 0.55, 0.65)
    easy_spin = Workout(
        id=f"{planned.id}_z2_suave",
        date=planned.date,
        sport=planned.sport,
        title=f"45' suaves a {easy.low_w}-{easy.high_w} W",
        steps=[WorkoutStep(duration_min=45, intensity="recovery", power=easy)],
        planned_tss=_tss(45, 0.6),
    )
    return [
        WorkoutCandidate(
            id="plan", decision="train", description="Mantener el plan original", workout=planned
        ),
        WorkoutCandidate(
            id="z2_estimulos",
            decision="modify",
            description="Bajar la intensidad: Z2 con estímulos cortos de tempo",
            workout=z2_with_stimuli,
        ),
        WorkoutCandidate(
            id="z2_suave",
            decision="modify",
            description="Rodaje regenerativo corto",
            workout=easy_spin,
        ),
        WorkoutCandidate(
            id="descanso", decision="rest", description="Descanso total", workout=None
        ),
    ]
