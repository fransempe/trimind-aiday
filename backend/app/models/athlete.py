from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.models.common import Intensity, LegsFeeling, Sport


class AthleteProfile(BaseModel):
    id: str
    name: str
    age: int
    weight_kg: float
    ftp_w: int
    run_threshold_pace_s_per_km: int
    swim_css_s_per_100m: int
    lthr_bpm: int


class Activity(BaseModel):
    id: str
    date: date
    sport: Sport
    title: str
    duration_min: float = Field(gt=0)
    distance_km: float | None = None
    tss: float = Field(ge=0)
    intensity: Intensity
    avg_power_w: int | None = None
    avg_hr_bpm: int | None = None
    rpe: int | None = Field(None, ge=1, le=10)


class DailyWellness(BaseModel):
    date: date
    sleep_hours: float = Field(ge=0, le=14)
    hrv_rmssd_ms: float = Field(gt=0)
    resting_hr_bpm: int
    rpe: int | None = Field(None, ge=1, le=10, description="Fatiga percibida reportada hoy")
    legs: LegsFeeling = "normal"


class Race(BaseModel):
    name: str
    date: date
    distance: Literal["sprint", "olympic", "70.3", "140.6"]
    priority: Literal["A", "B", "C"]
