// Arma el día del atleta: qué sesión va en cada franja horaria disponible.
import { type Exercise, MOBILITY_ROUTINE, STRENGTH_ROUTINE } from "@/lib/gym";
import type { EnduranceProfile, FitnessState, TrainingSlot } from "@/lib/setup";
import { sortSlots } from "@/lib/setup";
import type { CoachDecision, Sport, Workout, WorkoutStep } from "@/lib/types";

export interface DaySession {
  kind: "key" | "support" | "rest";
  sport: Sport;
  title: string;
  minutes: number;
  detail: string;
  steps?: WorkoutStep[];
  exercises?: Exercise[];
  modified?: boolean;
}

export interface DayItem {
  slot: TrainingSlot;
  session: DaySession | null;
}

// Sesión clave por perfil cuando no es la del plan de la demo (bici).
const KEY_BY_PROFILE: Partial<Record<EnduranceProfile, DaySession>> = {
  running: {
    kind: "key",
    sport: "run",
    title: "Run 50' con 3x10' a umbral",
    minutes: 50,
    detail: "Entrada en calor 15', 3x10' a 4:30 /km con 2' trote, vuelta a la calma 5'.",
  },
};

const SUPPORT: DaySession = {
  kind: "support",
  sport: "strength",
  title: "Gym: fuerza y movilidad",
  minutes: 40,
  detail: "Fuerza de base para resistencia. Carga moderada: terminá cada serie con 2 repeticiones en reserva.",
  exercises: STRENGTH_ROUTINE,
};

const SUPPORT_LIGHT: DaySession = {
  kind: "support",
  sport: "strength",
  title: "Movilidad y core",
  minutes: 25,
  detail: "Rutina suave de movilidad y core, sin carga: hoy la recuperación manda.",
  exercises: MOBILITY_ROUTINE,
};

export function buildDay(opts: {
  profile: EnduranceProfile;
  fitness: FitnessState;
  workout: Workout;
  decision: CoachDecision | null;
  slots: TrainingSlot[];
}): DayItem[] {
  const slots = sortSlots(opts.slots);
  if (!slots.length) return [];

  const rest = opts.decision?.decision === "rest";
  const modified = !!opts.decision?.new_workout && opts.workout.id === opts.decision.new_workout.id;
  const fromPlan: DaySession = {
    kind: "key",
    sport: opts.workout.sport,
    title: opts.workout.title,
    minutes: Math.round(opts.workout.total_duration_min),
    detail: modified ? "Ajustada por el Head Coach." : "Sesión clave del plan.",
    steps: opts.workout.steps,
    modified,
  };
  const key: DaySession = rest
    ? { kind: "rest", sport: "strength", title: "Descanso", minutes: 0, detail: "El Head Coach indicó descanso total hoy." }
    : opts.profile === "running" && !modified
      ? KEY_BY_PROFILE.running!
      : fromPlan;
  // Con la recuperación comprometida, el gym pasa a una rutina suave.
  const support = opts.decision?.decision === "modify" || rest ? SUPPORT_LIGHT : SUPPORT;

  if (slots.length === 1) return [{ slot: slots[0], session: key }];

  // La sesión clave va a la franja más larga que la contenga; el gym a la primera libre.
  const fits = slots.filter((s) => s.minutes >= key.minutes);
  const keySlot = (fits.length ? fits : slots).reduce((a, b) => (b.minutes > a.minutes ? b : a));
  let supportPlaced = false;
  return slots.map((slot) => {
    if (slot.id === keySlot.id) return { slot, session: key };
    if (!supportPlaced && slot.minutes >= support.minutes) {
      supportPlaced = true;
      return { slot, session: support };
    }
    return { slot, session: null };
  });
}
