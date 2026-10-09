---
version: 1
slug: "frontend-src-app-page-tsx"
primary_target: "frontend/src/app/page.tsx"
related_targets: ["frontend/src/app/layout.tsx","frontend/src/app/training/page.tsx","frontend/src/app/performance/page.tsx","frontend/src/app/recovery/page.tsx","frontend/src/app/race/page.tsx","frontend/src/app/athlete/page.tsx","frontend/src/app/ask/page.tsx"]
---

# Today (y shell de la app)

Mode: Operate. Público: asistentes técnicos de un AI Day que ven la demo en notebook o stream mientras
alguien la opera. Tarea: entender en segundos la decisión del día y su porqué, después ver a los
agentes que la sostienen. Restricciones fijadas por el usuario: fondo oscuro, colores por deporte
(swim #3987E5, bike #D95926, run #199E70); evitar estética de app de fitness de consumo. Code-led.

Momento memorable: el techo de intensidad que corta el perfil del plan.

Pendiente: ninguna decisión abierta.

## Direction contract

THESIS: Cada día es un protocolo de laboratorio de rendimiento: lecturas por estación, un umbral
marcado y una conclusión firmada por el Head Coach. Rechaza la grilla de tarjetas KPI con acento neón.

OWN-WORLD: Fondo grafito como mesa de luz, hojas separadas por filetes finos en vez de tarjetas;
tinta hueso, gris cálido para lo secundario, ámbar reactivo solo para umbrales, techos y lo que espera
al atleta. Encabezado de protocolo en banda hueso con tinta grafito. Archivo en anchos variables
(condensado para cifras y decisión, normal para texto) y Martian Mono solo para códigos, tiempos y
medidas. Densidad de planilla, cifras tabulares, colores por deporte en series.

STORY: El público lee primero la conclusión (Train, Modify o Recover) y el porqué, ve el techo que
cruza el plan, recorre las lecturas de cada agente con la discrepancia marcada, y entiende de qué
estado del atleta salió todo.

FIRST VIEWPORT: Banda de protocolo arriba (número, fecha, atleta, D-7, modo, Ask Coaching Team). Rail
de navegación grafito a la izquierda. Debajo, a 8 columnas, la conclusión: decisión condensada a gran
escala, razón y explicación, y el gráfico del techo con ambos perfiles registrados; a 4 columnas, la
regla de readiness con sus cuatro lecturas y las condiciones del test. Abajo, la tabla de estaciones
de los agentes, la traza y los factores de impacto en rampa fija.

FORM: Protocolo de laboratorio de rendimiento deportivo, candidato 6 de 7 de la lista ordenada;
seed key ad93bd21. Movimiento distintivo: el techo de intensidad, el perfil de potencia contra la
línea de umbral que fijan las reglas; lo que la cruza queda tachado y el plan nuevo pasa por debajo,
dibujado una sola vez cuando llega la decisión.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
