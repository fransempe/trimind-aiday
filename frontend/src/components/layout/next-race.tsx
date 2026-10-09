"use client";

import { Flag } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { raceById, type RaceEvent, useSetup } from "@/lib/setup";

function raceDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}

export function useNextRace(): RaceEvent | null {
  const agenda = useSetup((s) => s.agenda);
  return (
    agenda
      .map(raceById)
      .filter((r): r is RaceEvent => !!r && r.dayOffset > 0)
      .sort((a, b) => a.dayOffset - b.dayOffset)[0] ?? null
  );
}

const SEEN = "trimind-next-race-toast";

/** Aviso al abrir la app (una vez por sesión del navegador) con la próxima carrera de la agenda. */
export function NextRaceToast() {
  const race = useNextRace();
  const completed = useSetup((s) => s.completed);

  useEffect(() => {
    if (!race || !completed) return;
    try {
      if (sessionStorage.getItem(SEEN) === race.id) return;
      sessionStorage.setItem(SEEN, race.id);
    } catch {
      // sin sessionStorage el aviso igual se muestra
    }
    const t = setTimeout(
      () =>
        toast(`Próxima carrera: ${race.name}`, {
          description: `En ${race.dayOffset} ${race.dayOffset === 1 ? "día" : "días"}, el ${raceDate(race.dayOffset)}.`,
          icon: <Flag className="size-4" />,
          duration: 6000,
        }),
      900,
    );
    return () => clearTimeout(t);
  }, [race, completed]);

  return null;
}

/** Tarjeta fija en el sidebar: la próxima carrera siempre a la vista. */
export function NextRaceCard() {
  const race = useNextRace();
  if (!race) return null;
  return (
    <Link href="/race" className="block border-t border-sidebar-border pt-3 hover:text-foreground">
      <span className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
        <Flag className="size-3.5" strokeWidth={1.75} /> Próxima carrera
      </span>
      <span className="mt-1 block text-[14px] font-semibold leading-tight">{race.name}</span>
      <span className="mt-0.5 flex items-baseline gap-2">
        <span className="num text-[22px] font-bold leading-none tracking-[-0.02em] [font-stretch:66%]">D-{race.dayOffset}</span>
        <span className="text-[12px] text-muted-foreground" suppressHydrationWarning>{raceDate(race.dayOffset)}</span>
      </span>
    </Link>
  );
}
