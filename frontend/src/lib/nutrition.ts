// Carbohidratos del día según la carga planeada. Rangos de las guías generales de nutrición
// deportiva (g/kg/día y g/h durante el ejercicio); los gramos se calculan con el peso del atleta.
import type { DayItem, DaySession } from "@/lib/day";
import type { Intensity } from "@/lib/types";

const INTENSE: Intensity[] = ["sweet_spot", "threshold", "vo2max", "anaerobic"];

export interface Range {
  low: number;
  high: number;
}

export interface SessionFuel {
  time: string;
  title: string;
  before: Range | null; // g, 1-3 h antes
  during: Range | null; // g/h
  after: Range | null; // g, en la primera hora
  note: string;
}

export interface DayNutrition {
  level: "descanso" | "liviano" | "moderado" | "alto" | "carga";
  label: string;
  gPerKg: Range;
  total: Range; // g en el día
  sessions: SessionFuel[];
  reason: string;
}

const LEVELS: Record<DayNutrition["level"], { label: string; gPerKg: Range }> = {
  descanso: { label: "Día de descanso", gPerKg: { low: 3, high: 5 } },
  liviano: { label: "Día liviano", gPerKg: { low: 4, high: 5 } },
  moderado: { label: "Día moderado", gPerKg: { low: 5, high: 7 } },
  alto: { label: "Día exigente", gPerKg: { low: 6, high: 10 } },
  carga: { label: "Carga de carbohidratos", gPerKg: { low: 10, high: 12 } },
};

const isIntense = (s: DaySession) => (s.steps ?? []).some((x) => INTENSE.includes(x.intensity));
const g = (r: Range, kg: number): Range => ({ low: Math.round((r.low * kg) / 5) * 5, high: Math.round((r.high * kg) / 5) * 5 });

function sessionFuel(time: string, s: DaySession, kg: number, laterSession: boolean): SessionFuel {
  const endurance = s.sport !== "strength";
  const intense = isIntense(s);
  const during: Range | null = !endurance || s.minutes < 60 ? null : s.minutes <= 150 ? { low: 30, high: 60 } : { low: 60, high: 90 };
  const before = endurance && (intense || s.minutes >= 60) ? g({ low: 1, high: 2 }, kg) : null;
  const after = endurance && (intense || laterSession || s.minutes >= 90) ? g({ low: 1, high: 1.2 }, kg) : null;
  const note = !endurance
    ? "Sin carga especial: una comida normal con proteína después."
    : during
      ? `${during.low}-${during.high} g por hora en geles, bebida o barras, desde el minuto 20.`
      : intense
        ? "Corta e intensa: alcanza con llegar comido; agua durante."
        : "Corta y suave: agua durante, no hace falta sumar carbohidratos.";
  return { time, title: s.title, before, during, after, note };
}

export function dayNutrition(items: DayItem[], kg: number, daysToRace: number): DayNutrition {
  const sessions = items.filter((i): i is DayItem & { session: DaySession } => !!i.session && i.session.kind !== "rest");
  // El gym no suma a la demanda de carbohidratos: cuenta solo el trabajo de resistencia.
  const minutes = sessions.filter((i) => i.session.sport !== "strength").reduce((a, i) => a + i.session.minutes, 0);
  const intense = sessions.some((i) => isIntense(i.session));

  let level: DayNutrition["level"];
  let reason: string;
  if (daysToRace >= 0 && daysToRace <= 2) {
    level = "carga";
    reason = `Faltan ${daysToRace} días para la carrera: se cargan los depósitos de glucógeno.`;
  } else if (!minutes) {
    level = "descanso";
    reason = sessions.length
      ? "Solo gym: comidas normales, con proteína después de la sesión."
      : "Sin entrenamiento: comidas normales, priorizando verduras y proteína.";
  } else if (minutes >= 150 || (intense && minutes >= 90)) {
    level = "alto";
    reason = `${minutes} min de entrenamiento${intense ? " con bloques intensos" : ""}: hace falta reponer bien.`;
  } else if (minutes >= 60 || intense) {
    level = "moderado";
    reason = `${minutes} min de entrenamiento${intense ? " con bloques intensos" : ""}.`;
  } else {
    level = "liviano";
    reason = `${minutes} min de trabajo suave.`;
  }

  const { label, gPerKg } = LEVELS[level];
  return {
    level,
    label,
    gPerKg,
    total: g(gPerKg, kg),
    reason,
    sessions: sessions.map((i, idx) => sessionFuel(i.slot.time, i.session, kg, idx < sessions.length - 1)),
  };
}
