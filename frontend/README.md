# TriMind AI · Frontend

Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui (Radix) + Recharts + Framer Motion + Zustand.

```bash
npm install
npm run dev        # http://localhost:3000
```

## Modo mock vs. API

`NEXT_PUBLIC_API_MODE` (ver `.env.example`):

- `mock` (por defecto): los agentes se simulan en el navegador (`src/lib/mock/coaching.ts`) y emiten los
  mismos eventos que el SSE del grafo, con demoras realistas.
- `api`: usa FastAPI (`src/lib/api/index.ts`, implementación `httpApi`).

Los datos del atleta (`src/lib/mock/athlete-data.json`) los calcula Python. Para regenerarlos:

```bash
cd ../backend && PYTHONPATH=. uv run python scripts/export_frontend_mock.py
```

`src/lib/engine.ts` replica la fórmula de readiness solo para recalcular en vivo cuando se mueven los
sliders. La fuente de verdad es `backend/app/tools/readiness.py`.

## Estructura

- `src/app/*`: páginas. Today (`/`, con pestañas Hoy, Semana, Mes y Ask Coaches), Análisis del staff,
  Training, Performance, Recovery, Race, Athlete, Datos importados, Configuración e Inicio (onboarding).
- `src/lib/types.ts`: espejo de los modelos Pydantic.
- `src/lib/store.ts`: estado del atleta y de la corrida de agentes; consume los `GraphEvent`.
- `src/lib/setup.ts`: perfil, agenda, horarios y dispositivos, guardados en el navegador.
- `src/lib/plan.ts`, `schedule.ts`, `day.ts`: plan hacia la carrera, calendario y sesiones del día.
- `src/lib/session-log.ts`: estado de las sesiones (hecha, sincronizada, salteada) y su análisis.
- `src/lib/nutrition.ts`: carbohidratos del día según la carga y el peso.
- `src/lib/agents.ts`: registry de especialistas. Sumar uno acá lo agrega al panel.
- `src/components/*`: UI por sección (`today/`, `analysis/`, `race/`, `ask/`, `layout/`).

Más detalle en [docs/arquitectura.md](../docs/arquitectura.md).
