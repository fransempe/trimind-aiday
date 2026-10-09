import logging
import re

from app.agents.registry import REGISTRY
from app.config import settings
from app.graph.state import RouteDecision
from app.llm import LLMError, record_heuristic, structured

log = logging.getLogger(__name__)

KEYWORDS = [
    ("nutrition", r"nutri|comer|comida|desayun|almuer|merienda|cena|carbo|gel|hidrat", ["nutrition", "training"]),
    ("race", r"carrera|race|ritmo|estrategia|taper|70\.3", ["race", "performance"]),
    ("recovery", r"dorm|sueñ|hrv|cansad|fatiga|recuper|descans", ["recovery", "training"]),
    ("performance", r"ftp|vatios|potencia|progres|umbral", ["performance", "training"]),
]

SYSTEM = """Sos el router de un staff de entrenadores de triatlón. Clasificá la pregunta del
atleta y elegí qué especialistas consultar (entre 1 y 3, solo de la lista).
Respondé SOLO con un JSON: {"intent": "training" | "recovery" | "race" | "performance" |
"nutrition" | "general", "agents": ["<nombre>", ...]}"""


def keyword_route(question: str) -> RouteDecision:
    for intent, pattern, agents in KEYWORDS:
        if re.search(pattern, question, re.IGNORECASE):
            return RouteDecision(intent=intent, agents=agents)
    return RouteDecision(intent="general", agents=["training", "recovery", "race"])


async def route(mode: str, question: str | None) -> RouteDecision:
    if mode == "daily" or not question:
        return RouteDecision(intent="daily", agents=list(REGISTRY))
    if settings.llm_mode == "live":
        catalog = "\n".join(f"- {a.name}: {a.description}" for a in REGISTRY.values())
        try:
            result = await structured(
                RouteDecision,
                f"{SYSTEM}\n\nEspecialistas:\n{catalog}",
                question,
                settings.specialist_model,
                label="router",
            )
            agents = [a for a in result.value.agents if a in REGISTRY]
            if agents:
                return RouteDecision(intent=result.value.intent, agents=agents)
        except LLMError as e:
            log.warning("Router por keywords: %s", e)
            record_heuristic("router")
    return keyword_route(question)
