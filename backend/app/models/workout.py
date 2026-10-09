from datetime import date

from pydantic import BaseModel, Field, computed_field, model_validator

from app.models.common import INTENSITY_ORDER, Intensity, Recommendation, Sport


class PowerTarget(BaseModel):
    low_w: int = Field(gt=0)
    high_w: int = Field(gt=0)

    @model_validator(mode="after")
    def _check_order(self) -> "PowerTarget":
        if self.low_w > self.high_w:
            raise ValueError("low_w no puede ser mayor que high_w")
        return self


class WorkoutStep(BaseModel):
    repeat: int = Field(1, ge=1)
    duration_min: float = Field(gt=0)
    intensity: Intensity
    power: PowerTarget | None = None
    recovery_min: float | None = None


class Workout(BaseModel):
    id: str
    date: date
    sport: Sport
    title: str
    steps: list[WorkoutStep] = Field(min_length=1)
    planned_tss: float = Field(ge=0)

    @computed_field
    @property
    def peak_intensity(self) -> Intensity:
        return max((s.intensity for s in self.steps), key=INTENSITY_ORDER.index)

    @computed_field
    @property
    def total_duration_min(self) -> float:
        return sum(
            s.repeat * s.duration_min + (s.repeat - 1) * (s.recovery_min or 0) for s in self.steps
        )


class WorkoutCandidate(BaseModel):
    """Variante generada por Python; el Head Coach elige una por id."""

    id: str
    decision: Recommendation
    description: str
    workout: Workout | None = None
