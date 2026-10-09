from datetime import date

from pydantic import BaseModel, Field

from app.models.athlete import Activity, AthleteProfile, DailyWellness, Race
from app.models.common import RacePhase, ReadinessBand
from app.models.workout import Workout


class LoadMetrics(BaseModel):
    atl: float = Field(description="Carga aguda, EWMA de 7 días")
    ctl: float = Field(description="Carga crónica, EWMA de 42 días")
    tsb: float = Field(description="Balance de forma: ctl - atl")
    last_48h_tss: float


class HRVStatus(BaseModel):
    today_ms: float
    baseline_30d_ms: float
    deviation_pct: float


class ReadinessComponents(BaseModel):
    hrv: int = Field(ge=0, le=100)
    sleep: int = Field(ge=0, le=100)
    load: int = Field(ge=0, le=100)
    subjective: int = Field(ge=0, le=100)


class Readiness(BaseModel):
    score: int = Field(ge=0, le=100)
    band: ReadinessBand
    components: ReadinessComponents


class AthleteSnapshot(BaseModel):
    """Todo lo que calcula Python. Es lo único que ven los especialistas."""

    date: date
    profile: AthleteProfile
    wellness_today: DailyWellness
    load: LoadMetrics
    hrv: HRVStatus
    readiness: Readiness
    race: Race
    days_to_race: int
    race_phase: RacePhase
    recent_activities: list[Activity]
    planned_workout: Workout
