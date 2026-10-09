from datetime import date, timedelta

import pandas as pd

from app.models.athlete import Activity
from app.models.metrics import LoadMetrics

ATL_DAYS = 7
CTL_DAYS = 42


def daily_tss(activities: list[Activity], today: date, days: int = CTL_DAYS) -> pd.Series:
    """TSS por día de los últimos `days` días, sin incluir hoy (días sin actividad = 0)."""
    idx = pd.date_range(today - timedelta(days=days), today - timedelta(days=1), freq="D")
    if not activities:
        return pd.Series(0.0, index=idx)
    df = pd.DataFrame(
        {"date": pd.to_datetime([a.date for a in activities]), "tss": [a.tss for a in activities]}
    )
    return df.groupby("date")["tss"].sum().reindex(idx, fill_value=0.0)


def compute_load(activities: list[Activity], today: date) -> LoadMetrics:
    """ATL/CTL como EWMA del TSS diario; TSB = CTL - ATL."""
    tss = daily_tss(activities, today)
    atl = tss.ewm(alpha=1 / ATL_DAYS, adjust=True).mean().iloc[-1]
    ctl = tss.ewm(alpha=1 / CTL_DAYS, adjust=True).mean().iloc[-1]
    return LoadMetrics(
        atl=round(float(atl), 1),
        ctl=round(float(ctl), 1),
        tsb=round(float(ctl - atl), 1),
        last_48h_tss=round(float(tss.iloc[-2:].sum()), 1),
    )
