"""Salida estructurada sobre LiteLLM: pide JSON, valida con Pydantic y reintenta."""

import json
import logging
import time
from dataclasses import dataclass

import litellm
from pydantic import BaseModel, ValidationError

from app.config import settings

log = logging.getLogger(__name__)
litellm.suppress_debug_info = True


class LLMError(RuntimeError):
    pass


@dataclass
class LLMResult[T: BaseModel]:
    value: T
    model: str
    latency_ms: int


def _extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    start, end = text.find("{"), text.rfind("}")
    return text[start : end + 1] if start != -1 and end != -1 else text


async def structured[T: BaseModel](
    schema: type[T], system: str, user: str, model: str
) -> LLMResult[T]:
    """Devuelve `schema` validado. Ante JSON inválido reintenta con el error; después usa
    el modelo de fallback si está configurado."""
    models = [model] + ([settings.fallback_model] if settings.fallback_model else [])
    last_error: Exception | None = None

    for current in models:
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        for attempt in range(settings.llm_max_attempts):
            start = time.perf_counter()
            try:
                response = await litellm.acompletion(
                    model=current,
                    messages=messages,
                    response_format={"type": "json_object"},
                    timeout=settings.llm_timeout_s,
                )
                content = response.choices[0].message.content or ""
                value = schema.model_validate_json(_extract_json(content))
                latency = int((time.perf_counter() - start) * 1000)
                return LLMResult(value=value, model=current, latency_ms=latency)
            except ValidationError as e:
                last_error = e
                log.warning("%s devolvió JSON inválido (intento %d): %s", current, attempt + 1, e)
                messages += [
                    {"role": "assistant", "content": content},
                    {
                        "role": "user",
                        "content": f"El JSON no es válido: {e.errors()[:3]}. "
                        "Devolvé solo el JSON corregido.",
                    },
                ]
            except Exception as e:  # errores de red, rate limit, auth
                last_error = e
                log.warning("Falló %s (intento %d): %s", current, attempt + 1, e)
                break
    raise LLMError(f"No se obtuvo una respuesta válida del LLM: {last_error}")


def to_json(obj) -> str:
    if isinstance(obj, BaseModel):
        return obj.model_dump_json(indent=1)
    return json.dumps(obj, ensure_ascii=False, indent=1, default=str)
