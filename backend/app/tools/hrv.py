from datetime import date, timedelta

import numpy as np

from app.models.athlete import DailyWellness
from app.models.metrics import HRVStatus

BASELINE_DAYS = 30


def hrv_baseline(wellness: list[DailyWellness], today: date) -> float:
    """Promedio de HRV de los 30 días previos a hoy."""
    start = today - timedelta(days=BASELINE_DAYS)
    values = [w.hrv_rmssd_ms for w in wellness if start <= w.date < today]
    if not values:
        raise ValueError("No hay datos de HRV para calcular el baseline")
    return float(np.mean(values))


def hrv_status(wellness: list[DailyWellness], today: date) -> HRVStatus:
    today_ms = next(w.hrv_rmssd_ms for w in wellness if w.date == today)
    baseline = hrv_baseline(wellness, today)
    return HRVStatus(
        today_ms=today_ms,
        baseline_30d_ms=round(baseline, 1),
        deviation_pct=round((today_ms - baseline) / baseline * 100, 1),
    )
