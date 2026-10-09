from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.common import ImpactLevel, Recommendation
from app.models.opinions import AgentOpinion
from app.models.workout import Workout


class Disagreement(BaseModel):
    agents: list[str]
    topic: str
    resolution: str


class CoachDraft(BaseModel):
    """Salida estructurada que devuelve el LLM del Head Coach."""

    model_config = ConfigDict(extra="forbid")

    selected_candidate_id: str
    confidence: float = Field(ge=0, le=1)
    primary_reason: str
    explanation: str
    impact_factors: dict[str, ImpactLevel]
    disagreements: list[Disagreement] = []


class CoachDecision(BaseModel):
    decision: Recommendation
    original_workout: Workout
    new_workout: Workout | None = None
    confidence: float = Field(ge=0, le=1)
    primary_reason: str
    explanation: str
    impact_factors: dict[str, ImpactLevel]
    opinions: list[AgentOpinion]
    disagreements: list[Disagreement] = []
    rule_retries: int = 0

    @model_validator(mode="after")
    def _check_consistency(self) -> "CoachDecision":
        if self.decision == "modify" and self.new_workout is None:
            raise ValueError("'modify' requiere new_workout")
        if self.decision in ("train", "rest") and self.new_workout is not None:
            raise ValueError(f"'{self.decision}' no lleva new_workout")
        return self
