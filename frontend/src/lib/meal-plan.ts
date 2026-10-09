// Plan de comidas del Nutrition Agent. Espejo de backend/app/models/nutrition.py y del respaldo
// heurístico de backend/app/agents/meal_plan.py, para el modo mock. Los gramos los calcula el código.
import type { DayItem } from "@/lib/day";
import { dayNutrition } from "@/lib/nutrition";
import type { DietCondition } from "@/lib/setup";
import type { CoachDecision, Recommendation, Sport } from "@/lib/types";

export type Meal = "desayuno" | "almuerzo" | "merienda" | "cena";
export const MEALS: Meal[] = ["desayuno", "almuerzo", "merienda", "cena"];
export const MEAL_LABEL: Record<Meal, string> = { desayuno: "Desayuno", almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena" };

export interface PlannedSession {
  time: string;
  sport: Sport;
  title: string;
  minutes: number;
  key: boolean;
  intense: boolean;
}

export interface StaffNote {
  agent: string;
  recommendation: Recommendation;
  observations: string[];
}

export interface MealPlanRequest {
  weight_kg: number;
  sessions: PlannedSession[];
  decision: Recommendation | null;
  primary_reason: string | null;
  staff: StaffNote[];
  conditions: DietCondition[];
}

export interface PlannedMeal {
  meal: Meal;
  when: string;
  carbs_g: number;
  protein_g: number;
  foods: string[];
  note: string;
}

export interface MealPlan {
  level: string;
  label: string;
  reason: string;
  carbs_g: [number, number];
  protein_g: [number, number];
  meals: PlannedMeal[];
  coordination: string[];
  tips: string[];
  consulted: StaffNote[];
  conditions: DietCondition[];
  model: string;
}

const INTENSE = ["sweet_spot", "threshold", "vo2max", "anaerobic"];
const CUTOFF: Record<Meal, string> = { desayuno: "10:00", almuerzo: "14:30", merienda: "18:30", cena: "23:59" };
const DEFAULT_TIME: Record<Meal, string> = { desayuno: "07:30", almuerzo: "13:00", merienda: "17:00", cena: "21:00" };
const BASE_SPLIT: Record<Meal, number> = { desayuno: 0.25, almuerzo: 0.3, merienda: 0.2, cena: 0.25 };
const r5 = (x: number) => Math.round(x / 5) * 5;
const mealFor = (time: string) => MEALS.find((m) => time <= CUTOFF[m])!;

/** Arma el pedido con las sesiones de hoy y lo que decidió el staff en la última corrida. */
export function mealPlanRequest(items: DayItem[], weightKg: number, decision: CoachDecision | null, conditions: DietCondition[] = []): MealPlanRequest {
  return {
    weight_kg: weightKg,
    sessions: items
      .filter((i) => i.session && i.session.kind !== "rest")
      .map((i) => ({
        time: i.slot.time,
        sport: i.session!.sport,
        title: i.session!.title,
        minutes: i.session!.minutes,
        key: i.session!.kind === "key",
        intense: (i.session!.steps ?? []).some((s) => INTENSE.includes(s.intensity)),
      })),
    decision: decision?.decision ?? null,
    primary_reason: decision?.primary_reason ?? null,
    staff: (decision?.opinions ?? []).map((o) => ({ agent: o.agent, recommendation: o.recommendation, observations: o.observations })),
    conditions,
  };
}

const FOODS: Record<Meal, [string, string, string][]> = {
  desayuno: [
    ["1/2 taza de avena con leche", "1 taza de avena con leche", "1 taza de avena con leche y miel"],
    ["1 banana", "1 banana y 1 tostada con mermelada", "1 banana y 2 tostadas con mermelada"],
    ["1 yogur", "1 yogur con granola", "1 yogur con granola"],
  ],
  almuerzo: [
    ["1 plato chico de arroz", "1 plato de arroz o fideos", "1 plato grande de fideos"],
    ["1 filet de pollo", "1 filet de pollo o 2 huevos", "1 filet grande de pollo o carne magra"],
    ["ensalada de hojas y tomate", "ensalada de hojas y tomate", "ensalada y 1 pan"],
  ],
  merienda: [
    ["1 fruta", "1 fruta y 2 tostadas con queso untable", "1 sándwich de pan con queso y jamón"],
    ["1 yogur", "1 yogur", "1 licuado de banana con leche"],
  ],
  cena: [
    ["verduras asadas", "1 plato de arroz con verduras", "1 plato grande de pasta con verduras"],
    ["1 porción de pescado o pollo", "1 porción de pescado o pollo", "1 porción de pescado, pollo o huevos"],
    ["1 fruta de postre", "1 fruta de postre", "1 flan o arroz con leche"],
  ],
};
// Reemplazos por condición: espejo de SWAPS en backend/app/agents/meal_plan.py.
const SWAPS: Record<DietCondition, [string, string][]> = {
  celiaquia: [
    ["avena", "avena certificada sin TACC"], ["tostadas", "tostadas de pan sin TACC"], ["tostada", "tostada de pan sin TACC"],
    ["fideos", "fideos de arroz"], ["pasta", "pasta sin TACC"], ["granola", "granola sin TACC"],
    ["sándwich de pan", "sándwich de pan sin TACC"], ["1 pan", "1 pan sin TACC"],
  ],
  lactosa: [["con leche", "con leche deslactosada"], ["yogur", "yogur deslactosado"], ["queso", "queso deslactosado"], ["flan", "postre de bebida vegetal"]],
  diabetes: [
    ["y miel", "y canela"], ["con mermelada", "con queso untable"], ["fideos", "fideos integrales"],
    ["arroz con leche", "fruta con yogur natural"], ["flan", "fruta con yogur natural"], ["licuado de banana con leche", "yogur natural con nueces"],
  ],
  vegetariano: [
    ["filet grande de pollo o carne magra", "porción grande de lentejas o tofu"], ["filet de pollo o 2 huevos", "2 huevos o 1 porción de garbanzos"],
    ["filet de pollo", "porción de lentejas"], ["pescado, pollo o huevos", "huevos o tofu"], ["pescado o pollo", "huevos o tofu"], ["y jamón", "y tomate"],
  ],
};
const CONDITION_RULE: Record<DietCondition, string> = {
  celiaquia: "Celiaquía: todo sin TACC; arroz, papa, batata, polenta, quinoa y productos certificados.",
  lactosa: "Intolerancia a la lactosa: lácteos deslactosados o bebidas vegetales.",
  diabetes: "Diabetes: carbohidratos repartidos parejo y de absorción lenta; los ajustes van con tu equipo de salud.",
  vegetariano: "Vegetariano: proteína de huevos, lácteos, legumbres y tofu.",
};

function adapt(food: string, conditions: DietCondition[]) {
  for (const c of conditions) {
    const hit = SWAPS[c].find(([old, nu]) => food.includes(old) && !food.includes(nu));
    if (hit) food = food.replace(hit[0], hit[1]);
  }
  return food;
}

const BASE_CARBS: Record<Meal, number> = { desayuno: 60, almuerzo: 80, merienda: 50, cena: 75 };
const AGENT_NAME: Record<string, string> = { training: "Training", recovery: "Recovery", race: "Race", performance: "Performance" };

/** Respaldo determinista (modo mock): mismos gramos que el backend, alimentos de plantilla. */
export function heuristicMealPlan(req: MealPlanRequest, items: DayItem[], daysToRace: number, model: string): MealPlan {
  const rest = req.decision === "rest";
  const sessions = rest ? [] : req.sessions;
  const day = dayNutrition(rest ? [] : items, req.weight_kg, daysToRace);
  const split = { ...BASE_SPLIT };
  for (const s of sessions.filter((x) => x.sport !== "strength")) {
    const m = mealFor(s.time);
    const i = MEALS.indexOf(m);
    split[m] += s.key ? 0.08 : 0.04;
    if (i + 1 < MEALS.length) split[MEALS[i + 1]] += s.key ? 0.05 : 0.02;
  }
  if (req.conditions.includes("diabetes")) for (const m of MEALS) split[m] = (split[m] + 0.25) / 2;
  const total = Object.values(split).reduce((a, b) => a + b, 0);
  const when: Record<Meal, string> = { ...DEFAULT_TIME };
  for (const s of sessions) {
    const m = mealFor(s.time);
    when[m] = `antes de la sesión de las ${s.time}`;
    const next = MEALS[MEALS.indexOf(m) + 1];
    if (next && !when[next].startsWith("antes")) when[next] = `después de la sesión de las ${s.time}`;
  }
  const carbsMid = (day.total.low + day.total.high) / 2;
  const protein: [number, number] = [r5(1.6 * req.weight_kg), r5(2 * req.weight_kg)];

  const meals = MEALS.map((m): PlannedMeal => {
    const carbs = r5((carbsMid * split[m]) / total);
    const size = carbs < BASE_CARBS[m] * 0.8 ? 0 : carbs > BASE_CARBS[m] * 1.3 ? 2 : 1;
    const w = when[m];
    return {
      meal: m,
      when: w,
      carbs_g: carbs,
      protein_g: r5((protein[0] + protein[1]) / 2 / 4),
      foods: FOODS[m].map((o) => adapt(o[size], req.conditions)),
      note: w.startsWith("antes")
        ? `Va ${w}: carbohidratos fáciles de digerir, poca grasa y fibra.`
        : w.startsWith("después")
          ? `Recuperación ${w}: carbohidratos para reponer y proteína para reparar.`
          : "Comida de base del día.",
    };
  });

  const staff = req.staff.length
    ? req.staff.filter((n) => n.agent !== "nutrition")
    : [
        { agent: "recovery", recommendation: "train" as Recommendation, observations: ["Consultado en el momento: recuperación sin alertas."] },
        { agent: "training", recommendation: "train" as Recommendation, observations: ["Consultado en el momento: se mantiene la sesión del plan."] },
      ];
  const coordination = [
    ...(req.primary_reason ? [`Head Coach: ${req.primary_reason}`] : []),
    ...req.conditions.map((c) => `Adaptado: ${CONDITION_RULE[c]}`),
    ...staff.slice(0, 3).map((n) => `${AGENT_NAME[n.agent] ?? n.agent} Agent (${n.recommendation}): ${n.observations.at(-1) ?? ""}`),
  ];
  return {
    level: day.level,
    label: day.label,
    reason: day.reason,
    carbs_g: [day.total.low, day.total.high],
    protein_g: protein,
    meals,
    coordination: coordination.slice(0, 4),
    tips: ["Tomá 500-750 ml de agua por hora de entrenamiento, más si hace calor.", "No pruebes comidas nuevas en la semana de carrera."],
    consulted: staff,
    conditions: req.conditions,
    model,
  };
}
