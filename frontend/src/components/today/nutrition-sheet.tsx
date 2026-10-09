"use client";

import { ChevronDown, Wheat } from "lucide-react";
import Link from "next/link";
import type { DayItem } from "@/lib/day";
import { dayNutrition, type Range } from "@/lib/nutrition";
import { useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";

const fmt = (r: Range | null, unit = "g") => (r ? `${r.low}-${r.high} ${unit}` : "—");

/** Carbohidratos del día, opcional: se abre a pedido y queda recordado. */
export function NutritionSheet({ items }: { items: DayItem[] }) {
  const open = useSetup((s) => s.showNutrition);
  const kg = useSetup((s) => s.weightKg);
  const update = useSetup((s) => s.update);
  const daysToRace = useCoach((s) => s.snapshot.days_to_race);
  const n = dayNutrition(items, kg, daysToRace);

  return (
    <section className="border-t-2 border-rule-strong pt-4" aria-labelledby="nutrition-title">
      <h2 id="nutrition-title">
        <button type="button" onClick={() => update({ showNutrition: !open })} aria-expanded={open} aria-controls="nutrition-body"
          className="group flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 text-left">
          <span className="flex items-center gap-2 text-[17px] font-semibold">
            <Wheat className="size-4 text-muted-foreground" strokeWidth={1.75} /> Nutrición · carbohidratos del día
          </span>
          <span className="flex items-center gap-2 text-[14px] font-normal text-muted-foreground group-hover:text-foreground">
            {open ? "Ocultar" : <><span className="num font-semibold text-foreground">{fmt(n.total)}</span> · {n.label.toLowerCase()}</>}
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </span>
        </button>
      </h2>

      {open && (
        <div id="nutrition-body" className="mt-4 space-y-5">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p>
              <span className="num text-[36px] font-bold leading-none tracking-[-0.02em] [font-stretch:66%]">{fmt(n.total)}</span>
              <span className="ml-2 text-[14px] text-muted-foreground">de carbohidratos en el día</span>
            </p>
            <p className="text-[14px]">
              <span className="font-semibold">{n.label}</span>
              <span className="num text-muted-foreground"> · {n.gPerKg.low}-{n.gPerKg.high} g/kg · {kg} kg</span>
            </p>
          </div>
          <p className="max-w-[70ch] text-[14px] text-muted-foreground">{n.reason}</p>

          {n.sessions.length > 0 && (
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full max-w-3xl text-[14px]">
                <caption className="sr-only">Carbohidratos alrededor de cada sesión</caption>
                <thead>
                  <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
                    <th className="pr-3 pb-1.5 font-semibold">Sesión</th>
                    <th className="pr-3 pb-1.5 text-right font-semibold">Antes</th>
                    <th className="pr-3 pb-1.5 text-right font-semibold">Durante</th>
                    <th className="pb-1.5 text-right font-semibold">Después</th>
                  </tr>
                </thead>
                <tbody>
                  {n.sessions.map((s) => (
                    <tr key={s.time} className="border-t border-rule align-top">
                      <td className="py-2 pr-3">
                        <span className="num mr-2 text-muted-foreground">{s.time}</span>
                        <span className="font-medium">{s.title}</span>
                        <span className="block text-[13px] text-muted-foreground">{s.note}</span>
                      </td>
                      <td className="num py-2 pr-3 text-right whitespace-nowrap">{fmt(s.before)}</td>
                      <td className="num py-2 pr-3 text-right whitespace-nowrap">{fmt(s.during, "g/h")}</td>
                      <td className="num py-2 text-right whitespace-nowrap">{fmt(s.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[12px] text-muted-foreground">
            Antes: 1 a 3 h previas. Después: en la primera hora. Calculado con tu peso; cambialo en{" "}
            <Link href="/configuracion" className="underline">Configuración</Link>. Pautas generales; no reemplazan a un nutricionista.
          </p>
        </div>
      )}
    </section>
  );
}
