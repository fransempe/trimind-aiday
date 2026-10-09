# Agentes de TriMind

Los números los calcula Python (readiness, carga, vatios, ritmos). Los agentes los leen, opinan y
redactan. Si el LLM falla o corre en modo `fake`, cada agente tiene una heurística por reglas que
devuelve el mismo formato.

El flujo de la recomendación diaria es:
router → 4 especialistas en paralelo → Head Coach → reglas → aprobación del atleta.

## Especialistas

Viven en [`backend/app/agents/`](../backend/app/agents/) y heredan de `Specialist`
([`base.py`](../backend/app/agents/base.py)). Cada uno devuelve una `AgentOpinion` con:

- `recommendation`: `train`, `modify` o `rest`;
- `score` (0-100) y `confidence` (0-1);
- `observations`: lecturas en español;
- `impact_factors`: qué factores pesaron y cuánto;
- `model` y `latency_ms`: para observabilidad.

| Agente | Qué mira | Qué hace |
|---|---|---|
| **Training Agent** ([`training.py`](../backend/app/agents/training.py)) | Carga (CTL, ATL, TSB), sesión planificada, sesiones recientes | Dice si la carga permite el estímulo del día o si conviene bajarlo |
| **Recovery Agent** ([`recovery.py`](../backend/app/agents/recovery.py)) | Sueño, HRV, FC en reposo, fatiga percibida, piernas, readiness | Dice si el cuerpo está recuperado; es el que frena con readiness en rojo o ámbar |
| **Race Agent** ([`race.py`](../backend/app/agents/race.py)) | Carrera objetivo, días que faltan, fase (build, taper, semana de carrera) | Cuida la periodización: no sumar fatiga en el taper, nada de VO2max cerca de la carrera |
| **Performance Agent** ([`performance.py`](../backend/app/agents/performance.py)) | FTP, umbrales, progresión, zonas | Evalúa si la sesión aporta a la progresión de rendimiento (marcado "beta" en la UI) |

**Para agregar un especialista:** crear la clase en `app/agents/`, sumarla a
[`registry.py`](../backend/app/agents/registry.py) y agregarla a `frontend/src/lib/agents.ts` para que
aparezca en el panel.

## Orquestación y decisión

| Agente | Dónde | Qué hace |
|---|---|---|
| **Router** | [`graph/router.py`](../backend/app/graph/router.py) | Decide a qué especialistas consultar. En la recomendación diaria van los cuatro. En Ask Coaches elige según la pregunta y la descripción de cada uno; si el LLM falla, decide por palabras clave |
| **Head Coach** | [`head_coach.py`](../backend/app/agents/head_coach.py) | Recibe solo las opiniones estructuradas, arbitra los desacuerdos y elige la sesión entre las opciones que arma el código (plan, Z2 con estímulos, Z2 suave o descanso). Escribe la razón principal, la explicación y la confianza. En Ask Coaches redacta la respuesta |

## Agente puntual

| Agente | Dónde | Qué hace |
|---|---|---|
| **Race Strategy** | [`race_strategy.py`](../backend/app/agents/race_strategy.py) | Botón **Estrategia IA** en Race (`POST /race/strategy`). Lee un resumen del entrenamiento (CTL, TSB, volumen semanal, fondos más largos de bici y run, readiness), elige el enfoque (conservador, equilibrado o agresivo) y escribe notas por segmento, nutrición y el porqué. Los vatios y ritmos los ajusta el código según el enfoque (×0.97, ×1 o ×1.02) |

## Lo que no es un agente

- **Motor de reglas** ([`rules/engine.py`](../backend/app/rules/engine.py)): código, sin LLM. Valida
  la decisión del Head Coach:
  - nada de intensidad de sweet spot o más con readiness en rojo;
  - nada de VO2max a 7 días o menos de la carrera;
  - nada de tono de diagnóstico médico.

  Si alguna falla, devuelve la decisión al Head Coach con el motivo, hasta 2 veces; después aplica
  una alternativa segura.
- **Aprobación del atleta (HITL):** cuando la decisión es `modify`, el grafo se pausa con
  `interrupt()` hasta que el atleta acepte o mantenga el plan.
- **Calculado en el navegador, sin LLM:** el análisis de las sesiones sincronizadas, las lecturas por
  disciplina de Análisis del staff y los carbohidratos del día.

## Modelos

Por defecto, todos los agentes usan `openrouter/nvidia/nemotron-3-super-120b-a12b:free`, con
`openrouter/google/gemma-4-31b-it:free` de fallback. Se cambian con `SPECIALIST_MODEL`, `COACH_MODEL` y
`FALLBACK_MODEL` en `backend/.env`. Cualquier modelo de LiteLLM que acepte `response_format` JSON
funciona.
