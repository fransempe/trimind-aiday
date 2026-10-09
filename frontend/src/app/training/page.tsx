"use client";

import { FormChart, LoadChart, WeeklyVolumeChart, dayLabel, weeklyVolume } from "@/components/charts";
import { TopBar } from "@/components/layout/top-bar";
import { PlanSheet } from "@/components/training/plan-sheet";
import { INTENSITY_META, Panel, SportDot, StatTile } from "@/components/shared";
import { formatDuration } from "@/lib/engine";
import { historyFor, raceStrategy } from "@/lib/mock/data";
import { useCoach } from "@/lib/store";

export default function TrainingPage() {
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);
  const snapshot = useCoach((s) => s.snapshot);
  const active = useCoach((s) => s.activeWorkout);
  const { daily, activities } = historyFor(hard);
  const weeks = weeklyVolume(daily);
  const totalHours = weeks.reduce((a, w) => a + w.swim + w.bike + w.run, 0);
  const recent = [...activities].reverse().slice(0, 14);

  return (
    <div className="space-y-10">
      <TopBar title="Training" subtitle="Plan hacia tus carreras, carga y volumen." />

      <PlanSheet />

      <div className="grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4">
        <StatTile label="CTL · fitness" value={snapshot.load.ctl.toFixed(0)} unit="TSS/d" detail="EWMA 42 días" />
        <StatTile label="ATL · fatiga" value={snapshot.load.atl.toFixed(0)} unit="TSS/d" detail="EWMA 7 días" />
        <StatTile label="TSB · forma" value={`${snapshot.load.tsb > 0 ? "+" : ""}${snapshot.load.tsb.toFixed(1)}`} detail="CTL − ATL" />
        <StatTile label="Volumen 6 semanas" value={totalHours.toFixed(0)} unit="h" detail={`${activities.length} sesiones`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Training load · últimos 30 días" className="xl:col-span-2">
          <LoadChart data={daily.slice(-30)} />
          <p className="sheet-label mb-2 mt-6">Balance de forma (TSB)</p>
          <FormChart data={daily.slice(-30)} />
        </Panel>
        <Panel title="Volumen semanal por deporte">
          <WeeklyVolumeChart data={weeks} height={330} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Actividades recientes" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="sheet-label text-left">
                  <th className="pb-2 font-normal">Fecha</th>
                  <th className="pb-2 font-normal">Sesión</th>
                  <th className="pb-2 font-normal">Intensidad</th>
                  <th className="pb-2 text-right font-normal">Duración</th>
                  <th className="pb-2 text-right font-normal">Distancia</th>
                  <th className="pb-2 text-right font-normal">TSS</th>
                </tr>
              </thead>
              <tbody className="num">
                {recent.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-2 text-muted-foreground" suppressHydrationWarning>
                      {a.day_offset === -1 ? "Ayer" : dayLabel(a.day_offset)}
                    </td>
                    <td className="py-2 font-sans">
                      <span className="flex items-center gap-2">
                        <SportDot sport={a.sport} /> {a.title}
                      </span>
                    </td>
                    <td className="py-2 font-sans text-muted-foreground">{INTENSITY_META[a.intensity].label}</td>
                    <td className="py-2 text-right">{formatDuration(a.duration_min)}</td>
                    <td className="py-2 text-right">{a.distance_km ? `${a.distance_km} km` : "—"}</td>
                    <td className="py-2 text-right">{Math.round(a.tss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Plan de la semana">
          <ul>
            {raceStrategy.taper.map((d, i) => (
              <li key={d.day} className={`grid grid-cols-[3.5rem_1fr] gap-3 border-t border-rule py-2.5 text-[15px] ${i === 0 ? "font-semibold" : ""}`}>
                <span className="num text-muted-foreground">{i === 0 ? "Hoy" : `D${d.day}`}</span>
                <span>{i === 0 ? active.title : d.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
