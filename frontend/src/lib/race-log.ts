// Carreras completadas, sus resultados (Garmin o manual), el relato del atleta y el análisis de la IA,
// más la base de conocimiento del atleta. Espejo de backend/app/models/knowledge.py.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { historyFor } from "@/lib/mock/data";
import type { RaceEvent } from "@/lib/setup";
import { baseSegments } from "@/lib/strategy";
import type { AthleteProfile } from "@/lib/types";

/** Carreras que el atleta ya corrió (demo). `dayOffset` negativo: hace cuántos días fue. */
export const PAST_RACES: RaceEvent[] = [
  { id: "past-21k-bsas", name: "Media Maratón de Buenos Aires", sport: "running", distance: "21,1 km", dayOffset: -40, location: "Buenos Aires" },
  { id: "past-olimpico-nordelta", name: "Triatlón Olímpico Nordelta", sport: "triathlon", distance: "Olímpico", dayOffset: -120, location: "Tigre" },
  { id: "past-sprint-pilar", name: "Triatlón Sprint Pilar", sport: "triathlon", distance: "Sprint", dayOffset: -200, location: "Pilar" },
];

export type ResultSource = "garmin" | "strava" | "wahoo" | "manual";

export interface SegmentResult {
  label: string;
  sport: "swim" | "bike" | "run";
  distance_km: number;
  time_s: number;
}

export interface SegmentStat extends SegmentResult {
  pace: string;
}

export interface RaceDebrief {
  race_name: string;
  total_s: number;
  segments: SegmentStat[];
  summary: string;
  highlights: string[];
  improvements: string[];
  insights: string[];
  model: string;
}

export interface RaceDebriefRequest {
  race_name: string;
  distance: string;
  days_ago: number;
  source: ResultSource;
  segments: SegmentResult[];
  transitions_s: number;
  brief: string;
}

export interface RaceResult {
  source: ResultSource;
  segments: SegmentResult[];
  transitions_s: number;
  brief: string;
  debrief: RaceDebrief | null;
}

export interface TrainingFacts {
  weeks: number;
  weekly_hours: number;
  hours_by_sport: Record<string, number>;
  sessions_by_sport: Record<string, number>;
  ctl: number;
  tsb: number;
  ftp_w: number;
  ftp_w_kg: number;
  longest_bike_min: number;
  longest_run_min: number;
  readiness_today: number;
}

export interface RaceRecord {
  race_name: string;
  distance: string;
  days_ago: number;
  total_s: number;
  brief: string;
  summary: string;
  insights: string[];
}

export interface KnowledgeRequest {
  profile: string;
  fitness: string;
  weight_kg: number;
  height_cm: number;
  races: RaceRecord[];
}

export interface KnowledgeBase {
  athlete_name: string;
  facts: TrainingFacts;
  training_summary: string;
  races_summary: string;
  athlete_profile: string;
  strengths: string[];
  opportunities: string[];
  next_focus: string[];
  model: string;
}

interface RaceLogState {
  results: Record<string, RaceResult>;
  knowledge: (KnowledgeBase & { at: number }) | null;
  saveResult(id: string, r: RaceResult): void;
  removeResult(id: string): void;
  setKnowledge(k: KnowledgeBase): void;
}

export const useRaceLog = create<RaceLogState>()(
  persist(
    (set) => ({
      results: {},
      knowledge: null,
      saveResult: (id, r) => set((s) => ({ results: { ...s.results, [id]: r } })),
      removeResult: (id) =>
        set((s) => {
          const results = { ...s.results };
          delete results[id];
          return { results };
        }),
      setKnowledge: (k) => set({ knowledge: { ...k, at: Date.now() } }),
    }),
    { name: "trimind-race-log", skipHydration: true },
  ),
);

export function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.round(s % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

/** "1:02:30", "45:10" o "45" (minutos) → segundos. */
export function parseTime(t: string): number | null {
  const parts = t.trim().split(":").map(Number);
  if (!parts.length || parts.some((n) => Number.isNaN(n) || n < 0)) return null;
  const s = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 60;
  return s > 0 ? Math.round(s) : null;
}

export const totalOf = (r: RaceResult) => r.segments.reduce((a, s) => a + s.time_s, 0) + r.transitions_s;

/** Segmentos de la carrera (distancias según el tipo), sin tiempos. */
export function raceSegments(race: RaceEvent, athlete: AthleteProfile) {
  return baseSegments(race, athlete).map((s) => ({ label: s.label, sport: s.sport, distance_km: s.distance_km, eta_min: s.eta_min }));
}

/** "Importar de Garmin, Strava o Wahoo" (demo): tiempos estables por carrera, cerca de lo estimado con sus umbrales. */
export function deviceResult(race: RaceEvent, athlete: AthleteProfile, source: Exclude<ResultSource, "manual">): RaceResult {
  let h = 7;
  for (const c of race.id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  const segments = raceSegments(race, athlete).map((s, i) => ({
    label: s.label,
    sport: s.sport,
    distance_km: s.distance_km,
    time_s: Math.round(s.eta_min * 60 * (0.98 + (((h + i * 137) % 70) / 1000))),
  }));
  return { source, segments, transitions_s: segments.length > 1 ? 150 + (h % 90) : 0, brief: "", debrief: null };
}

export function paceOf(s: SegmentResult) {
  if (s.sport === "bike") return `${(s.distance_km / (s.time_s / 3600)).toFixed(1)} km/h`;
  const per = s.time_s / (s.distance_km * (s.sport === "swim" ? 10 : 1));
  return `${Math.floor(per / 60)}:${String(Math.floor(per % 60)).padStart(2, "0")} ${s.sport === "swim" ? "/100 m" : "/km"}`;
}

// ---------------------------------------------------------------- respaldos del modo mock
export function heuristicDebrief(req: RaceDebriefRequest, model: string): RaceDebrief {
  const segments = req.segments.map((s) => ({ ...s, pace: paceOf(s) }));
  const total = segments.reduce((a, s) => a + s.time_s, 0) + req.transitions_s;
  const longest = segments.reduce((a, b) => (b.time_s > a.time_s ? b : a));
  const brief = req.brief.trim();
  return {
    race_name: req.race_name,
    total_s: total,
    segments,
    summary: `Terminaste ${req.race_name} en ${fmtTime(total)}. El segmento más largo fue ${longest.label.toLowerCase()} (${fmtTime(longest.time_s)} a ${longest.pace}).`,
    highlights: segments.slice(0, 3).map((s) => `${s.label}: ${fmtTime(s.time_s)} (${s.pace}).`),
    improvements: [
      "Revisar el ritmo de la segunda mitad del segmento más largo.",
      ...(/nutri|gel|comí|hidrat/i.test(brief) ? ["Ajustar la nutrición según lo que contaste del día."] : []),
    ],
    insights: brief ? [`Lo que contaste: ${brief.slice(0, 180)}`] : ["Sin relato: contar cómo te fue suma contexto para el staff."],
    model,
  };
}

export function trainingFacts(athlete: AthleteProfile, weightKg: number, ctl: number, tsb: number, readiness: number): TrainingFacts {
  const weeks = 6;
  const acts = historyFor(false).activities.filter((a) => a.day_offset >= -7 * weeks);
  const sports = ["swim", "bike", "run"] as const;
  const longest = (sport: string) => Math.max(0, ...acts.filter((a) => a.sport === sport).map((a) => a.duration_min));
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    weeks,
    weekly_hours: r1(acts.reduce((a, x) => a + x.duration_min, 0) / 60 / weeks),
    hours_by_sport: Object.fromEntries(sports.map((s) => [s, r1(acts.filter((a) => a.sport === s).reduce((a, x) => a + x.duration_min, 0) / 60 / weeks)])),
    sessions_by_sport: Object.fromEntries(sports.map((s) => [s, acts.filter((a) => a.sport === s).length])),
    ctl: r1(ctl),
    tsb: r1(tsb),
    ftp_w: athlete.ftp_w,
    ftp_w_kg: Math.round((athlete.ftp_w / weightKg) * 100) / 100,
    longest_bike_min: longest("bike"),
    longest_run_min: longest("run"),
    readiness_today: readiness,
  };
}

const SPORT_ES: Record<string, string> = { swim: "natación", bike: "ciclismo", run: "running" };

export function heuristicKnowledge(req: KnowledgeRequest, name: string, f: TrainingFacts, model: string): KnowledgeBase {
  const bySport = Object.entries(f.hours_by_sport).sort((a, b) => b[1] - a[1]);
  const [top, low] = [bySport[0][0], bySport.at(-1)![0]];
  return {
    athlete_name: name,
    facts: f,
    training_summary: `Venís entrenando ${f.weekly_hours} h por semana en las últimas ${f.weeks} semanas, con CTL ${f.ctl} y TSB ${f.tsb > 0 ? "+" : ""}${f.tsb}. La mayor parte del volumen es ${SPORT_ES[top]} (${f.hours_by_sport[top]} h/semana).`,
    races_summary: req.races.length
      ? req.races.map((r) => `${r.race_name}: ${fmtTime(r.total_s)} hace ${r.days_ago} días.${r.summary ? ` ${r.summary}` : ""}`).join(" ")
      : "Todavía no cargaste resultados de carreras.",
    athlete_profile: `Perfil de ${req.profile} con FTP ${f.ftp_w} W (${f.ftp_w_kg} W/kg). Tu disciplina con más volumen es ${SPORT_ES[top]} y la de menos, ${SPORT_ES[low]}. Tu fondo más largo reciente fue de ${Math.round(f.longest_bike_min)}' en bici y ${Math.round(f.longest_run_min)}' corriendo. ${req.races.flatMap((r) => r.insights).slice(0, 2).join(" ")}`.trim(),
    strengths: [`Volumen consistente en ${SPORT_ES[top]}.`, `FTP de ${f.ftp_w_kg} W/kg.`],
    opportunities: [`Sumar volumen de ${SPORT_ES[low]}.`, "Cargar el relato de cada carrera para afinar el análisis."],
    next_focus: ["Mantener la consistencia semanal.", `Una sesión técnica extra de ${SPORT_ES[low]} por semana.`],
    model,
  };
}

/** Resumen corto que se le pasa al backend para que los agentes lo tengan en cuenta. */
export function knowledgeContext(k: KnowledgeBase) {
  return `Base de conocimiento de ${k.athlete_name}. ${k.athlete_profile} Fortalezas: ${k.strengths.join("; ")}. Oportunidades: ${k.opportunities.join("; ")}.`.slice(0, 1500);
}
