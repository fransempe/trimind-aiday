// Estado de las sesiones del día: hecha a mano, sincronizada desde un dispositivo o salteada.
// Los números de la "actividad importada" se simulan en código a partir de lo planeado y la readiness;
// el análisis breve se arma con reglas sobre esos números (sin inventar datos).
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DaySession } from "@/lib/day";
import { connectedProviders, type Provider, type TrainingSlot } from "@/lib/setup";
import type { AthleteProfile, ReadinessBand, Sport } from "@/lib/types";

export type SessionStatus = "pending" | "done" | "skipped";

export interface DeviceRecord {
  duration_min: number;
  distance_km: number | null;
  avg_power_w: number | null;
  target_power_w: number | null;
  avg_pace_s: number | null; // s/km en run, s/100 m en natación
  target_pace_s: number | null;
  avg_hr_bpm: number;
  hr_drift_pct: number;
  tss: number;
  sets_done: number | null;
  sets_planned: number | null;
  compliance_pct: number;
}

export interface SessionAnalysis {
  verdict: "cumplida" | "con_matices" | "por_debajo";
  headline: string;
  points: string[];
}

export interface SessionEntry {
  status: SessionStatus;
  source: "manual" | Provider;
  at: number;
  record?: DeviceRecord;
  analysis?: SessionAnalysis;
}

interface LogState {
  entries: Record<string, SessionEntry>;
  set(key: string, entry: SessionEntry): void;
  clear(key: string): void;
}

export const useSessionLog = create<LogState>()(
  persist(
    (set) => ({
      entries: {},
      set: (key, entry) => set((s) => ({ entries: { ...s.entries, [key]: entry } })),
      clear: (key) =>
        set((s) => {
          const entries = { ...s.entries };
          delete entries[key];
          return { entries };
        }),
    }),
    { name: "trimind-session-log", skipHydration: true },
  ),
);

/** Clave por día, franja y sesión: si el Head Coach cambia la sesión, vuelve a quedar pendiente. */
export function sessionKey(slot: TrainingSlot, session: DaySession) {
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${day}:${slot.id}:${session.title}`;
}

/** La franja ya terminó (hora de inicio + tiempo disponible). */
export function slotEnded(slot: TrainingSlot, now = new Date()) {
  const [h, m] = slot.time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m + slot.minutes;
}

/** Qué dispositivo trae cada deporte: bici desde Wahoo, run desde Strava; si no, el reloj. */
export function deviceFor(sport: Sport, devices: Record<Provider, boolean>): Provider | null {
  const on = connectedProviders(devices);
  const pref: Provider[] = sport === "bike" ? ["wahoo", "garmin", "strava"] : sport === "run" ? ["strava", "garmin"] : ["garmin"];
  return pref.find((p) => on.includes(p)) ?? null;
}

// Variación chica y estable por sesión, para que el mismo día dé siempre lo mismo.
function noise(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000; // 0..1
}

const BAND_FACTOR: Record<ReadinessBand, number> = { green: 1, amber: 0.97, red: 0.93 };
const BAND_DRIFT: Record<ReadinessBand, number> = { green: 0, amber: 2, red: 4 };

function targetPower(session: DaySession) {
  // Solo los bloques de trabajo: los pasos con la potencia más alta de la sesión.
  const mid = (s: { power: { low_w: number; high_w: number } | null }) => (s.power ? (s.power.low_w + s.power.high_w) / 2 : 0);
  const top = Math.max(0, ...(session.steps ?? []).map(mid));
  const work = (session.steps ?? []).filter((s) => s.power && mid(s) === top);
  const mins = work.reduce((a, s) => a + s.duration_min * s.repeat, 0);
  if (!mins) return null;
  return Math.round(work.reduce((a, s) => a + ((s.power!.low_w + s.power!.high_w) / 2) * s.duration_min * s.repeat, 0) / mins);
}

export function simulateRecord(session: DaySession, profile: AthleteProfile, band: ReadinessBand, seed: string): DeviceRecord {
  const n = noise(seed);
  const f = BAND_FACTOR[band] * (0.98 + n * 0.04);
  const planned = Math.max(session.minutes, 1);
  const duration = Math.round(planned * Math.min(1.03, f + 0.02));
  const drift = Math.round((2.5 + BAND_DRIFT[band] + n * 2) * 10) / 10;
  const base = {
    duration_min: duration,
    distance_km: null,
    avg_power_w: null,
    target_power_w: null,
    avg_pace_s: null,
    target_pace_s: null,
    sets_done: null,
    sets_planned: null,
    hr_drift_pct: drift,
  };

  if (session.sport === "strength") {
    const planSets = (session.exercises ?? []).reduce((a, e) => a + (Number.parseInt(e.dose, 10) || 0), 0);
    const done = band === "red" ? Math.max(planSets - 2, 0) : planSets - (n > 0.8 ? 1 : 0);
    return { ...base, hr_drift_pct: 0, avg_hr_bpm: Math.round(102 + n * 10), tss: Math.round(duration * 0.5), sets_done: done, sets_planned: planSets,
      compliance_pct: Math.round((100 * done) / Math.max(planSets, 1)) };
  }

  let intensity = f;
  let rec: Partial<DeviceRecord> = {};
  if (session.sport === "bike") {
    const target = targetPower(session) ?? Math.round(profile.ftp_w * 0.7);
    const avg = Math.round(target * f);
    intensity = avg / target;
    rec = { avg_power_w: avg, target_power_w: target, distance_km: Math.round((duration / 60) * 31 * f * 10) / 10 };
  } else if (session.sport === "run") {
    const target = Math.round(profile.run_threshold_pace_s_per_km * 1.12);
    const avg = Math.round(target / f);
    intensity = target / avg;
    rec = { avg_pace_s: avg, target_pace_s: target, distance_km: Math.round(((duration * 60) / avg) * 10) / 10 };
  } else if (session.sport === "swim") {
    const target = Math.round(profile.swim_css_s_per_100m * 1.08);
    const avg = Math.round(target / f);
    intensity = target / avg;
    rec = { avg_pace_s: avg, target_pace_s: target, distance_km: Math.round(((duration * 60) / avg / 10) * 100) / 100 };
  }
  const plannedTss = session.minutes * 0.9;
  const compliance = Math.round(100 * Math.min(duration / planned, 1.05) * Math.min(intensity, 1.05));
  return {
    ...base,
    ...rec,
    avg_hr_bpm: Math.round(profile.lthr_bpm * (0.8 + (intensity - 0.95) * 0.5) + drift),
    tss: Math.round(plannedTss * (duration / planned) * intensity * intensity),
    compliance_pct: compliance,
  };
}

const pace = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Un renglón de lectura bajo la conclusión: qué significa la sesión o qué ajustar la próxima. */
export function takeaway(sport: Sport, r: DeviceRecord, verdict: SessionAnalysis["verdict"]): string {
  if (r.sets_planned !== null) {
    return r.sets_done === r.sets_planned
      ? "Fuerza de base al día: suma estabilidad para bici y carrera sin cansar las piernas."
      : `Faltaron ${(r.sets_planned ?? 0) - (r.sets_done ?? 0)} series: la próxima priorizá las de piernas.`;
  }
  if (verdict === "por_debajo") return "Un día por debajo no cambia el bloque: el staff ajusta la carga de mañana.";
  const unit = sport === "swim" ? "/100 m" : "/km";
  const metric = r.avg_power_w !== null ? `${r.avg_power_w} W` : r.avg_pace_s !== null ? `${pace(r.avg_pace_s)} ${unit}` : `${r.duration_min} min`;
  if (verdict === "cumplida") {
    return `Sostuviste ${metric} con la FC estable (${r.hr_drift_pct}% de desacople): asimilás bien la carga.`;
  }
  if (r.hr_drift_pct >= 5) return "Para la próxima: arrancá más tranquilo e hidratate desde el inicio.";
  const target = r.target_power_w !== null ? `${r.target_power_w} W` : r.target_pace_s !== null ? `${pace(r.target_pace_s)} ${unit}` : null;
  return target ? `Para la próxima: acercate a ${target} en los bloques de trabajo.` : "Para la próxima: completá el tiempo planeado.";
}

export function analyze(session: DaySession, r: DeviceRecord, band: ReadinessBand): SessionAnalysis {
  const points: string[] = [];
  const verdict: SessionAnalysis["verdict"] = r.compliance_pct >= 95 && r.hr_drift_pct < 5 ? "cumplida" : r.compliance_pct >= 88 ? "con_matices" : "por_debajo";

  if (r.sets_planned !== null) {
    points.push(r.sets_done === r.sets_planned
      ? `Completaste las ${r.sets_planned} series planeadas en ${r.duration_min} min.`
      : `Hiciste ${r.sets_done} de ${r.sets_planned} series; con la readiness de hoy está bien no forzar las últimas.`);
  } else {
    const dDiff = r.duration_min - session.minutes;
    points.push(Math.abs(dDiff) <= 2
      ? `Duración en lo planeado: ${r.duration_min} min.`
      : `Duración ${r.duration_min} min (${dDiff > 0 ? "+" : ""}${dDiff} min contra lo planeado).`);
    if (r.avg_power_w !== null && r.target_power_w !== null) {
      const pct = Math.round((100 * r.avg_power_w) / r.target_power_w);
      points.push(pct >= 97
        ? `Potencia media en los bloques de trabajo ${r.avg_power_w} W, en el objetivo de ${r.target_power_w} W.`
        : `Potencia media ${r.avg_power_w} W, ${100 - pct}% debajo del objetivo de ${r.target_power_w} W.`);
    }
    if (r.avg_pace_s !== null && r.target_pace_s !== null) {
      const unit = session.sport === "swim" ? "/100 m" : "/km";
      const diff = r.avg_pace_s - r.target_pace_s;
      points.push(diff <= 3
        ? `Ritmo medio ${pace(r.avg_pace_s)} ${unit}, en el objetivo de ${pace(r.target_pace_s)}.`
        : `Ritmo medio ${pace(r.avg_pace_s)} ${unit}, ${diff} s más lento que el objetivo de ${pace(r.target_pace_s)}.`);
    }
    points.push(r.hr_drift_pct < 5
      ? `Desacople de FC ${r.hr_drift_pct}%: la frecuencia se mantuvo estable, buena base aeróbica.`
      : `Desacople de FC ${r.hr_drift_pct}%: la frecuencia subió al final. Puede ser fatiga acumulada, calor o poca hidratación.`);
  }
  points.push(`Carga de la sesión ${r.tss} TSS: el staff la suma para la readiness de mañana.`);

  const headline = {
    cumplida: "Sesión cumplida, bien ejecutada.",
    con_matices: band === "green" ? "Cumplida, con algún detalle para ajustar." : "Cumplida, cuidando la fatiga de hoy.",
    por_debajo: "Quedó por debajo de lo planeado; el staff lo tiene en cuenta para lo que sigue.",
  }[verdict];
  return { verdict, headline, points };
}
