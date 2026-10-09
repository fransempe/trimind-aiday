"use client";

import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useState } from "react";
import { SPORT_META } from "@/components/shared";
import { ExerciseList } from "@/components/today/day-view";
import { SPORT_ICON } from "@/components/today/session-meta";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/engine";
import { PHASE_META } from "@/lib/plan";
import type { ScheduleDay } from "@/lib/schedule";
import { dateFor } from "@/lib/use-schedule";
import { cn } from "@/lib/utils";

const fmt = (offset: number, opts: Intl.DateTimeFormatOptions) => dateFor(offset).toLocaleDateString("es-AR", opts);
const sportColor = (sport: keyof typeof SPORT_ICON) => (sport === "strength" ? "var(--muted-foreground)" : SPORT_META[sport].color);

function DayItems({ day, compact, detailed }: { day: ScheduleDay; compact?: boolean; detailed?: boolean }) {
  if (day.race)
    return (
      <p className="flex items-center gap-1.5 text-[14px] font-semibold">
        <Flag className="size-3.5 text-reagent" /> {day.race.name}
      </p>
    );
  if (day.beyondPlan) return <p className="text-[13px] text-muted-foreground">Sin plan: agregá tu próxima carrera</p>;
  const items = day.items.filter((i) => i.session);
  if (!items.length) return <p className="text-[13px] text-muted-foreground">Descanso</p>;
  return (
    <ul className="space-y-2">
      {items.map((i) => {
        const s = i.session!;
        const Icon = SPORT_ICON[s.sport];
        return (
          <li key={i.slot.id} className="leading-tight">
            <span className="num text-[12px] text-muted-foreground">{i.slot.time}</span>
            <span className={cn("flex items-start gap-1.5", compact ? "text-[12px]" : "text-[14px]")}>
              <Icon className="mt-0.5 size-3.5 shrink-0" style={{ color: sportColor(s.sport) }} strokeWidth={1.75} />
              <span className={cn(s.kind === "key" && "font-semibold", compact && "line-clamp-2")}>{s.title}</span>
            </span>
            {!compact && s.minutes > 0 && (
              <span className="num ml-5 text-[12px] text-muted-foreground">
                {formatDuration(s.minutes)}
                {s.exercises ? ` · ${s.exercises.length} ejercicios` : ""}
              </span>
            )}
            {detailed && s.exercises && <ExerciseList exercises={s.exercises} compact />}
          </li>
        );
      })}
    </ul>
  );
}

/** Semana: siete columnas con filetes, hoy marcado; se puede avanzar semana a semana. */
export function WeekView({ schedule }: { schedule: ScheduleDay[] }) {
  const [week, setWeek] = useState(0);
  const maxWeek = Math.floor((schedule.length - 1) / 7);
  const days = schedule.slice(week * 7, week * 7 + 7);
  const total = days.reduce((a, d) => a + d.totalMinutes, 0);
  const phase = days[0]?.week;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold [font-stretch:72%]">
            {week === 0 ? "Esta semana" : `Semana del ${fmt(days[0].offset, { day: "numeric", month: "short" })}`}
          </h2>
          <p className="num text-[13px] text-muted-foreground">
            {formatDuration(total)} planificadas{phase ? ` · ${PHASE_META[phase.phase].label}${phase.recovery ? " (descarga)" : ""}` : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" onClick={() => setWeek((w) => w - 1)} disabled={week === 0} aria-label="Semana anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeek((w) => w + 1)} disabled={week >= maxWeek} aria-label="Semana siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <ol className="grid grid-cols-1 border-t border-rule-strong md:grid-cols-7">
        {days.map((d) => (
          <li key={d.offset} className={cn("border-b border-rule p-3 md:min-h-56 md:border-b-0 md:border-l md:first:border-l-0", d.offset === 0 && "bg-foreground/[0.04]")}>
            <p className="mb-3 flex items-baseline justify-between gap-2">
              <span className={cn("text-[14px] capitalize", d.offset === 0 ? "font-bold" : "font-semibold")} suppressHydrationWarning>
                {d.offset === 0 ? "Hoy" : fmt(d.offset, { weekday: "short" })}
              </span>
              <span className="num text-[13px] text-muted-foreground" suppressHydrationWarning>{fmt(d.offset, { day: "numeric", month: "numeric" })}</span>
            </p>
            <DayItems day={d} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Mes: calendario de 5 semanas desde el lunes de esta semana; tocar un día muestra su detalle. */
export function MonthView({ schedule }: { schedule: ScheduleDay[] }) {
  const weekday = (dateFor(0).getDay() + 6) % 7; // 0 = lunes
  const cells = Array.from({ length: 35 }, (_, i) => i - weekday);
  const [selected, setSelected] = useState(0);
  const byOffset = new Map(schedule.map((d) => [d.offset, d]));
  const sel = byOffset.get(selected);
  const firstBeyond = schedule.find((d) => d.beyondPlan)?.offset;

  return (
    <div className="space-y-5">
      <h2 className="text-[20px] font-bold [font-stretch:72%] first-letter:uppercase" suppressHydrationWarning>
        {fmt(0, { month: "long", year: "numeric" })} y próximas semanas
      </h2>
      <div className="grid grid-cols-7 border-t border-l border-rule">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="border-r border-b border-rule px-2 py-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">{d}</div>
        ))}
        {cells.map((off) => {
          const day = byOffset.get(off);
          const past = off < 0;
          const sessions = day?.items.filter((i) => i.session) ?? [];
          return (
            <button
              key={off}
              type="button"
              disabled={past || !day}
              onClick={() => setSelected(off)}
              aria-pressed={selected === off}
              className={cn(
                "flex min-h-20 flex-col items-start gap-1 border-r border-b border-rule p-1.5 text-left transition-colors sm:min-h-24 sm:p-2",
                past ? "text-faint" : "hover:bg-foreground/[0.04]",
                selected === off && "bg-foreground/[0.07] outline outline-2 -outline-offset-2 outline-foreground/60",
              )}
            >
              <span className={cn("num text-[13px]", off === 0 && "font-bold")} suppressHydrationWarning>
                {off === 0 ? "Hoy" : dateFor(off).getDate()}
              </span>
              {day?.race ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold"><Flag className="size-3 text-reagent" /> <span className="line-clamp-2">{day.race.name}</span></span>
              ) : (
                <span className="flex flex-wrap gap-1" aria-label={sessions.map((s) => s.session!.title).join(", ")}>
                  {sessions.map((s) => {
                    const Icon = SPORT_ICON[s.session!.sport];
                    return <Icon key={s.slot.id} className="size-3.5" style={{ color: sportColor(s.session!.sport) }} strokeWidth={1.75} />;
                  })}
                </span>
              )}
              {day && day.totalMinutes > 0 && <span className="num mt-auto hidden text-[11px] text-muted-foreground sm:block">{formatDuration(day.totalMinutes)}</span>}
            </button>
          );
        })}
      </div>
      {firstBeyond !== undefined && (
        <p className="text-[13px] text-muted-foreground" suppressHydrationWarning>
          Desde el {fmt(firstBeyond, { day: "numeric", month: "long" })} no hay plan: agregá tu próxima carrera en Race para extenderlo.
        </p>
      )}
      {sel && (
        <div className="border-t border-rule-strong pt-4">
          <h3 className="mb-3 text-[16px] font-semibold first-letter:uppercase" suppressHydrationWarning>
            {selected === 0 ? "Hoy" : fmt(selected, { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          <DayItems day={sel} detailed />
        </div>
      )}
    </div>
  );
}
