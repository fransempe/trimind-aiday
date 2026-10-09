import numpy as np

from app.models.athlete import DailyWellness
from app.models.common import ReadinessBand
from app.models.metrics import HRVStatus, LoadMetrics, Readiness, ReadinessComponents

WEIGHTS = {"hrv": 0.35, "sleep": 0.25, "load": 0.25, "subjective": 0.15}
LEGS_SCORE = {"fresh": 100, "normal": 75, "heavy": 40, "sore": 20}


def _clamp(x: float) -> int:
    return int(round(float(np.clip(x, 0, 100))))


def hrv_component(deviation_pct: float) -> int:
    # 85 en el baseline; cada punto % por debajo resta 3.5.
    return _clamp(85 + 3.5 * deviation_pct)


def sleep_component(hours: float) -> int:
    # 4 h o menos = 0, 8 h o más = 100.
    return _clamp((hours - 4) / 4 * 100)


def load_component(tsb: float) -> int:
    # TSB de -30 o menos = 0, +5 o más = 100.
    return _clamp((tsb + 30) / 35 * 100)


def subjective_component(wellness: DailyWellness) -> int:
    scores = [LEGS_SCORE[wellness.legs]]
    if wellness.rpe is not None:
        scores.append((10 - wellness.rpe) / 9 * 100)
    return _clamp(float(np.mean(scores)))


def band_for(score: int) -> ReadinessBand:
    if score < 40:
        return "red"
    if score < 70:
        return "amber"
    return "green"


def compute_readiness(wellness: DailyWellness, hrv: HRVStatus, load: LoadMetrics) -> Readiness:
    components = ReadinessComponents(
        hrv=hrv_component(hrv.deviation_pct),
        sleep=sleep_component(wellness.sleep_hours),
        load=load_component(load.tsb),
        subjective=subjective_component(wellness),
    )
    score = _clamp(sum(getattr(components, k) * w for k, w in WEIGHTS.items()))
    return Readiness(score=score, band=band_for(score), components=components)
