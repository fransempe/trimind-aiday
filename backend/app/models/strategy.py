from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Pacing = Literal["conservador", "equilibrado", "agresivo"]
TargetUnit = Literal["W", "s/km", "s/100m"]


class SegmentPlan(BaseModel):
    """Segmento con objetivos ya calculados en código (el LLM no los toca)."""

    sport: Literal["swim", "bike", "run"]
    label: str
    distance_km: float = Field(gt=0)
    target_low: float = Field(gt=0)
    target_high: float = Field(gt=0)
    unit: TargetUnit
    eta_min: float = Field(gt=0)


class TrainingSummary(BaseModel):
    ctl: float
    tsb: float
    readiness: int
    ftp_w: int
    longest_bike_min: float
    longest_run_min: float
    weekly_hours: float


class RaceStrategyRequest(BaseModel):
    race_name: str
    race_distance: str
    days_to_race: int
    segments: list[SegmentPlan] = Field(min_length=1)


class RaceStrategyDraft(BaseModel):
    """Lo que devuelve el LLM: el enfoque de pacing y los textos. Ningún número nuevo."""

    model_config = ConfigDict(extra="forbid")

    pacing: Pacing
    segment_notes: list[str] = Field(min_length=1)
    nutrition: list[str] = Field(min_length=1, max_length=4)
    rationale: list[str] = Field(min_length=1, max_length=4)


class StrategySegment(SegmentPlan):
    notes: str


class RaceStrategy(BaseModel):
    race_name: str
    pacing: Pacing
    segments: list[StrategySegment]
    estimated_finish_min: float
    nutrition: list[str]
    rationale: list[str]
    training: TrainingSummary
    model: str
