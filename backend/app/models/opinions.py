from pydantic import BaseModel, ConfigDict, Field

from app.models.common import ImpactLevel, Recommendation


class AgentOpinionDraft(BaseModel):
    """Salida estructurada que devuelve el LLM de cada especialista."""

    model_config = ConfigDict(extra="forbid")

    recommendation: Recommendation
    score: int = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    observations: list[str] = Field(min_length=1, max_length=5)
    impact_factors: dict[str, ImpactLevel]


class AgentOpinion(AgentOpinionDraft):
    model_config = ConfigDict(extra="ignore")

    agent: str
    model: str = ""
    latency_ms: int = 0
