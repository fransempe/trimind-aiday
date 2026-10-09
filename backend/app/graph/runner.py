"""Cómo corre la API el grafo: streams de eventos y resultados finales."""

import uuid
from collections.abc import AsyncIterator

from langgraph.types import Command

from app.graph.builder import graph
from app.models.api import AskResponse
from app.models.metrics import AthleteSnapshot


def _config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


async def _events(input_, thread_id: str) -> AsyncIterator[dict]:
    async for event in graph.astream(input_, _config(thread_id), stream_mode="custom"):
        yield event


def stream_recommendation(snapshot: AthleteSnapshot) -> AsyncIterator[dict]:
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    return _events(
        {"run_id": run_id, "mode": "daily", "snapshot": snapshot, "opinions": []}, run_id
    )


def stream_resume(thread_id: str, action: str) -> AsyncIterator[dict]:
    return _events(Command(resume=action), thread_id)


def is_waiting(thread_id: str) -> bool:
    return bool(graph.get_state(_config(thread_id)).next)


async def run_recommendation(snapshot: AthleteSnapshot) -> dict:
    """Versión no-stream: devuelve la decisión final o la que espera aprobación."""
    last = None
    async for event in stream_recommendation(snapshot):
        if event["type"] in ("awaiting_approval", "decision_final"):
            last = event
    return last or {}


async def run_resume(thread_id: str, action: str) -> dict:
    last = None
    async for event in stream_resume(thread_id, action):
        if event["type"] == "decision_final":
            last = event
    return last or {}


async def ask(question: str, snapshot: AthleteSnapshot) -> AskResponse:
    run_id = f"ask_{uuid.uuid4().hex[:8]}"
    state = await graph.ainvoke(
        {
            "run_id": run_id,
            "mode": "ask",
            "question": question,
            "snapshot": snapshot,
            "opinions": [],
        },
        _config(run_id),
    )
    return AskResponse(
        answer=state["answer"], consulted_agents=state["route"].agents, opinions=state["opinions"]
    )
