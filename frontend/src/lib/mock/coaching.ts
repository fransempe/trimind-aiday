// Simulación determinista del equipo de agentes para el modo mock.
// En modo API estas opiniones las generan los LLM del grafo de LangGraph.
import { formatSleep } from "@/lib/engine";
import { dayNutrition } from "@/lib/nutrition";
import { candidates } from "@/lib/mock/data";
import type {
  AgentOpinion,
  AthleteSnapshot,
  CoachDecision,
  Disagreement,
  ImpactLevel,
  Recommendation,
} from "@/lib/types";

const HIGH = new Set(["threshold", "vo2max", "anaerobic"]);
const LEVEL_RANK: Record<ImpactLevel, number> = { low: 0, moderate: 1, high: 2 };

function opinion(
  agent: string,
  recommendation: Recommendation,
  score: number,
  confidence: number,
  observations: string[],
  impact_factors: Record<string, ImpactLevel>,
): AgentOpinion {
  return {
    agent,
    recommendation,
    score: Math.round(score),
    confidence,
    observations,
    impact_factors,
    model: agent === "head_coach" ? "nemotron-3-super-120b" : "gemma-4-31b",
    latency_ms: 900 + Math.round(Math.random() * 1400),
  };
}

function context(s: AthleteSnapshot) {
  const yesterday = s.recent_activities.at(-1);
  return {
    s,
    r: s.readiness,
    dev: s.hrv.deviation_pct,
    sleep: s.wellness_today.sleep_hours,
    yesterday,
    hardYesterday: !!yesterday && HIGH.has(yesterday.intensity),
    fmtDev: `${s.hrv.deviation_pct > 0 ? "+" : ""}${s.hrv.deviation_pct.toFixed(0)}%`,
  };
}

type Ctx = ReturnType<typeof context>;

const specialists: Record<string, (c: Ctx) => AgentOpinion> = {
  training: ({ s, r, yesterday, hardYesterday, sleep }) => {
    const obs = [
      `El plan de hoy es ${s.planned_workout.title} (sweet spot), la sesión clave de la semana.`,
      `Carga: CTL ${s.load.ctl.toFixed(0)}, ATL ${s.load.atl.toFixed(0)}, TSB ${s.load.tsb.toFixed(1)}.`,
    ];
    if (hardYesterday && yesterday)
      obs.push(`Ayer hizo ${yesterday.title} (TSS ${yesterday.tss.toFixed(0)}): dos sesiones de calidad en 24 h.`);
    if (r.band === "red" || (hardYesterday && sleep < 6)) {
      return opinion("training", "modify", 42, 0.78, obs, {
        carga_reciente: "high",
        estimulo_planificado: "moderate",
      });
    }
    obs.push("La carga está controlada para sostener el estímulo planificado.");
    return opinion("training", "train", r.band === "green" ? 84 : 64, 0.82, obs, {
      carga_reciente: hardYesterday ? "moderate" : "low",
      estimulo_planificado: "high",
    });
  },

  recovery: ({ s, r, dev, sleep, fmtDev }) => {
    const obs = [
      `Durmió ${formatSleep(sleep)}${sleep < 6.5 ? ", bastante por debajo de su promedio de 7h35" : ""}.`,
      `HRV ${s.hrv.today_ms.toFixed(0)} ms (${fmtDev} respecto del baseline de 30 días).`,
    ];
    const w = s.wellness_today;
    if (w.rpe != null || w.legs !== "normal")
      obs.push(
        `Reporta piernas ${{ fresh: "frescas", normal: "normales", heavy: "pesadas", sore: "cargadas" }[w.legs]}${w.rpe != null ? ` y fatiga percibida ${w.rpe}/10` : ""}.`,
      );
    obs.push(`Readiness ${r.score}/100 (${{ green: "verde", amber: "ámbar", red: "rojo" }[r.band]}).`);
    const factors: Record<string, ImpactLevel> = {
      sueno: sleep < 6 ? "high" : sleep < 7 ? "moderate" : "low",
      hrv: dev <= -15 ? "high" : dev <= -7 ? "moderate" : "low",
      fatiga_percibida: (w.rpe ?? 0) >= 7 || w.legs === "heavy" || w.legs === "sore" ? "high" : "low",
    };
    if (r.score < 20) return opinion("recovery", "rest", r.score, 0.86, obs, factors);
    if (r.band !== "green") return opinion("recovery", "modify", r.score, 0.88, obs, factors);
    return opinion("recovery", "train", r.score, 0.84, obs, factors);
  },

  race: ({ s, r }) => {
    const obs = [
      `Faltan ${s.days_to_race} días para ${s.race.name} (carrera A).`,
      s.days_to_race <= 7
        ? "Semana de carrera: la prioridad es llegar fresco, no sumar forma."
        : "Todavía hay margen para sumar carga antes del taper.",
    ];
    if (r.band !== "green") {
      obs.push("Una sesión de calidad con baja recuperación no suma forma para el domingo y sí suma fatiga.");
      return opinion("race", "modify", 48, 0.8, obs, { proximidad_carrera: "high" });
    }
    obs.push("Un último toque de intensidad moderada mantiene la activación sin comprometer el taper.");
    return opinion("race", "train", 76, 0.74, obs, { proximidad_carrera: "moderate" });
  },

  performance: ({ s, r }) => {
    const obs = [
      `Su FTP subió de 242 a ${s.profile.ftp_w} W en 12 meses; el trabajo de sweet spot lo sostiene.`,
      "Es el último estímulo de umbral antes de la carrera.",
    ];
    if (r.band === "red") {
      obs.push("Recortar la sesión cuesta poco en forma, pero conviene mantener algo de intensidad.");
      return opinion("performance", "train", 55, 0.52, obs, { progresion_ftp: "moderate" });
    }
    return opinion("performance", "train", 80, 0.7, obs, { progresion_ftp: "moderate" });
  },

  nutrition: ({ s, r, sleep }) => {
    const w = s.planned_workout;
    const intense = w.steps.some((x) => ["sweet_spot", "threshold", "vo2max", "anaerobic"].includes(x.intensity));
    const n = dayNutrition(
      [{ slot: { id: "k", time: "18:00", minutes: 90 }, session: { kind: "key", sport: w.sport, title: w.title, minutes: w.total_duration_min, detail: "", steps: w.steps } }],
      s.profile.weight_kg,
      s.days_to_race,
    );
    const obs = [`${n.label}: ${n.total.low}-${n.total.high} g de carbohidratos (${n.gPerKg.low}-${n.gPerKg.high} g/kg) y ${Math.round(1.6 * s.profile.weight_kg / 5) * 5}-${Math.round(2 * s.profile.weight_kg / 5) * 5} g de proteína.`];
    if (intense) obs.push("La sesión tiene bloques intensos: llegar con 1-2 g/kg de carbohidratos 1 a 3 h antes.");
    if (sleep < 6.5) obs.push(`Durmió ${formatSleep(sleep)}: conviene priorizar la comida de recuperación y la cena.`);
    if (s.days_to_race <= 7) obs.push("Semana de carrera: comidas conocidas, nada nuevo, y subir carbohidratos los últimos 2 días.");
    const weak = r.band !== "green" && intense;
    return opinion("nutrition", weak && sleep < 6 ? "modify" : "train", weak ? 55 : 78, 0.72, obs.slice(0, 4), {
      disponibilidad_energetica: intense ? "moderate" : "low",
      recuperacion_nutricional: sleep < 6 ? "high" : weak ? "moderate" : "low",
    });
  },
};

export function specialistOpinion(agent: string, snapshot: AthleteSnapshot): AgentOpinion {
  return specialists[agent](context(snapshot));
}

export function headCoachDecision(snapshot: AthleteSnapshot, opinions: AgentOpinion[]): CoachDecision {
  const c = context(snapshot);
  const { r, fmtDev, sleep } = c;
  const pick = (id: string) => candidates.find((x) => x.id === id)!;

  let chosen = pick("plan");
  if (r.score < 20) chosen = pick("descanso");
  else if (r.band === "red" || (r.band === "amber" && (c.dev <= -10 || sleep < 6))) chosen = pick("z2_estimulos");

  const impact: Record<string, ImpactLevel> = {};
  for (const o of opinions)
    for (const [k, v] of Object.entries(o.impact_factors))
      if (!impact[k] || LEVEL_RANK[v] > LEVEL_RANK[impact[k]]) impact[k] = v;

  const agreeing = opinions.filter((o) => o.recommendation === chosen.decision);
  const confidence =
    Math.round(
      ((agreeing.length ? agreeing : opinions).reduce((a, o) => a + o.confidence, 0) /
        (agreeing.length || opinions.length)) *
        100,
    ) / 100;

  const disagreements: Disagreement[] = [];
  const dissenters = opinions.filter((o) => o.recommendation !== chosen.decision);
  if (dissenters.length) {
    disagreements.push({
      agents: [...dissenters.map((o) => o.agent), ...agreeing.slice(0, 1).map((o) => o.agent)],
      topic:
        chosen.decision === "train" ? "Bajar la intensidad por precaución" : "Mantener el estímulo de umbral",
      resolution:
        chosen.decision === "modify"
          ? "Se conserva un estímulo corto (3x2' a 220 W) para mantener la activación sin sumar fatiga."
          : chosen.decision === "rest"
            ? "Con la recuperación tan comprometida, el estímulo no compensa el riesgo."
            : "Los indicadores de recuperación están en verde: no hay motivo para recortar.",
    });
  }

  const reasons: Record<string, [string, string]> = {
    plan: [
      r.band === "green" && c.hardYesterday
        ? "Se restaura el plan original: la recuperación volvió a valores normales."
        : "Los indicadores acompañan: se mantiene el plan.",
      `Readiness ${r.score}/100, HRV ${fmtDev} respecto de su baseline y ${formatSleep(sleep)} de sueño. La sesión de sweet spot es el estímulo clave de la semana y el cuerpo está listo para absorberla.`,
    ],
    z2_estimulos: [
      "Hoy la recuperación vale más que el estímulo extra.",
      `Durmió ${formatSleep(sleep)}, el HRV está ${fmtDev} respecto de lo normal${c.hardYesterday ? " y ayer hizo un run fuerte" : ""}, con la carrera a ${snapshot.days_to_race} días. Se cambian los 3x15' a 250 W por 60' en Z2 con 3 estímulos cortos de 2' a 220 W: mantiene la activación sin sumar fatiga para el domingo.`,
    ],
    descanso: [
      "Descanso total: la recuperación está muy comprometida.",
      `Readiness ${r.score}/100. Un día libre ahora protege la semana de carrera.`,
    ],
  };
  const [primary_reason, explanation] = reasons[chosen.id] ?? reasons.plan;

  return {
    decision: chosen.decision,
    original_workout: snapshot.planned_workout,
    new_workout: chosen.decision === "modify" ? chosen.workout : null,
    confidence,
    primary_reason,
    explanation,
    impact_factors: impact,
    opinions,
    disagreements,
    rule_retries: 0,
  };
}

const ASK_ROUTES: { match: RegExp; agents: string[] }[] = [
  { match: /nutri|comer|comida|desayun|almuer|merienda|cena|carbo|gel|hidrat/i, agents: ["nutrition", "training"] },
  { match: /carrera|race|ritmo|estrategia|taper/i, agents: ["race", "performance"] },
  { match: /dorm|sueñ|hrv|cansad|fatiga|recuper|descans/i, agents: ["recovery", "training"] },
  { match: /ftp|vatios|potencia|progres|mejor/i, agents: ["performance", "training"] },
];

export function routeQuestion(question: string): string[] {
  return ASK_ROUTES.find((r) => r.match.test(question))?.agents ?? ["training", "recovery", "race"];
}

export function askAnswer(question: string, snapshot: AthleteSnapshot, agents: string[]): string {
  const r = snapshot.readiness;
  if (agents[0] === "nutrition")
    return `Con la sesión de hoy (${snapshot.planned_workout.title}) el Nutrition Agent apunta a 5-7 g de carbohidratos por kilo en el día. Llegá a la sesión con una comida rica en carbohidratos 2 a 3 h antes, sumá 30-60 g por hora si dura más de una hora y, en la primera hora después, combiná carbohidratos con proteína. El plan de comidas completo está en Nutrición.`;
  if (agents[0] === "race")
    return `Para ${snapshot.race.name} el equipo propone nadar a 1:47-1:50 /100 m, pedalear a 205-215 W (76-80% de tu FTP de ${snapshot.profile.ftp_w} W) y correr los primeros 5 km a 5:00 /km antes de acelerar. En la bici, 80-90 g de carbohidratos por hora. Faltan ${snapshot.days_to_race} días: lo que queda es llegar fresco.`;
  if (agents[0] === "recovery")
    return `Tu readiness hoy es ${r.score}/100 (HRV ${snapshot.hrv.deviation_pct.toFixed(0)}% respecto del baseline, ${formatSleep(snapshot.wellness_today.sleep_hours)} de sueño). ${r.band === "green" ? "Estás en condiciones de entrenar según el plan." : "Conviene bajar la intensidad hoy y priorizar dormir más de 8 h esta noche."} Si la sensación de fatiga persiste varios días, consultalo con un profesional de la salud.`;
  if (agents[0] === "performance")
    return `Tu FTP pasó de 242 a ${snapshot.profile.ftp_w} W en 12 meses (+11,6%). Lo que más aportó fueron los bloques de sweet spot de los martes. Después de la carrera, el equipo sugiere un test de 20' para recalibrar zonas.`;
  return `El equipo analizó tu situación: readiness ${r.score}/100, TSB ${snapshot.load.tsb.toFixed(1)} y ${snapshot.days_to_race} días para la carrera. ${r.band === "green" ? "Seguí el plan tal como está." : "Hoy priorizá la recuperación: rodaje suave y buena hidratación."}`;
}

/** Respuesta directa de un especialista (modo mock): sus lecturas de hoy y un cierre según su área. */
export function directAnswer(agent: string, question: string, snapshot: AthleteSnapshot, context?: Record<string, unknown>): string {
  const obs = specialistOpinion(agent, snapshot).observations.slice(0, 2).join(" ");
  const conditions = (context?.conditions as string[] | undefined) ?? [];
  const closing: Record<string, string> = {
    training: "Si querés mover la sesión de día, avisame y la acomodo para no juntar dos de calidad seguidas.",
    recovery: "Esta noche apuntá a dormir más de 8 h; si la fatiga sigue varios días, consultalo con un profesional de la salud.",
    race: `Faltan ${snapshot.days_to_race} días: lo que queda es llegar fresco y con la estrategia ensayada.`,
    performance: "Después de la carrera conviene un test de 20' para recalibrar zonas.",
    nutrition: conditions.length
      ? "Tu plan ya está adaptado a tus condiciones alimentarias; los ajustes clínicos van con tu equipo de salud."
      : "Antes de la sesión clave priorizá carbohidratos fáciles de digerir, y después combiná carbohidratos con proteína.",
  };
  return `${obs} ${closing[agent] ?? ""}`.trim() || `Recibí tu pregunta: "${question}".`;
}
