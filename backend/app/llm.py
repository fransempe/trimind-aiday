"""Salida estructurada sobre LiteLLM: pide JSON, valida con Pydantic y reintenta.

Además:
- Caché: la misma consulta (modelo, prompt y contexto) devuelve la respuesta guardada, sin gastar
  cupo. Se guarda en disco para que sobreviva a reinicios del backend.
- Registro de llamadas: cada intento queda en memoria (agente, modelo, latencia, tokens, caché,
  fallback, errores) para la página de Observabilidad.
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path

import litellm
from pydantic import BaseModel, ValidationError

from app.config import settings

log = logging.getLogger(__name__)
litellm.suppress_debug_info = True

CACHE_PATH = Path(".cache/llm-cache.json")


class LLMError(RuntimeError):
    pass


@dataclass
class LLMResult[T: BaseModel]:
    value: T
    model: str
    latency_ms: int


@dataclass
class CallRecord:
    ts: str
    label: str
    model: str
    requested_model: str
    latency_ms: int
    ok: bool
    cached: bool = False
    fallback: bool = False
    retry: bool = False
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0
    error: str = ""
    extra: dict = field(default_factory=dict)


CALLS: deque[CallRecord] = deque(maxlen=300)


def _record(**kw) -> None:
    CALLS.append(CallRecord(ts=datetime.now().isoformat(timespec="seconds"), **kw))


# ---------------------------------------------------------------- caché
_cache: dict[str, dict] | None = None


def _load_cache() -> dict[str, dict]:
    global _cache
    if _cache is None:
        try:
            _cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            _cache = {}
    return _cache


def _save_cache() -> None:
    try:
        CACHE_PATH.parent.mkdir(exist_ok=True)
        CACHE_PATH.write_text(json.dumps(_load_cache(), ensure_ascii=False), encoding="utf-8")
    except OSError as e:
        log.warning("No se pudo guardar la caché del LLM: %s", e)


def clear_cache() -> int:
    n = len(_load_cache())
    _load_cache().clear()
    _save_cache()
    return n


def _key(schema: type[BaseModel], system: str, user: str, model: str) -> str:
    return hashlib.sha256(f"{schema.__name__}\n{model}\n{system}\n{user}".encode()).hexdigest()


def _extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    start, end = text.find("{"), text.rfind("}")
    return text[start : end + 1] if start != -1 and end != -1 else text


def _usage(response) -> tuple[int, int, float]:
    usage = getattr(response, "usage", None)
    tin = getattr(usage, "prompt_tokens", 0) or 0
    tout = getattr(usage, "completion_tokens", 0) or 0
    try:
        cost = float(litellm.completion_cost(completion_response=response) or 0)
    except Exception:  # modelos sin precio conocido
        cost = 0.0
    return tin, tout, cost


async def structured[T: BaseModel](
    schema: type[T], system: str, user: str, model: str, label: str = ""
) -> LLMResult[T]:
    """Devuelve `schema` validado. Ante JSON inválido reintenta con el error; después prueba el
    modelo de especialistas y el de fallback. `label` identifica al agente en Observabilidad."""
    label = label or schema.__name__
    key = _key(schema, system, user, model)
    if settings.llm_cache and (hit := _load_cache().get(key)):
        try:
            value = schema.model_validate_json(hit["content"])
            # En la demo se reproduce el tiempo original (con tope) para que se vea trabajar a cada agente.
            # Entradas viejas sin latencia: un tiempo estable por consulta, para que no terminen todas juntas.
            original = hit.get("latency_ms") or 1200 + int(key[:4], 16) % 1800
            delay = min(original, settings.llm_cache_replay_max_ms) if settings.llm_cache_replay else 0
            await asyncio.sleep(delay / 1000)
            _record(label=label, model=hit["model"], requested_model=model, latency_ms=delay, ok=True, cached=True)
            return LLMResult(value=value, model=f"{hit['model']} · caché", latency_ms=delay)
        except ValidationError:
            pass  # el esquema cambió: se vuelve a pedir

    # Si falla el modelo pedido (ej. el del Head Coach saturado), se prueba el de especialistas y
    # después el de fallback, sin repetir.
    models = list(dict.fromkeys(m for m in (model, settings.specialist_model, settings.fallback_model) if m))
    last_error: Exception | None = None

    for current in models:
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        for attempt in range(settings.llm_max_attempts):
            start = time.perf_counter()
            content = ""
            common = {"label": label, "model": current, "requested_model": model, "fallback": current != model, "retry": attempt > 0}
            try:
                response = await litellm.acompletion(
                    model=current,
                    messages=messages,
                    response_format={"type": "json_object"},
                    timeout=settings.llm_timeout_s,
                )
                latency = int((time.perf_counter() - start) * 1000)
                tin, tout, cost = _usage(response)
                content = response.choices[0].message.content or ""
                value = schema.model_validate_json(_extract_json(content))
                _record(**common, latency_ms=latency, ok=True, tokens_in=tin, tokens_out=tout, cost_usd=cost)
                if settings.llm_cache:
                    _load_cache()[key] = {"model": current, "content": value.model_dump_json(), "latency_ms": latency}
                    _save_cache()
                return LLMResult(value=value, model=current, latency_ms=latency)
            except ValidationError as e:
                last_error = e
                _record(**common, latency_ms=int((time.perf_counter() - start) * 1000), ok=False, error="JSON inválido")
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
                _record(**common, latency_ms=int((time.perf_counter() - start) * 1000), ok=False, error=type(e).__name__)
                log.warning("Falló %s (intento %d): %s", current, attempt + 1, e)
                break
    raise LLMError(f"No se obtuvo una respuesta válida del LLM: {last_error}")


def record_heuristic(label: str) -> None:
    """Deja asentado que un agente respondió con su heurística porque el LLM falló."""
    _record(label=label, model="heuristic-fallback", requested_model="", latency_ms=0, ok=True, fallback=True)


def calls_summary() -> dict:
    calls = [asdict(c) for c in CALLS]
    real = [c for c in calls if c["ok"] and not c["cached"] and c["model"] != "heuristic-fallback"]
    return {
        "calls": list(reversed(calls)),
        "summary": {
            "total": len(calls),
            "llm_ok": len(real),
            "cached": sum(c["cached"] for c in calls),
            "errors": sum(not c["ok"] for c in calls),
            "fallbacks": sum(c["fallback"] for c in calls),
            "avg_latency_ms": int(sum(c["latency_ms"] for c in real) / len(real)) if real else 0,
            "tokens_in": sum(c["tokens_in"] for c in calls),
            "tokens_out": sum(c["tokens_out"] for c in calls),
            "cost_usd": round(sum(c["cost_usd"] for c in calls), 4),
            "cache_entries": len(_load_cache()),
        },
    }


def to_json(obj) -> str:
    if isinstance(obj, BaseModel):
        return obj.model_dump_json(indent=1)
    return json.dumps(obj, ensure_ascii=False, indent=1, default=str)
