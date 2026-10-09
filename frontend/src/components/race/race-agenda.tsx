"use client";

import { CalendarCheck, CalendarPlus, WandSparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StrategyDrawer, useRaceStrategy } from "@/components/race/strategy-sheet";
import { Empty, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { targetRace } from "@/lib/plan";
import { PROFILE_META, RACE_CATALOG, type RaceEvent, raceById, useSetup } from "@/lib/setup";
import { cn } from "@/lib/utils";

function raceDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

function RaceRow({ race, inAgenda, onToggle }: { race: RaceEvent; inAgenda: boolean; onToggle: () => void }) {
  return (
    <li className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t border-rule py-3 first:border-t-0">
      <div className="leading-tight">
        <p className="num text-[18px] font-semibold" suppressHydrationWarning>{raceDate(race.dayOffset)}</p>
        <p className="num text-[12px] text-muted-foreground">D-{race.dayOffset}</p>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">{race.name}</p>
        <p className="text-[13px] text-muted-foreground">
          {PROFILE_META[race.sport].label} · {race.distance} · {race.location}
        </p>
      </div>
      <Button variant={inAgenda ? "outline" : "default"} size="sm" onClick={onToggle} className="gap-1.5"
        aria-pressed={inAgenda}>
        {inAgenda ? <CalendarCheck className="size-3.5" /> : <CalendarPlus className="size-3.5" />}
        {inAgenda ? "En mi agenda" : "Agregar a mi agenda"}
      </Button>
    </li>
  );
}

export function RaceAgenda() {
  const { profile, agenda, toggleRace } = useSetup();
  const mine = agenda.map(raceById).filter((r): r is RaceEvent => !!r).sort((a, b) => a.dayOffset - b.dayOffset);
  const target = targetRace(mine, profile);
  const compatible = (r: RaceEvent) =>
    r.sport === profile || (profile === "triathlon" && r.sport !== "cycling") || (profile === "duathlon" && (r.sport === "running" || r.sport === "cycling"));
  const { results, loadingId, generate } = useRaceStrategy();
  const [openId, setOpenId] = useState<string | null>(null);
  const openRace = mine.find((r) => r.id === openId) ?? null;
  const showStrategy = (r: RaceEvent) => {
    setOpenId(r.id);
    if (!results[r.id] && loadingId !== r.id) generate(r);
  };
  const available = RACE_CATALOG.filter((r) => compatible(r) && !agenda.includes(r.id)).sort((a, b) => a.dayOffset - b.dayOffset);

  const toggle = (r: RaceEvent) => {
    const adding = !agenda.includes(r.id);
    toggleRace(r.id);
    toast(adding ? "Carrera agregada a tu agenda" : "Carrera quitada de tu agenda", {
      description: adding ? `${r.name}: el plan de Training se vuelve a armar.` : r.name,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
      <Panel id="agenda" title={`Mi agenda · ${mine.length} ${mine.length === 1 ? "carrera" : "carreras"}`}>
        {mine.length === 0 ? (
          <Empty>Tu agenda está vacía. Agregá una carrera de la lista y el staff arma el plan hacia ella.</Empty>
        ) : (
          <ol>
            {mine.map((r) => (
              <li key={r.id} className={cn("grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t border-rule py-3 first:border-t-0")}>
                <div className="leading-tight">
                  <p className="num text-[18px] font-semibold" suppressHydrationWarning>{raceDate(r.dayOffset)}</p>
                  <p className="num text-[12px] text-muted-foreground">D-{r.dayOffset}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{r.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {r.id === target?.id
                      ? "Carrera objetivo del plan"
                      : target && r.dayOffset < target.dayOffset
                        ? "Preparación"
                        : "Después del objetivo"}{" "}
                    · {PROFILE_META[r.sport].label} · {r.distance}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => showStrategy(r)} className="gap-1.5" aria-label={`Estrategia con IA para ${r.name}`}>
                    <WandSparkles className="size-3.5 text-reagent" /> <span className="hidden sm:inline">Estrategia IA</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggle(r)} aria-label={`Quitar ${r.name} de la agenda`}>
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel id="catalog" title={`Carreras disponibles para ${PROFILE_META[profile].label.toLowerCase()}`}>
        {available.length === 0 ? (
          <Empty>Ya agregaste todas las carreras disponibles para tu perfil.</Empty>
        ) : (
          <ul>
            {available.map((r) => (
              <RaceRow key={r.id} race={r} inAgenda={false} onToggle={() => toggle(r)} />
            ))}
          </ul>
        )}
        <p className="mt-3 text-[12px] text-muted-foreground">Calendario de demo: fechas relativas a hoy.</p>
      </Panel>

      <StrategyDrawer
        race={openRace}
        strategy={openRace ? results[openRace.id] : undefined}
        loading={!!openRace && loadingId === openRace.id}
        onRegenerate={() => openRace && generate(openRace)}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}
