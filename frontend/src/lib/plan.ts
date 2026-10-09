// Generador determinista de plan a partir de la agenda, el estado físico y los datos importados.
// En la versión con backend lo calcula Python; la lógica queda acá para el modo mock.
import { type EnduranceProfile, FITNESS_META, type FitnessState, type RaceEvent } from "@/lib/setup";

export type Phase = "base" | "build" | "peak" | "taper" | "race";

export interface PlanWeek {
  index: number;
  startOffset: number;
  phase: Phase;
  hours: number;
  split: { sport: "swim" | "bike" | "run" | "strength"; hours: number }[];
  key: string;
  race?: RaceEvent;
  recovery: boolean;
}

export interface PlanInputs {
  profile: EnduranceProfile;
  fitness: FitnessState;
  races: RaceEvent[];
  importedCtl: number | null;
  sleepAvg: number | null;
}

export interface Plan {
  target: RaceEvent;
  weeks: PlanWeek[];
  basis: string[];
}

export const PHASE_META: Record<Phase, { label: string; key: Record<EnduranceProfile, string> }> = {
  base: {
    label: "Base",
    key: { triathlon: "Fondo largo de bici en Z2", duathlon: "Fondo largo de bici en Z2", running: "Fondo largo en Z2", cycling: "Fondo largo en Z2" },
  },
  build: {
    label: "Construcción",
    key: { triathlon: "Bici 3x15' sweet spot", duathlon: "Brick bici + run a ritmo", running: "Umbral 3x10'", cycling: "Sweet spot 3x15'" },
  },
  peak: {
    label: "Pico",
    key: { triathlon: "Simulación de carrera (brick)", duathlon: "Simulación de carrera", running: "Ritmo de carrera 2x5 km", cycling: "Simulación del recorrido" },
  },
  taper: {
    label: "Taper",
    key: { triathlon: "Activación a ritmo de carrera", duathlon: "Activación a ritmo de carrera", running: "4x1' a ritmo de carrera", cycling: "Activación 3x3'" },
  },
  race: {
    label: "Carrera",
    key: { triathlon: "Día de carrera", duathlon: "Día de carrera", running: "Día de carrera", cycling: "Día de carrera" },
  },
};

const BASE_HOURS: Record<EnduranceProfile, number> = { triathlon: 9, duathlon: 7, running: 5, cycling: 8 };
const SPLIT: Record<EnduranceProfile, { sport: PlanWeek["split"][number]["sport"]; share: number }[]> = {
  triathlon: [{ sport: "swim", share: 0.2 }, { sport: "bike", share: 0.5 }, { sport: "run", share: 0.3 }],
  duathlon: [{ sport: "bike", share: 0.55 }, { sport: "run", share: 0.45 }],
  running: [{ sport: "run", share: 1 }],
  cycling: [{ sport: "bike", share: 1 }],
};

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Carrera objetivo: la más lejana de la disciplina del atleta (si no hay, la más lejana de la agenda). */
export function targetRace(races: RaceEvent[], profile: EnduranceProfile): RaceEvent | null {
  const future = races.filter((r) => r.dayOffset > 0).sort((a, b) => a.dayOffset - b.dayOffset);
  if (!future.length) return null;
  const own = future.filter((r) => r.sport === profile);
  return (own.length ? own : future).at(-1)!;
}

export function buildPlan(inp: PlanInputs): Plan | null {
  const races = [...inp.races].filter((r) => r.dayOffset > 0).sort((a, b) => a.dayOffset - b.dayOffset);
  const target = targetRace(races, inp.profile);
  if (!target) return null;
  const before = races.filter((r) => r.dayOffset < target.dayOffset).length;
  const after = races.filter((r) => r.dayOffset > target.dayOffset).length;
  const nWeeks = Math.max(1, Math.ceil(target.dayOffset / 7));

  // Volumen de partida: estado declarado, corregido por la carga real importada y el sueño.
  const basis: string[] = [`Estado declarado: ${FITNESS_META[inp.fitness].label.toLowerCase()} (×${FITNESS_META[inp.fitness].volume}).`];
  let start = BASE_HOURS[inp.profile] * FITNESS_META[inp.fitness].volume;
  if (inp.importedCtl != null) {
    const f = Math.min(1.3, Math.max(0.6, inp.importedCtl / 60));
    start *= f;
    basis.push(`Carga crónica importada CTL ${Math.round(inp.importedCtl)} (×${round1(f)}).`);
  } else {
    basis.push("Sin dispositivos conectados: el plan arranca solo con el estado declarado.");
  }
  if (inp.sleepAvg != null) {
    if (inp.sleepAvg < 7) {
      start *= 0.9;
      basis.push(`Sueño promedio ${round1(inp.sleepAvg)} h (< 7 h): volumen −10% y más días suaves.`);
    } else {
      basis.push(`Sueño promedio ${round1(inp.sleepAvg)} h: sin recorte por recuperación.`);
    }
  }
  basis.push(
    `Carrera objetivo: ${target.name} en ${target.dayOffset} días.` +
      (before ? ` ${before} carrera(s) antes como preparación.` : "") +
      (after ? ` ${after} carrera(s) después: se planifican al terminar este ciclo.` : ""),
  );

  const taperWeeks = nWeeks >= 10 ? 2 : 1;
  const build = Math.round((nWeeks - taperWeeks) * 0.4);
  const peak = nWeeks - taperWeeks >= 6 ? Math.max(1, Math.round((nWeeks - taperWeeks) * 0.15)) : 0;
  const base = Math.max(0, nWeeks - taperWeeks - build - peak);

  const weeks: PlanWeek[] = [];
  let hours = start;
  for (let i = 0; i < nWeeks; i++) {
    const phase: Phase = i < base ? "base" : i < base + build ? "build" : i < base + build + peak ? "peak" : "taper";
    const recovery = phase !== "taper" && (i + 1) % 4 === 0;
    if (phase !== "taper") hours *= i === 0 ? 1 : 1.06;
    let h = recovery ? hours * 0.75 : hours;
    if (phase === "taper") h = hours * (i === nWeeks - 1 ? 0.45 : 0.65);
    const startOffset = i * 7;
    const race = races.find((r) => r.dayOffset >= startOffset && r.dayOffset < startOffset + 7);
    const split = SPLIT[inp.profile].map((s) => ({ sport: s.sport, hours: round1(h * s.share) }));
    if (inp.fitness === "gym_only") split.push({ sport: "strength", hours: 1 });
    weeks.push({
      index: i + 1,
      startOffset,
      phase: race && race.id === target.id ? "race" : phase,
      hours: round1(split.reduce((a, s) => a + s.hours, 0)),
      split,
      key: recovery ? "Semana de descarga: todo suave" : PHASE_META[phase].key[inp.profile],
      race,
      recovery,
    });
  }
  return { target, weeks, basis };
}
