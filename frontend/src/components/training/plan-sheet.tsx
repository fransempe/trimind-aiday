"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { Empty, Panel, SPORT_META } from "@/components/shared";
import { importedData } from "@/lib/mock/imports";
import { buildPlan, PHASE_META, type PlanWeek } from "@/lib/plan";
import { connectedProviders, PROFILE_META, raceById, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";

const STRENGTH = { label: "Fuerza", color: "var(--chart-5)" };

function Split({ week, max }: { week: PlanWeek; max: number }) {
  return (
    <div className="flex h-2.5 w-full gap-[2px]" aria-hidden>
      {week.split.map((s) => (
        <span key={s.sport} className="h-full rounded-[1px]"
          style={{ width: `${(s.hours / max) * 100}%`, background: s.sport === "strength" ? STRENGTH.color : SPORT_META[s.sport].color }} />
      ))}
    </div>
  );
}

/** Plan armado a partir de la agenda, el estado declarado y los datos importados. */
export function PlanSheet() {
  const setup = useSetup();
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);
  const races = setup.agenda.map(raceById).filter((r) => !!r);
  const data = importedData(connectedProviders(setup.devices), hard);
  const plan = buildPlan({ profile: setup.profile, fitness: setup.fitness, races, importedCtl: data.ctl, sleepAvg: data.sleepAvg });

  if (!plan)
    return (
      <Panel id="plan" title="Plan de entrenamiento">
        <Empty>
          No hay plan porque tu agenda no tiene carreras.{" "}
          <Link href="/race" className="underline">Agregá una en Race</Link> y el staff lo arma solo.
        </Empty>
      </Panel>
    );

  const max = Math.max(...plan.weeks.map((w) => w.hours));
  const sports = [...new Set(plan.weeks.flatMap((w) => w.split.map((s) => s.sport)))];

  return (
    <Panel id="plan" title={`Plan de entrenamiento · ${PROFILE_META[setup.profile].label} · ${plan.weeks.length} ${plan.weeks.length === 1 ? "semana" : "semanas"} hacia ${plan.target.name}`}>
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
                <th className="pr-3 pb-2 font-semibold">Sem.</th>
                <th className="pr-3 pb-2 font-semibold">Fase</th>
                <th className="pr-3 pb-2 font-semibold">Sesión clave</th>
                <th className="w-40 pr-3 pb-2 font-semibold">Reparto</th>
                <th className="pb-2 text-right font-semibold">Horas</th>
              </tr>
            </thead>
            <tbody>
              {plan.weeks.map((w) => (
                <tr key={w.index} className={cn("border-t border-rule", w.index === 1 && "font-semibold")}>
                  <td className="num py-2 pr-3">{w.index === 1 ? "Esta" : w.index}</td>
                  <td className="py-2 pr-3">{PHASE_META[w.phase].label}{w.recovery ? " · descarga" : ""}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {w.race ? (
                      <span className="inline-flex items-center gap-1.5 text-foreground"><Flag className="size-3.5" /> {w.race.name}</span>
                    ) : (
                      w.key
                    )}
                  </td>
                  <td className="py-2 pr-3"><Split week={w} max={max} /></td>
                  <td className="num py-2 text-right">{w.hours.toFixed(1)} h</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px] text-muted-foreground">
            {sports.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: s === "strength" ? STRENGTH.color : SPORT_META[s].color }} />
                {s === "strength" ? STRENGTH.label : SPORT_META[s].label}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[14px] font-semibold">Con qué se armó</h3>
          <ul className="mt-2 text-[13px] leading-snug text-muted-foreground">
            {plan.basis.map((b) => (
              <li key={b} className="border-t border-rule py-2">{b}</li>
            ))}
          </ul>
          <p className="mt-3 text-[13px]">
            <Link href="/datos" className="underline">Ver datos importados</Link>
          </p>
        </div>
      </div>
    </Panel>
  );
}
