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
  column-gap: "40px"
  page-max: "1480px"
  rail-width: "224px"
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
---

# Design System: TriMind AI

## Overview

**Creative North Star: "Protocolo de laboratorio"**

Cada pantalla es una hoja de un informe de laboratorio de rendimiento deportivo, apoyada sobre una mesa de luz grafito. No hay tarjetas: hay hojas separadas por filetes finos, con una cabecera de protocolo impresa en banda hueso, lecturas por estación en franjas tabulares y una conclusión firmada por el Head Coach. La densidad es de planilla: cifras tabulares, columnas alineadas, etiquetas cortas.

La tipografía hace el trabajo de jerarquía. Archivo cambia de ancho según el rol: muy condensada para la decisión y las cifras grandes, condensada para lecturas y etiquetas, normal para el texto corrido. Martian Mono aparece solo donde un instrumento imprimiría un código: ids de corrida, tiempos de la traza, nombres de modelo y medidas. El color está racionado: tinta hueso para casi todo, gris cálido para lo secundario, ámbar reactivo solo para el umbral y lo que espera al atleta, y los tres colores por deporte solo sobre datos de ese deporte.

El movimiento distintivo es el techo de intensidad: una línea ámbar que se dibuja una sola vez cuando llega la decisión, tacha en rojo lo que del plan original la cruza y deja pasar por debajo el ajuste en la rampa de valor. Lo que el sistema rechaza explícitamente: la grilla de tarjetas KPI con acento neón y la estética de app de fitness de consumo.

**Key Characteristics:**
- Mesa grafito, hojas con filete superior, sin tarjetas ni sombras de reposo.
- Banda de protocolo hueso con tinta grafito arriba; rail de navegación grafito a la izquierda.
- Archivo de ancho variable (62% a 100%) con cifras tabulares; Martian Mono solo para códigos y medidas.
- Ámbar reactivo racionado; colores por deporte solo en series por deporte.
- Rampa de valor grafito a hueso para zonas de intensidad: más claro es más intenso.
- Esquinas casi rectas (2px a 4px).

## Colors

Una paleta de tinta sobre grafito: neutros cálidos casi monocromos, un solo acento reactivo y hues reservados para los datos.

### Primary
- **Ámbar reactivo** (reagent): el reactivo del laboratorio. Marca techos y umbrales, la pausa que espera la aprobación del atleta, la decisión Modify (vía warning, mismo valor), el punto del ítem activo del rail, el punto del wordmark, el foco, el caret y la selección. Nada más.

### Secondary
- **Verde de estado** (good): Train, readiness en verde, "Reglas OK", "Listo" y el LED de dispositivo conectado.
- **Rojo crítico** (critical): Recover, readiness comprometida, impacto alto y el tachado de lo que cruza el techo.

### Tertiary (series de datos)
- **Azul natación** (swim), **naranja ciclismo** (bike), **verde running** (run): únicamente en datos por deporte (puntos de sesión, barras de volumen, filas de resumen semanal).
- **Violeta ATL** (atl-violet): la única serie no deportiva con hue, para separar la carga aguda de la crónica; también marca Fuerza en el plan generado.
- **Rampa de zonas** (zone-z1 a zone-z6): valor grafito a hueso; las zonas de intensidad se leen por luminosidad, nunca por hue.

### Neutral
- **Mesa grafito** (graphite-table): fondo de página y de las hojas.
- **Hoja** (sheet) / **Popover** / **Superficie apagada** (muted-surface) / **Acento** (accent-surface): capas tonales para popovers, controles y hover.
- **Rail** (rail, rail-accent, rail-border): la navegación, un escalón más oscuro que la mesa.
- **Tinta hueso** (bone-ink): texto principal, botón primario, ajuste del Head Coach en el gráfico del techo.
- **Gris cálido** (warm-gray): texto secundario, subtítulos, etiquetas. **Tenue** (faint): tercer nivel, impacto bajo, LED apagado, plan fantasma.
- **Banda hueso** (band, band-ink, band-muted): la cabecera de protocolo, con tinta grafito y etiquetas en gris pardo.
- **Filetes** (rule, rule-strong): separadores; el filete fuerte abre cada hoja. **Grilla** (grid) y **Eje** (axis): estructura recesiva de los gráficos.

### Named Rules
**The Reagent Rule.** El ámbar solo aparece donde hay un umbral, un techo, algo pendiente del atleta o un Modify. Si no se puede nombrar el umbral, no va ámbar.

**The Sport Hue Rule.** Azul, naranja y verde de deporte solo tiñen datos de ese deporte. Las series no deportivas van en tinta hueso; ATL en violeta es la única excepción.

**The Value Ramp Rule.** Las zonas de intensidad se codifican por valor en la rampa grafito a hueso (más claro = más intenso), nunca con colores de deporte ni con ámbar.

**The Never Color Alone Rule.** Toda decisión o estado lleva ícono y texto además de color (sello con ícono, "Reglas OK" con check, impacto con diámetro y etiqueta).

## Typography

**Display Font:** Archivo variable, eje wdth (con sans-serif)
**Body Font:** Archivo variable (con sans-serif)
**Label/Mono Font:** Martian Mono (con monospace)

**Character:** Una sola grotesca que se comprime como una planilla impresa cuando lleva cifras o la conclusión, y se abre para leer. El mono es de instrumento, no de estilo.

### Hierarchy
- **Decision** (700, 72px, 0.85, wdth 62, mayúsculas): la palabra Train / Modify / Recover en la conclusión. Una por pantalla.
- **Headline** (700, 40px, 1, wdth 68): título de página (PageHead) y el wordmark a 26px con wdth 66.
- **Reading XL** (700, 64px, 0.85, wdth 66, tabular): la cifra protagonista de una hoja (readiness score, D-7).
- **Title lead** (600, 24px, 1.2): la razón principal junto a la decisión, máximo 36ch.
- **Title** (600, 15px): título de hoja en su cabecera; 16px para el título de una sesión.
- **Reading** (600, 28px, wdth 78, tabular): cifra de una celda de lecturas (StatTile); en tablas, las cifras usan el mismo tratamiento a 14-16px.
- **Body** (400, 15px, 1.625): explicaciones, máximo 66ch; subtítulo de página máximo 68ch.
- **Body small** (400, 13px): etiquetas de lectura, leyendas, metadatos, ejes a 13px.
- **Label** (600, 0.78rem, 0.06em, mayúsculas, wdth 78, gris cálido): encabezados de columna de tabla y rótulos de dato (días del taper, nombre de la serie sobre un gráfico).
- **Band label** (600, 10px, 0.08em, mayúsculas, wdth 78): rótulos de campo en la banda de protocolo, siempre sobre su valor.
- **Code** (Martian Mono 400, 0.72rem, tabular): id de corrida, tiempos de la traza, modelo y latencia.

### Named Rules
**The Width Carries Weight Rule.** La jerarquía de cifras se arma con el ancho (62% a 78%) y el tamaño, no con color: cuanto más importante la cifra, más condensada.

**The Instrument Mono Rule.** Martian Mono solo para códigos, tiempos y medidas que un instrumento imprimiría. Nunca para títulos, etiquetas o texto.

**The Tabular Figures Rule.** Toda cifra comparable usa números tabulares y lining para que las columnas se alineen.

## Layout

Shell de dos zonas: rail de navegación fijo de 224px a la izquierda desde lg, y a la derecha la banda de protocolo pegajosa arriba y el contenido debajo, con ancho máximo de 1480px y márgenes de 16 / 24 / 32px según breakpoint (py 24px). En mobile el rail se vuelve una franja superior con wordmark y navegación horizontal desplazable, y la banda de protocolo envuelve sus campos.

El contenido se compone en grillas de 12 columnas: Today pone la conclusión a 8 columnas y la readiness y las condiciones del test a 4; las páginas secundarias usan dos columnas desde xl con separación horizontal de 40px y vertical de 40px entre hojas. Las lecturas se alinean en franjas de celdas separadas por filetes verticales (celda con 12px vertical y 16px a la derecha). Onboarding (/inicio) usa filas de paso: título a la izquierda, opciones en lista con filete a la derecha. Ningún hijo de grilla puede empujar el ancho de la página: las tablas anchas se contienen.

## Elevation & Depth

Plano por defecto. La profundidad es tonal y lineal: la mesa grafito, el rail un escalón más oscuro, la banda hueso como único plano claro, y filetes de 1px que separan hojas y filas. Las hojas no tienen sombra ni fondo propio; se distinguen por su filete superior fuerte y la línea de cabecera.

### Shadow Vocabulary
- **Capa flotante** (`box-shadow` de shadcn `shadow-xl`): solo tooltips de gráficos, popovers y toasts, que flotan sobre los datos.

### Named Rules
**The Ruled Sheet Rule.** Una sección es una hoja: filete superior fuerte (rule-strong) y cabecera con filete fino, nunca una caja con sombra o fondo elevado. La única variante es el filete ámbar de 2px cuando la hoja contiene lo que espera al atleta.

## Shapes

Esquinas casi rectas en todo el sistema: 2px para el sello de decisión, 3px para la banda, cajas de aprobación, tooltips y burbujas del chat, 4px (--radius 0.25rem) para botones e inputs de shadcn. Los únicos círculos son puntos de datos: punto de deporte de 8px, impacto de 6 / 10 / 15px, LED de 10px, punto del ítem activo de 6px. Las barras del gráfico del techo tienen esquinas de 1.5px; las líneas de Recharts tienen 2px de trazo. El tachado del techo es un rayado a 45 grados en rojo crítico.

## Components

### Buttons
Directos y planos, de planilla.
- **Shape:** esquinas casi rectas (4px), alto 32px (28px en sm, 36px en lg).
- **Primary:** fondo tinta hueso, texto grafito, 500 a 14px; hover al 80% de opacidad.
- **Outline:** fondo input al 30%, borde input, texto hueso; hover al 50%. Es el par de "Mantener plan", "Desconectar", "Sincronizar ahora".
- **Band button:** "Ask Coaching Team" en la banda: tinta grafito sobre hueso invertida (fondo band-ink, texto band), 36px, 3px, 600 a 14px; hover al 90%.
- **Hover / Focus:** foco con anillo ámbar (outline 2px reagent, offset 2px a nivel global); pulsado baja 1px.

### Decision Seal
- **Style:** borde fino del color de la decisión al 55%, texto del mismo color, mayúsculas 600 con wdth 76 y 0.04em, ícono a la izquierda (check, lápiz o cama).
- **Sizes:** sm 12px con 2px 6px; lg 15px con 4px 10px.

### Cards / Containers (hojas)
- **Corner Style:** sin esquinas.
- **Background:** la mesa grafito; sin fondo propio.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** filete superior rule-strong; cabecera de 48px mínimo con filete inferior rule; ámbar de 2px cuando está activa.
- **Internal Padding:** 16px bajo la cabecera, 8px abajo; el contenido corre a sangre de la columna.

### Inputs / Fields
- **Style:** borde input, fondo input al 30%, 4px, 32px de alto, 14px.
- **Focus:** borde y anillo ámbar.
- **Error / Disabled:** borde crítico con anillo al 40%; deshabilitado al 50% de opacidad. Peso y altura en Athlete y onboarding usan este campo.

### Navigation
- **Rail:** fondo rail, ítems separados por filetes, ícono de 16px a trazo 1.75, texto 14px gris cálido; hover a hueso. Activo: texto hueso 600, ícono ámbar y punto ámbar de 6px al final. Abajo, el estado de dispositivos con LED y la nota de alcance.
- **Mobile:** franja superior con chips de 13px desplazables; el activo toma fondo rail-accent.

### Protocol Band
Cabecera impresa del informe: fondo hueso, tinta grafito, "Protocolo diario" condensado a 17px con el id de corrida en mono, y campos rótulo/valor (Fecha, Atleta, FTP, Carrera, Fase, Datos, Dispositivos) con valores tabulares a 15px. Pegajosa arriba.

### Ceiling Profile (signature)
El perfil de potencia del día contra el techo que fijan las reglas. Barras por bloque en la rampa de zonas; cuando hay ajuste, el plan original pasa a fantasma (hueso al 10% con borde tenue punteado 4/3) y el ajuste se registra encima en los mismos ejes. El techo es una línea ámbar de 3px que se dibuja en 0.9s (ease 0.16, 1, 0.3, 1); lo que la cruza se tacha con rayado rojo y una diagonal de corte, con la etiqueta "+N W tachado". Secuencia: techo, tachado a 0.85s, ajuste a 1.1s. Con movimiento reducido, todo aparece sin animación. Se dibuja en píxeles reales: el texto no escala con el ancho.

### Readings Strip y Impact Meter
- **StatTile:** rótulo 13px gris cálido, cifra de lectura a 28px, unidad 13px, detalle 12px; celdas separadas por filetes.
- **ImpactMeter:** rampa fija de diámetros (6 / 10 / 15px) en tenue, gris cálido y crítico, siempre con la etiqueta Bajo / Moderado / Alto.

### Device LED
Estado de conexión de Garmin, Strava o Wahoo, fijado por el usuario: punto verde (good) de 10px con un pulso ping al 60% cuando hay conexión, tenue sin conexión. El pulso se apaga con movimiento reducido. Aparece en el rail, en la banda, en /datos y en el onboarding.

### Approval Box
La pausa human-in-the-loop: borde ámbar al 60%, fondo ámbar al 6%, 3px, 14px de padding, mensaje en ámbar y el par botón primario / outline.

## Do's and Don'ts

### Do:
- **Do** abrir cada sección como una hoja con filete superior rule-strong y cabecera con filete fino.
- **Do** reservar el ámbar reactivo (#e8a93b) para techos, umbrales, lo que espera al atleta y Modify.
- **Do** codificar zonas de intensidad con la rampa de valor zone-z1 a zone-z6, más claro = más intenso.
- **Do** poner cifras en Archivo condensado (wdth 62 a 78) con números tabulares.
- **Do** acompañar todo estado o decisión con ícono y texto, además de color.
- **Do** usar Martian Mono solo para ids, tiempos de traza, modelos y medidas.
- **Do** respetar movimiento reducido: el techo y el LED aparecen sin animar.

### Don't:
- **Don't** armar grillas de tarjetas KPI con acento neón ni estética de app de fitness de consumo.
- **Don't** usar los colores de deporte (#3987e5, #d95926, #199e70) fuera de datos por deporte, ni para zonas.
- **Don't** usar ámbar como acento decorativo, de marca o de hover.
- **Don't** dar sombra o fondo elevado a las hojas; la sombra queda para tooltips, popovers y toasts.
- **Don't** redondear más de 4px salvo los puntos de datos.
