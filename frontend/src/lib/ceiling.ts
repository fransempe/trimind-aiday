// Techo de intensidad que imponen las reglas duras (espejo de backend/app/rules/engine.py):
// readiness en rojo → hasta tempo; a 7 días o menos de la carrera → sin VO2max.
import type { AthleteSnapshot } from "@/lib/types";

export interface Ceiling {
  watts: number;
  label: string;
  reason: string;
}

const TEMPO_TOP = 0.87;
const THRESHOLD_TOP = 1.05;

export function intensityCeiling(s: AthleteSnapshot): Ceiling | null {
  const ftp = s.profile.ftp_w;
  if (s.readiness.band === "red") {
    return {
      watts: Math.round((ftp * TEMPO_TOP) / 5) * 5,
      label: "Techo: tempo",
      reason: `Readiness ${s.readiness.score}/100 en rojo`,
    };
  }
  if (s.days_to_race <= 7) {
    return {
      watts: Math.round((ftp * THRESHOLD_TOP) / 5) * 5,
      label: "Techo: umbral",
      reason: `Sin VO2max a ${s.days_to_race} días de la carrera`,
    };
  }
  return null;
}
