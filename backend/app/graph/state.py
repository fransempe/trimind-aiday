import operator
from typing import Annotated, Literal, TypedDict

from pydantic import BaseModel

from app.models.decision import CoachDecision
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinion
from app.models.rules import RuleViolation
from app.models.workout import WorkoutCandidate


class RouteDecision(BaseModel):
    intent: Literal["daily", "training", "recovery", "race", "performance", "general"]
    agents: list[str]


class GraphState(TypedDict, total=False):
    run_id: str
    mode: Literal["daily", "ask"]
    question: str | None
    snapshot: AthleteSnapshot
    candidates: list[WorkoutCandidate]
    route: RouteDecision
    opinions: Annotated[list[AgentOpinion], operator.add]  # reducer del fan-in
    decision: CoachDecision | None
    violations: list[RuleViolation]
    rule_retries: int
    status: Literal["auto", "accepted", "rejected"] | None
    answer: str | None
