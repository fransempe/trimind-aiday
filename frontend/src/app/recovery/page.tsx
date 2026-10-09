"use client";

import { dayLabel, HrvChart, SimpleLineChart, SleepChart } from "@/components/charts";
import { AgentChat } from "@/components/agent-chat";
import { TopBar } from "@/components/layout/top-bar";
import { BAND_META, Panel, StatTile } from "@/components/shared";
import { ReadinessSheet } from "@/components/today/readiness-sheet";
import { ScenarioControl } from "@/components/today/scenario-control";
import { formatSleep } from "@/lib/engine";
import { historyFor } from "@/lib/mock/data";
import { useCoach } from "@/lib/store";

export default function RecoveryPage() {
  const s = useCoach((st) => st.snapshot);
  const hard = useCoach((st) => st.inputs.hard_run_yesterday);
  const daily = historyFor(hard).daily.slice(-30);

  const hrv = [
    ...daily.map((d) => ({ day_offset: d.day_offset, hrv: d.hrv_ms, baseline: d.hrv_baseline_ms })),
    { day_offset: 0, hrv: s.hrv.today_ms, baseline: s.hrv.baseline_30d_ms },
  ];
  const sleep = [
    ...daily.slice(-14).map((d) => ({ day_offset: d.day_offset, sleep: d.sleep_hours })),
    { day_offset: 0, sleep: s.wellness_today.sleep_hours },
  ];
  const rhr = daily.map((d) => ({ dia: dayLabel(d.day_offset), rhr: d.resting_hr_bpm }));
  const avgSleep = sleep.reduce((a, d) => a + d.sleep, 0) / sleep.length;

  return (
    <div className="space-y-5">
      <TopBar title="Recovery" subtitle="Sueño, HRV y fatiga: lo que mira el Recovery Agent." />

      <div className="grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4">
        <StatTile label="Readiness" value={s.readiness.score} unit="/100" detail={BAND_META[s.readiness.band].label} />
        <StatTile label="HRV hoy" value={s.hrv.today_ms.toFixed(0)} unit="ms"
          detail={`${s.hrv.deviation_pct > 0 ? "+" : ""}${s.hrv.deviation_pct.toFixed(0)}% vs. ${s.hrv.baseline_30d_ms} ms`} />
        <StatTile label="Sueño anoche" value={formatSleep(s.wellness_today.sleep_hours)} detail={`Promedio 14 d: ${formatSleep(avgSleep)}`} />
        <StatTile label="FC en reposo" value={s.wellness_today.resting_hr_bpm} unit="lpm" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <Panel title="HRV · 30 días">
            <HrvChart data={hrv} />
          </Panel>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Sueño · 14 días (objetivo 8 h)">
              <SleepChart data={sleep} />
            </Panel>
            <Panel title="FC en reposo · 30 días">
              <SimpleLineChart data={rhr} x="dia" y="rhr" name="FC reposo" unit="lpm" height={200} />
            </Panel>
          </div>
        </div>
        <div className="space-y-5 self-start xl:col-span-4">
          <ReadinessSheet />
          <ScenarioControl compact />
        </div>
      </div>

      <AgentChat agent="recovery" suggestions={["Dormí mal, ¿entreno igual?", "¿Qué indica mi HRV de hoy?", "¿Cómo recupero mejor esta semana?"]} />
    </div>
  );
}
