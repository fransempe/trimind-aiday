from langgraph.config import get_stream_writer
from langgraph.types import interrupt

from app.agents import head_coach
from app.agents.registry import REGISTRY
from app.config import settings
from app.graph.router import route
from app.graph.state import GraphState
from app.models.events import (
    AgentCompleted,
    AgentStarted,
    AwaitingApproval,
    DecisionFinal,
    RouterDecided,
    RulesChecked,
)
from app.rules import engine
from app.tools.workouts import build_candidates


def emit(event) -> None:
    get_stream_writer()(event.model_dump(mode="json"))


async def router_node(state: GraphState) -> dict:
    decision = await route(state["mode"], state.get("question"))
    emit(RouterDecided(run_id=state["run_id"], intent=decision.intent, agents=decision.agents))
    snap = state["snapshot"]
    return {
        "route": decision,
        "candidates": build_candidates(snap.planned_workout, snap.profile.ftp_w),
        "rule_retries": 0,
        "violations": [],
    }


async def specialist_node(payload: dict) -> dict:
    """Corre en paralelo, una instancia por especialista (Send)."""
    agent = REGISTRY[payload["agent"]]
    emit(AgentStarted(run_id=payload["run_id"], agent=agent.name))
    opinion = await agent.opine(payload["snapshot"], payload.get("question"))
    emit(AgentCompleted(run_id=payload["run_id"], opinion=opinion))
    return {"opinions": [opinion]}


async def head_coach_node(state: GraphState) -> dict:
    emit(AgentStarted(run_id=state["run_id"], agent="head_coach"))
    decision = await head_coach.decide(
        state["snapshot"], state["opinions"], state["candidates"], state.get("violations")
    )
    return {"decision": decision}


async def rules_node(state: GraphState) -> dict:
    decision, snap, retries = state["decision"], state["snapshot"], state.get("rule_retries", 0)
    result = engine.check(decision, snap)
    emit(RulesChecked(run_id=state["run_id"], result=result, attempt=retries + 1))

    if not result.passed and retries < settings.max_rule_retries:
        return {"violations": result.violations, "rule_retries": retries + 1}
    if not result.passed:
        # Agotados los reintentos: decisión determinista segura.
        decision = await head_coach.decide(
            snap, state["opinions"], state["candidates"], force_heuristic=True
        )
    decision = decision.model_copy(update={"rule_retries": retries})
    if decision.decision == "modify":
        emit(AwaitingApproval(run_id=state["run_id"], decision=decision, thread_id=state["run_id"]))
    return {"decision": decision, "violations": []}


def after_rules(state: GraphState) -> str:
    if state.get("violations"):
        return "head_coach"
    return "approval" if state["decision"].decision == "modify" else "finalize"


def approval_node(state: GraphState) -> dict:
    """Human-in-the-loop: pausa el grafo hasta que el atleta acepta o rechaza."""
    action = interrupt(
        {"thread_id": state["run_id"], "decision": state["decision"].model_dump(mode="json")}
    )
    return {"status": "accepted" if action == "accept" else "rejected"}


def finalize_node(state: GraphState) -> dict:
    status = state.get("status") or "auto"
    emit(DecisionFinal(run_id=state["run_id"], decision=state["decision"], status=status))
    return {"status": status}


async def answer_node(state: GraphState) -> dict:
    emit(AgentStarted(run_id=state["run_id"], agent="head_coach"))
    return {"answer": await head_coach.answer(state["question"] or "", state["opinions"])}
