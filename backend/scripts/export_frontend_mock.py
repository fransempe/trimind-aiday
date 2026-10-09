"""Exporta los datos mock ya calculados por Python para el frontend.

Así el frontend en modo mock muestra exactamente los mismos números que el backend.
Uso (desde backend/): PYTHONPATH=. uv run python scripts/export_frontend_mock.py
"""

import json
from datetime import date
from pathlib import Path

import pandas as pd

from app.repositories.mock import list_scenarios, load_athlete_data
from app.tools.load import ATL_DAYS, CTL_DAYS, daily_tss
from app.tools.snapshot import build_snapshot
from app.tools.workouts import build_candidates

OUT = (
    Path(__file__).resolve().parents[2] / "frontend" / "src" / "lib" / "mock" / "athlete-data.json"
)
TODAY = date(2026, 1, 1)  # fecha ancla; el frontend trabaja con day_offset


def offset(d: date) -> int:
    return (d - TODAY).days


def daily_series(scenario: str) -> list[dict]:
    data = load_athlete_data(scenario, today=TODAY)
    tss = daily_tss(data.activities, TODAY)
    atl = tss.ewm(alpha=1 / ATL_DAYS, adjust=True).mean()
    ctl = tss.ewm(alpha=1 / CTL_DAYS, adjust=True).mean()
    minutes = pd.DataFrame(
        [
            {"date": pd.Timestamp(a.date), "sport": a.sport, "min": a.duration_min}
            for a in data.activities
        ]
    ).pivot_table(index="date", columns="sport", values="min", aggfunc="sum", fill_value=0)
    wellness = {pd.Timestamp(w.date): w for w in data.wellness}
    hrv = pd.Series({k: w.hrv_rmssd_ms for k, w in wellness.items()}).sort_index()
    baseline = hrv.shift(1).rolling(30, min_periods=7).mean()

    rows = []
    for ts in tss.index:
        w = wellness[ts]
        rows.append(
            {
                "day_offset": offset(ts.date()),
                "tss": round(float(tss[ts]), 1),
                "atl": round(float(atl[ts]), 1),
                "ctl": round(float(ctl[ts]), 1),
                "tsb": round(float(ctl[ts] - atl[ts]), 1),
                **{
                    f"{s}_min": float(minutes.get(s, {}).get(ts, 0) or 0)
                    for s in ("swim", "bike", "run")
                },
                "hrv_ms": w.hrv_rmssd_ms,
                "hrv_baseline_ms": None if pd.isna(baseline[ts]) else round(float(baseline[ts]), 1),
                "sleep_hours": w.sleep_hours,
                "resting_hr_bpm": w.resting_hr_bpm,
            }
        )
    return rows


def main() -> None:
    scenarios = {}
    for name in list_scenarios():
        data = load_athlete_data(name, today=TODAY)
        snap = build_snapshot(data)
        scenarios[name] = {
            "snapshot": json.loads(snap.model_dump_json()),
            "activities": [
                {**json.loads(a.model_dump_json(exclude={"date"})), "day_offset": offset(a.date)}
                for a in data.activities
            ],
            "daily": daily_series(name),
        }

    base = load_athlete_data("normal", today=TODAY)
    candidates = build_candidates(base.planned_workout(), base.profile.ftp_w)
    payload = {
        "generated_from": "backend/scripts/export_frontend_mock.py",
        "anchor_date": TODAY.isoformat(),
        "candidates": [json.loads(c.model_dump_json()) for c in candidates],
        "scenarios": scenarios,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), "utf-8")
    print(f"OK -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
