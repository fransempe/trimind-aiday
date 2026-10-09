"use client";

import { Check, CircleDashed, X } from "lucide-react";
import { Panel, SPORT_META } from "@/components/shared";
import { formatDuration } from "@/lib/engine";
import { historyFor } from "@/lib/mock/data";
import { sessionKey, useSessionLog } from "@/lib/session-log";
import { type EnduranceProfile, PROVIDER_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import type { Activity, AthleteProfile, Sport } from "@/lib/types";
import { useSchedule } from "@/lib/use-schedule";
import { cn } from "@/lib/utils";

const DISCIPLINES: Record<EnduranceProfile, Sport[]> = {
  running: ["run"],
  cycling: ["bike"],
  duathlon: ["run", "bike"],
  triathlon: ["swim", "bike", "run"],
};

const pace = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function threshold(sport: Sport, p: AthleteProfile) {
  if (sport === "bike") return `FTP ${p.ftp_w} W`;
  if (sport === "run") return `Umbral ${pace(p.run_threshold_pace_s_per_km)} /km`;
  return `CSS ${pace(p.swim_css_s_per_100m)} /100 m`;
}

function stats(acts: Activity[], sport: Sport) {
  const of = (from: number, to: number) => acts.filter((a) => a.sport === sport && a.day_offset >= from && a.day_offset < to);
  const week = of(-7, 1);
  const prev = of(-14, -7);
  const minutes = week.reduce((a, x) => a + x.duration_min, 0);
  const prevMinutes = prev.reduce((a, x) => a + x.duration_min, 0);
  return {
    sessions: week.length,
    minutes,
    km: week.reduce((a, x) => a + (x.distance_km ?? 0), 0),
    tss: Math.round(week.reduce((a, x) => a + x.tss, 0)),
    delta: prevMinutes ? Math.round(((minutes - prevMinutes) / prevMinutes) * 100) : 0,
    longest: Math.max(0, ...of(-42, 1).map((a) => a.duration_min)),
    yesterdayHard: acts.some((a) => a.sport === sport && a.day_offset === -1 && ["threshold", "vo2max", "anaerobic"].includes(a.intensity)),
  };
}

/** Lectura de una línea, calculada en código a partir de los números de la disciplina. */
function reading(s: ReturnType<typeof stats>, taper: boolean) {
  if (s.yesterdayHard) return "Sesión intensa ayer: el Recovery Agent la pesa en la readiness de hoy.";
  if (s.delta > 15) return `Volumen en subida (+${s.delta}%): cuidá la recuperación entre sesiones.`;
  if (s.delta < -15) return taper ? `Volumen en baja (${s.delta}%), como corresponde al taper.` : `Menos volumen que la semana pasada (${s.delta}%).`;
  return `Volumen estable (${s.delta > 0 ? "+" : ""}${s.delta}%): buena consistencia.`;
}

function TodayLine({ sport }: { sport: Sport }) {
  const { today } = useSchedule(1);
  const item = today.find((i) => i.session?.sport === sport);
  const key = item?.session ? sessionKey(item.slot, item.session) : null;
  const entry = useSessionLog((s) => (key ? s.entries[key] : undefined));

  if (!item?.session) return <p className="text-[14px] text-muted-foreground">Hoy: sin sesión.</p>;
  const st = !entry ? null : entry.status === "skipped" ? "skipped" : "done";
  return (
    <p className="text-[14px]">
      <span className="text-muted-foreground">Hoy {item.slot.time} · </span>
      <span className="font-semibold">{item.session.title}</span>{" "}
      <span className={cn("inline-flex items-center gap-1 text-[13px]", st === "done" ? "text-good" : "text-muted-foreground")}>
        {st === "done" ? <Check className="size-3.5" /> : st === "skipped" ? <X className="size-3.5" /> : <CircleDashed className="size-3.5" />}
        {st === "done"
          ? entry!.source === "manual" ? "Hecha" : `Hecha · ${PROVIDER_META[entry!.source].label.replace(" Connect", "")}`
          : st === "skipped" ? "No realizada" : "Pendiente"}
      </span>
    </p>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="num text-[18px] font-semibold">{value}</p>
    </div>
  );
}

export function DisciplineSheet() {
  const profile = useSetup((s) => s.profile);
  const athlete = useCoach((s) => s.snapshot.profile);
  const phase = useCoach((s) => s.snapshot.race_phase);
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);
  const acts = historyFor(hard).activities;
  const sports = DISCIPLINES[profile];

  return (
    <Panel id="disciplines" title="Cómo venís por disciplina · últimos 7 días">
      <div className={cn("grid grid-cols-1 gap-x-8 gap-y-8", sports.length === 3 ? "lg:grid-cols-3" : sports.length === 2 ? "lg:grid-cols-2" : "")}>
        {sports.map((sport) => {
          const s = stats(acts, sport);
          return (
            <section key={sport} className="border-t-2 pt-3" style={{ borderColor: SPORT_META[sport].color }} aria-label={SPORT_META[sport].label}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{SPORT_META[sport].label}</h3>
                <span className="num text-[13px] text-muted-foreground">{threshold(sport, athlete)}</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <Readout label="Sesiones" value={String(s.sessions)} />
                <Readout label="Tiempo" value={formatDuration(s.minutes)} />
                <Readout label="Km" value={sport === "swim" ? s.km.toFixed(1) : s.km.toFixed(0)} />
                <Readout label="TSS" value={String(s.tss)} />
              </div>
              <p className="mt-3 text-[14px]">{reading(s, phase !== "build")}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Fondo más largo en 6 semanas: {formatDuration(s.longest)}</p>
              <div className="mt-3 border-t border-rule pt-2.5">
                <TodayLine sport={sport} />
              </div>
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
