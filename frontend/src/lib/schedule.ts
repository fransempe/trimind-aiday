// Calendario a futuro: reparte las sesiones de cada semana del plan en días y franjas horarias.
import type { DayItem, DaySession } from "@/lib/day";
import { MOBILITY_ROUTINE, STRENGTH_ROUTINE } from "@/lib/gym";
import type { Plan, PlanWeek } from "@/lib/plan";
import { type EnduranceProfile, type FitnessState, type RaceEvent, sortSlots, type TrainingSlot } from "@/lib/setup";
import type { Sport } from "@/lib/types";

interface Template {
  sport: Sport;
  title: string;
  minutes: number;
  kind: DaySession["kind"];
}

const T = (sport: Sport, title: string, minutes: number, kind: DaySession["kind"] = "key"): Template => ({ sport, title, minutes, kind });
const GYM = T("strength", "Gym: fuerza y movilidad", 40, "support");

// Semana tipo por perfil; el índice es días desde hoy módulo 7 (hoy = día de calidad).
const WEEK: Record<EnduranceProfile, Template[][]> = {
  triathlon: [
    [GYM, T("bike", "Bici de calidad", 80)],
    [T("run", "Run tempo", 55)],
    [T("swim", "Natación series", 50, "support"), T("bike", "Bici Z2", 60)],
    [T("swim", "Natación suave", 40, "support")],
    [T("bike", "Fondo largo de bici", 180)],
    [T("run", "Fondo largo de run", 95)],
    [T("run", "Run suave", 45)],
  ],
  duathlon: [
    [GYM, T("bike", "Bici de calidad", 75)],
    [T("run", "Run tempo", 50)],
    [T("bike", "Bici Z2", 60)],
    [],
    [T("bike", "Brick: bici 90' + run 20'", 110)],
    [T("run", "Fondo largo de run", 80)],
    [T("run", "Run suave", 40)],
  ],
  running: [
    [GYM, T("run", "Run de calidad", 50)],
    [T("run", "Run Z2", 45)],
    [GYM],
    [],
    [T("run", "Run tempo", 50)],
    [T("run", "Fondo largo", 90)],
    [T("run", "Run suave", 35)],
  ],
  cycling: [
    [GYM, T("bike", "Bici de calidad", 80)],
    [T("bike", "Bici Z2", 70)],
    [GYM],
    [],
    [T("bike", "Bici tempo", 75)],
    [T("bike", "Fondo largo", 210)],
    [T("bike", "Rodaje suave", 50)],
  ],
};

// En taper y semana de carrera las sesiones se nombran por lo que son: cortas y con activación.
const TAPER_TITLE: Record<Sport, string> = {
  swim: "Natación suave",
  bike: "Bici corta con activación",
  run: "Run corto con activación",
  strength: "Movilidad y core",
};

const PHASE_SUFFIX: Record<PlanWeek["phase"], string> = {
  base: "en Z2",
  build: "con bloques a umbral",
  peak: "a ritmo de carrera",
  taper: "corto con activación",
  race: "corto con activación",
};

export interface ScheduleDay {
  offset: number;
  items: DayItem[];
  race?: RaceEvent;
  week?: PlanWeek;
  totalMinutes: number;
  /** Día después del ciclo planificado: hace falta otra carrera para extender el plan. */
  beyondPlan?: boolean;
}

function place(sessions: DaySession[], slots: TrainingSlot[]): DayItem[] {
  const sorted = sortSlots(slots);
  if (!sorted.length || !sessions.length) return [];
  const free = [...sorted];
  const items: DayItem[] = [];
  // Primero la sesión más larga en la franja más larga; el resto en orden.
  for (const s of [...sessions].sort((a, b) => b.minutes - a.minutes)) {
    if (!free.length) break;
    const fits = free.filter((f) => f.minutes >= s.minutes);
    const slot = (fits.length ? fits : free).reduce((a, b) => (b.minutes > a.minutes ? b : a));
    free.splice(free.indexOf(slot), 1);
    items.push({ slot, session: { ...s, minutes: Math.min(s.minutes, slot.minutes) } });
  }
  return items.sort((a, b) => a.slot.time.localeCompare(b.slot.time));
}

export function buildSchedule(opts: {
  profile: EnduranceProfile;
  fitness: FitnessState;
  plan: Plan | null;
  races: RaceEvent[];
  slots: TrainingSlot[];
  today: DayItem[];
  days: number;
}): ScheduleDay[] {
  const tpl = WEEK[opts.profile];
  const baseHours = tpl.flat().filter((t) => t.kind !== "support").reduce((a, t) => a + t.minutes, 0) / 60;
  const out: ScheduleDay[] = [];

  for (let d = 0; d < opts.days; d++) {
    const race = opts.races.find((r) => r.dayOffset === d);
    const week = opts.plan?.weeks.find((w) => d >= w.startOffset && d < w.startOffset + 7);
    let items: DayItem[];
    if (d === 0) {
      items = opts.today;
    } else if (race) {
      items = place([{ kind: "key", sport: race.sport === "running" ? "run" : race.sport === "cycling" ? "bike" : "run", title: race.name, minutes: 0, detail: `Carrera · ${race.distance}` }], opts.slots.slice(0, 1));
    } else if (opts.plan && d > opts.plan.target.dayOffset) {
      const after = d - opts.plan.target.dayOffset;
      const recovery: DaySession[] =
        after <= 7 && after % 2 === 0
          ? [{ kind: "support", sport: after % 4 === 0 ? "swim" : "run", title: "Recuperación post carrera", minutes: 30, detail: "Muy suave, solo para soltar." }]
          : [];
      items = place(recovery, opts.slots);
      if (after > 7) {
        out.push({ offset: d, items: [], race, week, totalMinutes: 0, beyondPlan: true });
        continue;
      }
    } else if (!week) {
      items = [];
    } else {
      const scale = Math.min(1.6, Math.max(0.35, week.hours / baseHours));
      const dayRaceSoon = opts.races.some((r) => r.dayOffset > d && r.dayOffset - d <= 2);
      const sessions: DaySession[] = tpl[d % 7]
        .filter((t) => !(dayRaceSoon && t.kind === "support"))
        .filter((t) => !(opts.fitness !== "gym_only" && t.sport === "strength" && week.phase === "taper"))
        .map((t) => ({
          kind: t.kind,
          sport: t.sport,
          title:
            t.kind === "support"
              ? t.title
              : week.phase === "taper" || week.phase === "race"
                ? TAPER_TITLE[t.sport]
                : `${t.title} ${week.recovery ? "suave (descarga)" : PHASE_SUFFIX[week.phase]}`,
          minutes: t.kind === "support" ? t.minutes : Math.max(20, Math.round((t.minutes * scale) / 5) * 5),
          detail: dayRaceSoon ? "Pre-carrera: corto y suave." : "",
          exercises: t.sport === "strength" ? (week.phase === "taper" || week.phase === "race" ? MOBILITY_ROUTINE : STRENGTH_ROUTINE) : undefined,
        }));
      items = place(sessions, opts.slots);
    }
    out.push({
      offset: d,
      items,
      race,
      week,
      totalMinutes: items.reduce((a, i) => a + (i.session?.minutes ?? 0), 0),
    });
  }
  return out;
}
