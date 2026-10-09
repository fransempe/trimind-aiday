from datetime import timedelta

from app.models.metrics import AthleteSnapshot
from app.repositories.mock import AthleteData
from app.tools.hrv import hrv_status
from app.tools.load import compute_load
from app.tools.race import days_to_race, race_phase
from app.tools.readiness import compute_readiness

RECENT_DAYS = 3


def build_snapshot(data: AthleteData) -> AthleteSnapshot:
    today = data.today
    load = compute_load(data.activities, today)
    hrv = hrv_status(data.wellness, today)
    days = days_to_race(data.race, today)
    since = today - timedelta(days=RECENT_DAYS)
    return AthleteSnapshot(
        date=today,
        profile=data.profile,
        wellness_today=data.wellness_today,
        load=load,
        hrv=hrv,
        readiness=compute_readiness(data.wellness_today, hrv, load),
        race=data.race,
        days_to_race=days,
        race_phase=race_phase(days),
        recent_activities=[a for a in data.activities if since <= a.date < today],
        planned_workout=data.planned_workout(),
    )
