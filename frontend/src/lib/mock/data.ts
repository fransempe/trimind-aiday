import raw from "./athlete-data.json";
import type { Activity, AthleteSnapshot, DailyPoint, WorkoutCandidate } from "@/lib/types";

// Datos exportados desde Python (backend/scripts/export_frontend_mock.py).
export type ScenarioKey = "normal" | "fatigued" | "recovered";

interface ScenarioData {
  snapshot: AthleteSnapshot;
  activities: Activity[];
  daily: DailyPoint[];
}

const data = raw as unknown as {
  candidates: WorkoutCandidate[];
  scenarios: Record<ScenarioKey, ScenarioData>;
};

export const candidates = data.candidates;
export const scenarios = data.scenarios;

/** Historia "con run fuerte ayer" (fatigued) o "con run suave ayer" (normal). */
export function historyFor(hardRunYesterday: boolean): ScenarioData {
  return hardRunYesterday ? scenarios.fatigued : scenarios.normal;
}

// Datos que el backend todavía no modela (solo para las pantallas de demo).
export const ftpHistory = [
  { month: "Nov", ftp: 242 },
  { month: "Dic", ftp: 245 },
  { month: "Ene", ftp: 248 },
  { month: "Feb", ftp: 250 },
  { month: "Mar", ftp: 255 },
  { month: "Abr", ftp: 254 },
  { month: "May", ftp: 258 },
  { month: "Jun", ftp: 262 },
  { month: "Jul", ftp: 263 },
  { month: "Ago", ftp: 266 },
  { month: "Sep", ftp: 268 },
  { month: "Oct", ftp: 270 },
];

export const powerCurve = [
  { label: "5s", watts: 980 },
  { label: "1m", watts: 455 },
  { label: "5m", watts: 330 },
  { label: "20m", watts: 284 },
  { label: "60m", watts: 268 },
  { label: "2h", watts: 238 },
];

export const raceStrategy = {
  segments: [
    {
      sport: "swim" as const,
      label: "Natación 1,9 km",
      target: "1:47-1:50 /100 m",
      eta: "35'",
      notes: "Salida controlada los primeros 200 m; buscar pies a partir de la primera boya.",
    },
    {
      sport: "bike" as const,
      label: "Ciclismo 90 km",
      target: "205-215 W (76-80% FTP)",
      eta: "2h28'",
      notes: "NP tope 220 W. No pasar de 240 W en repechos. Cadencia 85-90.",
    },
    {
      sport: "run" as const,
      label: "Running 21,1 km",
      target: "4:55-5:00 /km",
      eta: "1h45'",
      notes: "Primeros 5 km a 5:00 aunque las piernas pidan más; negativo desde el km 15.",
    },
  ],
  nutrition: [
    "Desayuno 3 h antes: 120 g de carbohidratos.",
    "Bici: 80-90 g de carbohidratos por hora + 750 ml de líquido con sodio.",
    "Run: gel cada 25' y agua en cada puesto.",
  ],
  taper: [
    { day: -7, label: "Bici 3x15' a 250 W (o Z2 + estímulos si la recuperación no acompaña)" },
    { day: -6, label: "Natación técnica 40'" },
    { day: -5, label: "Run 40' con 4x1' a ritmo de carrera" },
    { day: -4, label: "Bici 60' Z2 + 3x3' a ritmo de carrera" },
    { day: -3, label: "Descanso" },
    { day: -2, label: "Activación: natación 20' + bici 30' + trote 15'" },
    { day: -1, label: "Check-in y bici 20' suave" },
  ],
  estimatedFinish: "4h55'",
};
