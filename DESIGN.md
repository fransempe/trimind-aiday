---
name: TriMind AI
description: Entrenador multiagente para deportes de resistencia, presentado como un protocolo de laboratorio de rendimiento.
colors:
  graphite-table: "#0f1113"
  sheet: "#15181b"
  popover: "#1b1f23"
  muted-surface: "#1d2125"
  accent-surface: "#22272c"
  rail: "#0b0d0f"
  rail-accent: "#171a1d"
  rail-border: "#22262a"
  bone-ink: "#ece7db"
  warm-gray: "#a39d91"
  faint: "#8c867c"
  band: "#ece7db"
  band-ink: "#15181b"
  band-muted: "#5d5850"
  rule: "#2a2e33"
  rule-strong: "#40464d"
  input: "#3a4046"
  grid: "#23272b"
  axis: "#8a847a"
  reagent: "#e8a93b"
  good: "#4cb874"
  critical: "#e5534b"
  swim: "#3987e5"
  bike: "#d95926"
  run: "#199e70"
  atl-violet: "#9085e9"
  zone-z1: "#3d4247"
  zone-z2: "#6b675f"
  zone-z3: "#9a9487"
  zone-z3-4: "#c4bdaf"
  zone-z4: "#e2dccf"
  zone-z5: "#f7f3ea"
  zone-z6: "#ffffff"
typography:
  decision:
    fontFamily: "Archivo, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 0.85
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 62"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 68"
  reading-xl:
    fontFamily: "Archivo, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 0.85
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 66"
    fontFeature: "'tnum', 'lnum'"
  section-title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    fontVariation: "'wdth' 80"
  title-lead:
    fontFamily: "Archivo, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.005em"
  reading:
    fontFamily: "Archivo, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 78"
    fontFeature: "'tnum', 'lnum'"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "Archivo, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 78"
  table-head:
    fontFamily: "Archivo, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.05em"
    fontVariation: "'wdth' 80"
  band-label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 78"
  code:
    fontFamily: "Martian Mono, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    letterSpacing: "0"
    fontFeature: "'tnum'"
rounded:
  seal: "2px"
  sheet: "3px"
  control: "4px"
  dot: "9999px"
spacing:
  page-x-sm: "16px"
  page-x-md: "24px"
  page-x-lg: "32px"
  page-y: "24px"
  sheet-head-y: "10px"
  cell: "12px"
  row-y: "12px"
  session-row-y: "20px"
  column-gap: "40px"
  page-max: "1480px"
  rail-width: "224px"
  side-sheet-x: "32px"
  side-sheet-max: "768px"
components:
  button-primary:
    backgroundColor: "{colors.bone-ink}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.input}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    textColor: "{colors.warm-gray}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "28px"
  button-band:
    backgroundColor: "{colors.band-ink}"
    textColor: "{colors.band}"
    rounded: "{rounded.sheet}"
    padding: "0 14px"
    height: "36px"
  decision-seal-modify:
    textColor: "{colors.reagent}"
    typography: "{typography.label}"
    rounded: "{rounded.seal}"
    padding: "2px 6px"
  sheet:
    backgroundColor: "{colors.graphite-table}"
    textColor: "{colors.bone-ink}"
    rounded: "0"
  input:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
    height: "32px"
  protocol-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-ink}"
    padding: "10px 32px"
  nav-rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.warm-gray}"
    width: "{spacing.rail-width}"
  approval-box:
    textColor: "{colors.reagent}"
    rounded: "{rounded.sheet}"
    padding: "14px"
  side-sheet:
    backgroundColor: "{colors.graphite-table}"
    textColor: "{colors.bone-ink}"
    padding: "24px 32px"
    width: "{spacing.side-sheet-max}"
  modal:
    backgroundColor: "{colors.graphite-table}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.control}"
    padding: "24px"
    width: "576px"
  status-tag:
    textColor: "{colors.reagent}"
    rounded: "{rounded.sheet}"
    padding: "2px 6px"
  chat-bubble-user:
    backgroundColor: "{colors.bone-ink}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.sheet}"
    padding: "8px 14px"
  chat-bubble-agent:
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.sheet}"
    padding: "10px 14px"
  toast:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.control}"
---

# Design System: TriMind AI

## Overview

**Creative North Star: "Protocolo de laboratorio"**

Cada pantalla es una hoja de un informe de laboratorio de rendimiento deportivo, apoyada sobre una mesa de luz grafito. No hay tarjetas: hay hojas separadas por filetes finos, con una cabecera de protocolo impresa en banda hueso, lecturas por estación en franjas tabulares y una conclusión firmada por el Head Coach. La densidad es de planilla: cifras tabulares, columnas alineadas, etiquetas cortas. Las superficies nuevas (Today por franjas, Nutrición, Race, Base de conocimiento, Observabilidad) siguen la misma gramática: listas con filete entre filas, franjas de lecturas y hojas laterales para el detalle.

La tipografía hace el trabajo de jerarquía. Archivo cambia de ancho según el rol: muy condensada para la decisión y las cifras grandes, condensada para lecturas y etiquetas, normal para el texto corrido. Martian Mono aparece solo donde un instrumento imprimiría un código: ids de corrida, tiempos de la traza, nombres de modelo y medidas. El color está racionado: tinta hueso para casi todo, gris cálido para lo secundario, ámbar reactivo solo para el umbral y lo que espera al atleta, y los tres colores por deporte solo sobre datos de ese deporte.

El movimiento distintivo es el techo de intensidad: una línea ámbar que se dibuja una sola vez cuando llega la decisión, tacha en rojo lo que del plan original la cruza y deja pasar por debajo el ajuste en la rampa de valor. Lo que el sistema rechaza explícitamente: la grilla de tarjetas KPI con acento neón y la estética de app de fitness de consumo.

**Key Characteristics:**
- Mesa grafito, hojas con filete superior, sin tarjetas ni sombras de reposo.
- Banda de protocolo hueso con tinta grafito arriba; rail de navegación grafito a la izquierda.
- Archivo de ancho variable (62% a 100%) con cifras tabulares; Martian Mono solo para códigos y medidas.
- Ámbar reactivo racionado; colores por deporte solo en series por deporte.
- Rampa de valor grafito a hueso para zonas de intensidad: más claro es más intenso.
- Esquinas casi rectas (2px a 4px).
- El detalle se abre a pedido: filas colapsables y hojas laterales, nunca páginas de detalle nuevas.

## Colors

Una paleta de tinta sobre grafito: neutros cálidos casi monocromos, un solo acento reactivo y hues reservados para los datos.

### Primary
- **Ámbar reactivo** (reagent): el reactivo del laboratorio. Marca techos y umbrales, la pausa que espera la aprobación del atleta, la decisión Modify (vía warning, mismo valor) y "Ajustada por el Head Coach", lo que está en curso y el atleta espera (líneas "está pensando…", "Escuchando…", la caja del router en Ask Coaches), lo que falta completar (etiqueta "Para completar", trofeo de carrera sin análisis, aviso de plan desactualizado), el día de carrera en el taper y en el calendario, el veredicto "por debajo" de una sesión, las etiquetas de fallback en Observabilidad, el punto del ítem activo del rail, el punto del wordmark, el foco, el caret y la selección. Nada más.

### Secondary
- **Verde de estado** (good): Train, readiness en verde, "Reglas OK", sesión hecha, veredicto cumplido, carrera analizada, condiciones aplicadas al plan, eval aprobado y el LED de dispositivo conectado.
- **Rojo crítico** (critical): Recover, readiness comprometida, impacto alto, eval fallido, error de llamada y el tachado de lo que cruza el techo.

### Tertiary (series de datos)
- **Azul natación** (swim), **naranja ciclismo** (bike), **verde running** (run): únicamente en datos por deporte (puntos de sesión, íconos de sesión en Semana y Mes, barras de volumen, filas de resumen semanal, el filete de 2px que abre una columna por disciplina o un segmento de carrera, el punto junto al tiempo de un segmento).
- **Violeta ATL** (atl-violet): la única serie no deportiva con hue, para separar la carga aguda de la crónica; también marca Fuerza en el plan generado.
- **Rampa de zonas** (zone-z1 a zone-z6): valor grafito a hueso; las zonas de intensidad se leen por luminosidad, nunca por hue.

### Neutral
- **Mesa grafito** (graphite-table): fondo de página, de las hojas, de la hoja lateral y del modal.
- **Hoja** (sheet) / **Popover** / **Superficie apagada** (muted-surface) / **Acento** (accent-surface): capas tonales para popovers, toasts, controles, pestañas y hover.
- **Rail** (rail, rail-accent, rail-border): la navegación, un escalón más oscuro que la mesa.
- **Tinta hueso** (bone-ink): texto principal, botón primario, burbuja del atleta en el chat, chip de condición activo, ajuste del Head Coach en el gráfico del techo.
- **Gris cálido** (warm-gray): texto secundario, subtítulos, etiquetas, estado pendiente. **Tenue** (faint): tercer nivel, nombre de modelo, impacto bajo, LED apagado, plan fantasma.
- **Banda hueso** (band, band-ink, band-muted): la cabecera de protocolo, con tinta grafito y etiquetas en gris pardo.
- **Filetes** (rule, rule-strong): separadores; el filete fuerte abre cada hoja. **Grilla** (grid) y **Eje** (axis): estructura recesiva de los gráficos.

### Named Rules
**The Reagent Rule.** El ámbar solo aparece donde hay un umbral, un techo, algo pendiente del atleta o en curso para él, o un Modify. Si no se puede nombrar el umbral o la espera, no va ámbar: un resultado de IA ya entregado no es una espera.

**The Sport Hue Rule.** Azul, naranja y verde de deporte solo tiñen datos de ese deporte. Las series no deportivas van en tinta hueso; ATL en violeta es la única excepción.

**The Value Ramp Rule.** Las zonas de intensidad se codifican por valor en la rampa grafito a hueso (más claro = más intenso), nunca con colores de deporte ni con ámbar.

**The Never Color Alone Rule.** Toda decisión o estado lleva ícono y texto además de color (sello con ícono, "Reglas OK" con check, estado de sesión con check, círculo punteado o cruz, impacto con diámetro y etiqueta).

## Typography

**Display Font:** Archivo variable, eje wdth (con sans-serif)
**Body Font:** Archivo variable (con sans-serif)
**Label/Mono Font:** Martian Mono (con monospace)

**Character:** Una sola grotesca que se comprime como una planilla impresa cuando lleva cifras o la conclusión, y se abre para leer. El mono es de instrumento, no de estilo.

### Hierarchy
- **Decision** (700, 72px, 0.85, wdth 62, mayúsculas): la palabra Train / Modify / Recover en la conclusión. Una por pantalla.
- **Headline** (700, 40px, 1, wdth 68): título de página (PageHead) y el wordmark a 26px con wdth 66.
- **Reading XL** (700, 64px, 0.85, wdth 66, tabular): la cifra protagonista de una hoja (readiness score, D-7). La misma familia, a menor tamaño, lleva la hora de cada franja en Today (44px la sesión clave, 32px el resto), el total de carbohidratos (36px) y el D-N de la próxima carrera en el rail (22px).
- **Section title** (700, 24px, 1.1, wdth 80): título de una hoja lateral; a 22px abre "Resultados de la IA" y a 20px con wdth 72 titula Semana y Mes.
- **Title lead** (600, 24px, 1.2): la razón principal junto a la decisión, máximo 36ch.
- **Title** (600, 15px): título de hoja en su cabecera y de una fila de lista (carrera, eval); 17px para la cabecera de una columna por disciplina o de la nutrición del día, 18px para una comida, 26px / 20px para el título de sesión en Today.
- **Reading** (600, 28px, wdth 78, tabular): cifra de una celda de lecturas (StatTile); las lecturas compactas (análisis de sesión, disciplinas) usan el mismo tratamiento a 15-18px, y los totales destacados a 22px 700 con wdth 72.
- **Body** (400, 15px, 1.625): explicaciones, máximo 66ch a 70ch; subtítulo de página máximo 68ch. Las filas y respuestas de chat corren a 14px.
- **Body small** (400, 13px): etiquetas de lectura, leyendas, metadatos, ejes; 12px para notas al pie y aclaraciones de alcance.
- **Label** (600, 0.78rem, 0.06em, mayúsculas, wdth 78, gris cálido): rótulos de dato (días del taper, nombre de la serie sobre un gráfico).
- **Table head** (600, 12px, 0.05em, mayúsculas, wdth 80, gris cálido): encabezados de columna en todas las tablas (ejercicios, carbohidratos, llamadas al LLM) y los días de la grilla del Mes.
- **Band label** (600, 10px, 0.08em, mayúsculas, wdth 78): rótulos de campo en la banda de protocolo, siempre sobre su valor.
- **Code** (Martian Mono 400, 0.72rem, tabular): id de corrida, tiempos de la traza, nombre de modelo, latencia, configuración del backend.

### Named Rules
**The Width Carries Weight Rule.** La jerarquía de cifras se arma con el ancho (62% a 80%) y el tamaño, no con color: cuanto más importante la cifra, más condensada.

**The Instrument Mono Rule.** Martian Mono solo para códigos, tiempos y medidas que un instrumento imprimiría. Nunca para títulos, etiquetas o texto.

**The Tabular Figures Rule.** Toda cifra comparable usa números tabulares y lining para que las columnas se alineen.

## Layout

Shell de dos zonas: rail de navegación fijo de 224px a la izquierda desde lg, y a la derecha la banda de protocolo pegajosa arriba y el contenido debajo, con ancho máximo de 1480px y márgenes de 16 / 24 / 32px según breakpoint (py 24px). En mobile el rail se vuelve una franja superior con wordmark y navegación horizontal desplazable, y la banda de protocolo envuelve sus campos.

Las páginas apilan bloques con 40px de separación (32px en Nutrición, 48px entre los dos tramos de Análisis). El contenido se compone en grillas de 12 columnas: Análisis pone las disciplinas a 8 columnas y readiness y escenario a 4, y repite el reparto 8 / 4 bajo "Resultados de la IA"; las páginas secundarias usan dos columnas desde xl con separación de 40px. Las lecturas se alinean en franjas de celdas entre filete fuerte arriba y abajo, separadas por filetes verticales (2 columnas en mobile, 4 o 6 desde lg / xl).

Las listas son la unidad principal: filas con filete superior fino y 12px vertical (carreras, agenda, evals, resultados), sin filete en la primera. Today usa filas de franja con 20px vertical y una columna fija para la hora (5.5rem, 8rem desde sm); Nutrición usa una columna de 11rem para la comida. Encima de la lista, una tira de estado entre filetes fuertes (readiness y decisión en Today, totales y botón de IA en Nutrición). Las columnas por disciplina o por segmento se reparten en 1 / 2 / 3 columnas desde lg según el perfil. Today se organiza en pestañas (Hoy / Semana / Mes / Ask Coaches); Semana es una grilla de 7 columnas desde md con el día actual tintado en hueso al 4%. Ningún hijo de grilla puede empujar el ancho de la página: las tablas anchas se contienen con scroll horizontal.

## Elevation & Depth

Plano por defecto. La profundidad es tonal y lineal: la mesa grafito, el rail un escalón más oscuro, la banda hueso como único plano claro, y filetes de 1px que separan hojas y filas. Las hojas no tienen sombra ni fondo propio; se distinguen por su filete superior fuerte y la línea de cabecera.

### Shadow Vocabulary
- **Capa flotante** (`box-shadow` de shadcn `shadow-xl`): tooltips de gráficos, popovers y toasts, que flotan sobre los datos.
- **Capa modal** (`shadow-2xl`): solo la hoja lateral y el modal de ejercicio, sobre un velo negro al 60%.

### Named Rules
**The Ruled Sheet Rule.** Una sección es una hoja: filete superior fuerte (rule-strong) y cabecera con filete fino, nunca una caja con sombra o fondo elevado. Las variantes son el filete ámbar de 2px cuando la hoja contiene lo que espera al atleta, el filete fuerte de 2px que abre un tramo mayor (nutrición del día, "Resultados de la IA", el análisis dentro de una hoja lateral) y el filete de 2px en color de deporte que abre una columna de esa disciplina.

## Shapes

Esquinas casi rectas en todo el sistema: 2px para el sello de decisión, 3px para la banda, cajas de aprobación, etiquetas de estado, burbujas del chat, tooltips y el marco de la demo, 4px (--radius 0.25rem) para botones, inputs, pestañas, toasts y el modal. La hoja lateral no tiene esquinas: va a sangre del borde derecho con filete izquierdo fuerte. Los únicos círculos son puntos de datos: punto de deporte de 8px, impacto de 6 / 10 / 15px, LED de 10px, punto del ítem activo de 6px, hitos del taper de 10px. Las barras del gráfico del techo tienen esquinas de 1.5px; las líneas de Recharts tienen 2px de trazo. El tachado del techo es un rayado a 45 grados en rojo crítico. Los marcos vacíos o pendientes (Empty, demo sin medio) llevan filete punteado.

## Components

### Buttons
Directos y planos, de planilla.
- **Shape:** esquinas casi rectas (4px), alto 32px (28px en sm, 36px en lg).
- **Primary:** fondo tinta hueso, texto grafito, 500 a 14px; hover al 80% de opacidad. Acción principal de cada bloque: "La hice", "Generar plan con IA", "Guardar y analizar con IA", "Cargar resultado".
- **Outline:** fondo input al 30%, borde input, texto hueso; hover al 50%. El par: "Mantener plan", "Sincronizar", importar de un dispositivo, "Estrategia IA", "Regenerar con IA", y la acción ya hecha de un toggle ("En mi agenda").
- **Ghost:** sin fondo ni borde, texto gris cálido, hover a superficie apagada. Acciones de baja jerarquía o reversibles: "No la hice", "Deshacer", "Vaciar caché", quitar de la agenda.
- **Band button:** "Ask Coaching Team" en la banda: tinta grafito sobre hueso invertida (fondo band-ink, texto band), 36px, 3px, 600 a 14px; hover al 90%.
- **Busy:** el ícono se cambia por un spinner y el texto narra quién trabaja ("El Race Agent está analizando…"); el botón queda deshabilitado al 50%.
- **Hover / Focus:** foco con anillo ámbar (outline 2px reagent, offset 2px a nivel global); pulsado baja 1px.

### Decision Seal
- **Style:** borde fino del color de la decisión al 55%, texto del mismo color, mayúsculas 600 con wdth 76 y 0.04em, ícono a la izquierda (check, lápiz o cama).
- **Sizes:** sm 12px con 2px 6px; lg 15px con 4px 10px. Dentro de una pastilla de agente (borde fino, 3px, 12px) muestra la opinión de cada especialista consultado.

### Cards / Containers (hojas)
- **Corner Style:** sin esquinas.
- **Background:** la mesa grafito; sin fondo propio.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete superior rule-strong; cabecera de 48px mínimo con filete inferior rule; ámbar de 2px cuando está activa.
- **Internal Padding:** 16px bajo la cabecera, 8px abajo; el contenido corre a sangre de la columna.
- **Collapsible:** un bloque opcional (nutrición del día, detalle de Nutrición, detalle de sesión) se abre desde su propio título con un chevron que gira 180 grados; cerrado, el título muestra el resumen ("230-300 g · día de carga"). La elección queda recordada.

### Inputs / Fields
- **Style:** borde input, fondo input al 30%, 4px, 32px de alto, 14px; los tiempos de segmento van a 16px con cifras tabulares.
- **Focus:** borde y anillo ámbar.
- **Error / Disabled:** borde crítico con anillo al 40%; deshabilitado al 50% de opacidad.
- **Switch:** conexión de dispositivos y "En vivo" en Observabilidad, siempre con su rótulo.

### Chips
- **Toggle de condición** (ConditionPicker): 13px, borde fino; activo invertido en tinta hueso con texto grafito y check. Aparece en Nutrición y Configuración.
- **Sugerencia de pregunta:** 13px gris cálido con borde fino; hover a hueso. Desaparecen al primer mensaje.

### Navigation
- **Rail:** fondo rail, ítems separados por filetes, ícono de 16px a trazo 1.75, texto 14px gris cálido; hover a hueso. Activo: texto hueso 600, ícono ámbar y punto ámbar de 6px al final. Abajo, separados por filete: la próxima carrera, el estado de dispositivos con LED y la nota de alcance.
- **Próxima carrera (rail):** rótulo 12px 600 gris cálido con bandera, nombre 14px 600, y D-N condensado a 22px 700 (wdth 66) junto a la fecha en 12px. Lleva a Race.
- **Pestañas:** lista de 32px sobre superficie apagada con 3px de margen interno; la activa toma fondo input al 30% con borde input y texto hueso. La pestaña de chat se monta siempre para no perder la conversación.
- **Mobile:** franja superior con chips de 13px desplazables; el activo toma fondo rail-accent.

### Protocol Band
Cabecera impresa del informe: fondo hueso, tinta grafito, "Protocolo diario" condensado a 17px con el id de corrida en mono, y campos rótulo/valor (Fecha, Atleta, FTP, Carrera, Fase, Datos, Dispositivos) con valores tabulares a 15px. Pegajosa arriba.

### Ceiling Profile (signature)
El perfil de potencia del día contra el techo que fijan las reglas. Barras por bloque en la rampa de zonas; cuando hay ajuste, el plan original pasa a fantasma (hueso al 10% con borde tenue punteado 4/3) y el ajuste se registra encima en los mismos ejes. El techo es una línea ámbar de 3px que se dibuja en 0.9s (ease 0.16, 1, 0.3, 1); lo que la cruza se tacha con rayado rojo y una diagonal de corte, con la etiqueta "+N W tachado". Secuencia: techo, tachado a 0.85s, ajuste a 1.1s. Con movimiento reducido, todo aparece sin animación. Se dibuja en píxeles reales: el texto no escala con el ancho. En Today, la propuesta del Head Coach se resume en una línea: la sesión original tachada en rojo, flecha ámbar, la nueva en 600.

### Session Row (Today)
Una franja disponible por fila: hora condensada a la izquierda con los minutos disponibles debajo, y a la derecha deporte (ícono en su color, rótulo gris cálido), título de sesión que abre y cierra el detalle, y el estado. El detalle (descripción, tabla de ejercicios con "Ver" demo, pasos del workout) arranca abierto mientras la sesión está pendiente y cerrado una vez registrada. Estados, siempre con ícono y texto:
- **Pendiente / Sin registrar:** círculo punteado gris cálido, con "La hice" (primario), "Sincronizar [dispositivo]" (outline) y "No la hice" (ghost).
- **Hecha · marcada a mano:** check verde, con nota de que falta el dato del dispositivo.
- **Hecha · sincronizada desde [dispositivo]:** LED verde y debajo el análisis: franja de lecturas compactas (12px rótulo, 15px cifra, filetes verticales), veredicto en 15px 600 (verde cumplida, hueso con matices, ámbar por debajo), una línea de lectura y, con el detalle abierto, los puntos en gris cálido.
- **No realizada:** cruz gris cálido.
Todos los estados registrados ofrecen "Deshacer".

### Readings Strip y Impact Meter
- **StatTile:** rótulo 13px gris cálido, cifra de lectura a 28px, unidad 13px, detalle 12px; celdas separadas por filetes.
- **ImpactMeter:** rampa fija de diámetros (6 / 10 / 15px) en tenue, gris cálido y crítico, siempre con la etiqueta Bajo / Moderado / Alto.

### Device LED
Estado de conexión de Garmin, Strava o Wahoo, fijado por el usuario: punto verde (good) de 10px con un pulso ping al 60% cuando hay conexión, tenue sin conexión. El pulso se apaga con movimiento reducido. Aparece en el rail, en la banda, en Configuración, en /datos, en el onboarding y en una sesión sincronizada.

### Approval Box
La pausa human-in-the-loop: borde ámbar al 60%, fondo ámbar al 6%, 3px, 14px de padding, mensaje en ámbar y el par botón primario / outline.

### Shared Patterns
Patrones que se repiten en varias superficies; una pantalla nueva los reutiliza en lugar de inventar su variante.
- **Hoja lateral** (Sheet): entra desde la derecha a ancho completo en mobile y hasta 768px desde sm, fondo mesa grafito, filete izquierdo fuerte, capa modal sobre velo negro al 60%; cierra con Esc, clic afuera o la X de 20px arriba a la derecha. Padding de 24px vertical y 20 / 32px horizontal, con scroll propio. Abre con título de sección (24px 700, wdth 80) y una descripción 14px gris cálido; el cuerpo se divide en secciones de título 15px 600 y cierra con la aclaración de alcance a 12px. Se usa para el resultado de una carrera (tiempos con importación desde dispositivo, relato escrito o dictado, debrief de IA) y para la estrategia con IA de una carrera de la agenda.
- **Modal de ejercicio:** caja centrada de hasta 576px, 4px, filete fuerte, capa modal; título 20px 600, dosis tabular en gris cálido, marco 16:9 de 3px con filete punteado para la demo (o el aviso "Demo animada próximamente") y la clave técnica bajo un filete.
- **Chat con agente** (AgentChat): una hoja "Preguntale a tu [agente]" al pie de Análisis, Nutrición y Race. Vacío, muestra chips de sugerencia; el atleta escribe en burbuja de tinta hueso alineada a la derecha (hasta 85%), el agente responde en burbuja con filete fino (hasta 92%, 14px, interlineado amplio) bajo una línea 12px 600 con su ícono, su nombre y a quién consultó; el nombre del modelo cierra la respuesta en mono tenue. Mientras responde, una línea ámbar con spinner ("[Agente] está pensando…"). El campo y "Enviar" van al pie, separados por filete cuando ya hay mensajes.
- **Bloque generado por IA:** todo lo que escribe un modelo se identifica y se firma. Arriba, un botón con varita ("Generar con IA", luego "Regenerar con IA" en outline); mientras trabaja, una línea ámbar con spinner que narra qué agente hace qué; entregado, una línea 13px 600 con varita nombra al autor ("Análisis del Race Agent"), el contenido corre en listas con filete entre ítems y el nombre del modelo cierra el bloque en Martian Mono tenue. Sin respuesta de IA se muestra el respaldo calculado en código, con una nota 13px que lo dice. Aplica a Nutrición, debrief de carrera, estrategia de carrera, Base de conocimiento y el chat.
- **Etiqueta de estado** (Tag): 11px 600, 3px, borde del tono al 50-60% y texto del mismo tono, sin fondo. Tonos: verde (ok, condición aplicada), ámbar (para completar, fallback, heurística), crítico (error), gris cálido con borde fino (caché, reintento). Con ícono cuando el texto solo no alcanza.
- **Toast:** abajo a la derecha, fondo popover, filete fino, 4px, capa flotante. Confirma un efecto que no se ve en pantalla: sincronización automática al abrir Today, tiempos importados, carrera agregada o quitada de la agenda, Base de conocimiento actualizada, caché vaciada, falla del backend con su remedio. Título corto y descripción con el objeto afectado; el de próxima carrera lleva bandera, dura 6s y sale una vez por sesión del navegador.
- **Vacío** (Empty): filete superior punteado fuerte, ícono de círculo tachado y una frase 14px gris cálido que dice qué falta y dónde resolverlo.

## Do's and Don'ts

### Do:
- **Do** abrir cada sección como una hoja con filete superior rule-strong y cabecera con filete fino.
- **Do** reservar el ámbar reactivo (#e8a93b) para techos, umbrales, lo que espera al atleta o está en curso para él, y Modify.
- **Do** codificar zonas de intensidad con la rampa de valor zone-z1 a zone-z6, más claro = más intenso.
- **Do** poner cifras en Archivo condensado (wdth 62 a 80) con números tabulares.
- **Do** acompañar todo estado o decisión con ícono y texto, además de color.
- **Do** usar Martian Mono solo para ids, tiempos de traza, modelos y medidas.
- **Do** firmar todo contenido generado por IA con su agente y cerrar con el nombre del modelo en mono tenue.
- **Do** abrir el detalle en una fila colapsable o en una hoja lateral, y confirmar con un toast lo que pasa fuera de la vista.
- **Do** respetar movimiento reducido: el techo y el LED aparecen sin animar.

### Don't:
- **Don't** armar grillas de tarjetas KPI con acento neón ni estética de app de fitness de consumo.
- **Don't** usar los colores de deporte (#3987e5, #d95926, #199e70) fuera de datos por deporte, ni para zonas.
- **Don't** usar ámbar como acento decorativo, de marca, de hover o para rotular un resultado de IA ya entregado.
- **Don't** dar sombra o fondo elevado a las hojas; la sombra queda para tooltips, popovers, toasts, la hoja lateral y el modal.
- **Don't** redondear más de 4px salvo los puntos de datos.
