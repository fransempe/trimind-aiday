"use client";

import { Panel, SPORT_META, SportDot } from "@/components/shared";
import { formatDuration } from "@/lib/engine";
import { historyFor } from "@/lib/mock/data";
import { useCoach } from "@/lib/store";

export function WeeklySummary() {
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);
  const { activities, daily } = historyFor(hard);
  const week = activities.filter((a) => a.day_offset >= -7);
  const tss = daily.filter((d) => d.day_offset >= -7).reduce((a, d) => a + d.tss, 0);
  const prevTss = daily.filter((d) => d.day_offset < -7 && d.day_offset >= -14).reduce((a, d) => a + d.tss, 0);
  const delta = Math.round(((tss - prevTss) / prevTss) * 100);

  const rows = (["swim", "bike", "run"] as const).map((sport) => {
    const items = week.filter((a) => a.sport === sport);
    return {
      sport,
      minutes: items.reduce((a, b) => a + b.duration_min, 0),
      km: items.reduce((a, b) => a + (b.distance_km ?? 0), 0),
      sessions: items.length,
    };
  });
  const max = Math.max(...rows.map((r) => r.minutes));

  return (
    <Panel id="week" title="Últimos 7 días">
      <table className="w-full text-[14px]">
        <thead>
          <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
            <th className="pb-2 font-semibold">Deporte</th>
            <th className="pb-2 text-right font-semibold">Ses.</th>
            <th className="pb-2 text-right font-semibold">Km</th>
            <th className="pb-2 text-right font-semibold">Tiempo</th>
          </tr>
        </thead>
        <tbody className="num">
          {rows.map((r) => (
            <tr key={r.sport} className="border-t border-rule">
              <td className="py-2 font-sans">
                <span className="flex items-center gap-2">
                  <SportDot sport={r.sport} /> {SPORT_META[r.sport].label}
                </span>
                <span className="mt-1.5 block h-1 rounded-[1px]" style={{ width: `${(r.minutes / max) * 100}%`, background: SPORT_META[r.sport].color }} />
              </td>
              <td className="py-2 text-right align-top">{r.sessions}</td>
              <td className="py-2 text-right align-top">{r.km.toFixed(1)}</td>
              <td className="py-2 text-right align-top">{formatDuration(r.minutes)}</td>
            </tr>
          ))}
          <tr className="border-t border-rule-strong">
            <td className="py-2 font-sans font-semibold">Carga total</td>
            <td colSpan={3} className="py-2 text-right">
              <span className="font-semibold">{Math.round(tss)} TSS</span>
              <span className="ml-2 text-muted-foreground">
                {delta > 0 ? "+" : ""}
                {delta}% vs. semana anterior
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}
