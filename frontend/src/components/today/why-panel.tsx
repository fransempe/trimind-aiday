"use client";

import { Scale } from "lucide-react";
import { Empty, ImpactMeter, Panel } from "@/components/shared";
import { agentById, FACTOR_LABELS } from "@/lib/agents";
import { useCoach } from "@/lib/store";
import type { ImpactLevel } from "@/lib/types";

const ORDER: Record<ImpactLevel, number> = { high: 0, moderate: 1, low: 2 };

export function WhyPanel() {
  const decision = useCoach((s) => s.decision);

  if (!decision)
    return (
      <Panel id="why" title="Why · qué pesó en la decisión">
        <Empty>Cuando el staff decida, acá aparecen los factores que pesaron, el arbitraje y lo que observó cada especialista.</Empty>
      </Panel>
    );

  const factors = Object.entries(decision.impact_factors).sort((a, b) => ORDER[a[1]] - ORDER[b[1]]);

  return (
    <Panel id="why" title="Why · qué pesó en la decisión">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div>
          <h3 className="mb-1 text-[14px] font-semibold">Factores de impacto</h3>
          <p className="mb-3 text-[12px] text-muted-foreground">El tamaño del punto es el nivel, en una escala fija.</p>
          <ul>
            {factors.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between border-t border-rule py-2 text-[14px]">
                {FACTOR_LABELS[k] ?? k}
                <ImpactMeter level={v} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-5">
          {decision.disagreements.length > 0 ? (
            decision.disagreements.map((d, i) => (
              <div key={i}>
                <h3 className="flex items-center gap-2 text-[14px] font-semibold text-reagent">
                  <Scale className="size-4" /> Arbitraje: {d.topic}
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground">{d.agents.map((a) => agentById(a).name).join(" vs. ")}</p>
                <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed">{d.resolution}</p>
              </div>
            ))
          ) : (
            <div>
              <h3 className="flex items-center gap-2 text-[14px] font-semibold"><Scale className="size-4" /> Sin discrepancias</h3>
              <p className="mt-1 text-[14px] text-muted-foreground">Todos los especialistas coinciden con la decisión.</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Observaciones de cada especialista</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {decision.opinions.map((o) => (
                <div key={o.agent} className="border-t border-rule pt-2">
                  <p className="text-[13px] font-semibold">{agentById(o.agent).name}</p>
                  <ul className="mt-1 space-y-1 text-[13px] leading-snug text-muted-foreground">
                    {o.observations.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
