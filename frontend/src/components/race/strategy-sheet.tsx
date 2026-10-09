"use client";

import { Bike, Footprints, Loader2, WandSparkles, Waves } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SPORT_META, StatTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/engine";
import { historyFor } from "@/lib/mock/data";
import type { RaceEvent } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { baseSegments, formatTarget, type RaceStrategy, type SegmentPlan, type TrainingSummary } from "@/lib/strategy";
import { cn } from "@/lib/utils";

const ICONS = { swim: Waves, bike: Bike, run: Footprints };
const READINGS = "grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4";
const PACING_LABEL = { conservador: "Conservador", equilibrado: "Equilibrado", agresivo: "Agresivo" };

function useTraining(): TrainingSummary {
  const s = useCoach((st) => st.snapshot);
  const hard = useCoach((st) => st.inputs.hard_run_yesterday);
  const acts = historyFor(hard).activities;
  const longest = (sport: string) => Math.max(0, ...acts.filter((a) => a.sport === sport).map((a) => a.duration_min));
  return {
    ctl: s.load.ctl,
    tsb: s.load.tsb,
    readiness: s.readiness.score,
    ftp_w: s.profile.ftp_w,
    longest_bike_min: longest("bike"),
    longest_run_min: longest("run"),
    weekly_hours: Math.round((acts.reduce((a, x) => a + x.duration_min, 0) / 60 / 6) * 10) / 10,
  };
}

function Segments({ segments, ftp }: { segments: (SegmentPlan & { notes?: string })[]; ftp: number }) {
  return (
    <div className={cn("grid grid-cols-1 gap-x-6 gap-y-6", segments.length >= 3 ? "lg:grid-cols-3" : segments.length === 2 ? "lg:grid-cols-2" : "")}>
      {segments.map((seg) => {
        const Icon = ICONS[seg.sport];
        return (
          <div key={seg.label} className="border-t-2 pt-3" style={{ borderColor: SPORT_META[seg.sport].color }}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-muted-foreground" strokeWidth={1.75} /> {seg.label}</p>
              <span className="num text-[14px] text-muted-foreground">{formatDuration(seg.eta_min)}</span>
            </div>
            <p className="num mt-3 text-[20px] font-semibold">{formatTarget(seg, ftp)}</p>
            {seg.notes && <p className="mt-2 text-[14px] text-muted-foreground">{seg.notes}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Estrategias generadas por carrera (viven en memoria; se pierden al recargar) y cuál se está generando. */
export function useRaceStrategy() {
  const athlete = useCoach((s) => s.snapshot.profile);
  const training = useTraining();
  const [results, setResults] = useState<Record<string, RaceStrategy>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const generate = async (race: RaceEvent) => {
    setLoadingId(race.id);
    try {
      const segments = baseSegments(race, athlete);
      const st = await api.raceStrategy({ race_name: race.name, race_distance: race.distance, days_to_race: race.dayOffset, segments }, training);
      setResults((r) => ({ ...r, [race.id]: st }));
    } catch {
      toast("No se pudo generar la estrategia", { description: "Revisá que el backend esté corriendo e intentá de nuevo." });
    } finally {
      setLoadingId(null);
    }
  };

  return { results, loadingId, generate };
}

/** Hoja lateral con la estrategia por segmento que arma el Race Agent para una carrera de la agenda. */
export function StrategyDrawer({ race, strategy, loading, onRegenerate, onOpenChange }: {
  race: RaceEvent | null;
  strategy?: RaceStrategy;
  loading: boolean;
  onRegenerate: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const athlete = useCoach((s) => s.snapshot.profile);
  const ai = strategy;

  return (
    <Sheet open={!!race} onOpenChange={onOpenChange}>
      <SheetContent>
        {race && (
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <div className="pr-10">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-reagent">
                <WandSparkles className="size-4" /> Estrategia con IA · Race Agent
              </p>
              <SheetTitle className="mt-2 text-[24px] font-bold leading-tight [font-stretch:80%]">{race.name}</SheetTitle>
              <SheetDescription className="mt-1 text-[14px] text-muted-foreground">
                {race.distance} · {race.location} · D-{race.dayOffset}
              </SheetDescription>
            </div>

            {loading || !ai ? (
              <div className="mt-8 space-y-6" aria-live="polite">
                <p className="flex items-center gap-2 text-[15px] text-reagent">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                  {loading ? "El Race Agent está analizando cómo venís entrenando…" : "Todavía no hay una estrategia generada."}
                </p>
                <div className="opacity-40">
                  <Segments segments={baseSegments(race, athlete)} ftp={athlete.ftp_w} />
                </div>
                {!loading && (
                  <Button onClick={onRegenerate} className="gap-2">
                    <WandSparkles className="size-4" /> Generar con IA
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-8 space-y-8">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-y border-rule-strong py-3">
                  <p className="text-[14px]">
                    Enfoque <span className="font-semibold">{PACING_LABEL[ai.pacing]}</span>
                    <span className="code ml-3 text-muted-foreground">{ai.model}</span>
                  </p>
                  <p className="text-[14px]">
                    Tiempo estimado{" "}
                    <span className="num text-[22px] font-bold [font-stretch:72%]">{formatDuration(ai.estimated_finish_min)}</span>
                  </p>
                </div>
                <Segments segments={ai.segments} ftp={athlete.ftp_w} />
                <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-[14px] font-semibold">Por qué esta estrategia</h3>
                    <ul className="text-[14px]">
                      {ai.rationale.map((t) => <li key={t} className="border-t border-rule py-2">{t}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-2 text-[14px] font-semibold">Nutrición e hidratación</h3>
                    <ul className="text-[14px]">
                      {ai.nutrition.map((t) => <li key={t} className="border-t border-rule py-2">{t}</li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-[14px] font-semibold">Entrenamiento que se tuvo en cuenta</h3>
                  <div className={READINGS}>
                    <StatTile label="CTL" value={Math.round(ai.training.ctl)} unit="TSS/d" detail={`TSB ${ai.training.tsb > 0 ? "+" : ""}${ai.training.tsb.toFixed(1)}`} />
                    <StatTile label="Volumen semanal" value={ai.training.weekly_hours} unit="h" detail="Promedio 6 semanas" />
                    <StatTile label="Fondo de bici" value={formatDuration(ai.training.longest_bike_min)} detail="Más largo en 6 semanas" />
                    <StatTile label="Fondo de run" value={formatDuration(ai.training.longest_run_min)} detail="Más largo en 6 semanas" />
                  </div>
                </div>
                <Button variant="outline" onClick={onRegenerate} className="gap-2">
                  <WandSparkles className="size-4" /> Regenerar con IA
                </Button>
              </div>
            )}
            <p className="mt-8 text-[12px] text-muted-foreground">Pautas generales de entrenamiento; no reemplazan a un profesional de la salud o la nutrición.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
