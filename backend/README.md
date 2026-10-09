# TriMind AI · Backend

Python 3.12 · uv · LangGraph · LiteLLM (Gemini free tier, OpenRouter de fallback) · FastAPI con SSE.

## Correr

```bash
cd backend
uv sync
cp .env.example .env        # y pegá tu GEMINI_API_KEY
uv run uvicorn app.api.main:app --reload --port 8000
```

- Docs interactivas: http://localhost:8000/docs
- Estado: http://localhost:8000/health

Sin key se puede probar con `LLM_MODE=fake` en `.env`: los agentes usan heurísticas deterministas
con una demora simulada. En modo `live`, si el LLM falla (rate limit, red, key), cada agente cae en
su heurística y la corrida termina igual; en la opinión el modelo figura como `heuristic-fallback`.

Para que el frontend use esta API, en `frontend/.env`:

```
NEXT_PUBLIC_API_MODE=api
```

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/athlete/snapshot` | Métricas del día calculadas en Python |
| POST | `/athlete/state` | Cambia sueño, HRV (ms o %), RPE, piernas, run fuerte ayer |
| POST | `/athlete/scenario/{normal\|fatigued\|recovered}` | Carga un escenario de demo |
| POST | `/recommendation` | Corre el grafo y devuelve la decisión (o la que espera aprobación) |
| GET | `/recommendation/stream` | SSE con un evento por nodo |
| POST | `/recommendation/resume` | `{thread_id, action: accept\|reject}` retoma el grafo pausado |
| POST | `/race/strategy` | Estrategia por segmento para una carrera, según el entrenamiento reciente |
| POST | `/nutrition/plan` | Plan de comidas del Nutrition Agent, coordinado con el staff |
| POST | `/ask` | Pregunta libre: el router elige especialistas |
| POST | `/feedback` | RPE y piernas post-entrenamiento |

## Grafo

```
router → fan-out (Send) → training · recovery · race · performance · nutrition → head_coach → rules
rules ─(viola una regla, máx. 2 reintentos)→ head_coach
rules ─(modify)→ approval (interrupt) → finalize
rules ─(train/rest)→ finalize
```

- **Los números los calcula Python** (`app/tools`). El LLM interpreta, argumenta y elige entre
  variantes de workout ya calculadas (`app/tools/workouts.py`).
- **Head Coach** (`app/agents/head_coach.py`): recibe solo las opiniones estructuradas.
- **Reglas** (`app/rules/engine.py`): sin intensidad (sweet spot o más) con readiness en rojo, sin
  VO2max a 7 días o menos de la carrera, sin tono de diagnóstico médico.
- **Agregar un especialista:** crear el archivo en `app/agents/` y sumarlo a `app/agents/registry.py`.
- Checkpointer en memoria: los threads se pierden al reiniciar.

## Tests

```bash
uv run pytest       # usa el modo fake, nunca llama al LLM
```

Más detalle en [docs/arquitectura.md](../docs/arquitectura.md) y [docs/agentes.md](../docs/agentes.md).
