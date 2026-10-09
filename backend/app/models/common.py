from typing import Literal

Recommendation = Literal["train", "modify", "rest"]
ImpactLevel = Literal["low", "moderate", "high"]
Sport = Literal["swim", "bike", "run", "strength"]
Intensity = Literal[
    "recovery", "endurance", "tempo", "sweet_spot", "threshold", "vo2max", "anaerobic"
]
ReadinessBand = Literal["green", "amber", "red"]
LegsFeeling = Literal["fresh", "normal", "heavy", "sore"]
RacePhase = Literal["build", "taper", "race_week"]

# Orden de menor a mayor intensidad; lo usan las reglas y Workout.peak_intensity.
INTENSITY_ORDER: tuple[Intensity, ...] = (
    "recovery",
    "endurance",
    "tempo",
    "sweet_spot",
    "threshold",
    "vo2max",
    "anaerobic",
)
HIGH_INTENSITIES: frozenset[Intensity] = frozenset({"threshold", "vo2max", "anaerobic"})
