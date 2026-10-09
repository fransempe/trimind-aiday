"use client";

import { ArrowRight, Loader2, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/top-bar";
import { Panel, SPORT_META, StatTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/engine";
import { raceRecords, refreshKnowledge } from "@/lib/knowledge";
import { fmtTime, trainingFacts, useRaceLog } from "@/lib/race-log";
import { useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

const READINGS = "grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4";

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-[15px] font-semibold">{title}</h3>
      <ul className="space-y-2 text-[14px]">
        {items.map((t) => <li key={t} className="border-t border-rule pt-2 first:border-t-0 first:pt-0">{t}</li>)}
      </ul>
    </div>
  );
}

export default function ConocimientoPage() {
  const snap = useCoach((s) => s.snapshot);
  const setup = useSetup();
  const knowledge = useRaceLog((s) => s.knowledge);
  useRaceLog((s) => s.results); // re-render al cargar resultados
  const [busy, setBusy] = useState(false);

  // Los datos de entrenamiento se calculan en código; se ven aunque todavía no haya análisis.
  const facts = knowledge?.facts ?? trainingFacts(snap.profile, setup.weightKg, snap.load.ctl, snap.load.tsb, snap.readiness.score);
  const records = raceRecords();

  const build = async () => {
    setBusy(true);
    try {
      await refreshKnowledge();
      toast("Base de conocimiento actualizada", { description: "El staff la tiene en cuenta en sus opiniones y respuestas." });
    } catch {
      toast("No se pudo actualizar", { description: "Revisá que el backend esté corriendo e intentá de nuevo." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <TopBar title="Base de conocimiento" subtitle={`Lo que el staff sabe de ${snap.profile.name}: cómo viene entrenando, sus carreras y su perfil como atleta.`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-muted-foreground" suppressHydrationWarning>
          {knowledge
            ? `Actualizada el ${new Date(knowledge.at).toLocaleDateString("es-AR", { day: "numeric", month: "long" })} · ${records.length} ${records.length === 1 ? "carrera cargada" : "carreras cargadas"}`
            : "Todavía no hay análisis. El Head Coach lo arma con tu entrenamiento y tus carreras."}
        </p>
        <Button onClick={build} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
          {busy ? "El Head Coach está escribiendo…" : knowledge ? "Actualizar con IA" : "Generar con IA"}
        </Button>
      </div>

      <Panel id="facts" title={`Entrenamiento de las últimas ${facts.weeks} semanas`}>
        <div className={READINGS}>
          <StatTile label="Volumen semanal" value={facts.weekly_hours} unit="h" detail={`CTL ${facts.ctl} · TSB ${facts.tsb > 0 ? "+" : ""}${facts.tsb}`} />
          <StatTile label="FTP" value={facts.ftp_w} unit="W" detail={`${facts.ftp_w_kg} W/kg`} />
          <StatTile label="Fondo de bici" value={formatDuration(facts.longest_bike_min)} detail="El más largo" />
          <StatTile label="Fondo de run" value={formatDuration(facts.longest_run_min)} detail="El más largo" />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
          {(["swim", "bike", "run"] as const).map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full" style={{ background: SPORT_META[s].color }} />
              {SPORT_META[s].label}: <span className="num font-semibold">{facts.hours_by_sport[s]} h/sem</span>
              <span className="text-muted-foreground">· {facts.sessions_by_sport[s]} sesiones</span>
            </li>
          ))}
        </ul>
      </Panel>

      {knowledge ? (
        <>
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
            <Panel id="kb-training" title="Cómo viene entrenando">
              <p className="max-w-[70ch] text-[15px] leading-relaxed">{knowledge.training_summary}</p>
            </Panel>
            <Panel id="kb-races" title="Las carreras que viene corriendo">
              <p className="max-w-[70ch] text-[15px] leading-relaxed">{knowledge.races_summary}</p>
            </Panel>
          </div>
          <Panel id="kb-profile" title="Características como atleta">
            <p className="max-w-[80ch] text-[16px] leading-relaxed">{knowledge.athlete_profile}</p>
            <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-3">
              <List title="Fortalezas" items={knowledge.strengths} />
              <List title="Oportunidades de mejora" items={knowledge.opportunities} />
              <List title="Foco para lo que viene" items={knowledge.next_focus} />
            </div>
          </Panel>
          <p className="text-[13px] text-muted-foreground">
            Un resumen de este análisis se suma al contexto de los agentes: lo tienen en cuenta al opinar y al responderte.
            <span className="code ml-2 text-faint">{knowledge.model}</span>
          </p>
        </>
      ) : null}

      <Panel id="kb-results" title="Resultados cargados">
        {records.length ? (
          <ul>
            {records.map((r) => (
              <li key={r.race_name} className="grid grid-cols-[1fr_auto] gap-3 border-t border-rule py-2.5 first:border-t-0 text-[14px]">
                <span><span className="font-semibold">{r.race_name}</span><span className="text-muted-foreground"> · {r.distance} · hace {r.days_ago} días</span></span>
                <span className="num font-semibold">{fmtTime(r.total_s)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-muted-foreground">Todavía no cargaste resultados.</p>
        )}
        <Link href="/race" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold hover:underline">
          Cargar resultados y relatos en Race <ArrowRight className="size-4" />
        </Link>
      </Panel>
    </div>
  );
}
