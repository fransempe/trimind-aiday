"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Panel } from "@/components/shared";
import { raceStrategy } from "@/lib/mock/data";
import { useCoach } from "@/lib/store";

const PHASE_LABEL = { build: "Bloque de construcción", taper: "Taper", race_week: "Semana de carrera" };

export function RaceCountdownCard() {
  const s = useCoach((st) => st.snapshot);
  const onRace = usePathname() === "/race";
  const weeks = 6;
  const elapsed = Math.max(0, Math.min(42, 42 - s.days_to_race));

  return (
    <Panel
      id="race"
      title="Race countdown"
      action={
        !onRace && <Link href="/race" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          Estrategia <ArrowUpRight className="size-3.5" />
        </Link>
      }
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[16px] font-semibold">{s.race.name}</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {PHASE_LABEL[s.race_phase]} · carrera {s.race.priority} · objetivo {raceStrategy.estimatedFinish}
          </p>
        </div>
        <p className="num shrink-0 text-[48px] leading-[0.85] font-bold [font-stretch:66%]">
          D-{s.days_to_race}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-[2px]" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }} aria-label={`Semana ${Math.ceil(elapsed / 7)} de ${weeks} del bloque`}>
        {Array.from({ length: weeks }).map((_, w) => {
          const fill = Math.max(0, Math.min(7, elapsed - w * 7)) / 7;
          return (
            <span key={w} className="relative h-2 overflow-hidden rounded-[1px] bg-muted">
              <span className="absolute inset-y-0 left-0 bg-foreground/80" style={{ width: `${fill * 100}%` }} />
            </span>
          );
        })}
      </div>
      <div className="num mt-1.5 flex justify-between text-[12px] text-muted-foreground">
        <span>Semana 1</span>
        <span>Carrera</span>
      </div>
    </Panel>
  );
}
