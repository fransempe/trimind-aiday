"""Carga los datos mock (fechas relativas a hoy) y aplica escenarios de demo.

Más adelante esta misma interfaz puede leer de Postgres.
"""

import json
from datetime import date, timedelta
from pathlib import Path

from pydantic import BaseModel

from app.models.api import AthleteStateUpdate
from app.models.athlete import Activity, AthleteProfile, DailyWellness, Race
from app.models.workout import Workout

MOCK_DIR = Path(__file__).resolve().parents[2] / "data" / "mock"


class AthleteData(BaseModel):
    today: date
    profile: AthleteProfile
    activities: list[Activity]
    wellness: list[DailyWellness]  # el último elemento es hoy
    race: Race
    plan: list[Workout]

    @property
    def wellness_today(self) -> DailyWellness:
        return self.wellness[-1]

    def planned_workout(self, day: date | None = None) -> Workout:
        day = day or self.today
        return next(w for w in self.plan if w.date == day)


def _read(name: str):
    return json.loads(MOCK_DIR.joinpath(name).read_text("utf-8"))


def _dated(item: dict, today: date) -> dict:
    item = dict(item)
    item["date"] = today + timedelta(days=item.pop("day_offset"))
    return item


def list_scenarios() -> list[str]:
    return sorted(p.stem for p in MOCK_DIR.joinpath("scenarios").glob("*.json"))


def load_athlete_data(scenario: str = "normal", today: date | None = None) -> AthleteData:
    today = today or date.today()
    patch = _read(f"scenarios/{scenario}.json")

    activities = [_dated(a, today) for a in _read("activities.json")]
    if yesterday := patch.get("yesterday_activity"):
        y = _dated(yesterday, today)
        activities = [a for a in activities if a["date"] != y["date"]] + [y]

    wellness = [_dated(w, today) for w in _read("wellness.json")]
    wellness.append({**patch["wellness_today"], "date": today})

    return AthleteData(
        today=today,
        profile=_read("athlete.json"),
        activities=sorted(activities, key=lambda a: a["date"]),
        wellness=wellness,
        race=_dated(_read("race.json"), today),
        plan=[_dated(w, today) for w in _read("plan.json")],
    )


def apply_state_update(data: AthleteData, update: AthleteStateUpdate) -> AthleteData:
    """Aplica los cambios del formulario de demo sobre el wellness de hoy."""
    changes = update.model_dump(
        exclude_none=True, exclude={"hrv_deviation_pct", "hard_run_yesterday"}
    )
    if update.hrv_deviation_pct is not None:
        from app.tools.hrv import hrv_baseline

        baseline = hrv_baseline(data.wellness, data.today)
        changes["hrv_rmssd_ms"] = round(baseline * (1 + update.hrv_deviation_pct / 100), 1)
    today = data.wellness_today.model_copy(update=changes)
    return data.model_copy(update={"wellness": [*data.wellness[:-1], today]})
