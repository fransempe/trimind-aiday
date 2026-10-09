"use client";

import { ArrowRight, ChevronDown, Moon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BAND_META, DecisionBadge, Empty, SPORT_META } from "@/components/shared";
import { Approval } from "@/components/today/conclusion-sheet";
import { SPORT_ICON } from "@/components/today/session-meta";
import { NutritionSheet } from "@/components/today/nutrition-sheet";
import { SessionStatus, useAutoSync } from "@/components/today/session-status";
import { WorkoutSteps } from "@/components/workout-profile";
import type { DayItem } from "@/lib/day";
import type { Exercise } from "@/lib/gym";
import { formatDuration } from "@/lib/engine";
import { sessionKey, useSessionLog } from "@/lib/session-log";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

export function ExerciseList({ exercises, compact }: { exercises: Exercise[]; compact?: boolean }) {
  return (
    <table className={cn("mt-3 w-full max-w-2xl", compact ? "text-[13px]" : "text-[14px]")}>
      <caption className="sr-only">Ejercicios</caption>
      <thead>
        <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
          <th className="pr-3 pb-1.5 font-semibold">Ejercicio</th>
          <th className="pr-3 pb-1.5 font-semibold">Series × reps</th>
          <th className="pb-1.5 text-right font-semibold">Descanso</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((e) => (
          <tr key={e.name} className="border-t border-rule align-top">
            <td className="py-2 pr-3">
              <span className="font-medium">{e.name}</span>
              {e.cue && !compact && <span className="block text-[13px] text-muted-foreground">{e.cue}</span>}
            </td>
            <td className="num py-2 pr-3 whitespace-nowrap">{e.dose}</td>
            <td className="num py-2 text-right whitespace-nowrap text-muted-foreground">{e.rest ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SessionRow({ item, workout, big }: { item: DayItem; workout: Workout; big: boolean }) {
  const s = item.session;
  const Icon = s ? SPORT_ICON[s.sport] : Moon;
  const logged = useSessionLog((st) => (s ? st.entries[sessionKey(item.slot, s)]?.status : undefined));
  // Sin elección del usuario: abierta mientras está pendiente, cerrada una vez registrada.
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? !(logged === "done" || logged === "skipped");
  const detailId = `detail-${item.slot.id}`;
  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-4 border-t border-rule py-5 first:border-t-0 sm:grid-cols-[8rem_1fr] sm:gap-8">
      <div className="leading-none">
        <p className={cn("num font-bold tracking-[-0.02em] [font-stretch:66%]", big ? "text-[44px]" : "text-[32px]")}>{item.slot.time}</p>
        <p className="num mt-1.5 text-[12px] text-muted-foreground">{formatDuration(item.slot.minutes)} disponibles</p>
      </div>
      {s ? (
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px]" style={{ color: s.sport === "strength" ? "var(--muted-foreground)" : SPORT_META[s.sport].color }}>
            <Icon className="size-4" strokeWidth={1.75} />
            <span className="text-muted-foreground">{s.sport === "strength" ? "Gym" : SPORT_META[s.sport].label}</span>
            {s.minutes > 0 && <span className="num text-muted-foreground">· {formatDuration(s.minutes)}</span>}
          </p>
          <h3 className={cn("mt-1 font-semibold leading-tight tracking-[-0.01em]", big ? "text-[26px]" : "text-[20px]")}>
            <button type="button" onClick={() => setChoice(!open)} aria-expanded={open} aria-controls={detailId}
              className="group inline-flex items-start gap-2 text-left hover:text-foreground/85">
              {s.title}
              <ChevronDown className={cn("mt-[0.2em] size-5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground", open && "rotate-180")} />
              <span className="sr-only">{open ? "Ocultar detalle" : "Ver detalle"}</span>
            </button>
          </h3>
          {s.modified && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-reagent">
              <Sparkles className="size-3.5" /> Ajustada por el Head Coach
            </p>
          )}
          {open && (
            <div id={detailId}>
              {s.detail && !s.modified && <p className="mt-1.5 max-w-[60ch] text-[14px] text-muted-foreground">{s.detail}</p>}
              {s.exercises && <ExerciseList exercises={s.exercises} />}
              {s.kind === "key" && s.steps && (
                <div className="mt-3 max-w-xl">
                  <WorkoutSteps workout={{ ...workout, steps: s.steps }} />
                </div>
              )}
            </div>
          )}
          {s.kind !== "rest" && <SessionStatus slot={item.slot} session={s} expanded={open} />}
        </div>
      ) : (
        <p className="self-center text-[15px] text-muted-foreground">Libre</p>
      )}
    </li>
  );
}

/** Hoy: solo lo que hay que hacer, en cada franja disponible. */
export function DayView({ items }: { items: DayItem[] }) {
  const snapshot = useCoach((s) => s.snapshot);
  const decision = useCoach((s) => s.decision);
  const workout = useCoach((s) => s.activeWorkout);
  const runStatus = useCoach((s) => s.runStatus);
  const band = BAND_META[snapshot.readiness.band];
  useAutoSync(items);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-rule-strong py-3 text-[14px]">
        <span>
          Readiness <span className="num font-semibold">{snapshot.readiness.score}</span>{" "}
          <span className={band.text}>· {band.label}</span>
        </span>
        {decision && (
          <span className="flex min-w-0 items-center gap-2">
            <DecisionBadge value={decision.decision} />
            <span className="text-muted-foreground">{decision.primary_reason}</span>
          </span>
        )}
        <Link href="/analisis" className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          Ver análisis del staff <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {runStatus === "awaiting_approval" && decision?.new_workout && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px]">
          <span className="text-muted-foreground">El Head Coach propone cambiar</span>
          <span className="text-muted-foreground line-through decoration-critical/80 decoration-2">{decision.original_workout.title}</span>
          <ArrowRight className="size-4 text-reagent" aria-label="por" />
          <span className="font-semibold">{decision.new_workout.title}</span>
        </p>
      )}
      <Approval />

      {items.length === 0 ? (
        <Empty>
          No cargaste horarios disponibles. <Link href="/configuracion" className="underline">Configurá tus horarios</Link>.
        </Empty>
      ) : (
        <ol>
          {items.map((it) => (
            <SessionRow key={it.slot.id} item={it} workout={workout} big={it.session?.kind === "key"} />
          ))}
        </ol>
      )}
      {items.length > 0 && <NutritionSheet items={items} />}
    </div>
  );
}
