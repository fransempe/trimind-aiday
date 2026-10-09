from datetime import date

from app.models.athlete import Race
from app.models.common import RacePhase


def days_to_race(race: Race, today: date) -> int:
    return (race.date - today).days


def race_phase(days: int) -> RacePhase:
    if days <= 7:
        return "race_week"
    if days <= 21:
        return "taper"
    return "build"
