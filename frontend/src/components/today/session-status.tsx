"use client";

import { Check, CircleDashed, Loader2, RefreshCw, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeviceLed } from "@/components/device-led";
import { Button } from "@/components/ui/button";
import type { DayItem, DaySession } from "@/lib/day";
import {
  analyze,
  takeaway,
  deviceFor,
  type SessionEntry,
  sessionKey,
  simulateRecord,
  slotEnded,
  useSessionLog,
} from "@/lib/session-log";
import { PROVIDER_META, type TrainingSlot, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";

const VERDICT_TONE = { cumplida: "text-good", con_matices: "text-foreground", por_debajo: "text-reagent" };

const pace = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Arma la entrada "sincronizada" de una sesión con los datos (simulados) del dispositivo. */
function useSyncEntry() {
  const profile = useCoach((s) => s.snapshot.profile);
  const band = useCoach((s) => s.snapshot.readiness.band);
  const devices = useSetup((s) => s.devices);
  return (slot: TrainingSlot, session: DaySession): SessionEntry | null => {
    const source = deviceFor(session.sport, devices);
    if (!source) return null;
    const record = simulateRecord(session, profile, band, sessionKey(slot, session));
    return { status: "done", source, at: Date.now(), record, analysis: analyze(session, record, band) };
  };
}

/** Al abrir Today, las sesiones cuya franja ya terminó se dan por hechas con lo que trae el dispositivo. */
export function useAutoSync(items: DayItem[]) {
  const [hydrated, setHydrated] = useState(() => !!useSessionLog.persist?.hasHydrated() && !!useSetup.persist?.hasHydrated());
  const build = useSyncEntry();

  useEffect(() => {
    const check = () => setHydrated(!!useSessionLog.persist?.hasHydrated() && !!useSetup.persist?.hasHydrated());
    const a = useSessionLog.persist?.onFinishHydration(check);
    const b = useSetup.persist?.onFinishHydration(check);
    check();
    return () => { a?.(); b?.(); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { entries, set } = useSessionLog.getState();
    for (const { slot, session } of items) {
      if (!session || session.kind === "rest" || !slotEnded(slot)) continue;
      const key = sessionKey(slot, session);
      if (entries[key]) continue;
      const entry = build(slot, session);
      if (!entry) continue;
      set(key, entry);
      toast(`${PROVIDER_META[entry.source as keyof typeof PROVIDER_META].label} sincronizó tu sesión de las ${slot.time}`, { description: session.title });
    }
    // build cambia en cada render; alcanza con reaccionar a los ítems y a la hidratación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items]);
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:border-l sm:border-rule sm:pl-3 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="num text-[15px] font-semibold">{value}</p>
    </div>
  );
}

function SyncedAnalysis({ entry, sport, expanded }: { entry: SessionEntry; sport: DaySession["sport"]; expanded: boolean }) {
  const r = entry.record!;
  const a = entry.analysis!;
  const readouts: { label: string; value: string }[] = [{ label: "Duración", value: `${r.duration_min} min` }];
  if (r.distance_km !== null) readouts.push({ label: "Distancia", value: sport === "swim" ? `${Math.round(r.distance_km * 1000)} m` : `${r.distance_km} km` });
  if (r.avg_power_w !== null) readouts.push({ label: "Potencia media", value: `${r.avg_power_w} W` });
  if (r.avg_pace_s !== null) readouts.push({ label: "Ritmo medio", value: `${pace(r.avg_pace_s)} ${sport === "swim" ? "/100 m" : "/km"}` });
  if (r.sets_done !== null) readouts.push({ label: "Series", value: `${r.sets_done}/${r.sets_planned}` });
  readouts.push({ label: "FC media", value: `${r.avg_hr_bpm} ppm` }, { label: "TSS", value: String(r.tss) }, { label: "Cumplimiento", value: `${r.compliance_pct}%` });

  return (
    <div className="mt-3 max-w-2xl border-t border-rule pt-3">
      <div className="grid grid-cols-3 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-0 [&>*]:sm:pr-4">
        {readouts.map((x) => <Readout key={x.label} {...x} />)}
      </div>
      <p className={cn("mt-4 text-[15px] font-semibold", VERDICT_TONE[a.verdict])}>{a.headline}</p>
      <p className="mt-0.5 text-[14px]">{takeaway(sport, r, a.verdict)}</p>
      {expanded && <ul className="mt-1.5 space-y-1 text-[14px] text-muted-foreground">
        {a.points.map((p) => <li key={p}>{p}</li>)}
      </ul>}
    </div>
  );
}

/** Estado de una sesión del día: pendiente, hecha (a mano o por sync) o salteada, con el análisis si hay datos. */
export function SessionStatus({ slot, session, expanded = true }: { slot: TrainingSlot; session: DaySession; expanded?: boolean }) {
  const key = sessionKey(slot, session);
  const entry = useSessionLog((s) => s.entries[key]);
  const { set, clear } = useSessionLog();
  const devices = useSetup((s) => s.devices);
  const build = useSyncEntry();
  const [syncing, setSyncing] = useState(false);
  const device = deviceFor(session.sport, devices);
  const ended = slotEnded(slot);

  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      const e = build(slot, session);
      setSyncing(false);
      if (e) set(key, e);
    }, 1200);
  };

  const syncButton = device && (
    <Button variant="outline" size="sm" onClick={sync} disabled={syncing} className="gap-1.5">
      {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
      {syncing ? "Buscando…" : `Sincronizar ${PROVIDER_META[device].label.replace(" Connect", "")}`}
    </Button>
  );

  if (!entry || entry.status === "pending") {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <CircleDashed className="size-3.5" /> {ended ? "Sin registrar" : "Pendiente"}
        </span>
        <Button size="sm" onClick={() => set(key, { status: "done", source: "manual", at: Date.now() })} className="gap-1.5">
          <Check className="size-3.5" /> La hice
        </Button>
        {syncButton}
        <Button variant="ghost" size="sm" onClick={() => set(key, { status: "skipped", source: "manual", at: Date.now() })} className="gap-1.5 text-muted-foreground">
          <X className="size-3.5" /> No la hice
        </Button>
        {!device && (
          <Link href="/configuracion" className="text-[13px] text-muted-foreground underline">Conectá un dispositivo para importarla</Link>
        )}
      </div>
    );
  }

  const undo = (
    <Button variant="ghost" size="sm" onClick={() => clear(key)} className="gap-1.5 text-muted-foreground">
      <RotateCcw className="size-3.5" /> Deshacer
    </Button>
  );

  if (entry.status === "skipped") {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground"><X className="size-3.5" /> No realizada</span>
        {undo}
      </div>
    );
  }

  if (entry.source === "manual") {
    return (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-good"><Check className="size-3.5" /> Hecha · marcada a mano</span>
          {syncButton}
          {undo}
        </div>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Sin datos de dispositivo todavía. {device ? "Sincronizá para ver el análisis de la sesión." : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-good">
          <DeviceLed on /> Hecha · sincronizada desde {PROVIDER_META[entry.source].label}
        </span>
        {undo}
      </div>
      <SyncedAnalysis entry={entry} sport={session.sport} expanded={expanded} />
    </div>
  );
}
