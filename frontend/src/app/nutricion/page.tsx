"use client";

import { ChevronDown, Loader2, WandSparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { AgentChat } from "@/components/agent-chat";
import { ConditionPicker } from "@/components/condition-picker";
import { TopBar } from "@/components/layout/top-bar";
import { DecisionBadge, Panel } from "@/components/shared";
import { FuelTable } from "@/components/today/nutrition-sheet";
import { Button } from "@/components/ui/button";
import { agentById } from "@/lib/agents";
import { api } from "@/lib/api";
import { heuristicMealPlan, MEAL_LABEL, type MealPlan, mealPlanRequest } from "@/lib/meal-plan";
import { dayNutrition } from "@/lib/nutrition";
import { CONDITION_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { useSchedule } from "@/lib/use-schedule";
import { cn } from "@/lib/utils";

// El plan generado vive mientras dure la sesión del navegador: navegar no lo pierde, recargar sí.
const usePlan = create<{ plan: MealPlan | null; loading: boolean; set: (p: Partial<{ plan: MealPlan | null; loading: boolean }>) => void }>(
  (set) => ({ plan: null, loading: false, set }),
);

const SUGGESTIONS = ["¿Qué como antes de entrenar?", "¿Qué puedo comer en la carrera?", "¿Cómo me hidrato si hace calor?"];

export default function NutricionPage() {
  const { today } = useSchedule(1);
  const kg = useSetup((s) => s.weightKg);
  const conditions = useSetup((s) => s.conditions);
  const decision = useCoach((s) => s.decision);
  const daysToRace = useCoach((s) => s.snapshot.days_to_race);
  const { plan, loading, set } = usePlan();
  const [details, setDetails] = useState(false);

  const req = mealPlanRequest(today, kg, decision, conditions);
  // Sin plan con IA se muestra el respaldo calculado en código, ya adaptado a las condiciones.
  const fallback = heuristicMealPlan(req, today, daysToRace, "");
  // Si cambiaron las condiciones después de generar, el plan con IA quedó viejo.
  const stale = !!plan && plan.conditions.join() !== conditions.join();
  const shown = plan && !stale ? plan : fallback;
  const fuel = dayNutrition(decision?.decision === "rest" ? [] : today, kg, daysToRace);

  const generate = async () => {
    set({ loading: true });
    try {
      set({ plan: await api.nutritionPlan(req, today, daysToRace) });
    } catch {
      toast("No se pudo generar el plan", { description: "Revisá que el backend esté corriendo e intentá de nuevo." });
    } finally {
      set({ loading: false });
    }
  };

  return (
    <div className="space-y-8">
      <TopBar title="Nutrición" subtitle="Tus comidas de hoy, armadas por el Nutrition Agent con el resto del staff." />

      <ConditionPicker label="Mis condiciones:" />

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-rule-strong py-3">
        <p className="text-[15px]">
          <span className="font-semibold">{shown.label}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="num font-semibold">{shown.carbs_g[0]}-{shown.carbs_g[1]} g</span>
          <span className="text-muted-foreground"> de carbohidratos y </span>
          <span className="num font-semibold">{shown.protein_g[0]}-{shown.protein_g[1]} g</span>
          <span className="text-muted-foreground"> de proteína</span>
        </p>
        <Button onClick={generate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
          {loading ? "Armando el plan…" : plan && !stale ? "Regenerar con IA" : "Generar plan con IA"}
        </Button>
      </div>

      {conditions.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted-foreground">Plan adaptado:</span>
          {conditions.map((c) => (
            <span key={c} className="rounded-[3px] border border-good/50 px-2 py-0.5 font-medium text-good">{CONDITION_META[c].badge}</span>
          ))}
          {stale && <span className="text-reagent">Cambiaste tus condiciones: regenerá el plan con IA.</span>}
        </p>
      )}

      {loading && (
        <p className="flex items-center gap-2 text-[14px] text-reagent" aria-live="polite">
          <Loader2 className="size-4 animate-spin" />
          {decision
            ? "El Nutrition Agent está leyendo la decisión del Head Coach y lo que observó el staff…"
            : "Sin corrida del staff hoy: el Nutrition Agent le consulta a Recovery y Training…"}
        </p>
      )}

      {/* Las 4 comidas en lista: qué comer primero, los gramos en segundo plano. */}
      <ol>
        {shown.meals.map((m) => (
          <li key={m.meal} className="grid grid-cols-1 gap-x-8 gap-y-1 border-t border-rule py-4 first:border-t-0 sm:grid-cols-[11rem_1fr]">
            <div>
              <h2 className="text-[18px] font-semibold">{MEAL_LABEL[m.meal]}</h2>
              <p className="text-[13px] text-muted-foreground">{/^\d/.test(m.when) ? `${m.when} aprox.` : m.when}</p>
            </div>
            <div>
              <p className="text-[16px] leading-relaxed">{m.foods.join(" · ")}</p>
              <p className="num mt-1 text-[12px] text-muted-foreground">
                {m.carbs_g} g de carbohidratos · {m.protein_g} g de proteína
                {plan && !stale && <span className="font-sans"> · {m.note}</span>}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {!(plan && !stale) && (
        <p className="-mt-4 text-[13px] text-muted-foreground">Plan base calculado con tu peso y la carga del día. Generalo con IA para que lo ajuste al staff.</p>
      )}

      <AgentChat agent="nutrition" suggestions={SUGGESTIONS} context={{ conditions, plan: shown.meals.map((m) => ({ comida: m.meal, alimentos: m.foods })) }} />

      <section>
        <button type="button" onClick={() => setDetails(!details)} aria-expanded={details}
          className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("size-4 transition-transform", details && "rotate-180")} />
          {details ? "Ocultar detalle" : "Ver detalle: coordinación con el staff, hidratación y sesiones"}
        </button>
        {details && (
          <div className="mt-6 space-y-10">
            <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
              <Panel id="staff" title="Cómo se coordinó con el staff">
                <ul className="space-y-2 text-[14px]">
                  {shown.coordination.map((c) => <li key={c} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">{c}</li>)}
                </ul>
                {plan && !stale && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {decision && (
                      <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 text-[12px]">
                        Head Coach <DecisionBadge value={decision.decision} />
                      </span>
                    )}
                    {plan.consulted.map((n) => (
                      <span key={n.agent} className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 text-[12px]">
                        {agentById(n.agent).name} <DecisionBadge value={n.recommendation} />
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel id="tips" title="Hidratación y timing">
                <ul className="space-y-2 text-[14px]">
                  {shown.tips.map((t) => <li key={t} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">{t}</li>)}
                </ul>
              </Panel>
            </div>
            <Panel id="fuel" title="Alrededor de cada sesión">
              <FuelTable n={fuel} />
              {!fuel.sessions.length && <p className="text-[14px] text-muted-foreground">Hoy no hay sesiones.</p>}
            </Panel>
            {plan && !stale && <p className="code text-faint">{plan.model}</p>}
          </div>
        )}
      </section>

      <p className="text-[12px] text-muted-foreground">
        Los gramos los calcula el código con tu peso ({kg} kg) y la carga del día; la IA elige los alimentos. Pautas generales de
        nutrición deportiva: no reemplazan a un nutricionista ni a tu equipo de salud.
      </p>
    </div>
  );
}
