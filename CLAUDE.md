# TriMind AI

Staff de entrenadores multi-agente para deportes de resistencia (triatlón, duatlón, ciclismo, running).
Es una **demo para AI Day**: priorizá la solución más simple que funcione y se vea bien en vivo; no
construyas todo al 100% ni agregues abstracciones de más.

Contexto de producto en [PRODUCT.md](PRODUCT.md), sistema de diseño en [DESIGN.md](DESIGN.md),
arquitectura en [docs/arquitectura.md](docs/arquitectura.md) y agentes en [docs/agentes.md](docs/agentes.md).

## Principio central

**Python calcula, el LLM interpreta.** Readiness, carga (CTL/ATL/TSB), HRV, vatios, ritmos, workouts
candidatos y gramos de nutrición salen de código determinista. Los agentes leen esos números, opinan,
eligen entre opciones ya calculadas y redactan. Nunca le pidas al LLM que calcule o invente una métrica.

Reglas duras (`backend/app/rules/engine.py`): nada de sweet spot o más con readiness en rojo, nada de
VO2max a 7 días o menos de la carrera, nada de tono de diagnóstico médico.

## Idioma

- Textos de agentes y de la UI: español rioplatense ("vos", "tocá", "venís").
- Labels de navegación y jerga deportiva en inglés: Today, Training, Race, FTP, TSS, sweet spot.
- Enums, claves y código en inglés.

## Comandos

```bash
# Backend (desde backend/)
uv sync
uv run uvicorn app.api.main:app --reload --port 8000
uv run pytest                 # modo fake, nunca llama al LLM
uv run ruff check app tests

# Frontend (desde frontend/)
npm run dev                   # http://localhost:3000
npx tsc --noEmit && npm run lint && npm run build

# Evals contra el LLM real (desde backend/; usa la caché si ya corrió)
PYTHONPATH=. uv run python evals/run_evals.py

# Regenerar los datos mock que usa el frontend (desde backend/)
PYTHONPATH=. uv run python scripts/export_frontend_mock.py
```

## Estructura

- `backend/app/agents/`: especialistas (training, recovery, race, performance, nutrition) que heredan
  de `Specialist` en `base.py`, Head Coach, estrategia de carrera (`race_strategy.py`) y plan de
  comidas (`meal_plan.py`).
- `backend/app/graph/`: grafo LangGraph (router → fan-out con `Send` → head_coach → rules →
  approval con `interrupt()` → finalize), runner con SSE.
- `backend/app/tools/`: todos los cálculos. `backend/app/llm.py`: salida estructurada sobre LiteLLM.
- `frontend/src/lib/`: stores Zustand (`store.ts`, `setup.ts`, `session-log.ts`), cliente API
  (`api/index.ts`, mock o http), lógica de plan, día, nutrición y comidas.
- `frontend/src/lib/types.ts` es el espejo de los modelos Pydantic: si cambiás un modelo, actualizalo.

## Modos y LLM

- `backend/.env`: `LLM_MODE=live|fake`. Modelos: `SPECIALIST_MODEL`, `COACH_MODEL`, `FALLBACK_MODEL`
  (hoy Gemini free tier, con Nemotron por OpenRouter de fallback). Las keys se cargan con `load_dotenv`.
- Si el LLM falla, cada agente cae en su heurística (`model: "heuristic-fallback"`); la corrida nunca
  se corta.
- `frontend/.env`: `NEXT_PUBLIC_API_MODE=mock|api` (`http` también vale). En mock todo se simula en el
  navegador con los mismos eventos que el SSE; cada feature con IA tiene su heurística espejo en TS.
- Caché de respuestas en `backend/.cache/` (`LLM_CACHE`): la misma consulta no vuelve a llamar al
  modelo. Si cambiás un prompt, la clave cambia sola; para forzar llamadas nuevas, vaciala desde la
  página Observabilidad.
- Los free tiers tienen cupo diario: no corras recomendaciones en vivo de más para probar. Para
  verificar lógica usá el modo fake o los tests.

## Cómo agregar un especialista

1. Clase en `backend/app/agents/` (context, heuristic, role_prompt, factors) y sumarla a `registry.py`.
2. Si responde preguntas, keywords en `backend/app/graph/router.py` y el intent en `graph/state.py`.
3. Frontend: `SPECIALISTS` y `FACTOR_LABELS` en `lib/agents.ts`, heurística en `lib/mock/coaching.ts`
   y su ruta en `ASK_ROUTES`.

## Diseño (resumen de DESIGN.md)

Mundo "Protocolo de laboratorio": fondo grafito, tinta hueso, paneles como hojas con reglas (no cards).
El ámbar (`reagent`) es **solo** para techos, umbrales, aprobación pendiente y MODIFY. Los colores de
deporte solo en datos por deporte. Martian Mono solo para códigos y medidas (`.num`, `.code`).
Verificá cada cambio de UI en desktop y en 390 px de ancho, sin scroll horizontal.

## Cuidados

- El dev server del puerto 3000 es del usuario: no lo mates ni lo reinicies. Si necesitás otro, usá
  otro puerto y cerralo al terminar.
- `uvicorn --reload` no ve cambios en `.env` ni en `backend/data/`: hace falta reiniciar o tocar un `.py`.
- Nunca commitees `.env` ni keys. No hagas commit ni push si no te lo piden.
- En Windows, los heredocs largos de bash fallan seguido: para ediciones grandes usá las herramientas
  de edición o un script en el scratchpad.

@frontend/AGENTS.md
