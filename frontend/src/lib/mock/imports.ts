// Registros "importados" de cada proveedor, derivados de la misma historia mock que usa el backend.
import { historyFor } from "@/lib/mock/data";
import type { Provider } from "@/lib/setup";
import type { Activity, DailyPoint } from "@/lib/types";

export interface ImportedActivity extends Activity {
  source: Provider;
}

export interface ImportedNight {
  day_offset: number;
  sleep_hours: number;
  hrv_ms: number;
  resting_hr_bpm: number;
  source: Provider;
}

/** Qué proveedor trae cada actividad: bici desde Wahoo, runs desde Strava, el resto desde el reloj. */
function sourceFor(a: Activity, connected: Provider[]): Provider | null {
  if (a.sport === "bike" && connected.includes("wahoo")) return "wahoo";
  if (a.sport === "run" && connected.includes("strava")) return "strava";
  if (connected.includes("garmin")) return "garmin";
  if (connected.includes("strava")) return "strava";
  return null;
}

export function importedData(connected: Provider[], hardRunYesterday: boolean) {
  const { activities, daily } = historyFor(hardRunYesterday);
  const acts: ImportedActivity[] = activities
    .map((a) => ({ ...a, source: sourceFor(a, connected) }))
    .filter((a): a is ImportedActivity => a.source !== null)
    .reverse();
  // Sueño, HRV y FC en reposo solo llegan desde el reloj (Garmin).
  const nights: ImportedNight[] = connected.includes("garmin")
    ? daily.map((d: DailyPoint) => ({
        day_offset: d.day_offset,
        sleep_hours: d.sleep_hours,
        hrv_ms: d.hrv_ms,
        resting_hr_bpm: d.resting_hr_bpm,
        source: "garmin" as Provider,
      })).reverse()
    : [];
  const last = daily.at(-1);
  const sleepAvg = nights.length ? nights.slice(0, 14).reduce((a, n) => a + n.sleep_hours, 0) / Math.min(14, nights.length) : null;
  return {
    activities: acts,
    nights,
    ctl: acts.length && last ? last.ctl : null,
    sleepAvg,
  };
}
