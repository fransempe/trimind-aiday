from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models.decision import CoachDecision
from app.models.opinions import AgentOpinion
from app.models.rules import RulesResult


class _Event(BaseModel):
    run_id: str
    ts: datetime = Field(default_factory=datetime.now)


class RouterDecided(_Event):
    type: Literal["router_decided"] = "router_decided"
    intent: str
    agents: list[str]


class AgentStarted(_Event):
    type: Literal["agent_started"] = "agent_started"
    agent: str


class AgentCompleted(_Event):
    type: Literal["agent_completed"] = "agent_completed"
    opinion: AgentOpinion


class RulesChecked(_Event):
    type: Literal["rules_checked"] = "rules_checked"
    result: RulesResult
    attempt: int


class AwaitingApproval(_Event):
    type: Literal["awaiting_approval"] = "awaiting_approval"
    decision: CoachDecision
    thread_id: str


class DecisionFinal(_Event):
    type: Literal["decision_final"] = "decision_final"
    decision: CoachDecision
    status: Literal["auto", "accepted", "rejected"]


class ErrorEvent(_Event):
    type: Literal["error"] = "error"
    node: str
    message: str


GraphEvent = Annotated[
    RouterDecided
    | AgentStarted
    | AgentCompleted
    | RulesChecked
    | AwaitingApproval
    | DecisionFinal
    | ErrorEvent,
    Field(discriminator="type"),
]
