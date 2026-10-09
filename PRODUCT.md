# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El público técnico de un AI Day: ingenieros y gente de producto que evalúan en vivo una demo de
orquestación multiagente. Ven la app en una notebook o por una pantalla compartida en streaming,
mientras alguien la opera y la explica. El triatleta (Francisco Sempé, 39 años) es el personaje de la
demo, no el usuario real: el público tiene que entender en segundos qué le pasa a ese atleta y qué
decide el staff de agentes.

## Product Purpose

TriMind AI es un entrenador multiagente para deportes de resistencia (triatlón, ciclismo, running,
natación). No registra entrenamientos ni muestra métricas por mostrarlas: convierte los datos en una
decisión diaria y responde "¿qué debería entrenar hoy, según cómo estoy, qué hice y para qué carrera me
preparo?". La demo tiene éxito si el público ve, sin que se lo expliquen dos veces, cómo varios agentes
especializados opinan, discrepan y un Head Coach arbitra y decide con una explicación.

## Positioning

Garmin, Strava y TrainingPeaks registran y grafican; TriMind decide. Funciona como un pequeño staff
deportivo de IA: especialistas (Training, Recovery, Race y Performance en beta) analizan desde su área,
el Head Coach combina sus opiniones estructuradas, arbitra los desacuerdos y elige mantener, modificar o
descansar. Los números los calcula Python; el LLM interpreta y argumenta, nunca calcula.

## Operating Context

- La demo se presenta en vivo en un AI Day, en notebook o pantalla compartida por stream.
- Recorrido guionado de 3 escenarios: estado normal (se mantiene 3x15' a 250 W), atleta fatigado
  (sueño 5h12, HRV -21%, run fuerte ayer, carrera en 7 días → 60' Z2 175-190 W + 3x2' a 220 W, con
  aprobación del atleta) y recuperado (8h14, HRV normal, RPE 2 → se restaura el plan).
- El operador cambia el estado del atleta con sliders y presets, y dispara "Ask Coaching Team".
- Lo que el público tiene que poder leer en vivo: agentes trabajando en paralelo, la discrepancia, el
  arbitraje, las reglas, la pausa human-in-the-loop y la traza del grafo (observabilidad).

## Capabilities and Constraints

- Pantallas: Today (principal), Training, Performance, Recovery, Race, Athlete, Ask Coaches.
- Contratos: AgentOpinion (recommendation, score, confidence, observations, impact_factors) y
  CoachDecision (decision, original/new workout, confidence, primary_reason, explanation,
  impact_factors, opinions, disagreements, rule_retries).
- Eventos SSE por nodo del grafo: router_decided, agent_started, agent_completed, rules_checked,
  awaiting_approval, decision_final, error.
- Modo mock (agentes simulados en el navegador) y modo API (FastAPI + LangGraph + Gemini free tier).
- Reglas duras: sin intensidad con readiness en rojo, sin VO2max a 7 días o menos de la carrera, sin
  tono de diagnóstico médico.
- Es una demo: priorizar lo simple y lo que se ve funcionar, no la completitud de producto.
- Nutrition Agent fuera del MVP; Performance Agent en beta.

## Brand Commitments

- Nombre: TriMind AI.
- Voz: español rioplatense con voseo, tono de entrenador profesional, directo y sin exagerar.
  Navegación, títulos de sección y jerga deportiva en inglés (Today, Readiness score, Coaching team,
  TSS, FTP, CTL/ATL/TSB, Train / Modify / Recover).
- Siempre visible que las recomendaciones son apoyo al entrenamiento, no diagnóstico médico.

## Evidence on Hand

- Datos mock realistas generados en Python: 6 semanas de actividades, sueño y HRV diarios, perfil
  (FTP 270 W, 72 kg) y carrera IRONMAN 70.3 Buenos Aires a 7 días (`backend/data/mock/`,
  `frontend/src/lib/mock/athlete-data.json`).
- Historia de FTP, curva de potencia y estrategia de carrera son datos de demo inventados
  (`frontend/src/lib/mock/data.ts`).
- No hay usuarios reales, testimonios, métricas de adopción ni integraciones externas: no fabricarlos.

## Product Principles

1. Decisión antes que dato: cada pantalla responde qué hacer, no solo qué pasó.
2. El razonamiento se ve: opiniones, discrepancias, reglas y traza son parte de la interfaz, no un log
   escondido.
3. Legible en vivo: el público entiende el estado y el cambio de decisión en segundos, a distancia de
   una notebook o en un stream comprimido.
4. Los números son de Python, las palabras del LLM: la UI distingue lo calculado de lo argumentado.
5. Apoyo, no diagnóstico: el tono nunca es médico.

## Accessibility & Inclusion

Pensar para pantalla compartida en streaming: contraste alto, tamaños de texto legibles con
compresión de video, y estado nunca transmitido solo por color (siempre icono o etiqueta).
