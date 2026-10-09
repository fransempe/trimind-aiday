"""API de TriMind. Correr con: uv run uvicorn app.api.main:app --reload"""

import json
import logging
from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.agents import race_strategy
from app.agents.registry import REGISTRY
from app.config import settings
from app.graph import runner
from app.models.api import (
    ApprovalRequest,
    AskRequest,
    AskResponse,
    AthleteStateUpdate,
    FeedbackRequest,
)
from app.models.metrics import AthleteSnapshot
from app.models.strategy import RaceStrategy, RaceStrategyRequest
from app.repositories.mock import list_scenarios
from app.repositories.state import AthleteState

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="TriMind AI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)
athlete = AthleteState(settings.scenario)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "llm_mode": settings.llm_mode,
        "specialist_model": settings.specialist_model,
        "coach_model": settings.coach_model,
        "agents": list(REGISTRY),
        "scenario": athlete.scenario,
    }


# ---------------------------------------------------------------- atleta
@app.get("/athlete/snapshot")
def get_snapshot() -> AthleteSnapshot:
    return athlete.snapshot()


@app.post("/athlete/state")
def update_state(update: AthleteStateUpdate) -> AthleteSnapshot:
    athlete.update(update)
    return athlete.snapshot()


@app.post("/athlete/scenario/{name}")
def set_scenario(name: str) -> AthleteSnapshot:
    if name not in list_scenarios():
        raise HTTPException(404, f"Escenarios disponibles: {list_scenarios()}")
    athlete.set_scenario(name)
    return athlete.snapshot()


# ---------------------------------------------------------------- recomendación
@app.post("/recommendation")
async def recommendation() -> dict:
    """Corre el grafo para hoy. Si la decisión es modificar, queda esperando aprobación."""
    return await runner.run_recommendation(athlete.snapshot())


async def _sse(events: AsyncIterator[dict]) -> AsyncIterator[str]:
    try:
        async for event in events:
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    except Exception as e:  # el frontend lo muestra en el trace
        logging.exception("Error en el grafo")
        error = {"type": "error", "run_id": "", "ts": "", "node": "graph", "message": str(e)}
        yield f"data: {json.dumps(error)}\n\n"


@app.get("/recommendation/stream")
def recommendation_stream() -> StreamingResponse:
    return StreamingResponse(
        _sse(runner.stream_recommendation(athlete.snapshot())),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/recommendation/resume")
async def recommendation_resume(req: ApprovalRequest) -> dict:
    if not runner.is_waiting(req.thread_id):
        raise HTTPException(404, "No hay una decisión esperando aprobación para ese thread_id")
    return await runner.run_resume(req.thread_id, req.action)


# ---------------------------------------------------------------- carrera
@app.post("/race/strategy")
async def race_strategy_endpoint(req: RaceStrategyRequest) -> RaceStrategy:
    """Estrategia por segmento del Race Agent, según el entrenamiento importado."""
    return await race_strategy.generate(req, athlete.data)


# ---------------------------------------------------------------- ask / feedback
@app.post("/ask")
async def ask(req: AskRequest) -> AskResponse:
    return await runner.ask(req.question, athlete.snapshot())


@app.post("/feedback")
def feedback(req: FeedbackRequest) -> dict:
    athlete.feedback.append(req)
    # El RPE post-entrenamiento alimenta la fatiga percibida del día.
    athlete.update(AthleteStateUpdate(rpe=req.rpe, legs=req.legs))
    return {"ok": True, "feedback_count": len(athlete.feedback)}
