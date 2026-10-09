// Estrategia por segmento. Los objetivos salen de los umbrales del atleta (código); el Race Agent
// elige el enfoque de pacing y redacta notas y porqué (backend/app/agents/race_strategy.py).
import { formatPace } from "@/lib/engine";
import type { RaceEvent } from "@/lib/setup";
import type { AthleteProfile } from "@/lib/types";

export type Pacing = "conservador" | "equilibrado" | "agresivo";
export type TargetUnit = "W" | "s/km" | "s/100m";

export interface SegmentPlan {
  sport: "swim" | "bike" | "run";
  label: string;
  distance_km: number;
  target_low: number;
  target_high: number;
  unit: TargetUnit;
  eta_min: number;
}

export interface StrategySegment extends SegmentPlan {
  notes: string;
}

export interface TrainingSummary {
  ctl: number;
  tsb: number;
  readiness: number;
  ftp_w: number;
  longest_bike_min: number;
  longest_run_min: number;
  weekly_hours: number;
}

export interface RaceStrategyRequest {
  race_name: string;
  race_distance: string;
  days_to_race: number;
  segments: SegmentPlan[];
}

export interface RaceStrategy {
  race_name: string;
  pacing: Pacing;
  segments: StrategySegment[];
  estimated_finish_min: number;
  nutrition: string[];
  rationale: string[];
  training: TrainingSummary;
  model: string;
}

export const PACING_FACTOR: Record<Pacing, number> = { conservador: 0.97, equilibrado: 1, agresivo: 1.02 };

const num = (s: string) => Number(s.replace(",", "."));
const parseKm = (label: string) => [...label.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => num(m[1]));

type Range = [number, number];
interface Shape {
  swim?: [number, Range];
  bike?: [number, Range];
  runs: [number, Range][];
}

/** Distancias y rangos de intensidad (vatios como %FTP; ritmos como × umbral) por tipo de carrera. */
function shapeFor(r: RaceEvent): Shape {
  if (r.sport === "triathlon") {
    const t: Record<string, Shape> = {
      Sprint: { swim: [0.75, [1.02, 1.05]], bike: [20, [0.9, 0.95]], runs: [[5, [1.03, 1.05]]] },
      Olímpico: { swim: [1.5, [1.05, 1.07]], bike: [40, [0.85, 0.9]], runs: [[10, [1.06, 1.08]]] },
      "70.3": { swim: [1.9, [1.07, 1.1]], bike: [90, [0.76, 0.8]], runs: [[21.1, [1.09, 1.11]]] },
      "140.6": { swim: [3.8, [1.1, 1.14]], bike: [180, [0.68, 0.72]], runs: [[42.2, [1.22, 1.26]]] },
    };
    return t[r.distance] ?? t["70.3"];
  }
  if (r.sport === "duathlon") {
    const [r1, b, r2] = parseKm(r.distance);
    const sprint = b <= 20;
    return { bike: [b, sprint ? [0.88, 0.92] : [0.82, 0.86]], runs: [[r1, [1.02, 1.04]], [r2, [1.06, 1.08]]] };
  }
  if (r.sport === "running") {
    const [km] = parseKm(r.distance);
    const f: Range = km <= 10 ? [1, 1.02] : km <= 21.1 ? [1.05, 1.07] : [1.12, 1.15];
    return { runs: [[km, f]] };
  }
  const [km] = parseKm(r.distance);
  return { bike: [km, km <= 40 ? [0.95, 1] : [0.65, 0.7]], runs: [] };
}

const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${String(km).replace(".", ",")} km`);

export function baseSegments(r: RaceEvent, p: AthleteProfile): SegmentPlan[] {
  const sh = shapeFor(r);
  const out: SegmentPlan[] = [];
  if (sh.swim) {
    const [km, [a, b]] = sh.swim;
    const lo = p.swim_css_s_per_100m * a;
    const hi = p.swim_css_s_per_100m * b;
    out.push({ sport: "swim", label: `Natación ${fmtKm(km)}`, distance_km: km, target_low: Math.round(lo), target_high: Math.round(hi), unit: "s/100m", eta_min: Math.round((km * 10 * ((lo + hi) / 2)) / 60) });
  }
  const runs = sh.runs.map(([km, [a, b]], i) => ({ km, a, b, i }));
  const pushRun = (x: (typeof runs)[number], label: string) => {
    const lo = p.run_threshold_pace_s_per_km * x.a;
    const hi = p.run_threshold_pace_s_per_km * x.b;
    out.push({ sport: "run", label, distance_km: x.km, target_low: Math.round(lo), target_high: Math.round(hi), unit: "s/km", eta_min: Math.round((x.km * ((lo + hi) / 2)) / 60) });
  };
  if (r.sport === "duathlon" && runs[0]) pushRun(runs[0], `Running 1 · ${fmtKm(runs[0].km)}`);
  if (sh.bike) {
    const [km, [a, b]] = sh.bike;
    const watts = (p.ftp_w * (a + b)) / 2;
    const speed = 38 * Math.cbrt(watts / p.ftp_w);
    out.push({ sport: "bike", label: `Ciclismo ${fmtKm(km)}`, distance_km: km, target_low: Math.round((p.ftp_w * a) / 5) * 5, target_high: Math.round((p.ftp_w * b) / 5) * 5, unit: "W", eta_min: Math.round((km / speed) * 60) });
  }
  if (r.sport === "duathlon" && runs[1]) pushRun(runs[1], `Running 2 · ${fmtKm(runs[1].km)}`);
  else if (r.sport !== "duathlon") runs.forEach((x) => pushRun(x, `Running ${fmtKm(x.km)}`));
  return out;
}

export function formatTarget(s: SegmentPlan, ftp: number): string {
  if (s.unit === "W") return `${Math.round(s.target_low)}-${Math.round(s.target_high)} W (${Math.round((s.target_low / ftp) * 100)}-${Math.round((s.target_high / ftp) * 100)}% FTP)`;
  if (s.unit === "s/km") return `${formatPace(s.target_low)}-${formatPace(s.target_high)} /km`;
  return `${formatPace(s.target_low)}-${formatPace(s.target_high)} /100 m`;
}

/** Espejo del heurístico del backend para el modo mock. */
export function heuristicStrategy(req: RaceStrategyRequest, t: TrainingSummary, model = "mock"): RaceStrategy {
  const run = req.segments.find((s) => s.sport === "run");
  const runShort = !!run && t.longest_run_min < run.eta_min * 0.75;
  const pacing: Pacing = t.ctl < 55 || t.readiness < 40 || runShort ? "conservador" : t.ctl >= 80 && t.tsb > 0 ? "agresivo" : "equilibrado";
  const f = PACING_FACTOR[pacing];
  const notes = {
    swim: "Salida controlada los primeros 200 m y buscá pies a partir de la primera boya.",
    bike: "Mantené la potencia dentro del rango; en subidas no pases el techo del rango por más de un minuto.",
    run: "Primer tercio a la parte lenta del rango; aceleración progresiva solo en el último tercio.",
  };
  const segments: StrategySegment[] = req.segments.map((s) =>
    s.unit === "W"
      ? { ...s, target_low: Math.round(s.target_low * f), target_high: Math.round(s.target_high * f), eta_min: Math.round((s.eta_min / Math.cbrt(f)) * 10) / 10, notes: notes[s.sport] }
      : { ...s, target_low: Math.round(s.target_low / f), target_high: Math.round(s.target_high / f), eta_min: Math.round((s.eta_min / f) * 10) / 10, notes: notes[s.sport] },
  );
  const total = segments.reduce((a, s) => a + s.eta_min, 0);
  const rationale = [
    `CTL ${Math.round(t.ctl)} y ${t.weekly_hours} h por semana en las últimas 6 semanas.`,
    `Fondo más largo: bici ${Math.round(t.longest_bike_min)}' y run ${Math.round(t.longest_run_min)}'.`,
  ];
  if (runShort) rationale.push("El run más largo queda por debajo del 75% del tiempo de carrera a pie: se corre conservador.");
  rationale.push(`Enfoque ${pacing}: ajusta los objetivos ×${f}.`);
  return {
    race_name: req.race_name,
    pacing,
    segments,
    estimated_finish_min: Math.round((total + (segments.length > 1 ? 4 : 0)) * 10) / 10,
    nutrition:
      total < 75
        ? ["Agua y electrolitos; no hace falta carbohidrato extra en menos de 75 minutos."]
        : [
            "Desayuno 3 h antes con 1,5-2 g de carbohidratos por kg.",
            "60-90 g de carbohidratos por hora a partir del minuto 30.",
            "500-750 ml de líquido por hora con sodio, más si hace calor.",
          ],
    rationale,
    training: t,
    model,
  };
}
