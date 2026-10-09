import asyncio
import logging
import random
from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict, Field

from app.config import settings
from app.llm import LLMError, record_heuristic, structured, to_json
from app.models.metrics import AthleteSnapshot
from app.models.opinions import AgentOpinion, AgentOpinionDraft
from app.repositories.knowledge_store import get_context

log = logging.getLogger(__name__)

OPINION_FORMAT = """
Respondé SOLO con un JSON con esta forma exacta:
{
  "recommendation": "train" | "modify" | "rest",
  "score": entero 0-100 (qué tan favorable es entrenar según tu área),
  "confidence": número 0-1,
  "observations": [1 a 4 frases cortas en español, citando los números del contexto],
  "impact_factors": {"<factor>": "low" | "moderate" | "high"}
}
"""

COMMON_RULES = """
Reglas:
- Los números ya están calculados. No calcules ni inventes valores: usá solo los del contexto.
- Opiná solo desde tu área de especialidad.
- Sos apoyo al entrenamiento, no un médico: nunca uses tono de diagnóstico médico.
- Escribí en español rioplatense, tono de entrenador profesional.
"""


class Specialist(ABC):
    name: str
    description: str  # la usa el router para decidir a quién consultar
    role_prompt: str
    factors: tuple[str, ...]

    @abstractmethod
    def context(self, snap: AthleteSnapshot) -> dict:
        """Recorte del snapshot que le corresponde a este especialista."""

    @abstractmethod
    def heuristic(self, snap: AthleteSnapshot) -> AgentOpinionDraft:
        """Opinión determinista: modo fake y respaldo si el LLM falla en vivo."""

    def system_prompt(self) -> str:
        factors = ", ".join(self.factors)
        return (
            f"{self.role_prompt}\n{COMMON_RULES}\n"
            f"Usá como claves de impact_factors solo estas: {factors}.\n{OPINION_FORMAT}"
        )

    async def opine(self, snap: AthleteSnapshot, question: str | None = None) -> AgentOpinion:
        if settings.llm_mode == "fake":
            delay = settings.fake_delay_s * random.uniform(0.6, 1.6)
            await asyncio.sleep(delay)
            return AgentOpinion(
                **self.heuristic(snap).model_dump(),
                agent=self.name,
                model="fake",
                latency_ms=int(delay * 1000),
            )
        user = f"Contexto del atleta hoy:\n{to_json(self.context(snap))}"
        if get_context():
            user += f"\n\nLo que el staff ya sabe del atleta:\n{get_context()}"
        if question:
            user += f"\n\nPregunta del atleta: {question}"
        try:
            result = await structured(
                AgentOpinionDraft, self.system_prompt(), user, settings.specialist_model, label=self.name
            )
        except LLMError as e:
            log.error("%s usa heurística por error del LLM: %s", self.name, e)
            record_heuristic(self.name)
            return AgentOpinion(
                **self.heuristic(snap).model_dump(), agent=self.name, model="heuristic-fallback"
            )
        return AgentOpinion(
            **result.value.model_dump(),
            agent=self.name,
            model=result.model,
            latency_ms=result.latency_ms,
        )


    async def answer(self, snap: AthleteSnapshot, question: str, extra: dict | None = None) -> tuple[str, str]:
        """Respuesta directa del especialista a una pregunta del atleta: (texto, modelo)."""
        if settings.llm_mode == "live":
            system = (
                f"{self.role_prompt}\n{COMMON_RULES}\n"
                "El atleta te pregunta directamente a vos. Respondé en 2 a 5 frases, desde tu área, "
                "citando los números del contexto. Si la pregunta es médica, recomendá consultar a un "
                'profesional. Respondé SOLO con un JSON: {"answer": "..."}'
            )
            user = f"Contexto del atleta hoy:\n{to_json(self.context(snap))}"
            if get_context():
                user += f"\n\nLo que el staff ya sabe del atleta:\n{get_context()}"
            if extra:
                user += f"\n\nContexto adicional:\n{to_json(extra)}"
            user += f"\n\nPregunta: {question}"
            try:
                result = await structured(DirectAnswer, system, user, settings.specialist_model, label=f"{self.name} · pregunta")
                return result.value.answer, result.model
            except LLMError as e:
                log.error("%s responde con heurística por error del LLM: %s", self.name, e)
                record_heuristic(f"{self.name} · pregunta")
        obs = self.heuristic(snap).observations
        model = "fake" if settings.llm_mode == "fake" else "heuristic-fallback"
        return " ".join(obs[:3]), model


class DirectAnswer(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str = Field(min_length=1)


def fmt_sleep(hours: float) -> str:
    h = int(hours)
    return f"{h}h{round((hours - h) * 60):02d}"


def fmt_pct(x: float) -> str:
    return f"{x:+.0f}%"
