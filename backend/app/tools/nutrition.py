"""Objetivos de nutrición del día, calculados en código.

Rangos de las guías generales de nutrición deportiva: carbohidratos en g/kg/día según la carga y
proteína a 1,6-2,0 g/kg. El reparto por comida se corre hacia la comida previa a la sesión clave
y hacia la de recuperación posterior. El LLM nunca calcula estos gramos.
"""

from dataclasses import dataclass

from app.models.common import Intensity

INTENSE: frozenset[Intensity] = frozenset({"sweet_spot", "threshold", "vo2max", "anaerobic"})

# nivel: (g/kg bajo, g/kg alto, etiqueta)
LEVELS: dict[str, tuple[float, float, str]] = {
    "descanso": (3, 5, "Día de descanso"),
    "liviano": (4, 5, "Día liviano"),
    "moderado": (5, 7, "Día moderado"),
    "alto": (6, 10, "Día exigente"),
    "carga": (10, 12, "Carga de carbohidratos"),
}

MEALS = ("desayuno", "almuerzo", "merienda", "cena")
BASE_SPLIT = {"desayuno": 0.25, "almuerzo": 0.30, "merienda": 0.20, "cena": 0.25}
# Hora (HH:MM) hasta la que una sesión cae "después" de cada comida.
MEAL_CUTOFF = {"desayuno": "10:00", "almuerzo": "14:30", "merienda": "18:30", "cena": "23:59"}


@dataclass
class DayTargets:
    level: str
    label: str
    carbs_g_per_kg: tuple[float, float]
    carbs_g: tuple[int, int]
    protein_g: tuple[int, int]
    reason: str


def _round5(x: float) -> int:
    return int(round(x / 5) * 5)


def day_targets(weight_kg: float, minutes: float, intense: bool, days_to_race: int) -> DayTargets:
    if 0 <= days_to_race <= 2:
        level, reason = "carga", f"Faltan {days_to_race} días para la carrera: se cargan los depósitos de glucógeno."
    elif minutes <= 0:
        level, reason = "descanso", "Sin entrenamiento: comidas normales, priorizando verduras y proteína."
    elif minutes >= 150 or (intense and minutes >= 90):
        level = "alto"
        reason = f"{minutes:.0f} min de entrenamiento{' con bloques intensos' if intense else ''}: hace falta reponer bien."
    elif minutes >= 60 or intense:
        level = "moderado"
        reason = f"{minutes:.0f} min de entrenamiento{' con bloques intensos' if intense else ''}."
    else:
        level, reason = "liviano", f"{minutes:.0f} min de trabajo suave."
    low, high, label = LEVELS[level]
    return DayTargets(
        level=level,
        label=label,
        carbs_g_per_kg=(low, high),
        carbs_g=(_round5(low * weight_kg), _round5(high * weight_kg)),
        protein_g=(_round5(1.6 * weight_kg), _round5(2.0 * weight_kg)),
        reason=reason,
    )


def meal_for(time: str) -> str:
    """Comida que va antes de una sesión que arranca a `time`."""
    return next(m for m in MEALS if time <= MEAL_CUTOFF[m])


def meal_split(sessions: list[tuple[str, bool]]) -> dict[str, float]:
    """Reparte el día entre las 4 comidas. `sessions`: (hora, es_clave)."""
    split = dict(BASE_SPLIT)
    for time, key in sessions:
        before = meal_for(time)
        i = MEALS.index(before)
        split[before] += 0.08 if key else 0.04
        if i + 1 < len(MEALS):  # la comida siguiente es la de recuperación
            split[MEALS[i + 1]] += 0.05 if key else 0.02
    total = sum(split.values())
    return {m: v / total for m, v in split.items()}
