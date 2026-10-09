"use client";

import { BookOpen, Download, Loader2, Mic, MicOff, Trophy, WandSparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, SPORT_META } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  fmtTime,
  deviceResult,
  PAST_RACES,
  paceOf,
  parseTime,
  type RaceResult,
  raceSegments,
  totalOf,
  useRaceLog,
} from "@/lib/race-log";
import { refreshKnowledge } from "@/lib/knowledge";
import { connectedProviders, PROFILE_META, PROVIDER_META, type Provider, type RaceEvent, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import { useDictation } from "@/lib/use-dictation";

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Panel lateral: tiempos (Garmin o manual), relato escrito o dictado, y el análisis del Race Agent. */
function ResultSheet({ race, onClose }: { race: RaceEvent | null; onClose: () => void }) {
  return (
    <Sheet open={!!race} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>{race && <ResultForm key={race.id} race={race} />}</SheetContent>
    </Sheet>
  );
}

function ResultForm({ race }: { race: RaceEvent }) {
  const athlete = useCoach((s) => s.snapshot.profile);
  const saved = useRaceLog((s) => s.results[race.id]);
  const save = useRaceLog((s) => s.saveResult);
  const segments = raceSegments(race, athlete);
  const [source, setSource] = useState<RaceResult["source"]>(saved?.source ?? "manual");
  const [times, setTimes] = useState<string[]>(() => segments.map((s, i) => (saved ? fmtTime(saved.segments[i]?.time_s ?? 0) : "")));
  const [transitions, setTransitions] = useState(saved && saved.transitions_s ? fmtTime(saved.transitions_s) : "");
  const [brief, setBrief] = useState(saved?.brief ?? "");
  const [busy, setBusy] = useState(false);
  const dictation = useDictation((t) => setBrief((b) => (b ? `${b} ${t}` : t)));
  const debrief = saved?.debrief ?? null;

  const parsed = times.map(parseTime);
  const valid = parsed.every((t) => t !== null);
  const result = (): RaceResult => ({
    source,
    segments: segments.map((s, i) => ({ label: s.label, sport: s.sport, distance_km: s.distance_km, time_s: parsed[i]! })),
    transitions_s: segments.length > 1 ? parseTime(transitions) ?? 0 : 0,
    brief: brief.trim(),
    debrief: null,
  });

  const providers = connectedProviders(useSetup((s) => s.devices));
  const [kbUpdated, setKbUpdated] = useState(false);
  const importFrom = (p: Provider) => {
    const g = deviceResult(race, athlete, p);
    setSource(p);
    setTimes(g.segments.map((s) => fmtTime(s.time_s)));
    setTransitions(g.transitions_s ? fmtTime(g.transitions_s) : "");
    toast(`Tiempos importados de ${PROVIDER_META[p].label}`, { description: race.name });
  };

  const analyze = async () => {
    if (!valid) return;
    const r = result();
    setBusy(true);
    try {
      const d = await api.raceDebrief({
        race_name: race.name,
        distance: race.distance,
        days_ago: -race.dayOffset,
        source: r.source,
        segments: r.segments,
        transitions_s: r.transitions_s,
        brief: r.brief,
      });
      save(race.id, { ...r, debrief: d });
      setBusy(false);
      // La IA lo recuerda: la carrera y su análisis pasan a la base de conocimiento.
      setKbUpdated(false);
      refreshKnowledge()
        .then(() => {
          setKbUpdated(true);
          toast("La Base de conocimiento se actualizó con esta carrera", { description: "El staff la va a tener en cuenta." });
        })
        .catch(() => {});
      return;
    } catch {
      save(race.id, r);
      toast("No se pudo analizar la carrera", { description: "Guardé tus tiempos; probá el análisis de nuevo con el backend corriendo." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div className="pr-10">
        <SheetTitle className="text-[24px] font-bold leading-tight [font-stretch:80%]">{race.name}</SheetTitle>
        <SheetDescription className="mt-1 text-[14px] text-muted-foreground">
          {PROFILE_META[race.sport].label} · {race.distance} · {ago(race.dayOffset)}
        </SheetDescription>
      </div>

      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold">Tiempos</h3>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <Button key={p} variant="outline" size="sm" onClick={() => importFrom(p)} className="gap-1.5">
                <Download className="size-3.5" /> {PROVIDER_META[p].label.replace(" Connect", "")}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {segments.map((s, i) => (
            <div key={s.label} className="space-y-1">
              <Label htmlFor={`t-${i}`} className="text-[13px] font-normal text-muted-foreground">
                <span className="inline-block size-2 rounded-full" style={{ background: SPORT_META[s.sport].color }} /> {s.label}
              </Label>
              <Input id={`t-${i}`} value={times[i]} placeholder="h:mm:ss o mm:ss" inputMode="numeric" className="num text-[16px]"
                onChange={(e) => { setSource("manual"); setTimes((t) => t.map((x, j) => (j === i ? e.target.value : x))); }} />
              {parsed[i] && <p className="num text-[12px] text-muted-foreground">{paceOf({ ...s, time_s: parsed[i]! })}</p>}
            </div>
          ))}
          {segments.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="t-trans" className="text-[13px] font-normal text-muted-foreground">Transiciones</Label>
              <Input id="t-trans" value={transitions} placeholder="mm:ss" className="num text-[16px]" onChange={(e) => setTransitions(e.target.value)} />
            </div>
          )}
        </div>
        {valid && (
          <p className="text-[14px]">
            Tiempo total <span className="num text-[22px] font-bold [font-stretch:72%]">{fmtTime(totalOf(result()))}</span>
            <span className="ml-2 text-[13px] text-muted-foreground">{source === "manual" ? "cargado a mano" : `importado de ${PROVIDER_META[source].label}`}</span>
          </p>
        )}
      </section>

      <section className="mt-8 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="brief" className="text-[15px] font-semibold">¿Cómo te fue? Escribilo o contalo en audio</Label>
          <Button variant={dictation.listening ? "default" : "outline"} size="sm" onClick={dictation.listening ? dictation.stop : dictation.start} className="gap-1.5">
            {dictation.listening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
            {dictation.listening ? "Terminar de dictar" : "Contalo con tu voz"}
          </Button>
        </div>
        {dictation.listening && <p className="text-[13px] text-reagent" aria-live="polite">Escuchando… hablá con normalidad.</p>}
        {!dictation.supported && <p className="text-[13px] text-muted-foreground">Este navegador no permite dictar. Probá en Chrome o Edge, o escribilo.</p>}
        <Textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} rows={5}
          placeholder="Sensaciones, clima, nutrición, qué salió bien y qué no…" />
      </section>

      <Button onClick={analyze} disabled={!valid || busy} className="mt-6 gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
        {busy ? "El Race Agent está analizando…" : debrief ? "Guardar y volver a analizar" : "Guardar y analizar con IA"}
      </Button>
      {!valid && <p className="mt-2 text-[13px] text-muted-foreground">Cargá el tiempo de cada segmento o importalo de tu dispositivo.</p>}

      {debrief && (
        <section className="mt-8 space-y-5 border-t-2 border-rule-strong pt-5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-reagent"><WandSparkles className="size-4" /> Análisis del Race Agent</p>
          <p className="text-[16px] leading-relaxed">{debrief.summary}</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <h4 className="mb-1.5 text-[14px] font-semibold">Lo que salió bien</h4>
              <ul className="space-y-1.5 text-[14px]">{debrief.highlights.map((t) => <li key={t} className="border-t border-rule pt-1.5 first:border-t-0 first:pt-0">{t}</li>)}</ul>
            </div>
            <div>
              <h4 className="mb-1.5 text-[14px] font-semibold">Para mejorar</h4>
              <ul className="space-y-1.5 text-[14px]">{debrief.improvements.map((t) => <li key={t} className="border-t border-rule pt-1.5 first:border-t-0 first:pt-0">{t}</li>)}</ul>
            </div>
          </div>
          <div>
            <h4 className="mb-1.5 text-[14px] font-semibold">Lo que el staff aprende de vos</h4>
            <ul className="space-y-1.5 text-[14px] text-muted-foreground">{debrief.insights.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <p className="code text-faint">{debrief.model}</p>
          {kbUpdated && (
            <Link href="/conocimiento" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-good hover:underline">
              <BookOpen className="size-4" /> Guardado en tu Base de conocimiento
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

export function CompletedRaces() {
  const results = useRaceLog((s) => s.results);
  const profile = useSetup((s) => s.profile);
  const [open, setOpen] = useState<RaceEvent | null>(null);
  const races = PAST_RACES.filter((r) => r.sport === profile || profile === "triathlon" || (profile === "duathlon" && r.sport === "running"));

  return (
    <Panel id="completed" title={`Carreras completadas · ${races.length}`}>
      <ol>
        {races.map((r) => {
          const res = results[r.id];
          return (
            <li key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-rule py-3 first:border-t-0">
              <Trophy className={res?.debrief ? "size-5 text-good" : "size-5 text-reagent"} strokeWidth={1.75} aria-hidden />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">
                  {r.name}
                  {!res?.debrief && <span className="ml-2 rounded-[3px] border border-reagent/60 px-1.5 py-0.5 text-[11px] font-semibold text-reagent">Para completar</span>}
                </p>
                <p className="text-[13px] text-muted-foreground" suppressHydrationWarning>
                  {ago(r.dayOffset)} · {PROFILE_META[r.sport].label} · {r.distance}
                  {res && <span className="num text-foreground"> · {fmtTime(totalOf(res))}</span>}
                  {res?.debrief && <span className="text-good"> · analizada</span>}
                </p>
              </div>
              <Button variant={res ? "outline" : "default"} size="sm" onClick={() => setOpen(r)}>
                {res ? (res.debrief ? "Ver análisis" : "Completar") : "Cargar resultado"}
              </Button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] text-muted-foreground">Los resultados y tus relatos alimentan la Base de conocimiento.</p>
      <ResultSheet race={open} onClose={() => setOpen(null)} />
    </Panel>
  );
}
