"use client";

import { AgentChat } from "@/components/agent-chat";
import { TopBar } from "@/components/layout/top-bar";
import { CompletedRaces } from "@/components/race/completed-races";
import { RaceAgenda } from "@/components/race/race-agenda";
import { Panel, StatTile } from "@/components/shared";
import { RaceCountdownCard } from "@/components/today/race-countdown-card";
import { raceStrategy } from "@/lib/mock/data";
import { useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

export default function RacePage() {
  const s = useCoach((st) => st.snapshot);
  const active = useCoach((st) => st.activeWorkout);
  const hasDemoRace = useSetup((st) => st.agenda.includes("im703-bsas"));

  return (
    <div className="space-y-10">
      <TopBar title="Race" subtitle="Tu agenda de carreras, las disponibles para tu perfil la estrategia con IA de cada una y tus resultados." />

      <CompletedRaces />

      <RaceAgenda />

      {hasDemoRace && (
        <>
          <div className="grid grid-cols-1 gap-x-10 gap-y-8 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <RaceCountdownCard />
            </div>
            <div className="grid grid-cols-1 self-start border-y border-rule-strong sm:grid-cols-2 xl:col-span-7 [&>*+*]:sm:border-l [&>*+*]:sm:border-rule [&>*+*]:sm:pl-4">
              <StatTile label="CTL al día de carrera" value={(s.load.ctl - 4).toFixed(0)} detail="Proyección con el taper" />
              <StatTile label="TSB proyectado" value="+12" detail="Rango ideal +5 a +15" />
            </div>
          </div>

          <Panel id="taper" title={`Taper hacia ${s.race.name} · últimos 7 días`}>
            <ol className="relative max-w-2xl space-y-3 border-l border-rule pl-5">
              {raceStrategy.taper.map((d, i) => (
                <li key={d.day} className="relative">
                  <span className={`absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background ${i === 0 ? "bg-foreground" : "bg-muted-foreground/40"}`} />
                  <p className="num text-[13px] text-muted-foreground">{i === 0 ? "Hoy · D-7" : `D${d.day}`}</p>
                  <p className="mt-0.5 text-[15px]">{i === 0 ? active.title : d.label}</p>
                </li>
              ))}
              <li className="relative">
                <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-background bg-reagent" />
                <p className="text-[13px] font-semibold text-reagent">Día de carrera</p>
                <p className="mt-0.5 text-[15px] font-semibold">{s.race.name}</p>
              </li>
            </ol>
          </Panel>
        </>
      )}

      <AgentChat agent="race" suggestions={["¿Cómo encaro la bici en la carrera?", "¿Qué hago los días previos?", "¿Qué ritmo de run es realista?"]} />
    </div>
  );
}
