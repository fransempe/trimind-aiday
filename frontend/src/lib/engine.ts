// Port mínimo de backend/app/tools/readiness.py para recalcular en vivo
// cuando el atleta mueve los sliders en modo mock. El backend es la fuente de verdad.
import { historyFor } from "@/lib/mock/data";
import type {
  AthleteSnapshot,
  DailyWellness,
  LegsFeeling,
  Readiness,
  ReadinessBand,
} from "@/lib/types";

const WEIGHTS = { hrv: 0.35, sleep: 0.25, load: 0.25, subjective: 0.15 };
const LEGS_SCORE: Record<LegsFeeling, number> = { fresh: 100, normal: 75, heavy: 40, sore: 20 };

const clamp = (x: number) => Math.round(Math.min(100, Math.max(0, x)));

export function bandFor(score: number): ReadinessBand {
  if (score < 40) return "red";
  if (score < 70) return "amber";
  return "green";
}

export function computeReadiness(w: DailyWellness, hrvDeviationPct: number, tsb: number): Readiness {
  const subjective = [LEGS_SCORE[w.legs], ...(w.rpe != null ? [((10 - w.rpe) / 9) * 100] : [])];
  const components = {
    hrv: clamp(85 + 3.5 * hrvDeviationPct),
    sleep: clamp(((w.sleep_hours - 4) / 4) * 100),
    load: clamp(((tsb + 30) / 35) * 100),
    subjective: clamp(subjective.reduce((a, b) => a + b, 0) / subjective.length),
  };
  const score = clamp(
    (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
      (acc, k) => acc + components[k] * WEIGHTS[k],
      0,
    ),
  );
  return { score, band: bandFor(score), components };
}

export interface AthleteInputs {
  sleep_hours: number;
  hrv_deviation_pct: number;
  rpe: number | null;
  legs: LegsFeeling;
  hard_run_yesterday: boolean;
}

export function buildSnapshot(inputs: AthleteInputs): AthleteSnapshot {
  const base = historyFor(inputs.hard_run_yesterday).snapshot;
  const baseline = base.hrv.baseline_30d_ms;
  const today_ms = Math.round(baseline * (1 + inputs.hrv_deviation_pct / 100) * 10) / 10;
  const wellness: DailyWellness = {
    ...base.wellness_today,
    sleep_hours: inputs.sleep_hours,
    hrv_rmssd_ms: today_ms,
    rpe: inputs.rpe,
    legs: inputs.legs,
  };
  return {
    ...base,
    wellness_today: wellness,
    hrv: { today_ms, baseline_30d_ms: baseline, deviation_pct: inputs.hrv_deviation_pct },
    readiness: computeReadiness(wellness, inputs.hrv_deviation_pct, base.load.tsb),
  };
}

export function formatSleep(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)}'`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h${String(m).padStart(2, "0")}'` : `${h}h`;
}

export function formatPace(secondsPerUnit: number): string {
  const m = Math.floor(secondsPerUnit / 60);
  const s = Math.round(secondsPerUnit % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const PRESETS: Record<"normal" | "fatigued" | "recovered", AthleteInputs> = {
  normal: { sleep_hours: 7.67, hrv_deviation_pct: 3.3, rpe: null, legs: "normal", hard_run_yesterday: false },
  fatigued: { sleep_hours: 5.2, hrv_deviation_pct: -21, rpe: 8, legs: "heavy", hard_run_yesterday: true },
  recovered: { sleep_hours: 8.23, hrv_deviation_pct: 4, rpe: 2, legs: "fresh", hard_run_yesterday: true },
};
