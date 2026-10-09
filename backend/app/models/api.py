from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.models.common import LegsFeeling
from app.models.opinions import AgentOpinion


class AthleteStateUpdate(BaseModel):
    sleep_hours: float | None = Field(None, ge=0, le=14)
    hrv_rmssd_ms: float | None = Field(None, gt=0)
    hrv_deviation_pct: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)
    legs: LegsFeeling | None = None
    hard_run_yesterday: bool | None = None

    @model_validator(mode="after")
    def _one_hrv_input(self) -> "AthleteStateUpdate":
        if self.hrv_rmssd_ms is not None and self.hrv_deviation_pct is not None:
            raise ValueError("Usar hrv_rmssd_ms o hrv_deviation_pct, no ambos")
        return self


class ApprovalRequest(BaseModel):
    thread_id: str
    action: Literal["accept", "reject"]
    comment: str | None = None


class FeedbackRequest(BaseModel):
    workout_id: str
    rpe: int = Field(ge=1, le=10)
    legs: LegsFeeling
    comment: str | None = None


class AskRequest(BaseModel):
    question: str = Field(min_length=3)


class AskResponse(BaseModel):
    answer: str
    consulted_agents: list[str]
    opinions: list[AgentOpinion]
