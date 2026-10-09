from datetime import date, timedelta

import pytest

from app.models.api import AthleteStateUpdate
from app.models.athlete import Activity, DailyWellness
from app.repositories.mock import apply_state_update, load_athlete_data
from app.tools.hrv import hrv_status
from app.tools.load import compute_load
from app.tools.race import race_phase
from app.tools.readiness import band_for, sleep_component
from app.tools.snapshot import build_snapshot
from app.tools.workouts import build_candidates

TODAY = date(2026, 10, 7)


def _act(day_offset: int, tss: float) -> Activity:
    return Activity(
        id=f"a{day_offset}",
        date=TODAY + timedelta(days=day_offset),
        sport="bike",
        title="x",
        duration_min=60,
        tss=tss,
        intensity="endurance",
    )


def test_constant_load_gives_flat_atl_ctl():
    acts = [_act(-d, 60) for d in range(1, 43)]
    load = compute_load(acts, TODAY)
    assert load.atl == pytest.approx(60, abs=0.1)
    assert load.ctl == pytest.approx(60, abs=0.1)
    assert load.tsb == pytest.approx(0, abs=0.1)
    assert load.last_48h_tss == 120


def test_hard_day_yesterday_drops_tsb():
    base = [_act(-d, 60) for d in range(2, 43)]
    easy = compute_load([*base, _act(-1, 60)], TODAY)
    hard = compute_load([*base, _act(-1, 150)], TODAY)
    assert hard.atl > easy.atl
    assert hard.tsb < easy.tsb


def test_hrv_deviation():
    wellness = [
        DailyWellness(
            date=TODAY - timedelta(days=d), sleep_hours=7, hrv_rmssd_ms=60, resting_hr_bpm=48
        )
        for d in range(1, 31)
    ]
    wellness.append(DailyWellness(date=TODAY, sleep_hours=7, hrv_rmssd_ms=45, resting_hr_bpm=48))
    status = hrv_status(wellness, TODAY)
    assert status.baseline_30d_ms == 60
    assert status.deviation_pct == -25


def test_readiness_helpers():
    assert band_for(39) == "red" and band_for(40) == "amber" and band_for(70) == "green"
    assert sleep_component(4) == 0 and sleep_component(8.5) == 100
    assert race_phase(7) == "race_week" and race_phase(14) == "taper" and race_phase(30) == "build"


@pytest.mark.parametrize(
    ("scenario", "band"), [("normal", "green"), ("fatigued", "red"), ("recovered", "green")]
)
def test_demo_scenarios_readiness(scenario, band):
    snap = build_snapshot(load_athlete_data(scenario, today=TODAY))
    assert snap.readiness.band == band
    assert snap.days_to_race == 7
    assert snap.planned_workout.title == "3x15' a 250 W"


def test_fatigued_scenario_metrics():
    snap = build_snapshot(load_athlete_data("fatigued", today=TODAY))
    assert snap.hrv.deviation_pct == pytest.approx(-21, abs=1.5)
    assert snap.recent_activities[-1].intensity == "threshold"


def test_state_update_with_hrv_deviation():
    data = load_athlete_data("normal", today=TODAY)
    data = apply_state_update(
        data, AthleteStateUpdate(sleep_hours=5.2, hrv_deviation_pct=-21, rpe=8, legs="heavy")
    )
    snap = build_snapshot(data)
    assert snap.hrv.deviation_pct == pytest.approx(-21, abs=0.2)
    assert snap.readiness.band in ("red", "amber")


def test_candidates_watts_from_ftp():
    planned = load_athlete_data(today=TODAY).planned_workout()
    cands = {c.id: c for c in build_candidates(planned, ftp=270)}
    assert cands["z2_estimulos"].workout.title == "60' Z2 a 175-190 W + 3x2' a 220 W"
    assert cands["z2_estimulos"].workout.peak_intensity == "tempo"
    assert cands["plan"].workout.peak_intensity == "sweet_spot"
    assert cands["descanso"].workout is None
