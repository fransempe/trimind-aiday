"use client";

import { RefreshCw } from "lucide-react";
import { dayLabel } from "@/components/charts";
import { DeviceLed } from "@/components/device-led";
import { Empty, PageHead, Panel, SportDot, StatTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { formatDuration, formatSleep } from "@/lib/engine";
import { importedData } from "@/lib/mock/imports";
import { buildPlan } from "@/lib/plan";
import { connectedProviders, PROVIDER_META, type Provider, raceById, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

function since(ts: number | null) {
  if (!ts) return "nunca";
  const min = Math.round((Date.now() - ts) / 60000);
  return min < 1 ? "recién" : min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
}

const READINGS = "grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4";

export default function DatosPage() {
  const setup = useSetup();
  const hard = useCoach((s) => s.inputs.hard_run_yesterday);
  const snapshot = useCoach((s) => s.snapshot);
  const connected = connectedProviders(setup.devices);
  const data = importedData(connected, hard);
  const races = setup.agenda.map(raceById).filter((r) => !!r);
  const plan = buildPlan({ profile: setup.profile, fitness: setup.fitness, races, importedCtl: data.ctl, sleepAvg: data.sleepAvg });

  return (
    <div className="space-y-10">
      <PageHead title="Datos importados" subtitle="Lo que llega de tus dispositivos y cómo cambia tu plan y tu readiness." />

      <Panel id="devices" title="Conexiones"
        action={
          <Button variant="outline" size="sm" onClick={setup.sync} disabled={!connected.length} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Sincronizar ahora
          </Button>
        }>
        {(Object.keys(PROVIDER_META) as Provider[]).map((p) => {
          const on = setup.devices[p];
          return (
            <div key={p} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-rule py-3 first:border-t-0">
              <DeviceLed on={on} />
              <div>
                <p className="text-[15px] font-semibold">{PROVIDER_META[p].label}</p>
                <p className="text-[13px] text-muted-foreground">
                  {on ? `Conectado · última sincronización ${since(setup.lastSync)}` : "Sin conectar"} · {PROVIDER_META[p].imports}
                </p>
              </div>
              <Button variant={on ? "outline" : "default"} size="sm" onClick={() => setup.setDevice(p, !on)}>
                {on ? "Desconectar" : "Conectar"}
              </Button>
            </div>
          );
        })}
      </Panel>

      <section aria-labelledby="impact-title" className="space-y-4">
        <h2 id="impact-title" className="text-[15px] font-semibold">Cómo influyen en el plan y el sueño</h2>
        <div className={READINGS}>
          <StatTile label="CTL importada" value={data.ctl != null ? Math.round(data.ctl) : "—"} unit="TSS/d" detail={data.ctl != null ? "Ajusta el volumen de partida" : "Conectá un dispositivo"} />
          <StatTile label="Sueño promedio 14 d" value={data.sleepAvg != null ? formatSleep(data.sleepAvg) : "—"} detail={data.sleepAvg != null ? (data.sleepAvg < 7 ? "Recorta volumen 10%" : "Sin recorte") : "Solo desde Garmin"} />
          <StatTile label="HRV baseline 30 d" value={data.nights.length ? snapshot.hrv.baseline_30d_ms.toFixed(0) : "—"} unit="ms" detail="Entra al readiness diario (35%)" />
          <StatTile label="Registros importados" value={data.activities.length + data.nights.length} detail={`${data.activities.length} actividades · ${data.nights.length} noches`} />
        </div>
        {plan ? (
          <ul className="max-w-[72ch] text-[14px]">
            {plan.basis.map((b) => (
              <li key={b} className="border-t border-rule py-2 first:border-t-0">{b}</li>
            ))}
          </ul>
        ) : (
          <Empty>Agregá una carrera a tu agenda en Race para que el staff arme el plan con estos datos.</Empty>
        )}
      </section>

      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-3">
        <Panel id="imported-activities" title={`Actividades importadas · ${data.activities.length}`} className="xl:col-span-2">
          {data.activities.length === 0 ? (
            <Empty>No hay dispositivos conectados: conectá Garmin, Strava o Wahoo para importar actividades.</Empty>
          ) : (
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full min-w-[520px] text-[14px]">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
                    <th className="pr-3 pb-2 font-semibold">Fecha</th>
                    <th className="pr-3 pb-2 font-semibold">Sesión</th>
                    <th className="pr-3 pb-2 font-semibold">Origen</th>
                    <th className="pr-3 pb-2 text-right font-semibold">Duración</th>
                    <th className="pb-2 text-right font-semibold">TSS</th>
                  </tr>
                </thead>
                <tbody className="num">
                  {data.activities.map((a) => (
                    <tr key={a.id} className="border-t border-rule">
                      <td className="py-2 pr-3 text-muted-foreground" suppressHydrationWarning>{a.day_offset === -1 ? "Ayer" : dayLabel(a.day_offset)}</td>
                      <td className="py-2 pr-3 font-sans"><span className="flex items-center gap-2"><SportDot sport={a.sport} /> {a.title}</span></td>
                      <td className="py-2 pr-3 font-sans text-muted-foreground">{PROVIDER_META[a.source].label}</td>
                      <td className="py-2 pr-3 text-right">{formatDuration(a.duration_min)}</td>
                      <td className="py-2 text-right">{Math.round(a.tss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel id="imported-nights" title="Sueño y HRV importados">
          {data.nights.length === 0 ? (
            <Empty>El sueño y el HRV llegan desde Garmin. Sin esa conexión, el readiness usa lo que cargás a mano.</Empty>
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
                  <th className="pr-3 pb-2 font-semibold">Noche</th>
                  <th className="pr-3 pb-2 text-right font-semibold">Sueño</th>
                  <th className="pr-3 pb-2 text-right font-semibold">HRV</th>
                  <th className="pb-2 text-right font-semibold">FC rep.</th>
                </tr>
              </thead>
              <tbody className="num">
                {data.nights.slice(0, 14).map((n) => (
                  <tr key={n.day_offset} className="border-t border-rule">
                    <td className="py-2 pr-3 text-muted-foreground" suppressHydrationWarning>{dayLabel(n.day_offset)}</td>
                    <td className="py-2 pr-3 text-right">{formatSleep(n.sleep_hours)}</td>
                    <td className="py-2 pr-3 text-right">{n.hrv_ms.toFixed(0)} ms</td>
                    <td className="py-2 text-right">{n.resting_hr_bpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
