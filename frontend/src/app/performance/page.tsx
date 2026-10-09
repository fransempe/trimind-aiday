"use client";

import { SimpleLineChart } from "@/components/charts";
import { TopBar } from "@/components/layout/top-bar";
import { INTENSITY_META, Panel, StatTile } from "@/components/shared";
import { formatPace } from "@/lib/engine";
import { ftpHistory, powerCurve } from "@/lib/mock/data";
import { useCoach } from "@/lib/store";

const ZONES = [
  { key: "recovery", from: 0, to: 0.55 },
  { key: "endurance", from: 0.56, to: 0.75 },
  { key: "tempo", from: 0.76, to: 0.87 },
  { key: "sweet_spot", from: 0.88, to: 0.94 },
  { key: "threshold", from: 0.95, to: 1.05 },
  { key: "vo2max", from: 1.06, to: 1.2 },
] as const;

export default function PerformancePage() {
  const p = useCoach((s) => s.snapshot.profile);
  const gain = ftpHistory.at(-1)!.ftp - ftpHistory[0].ftp;

  return (
    <div className="space-y-5">
      <TopBar title="Performance" subtitle="Progresión de umbrales y zonas de entrenamiento." />

      <div className="grid grid-cols-2 border-y border-rule-strong lg:grid-cols-4 [&>*+*]:lg:border-l [&>*+*]:lg:border-rule [&>*+*]:lg:pl-4">
        <StatTile label="FTP" value={p.ftp_w} unit="W" detail={`+${gain} W en 12 meses`} />
        <StatTile label="W/kg" value={(p.ftp_w / p.weight_kg).toFixed(2)} detail={`${p.weight_kg} kg`} />
        <StatTile label="Ritmo umbral run" value={formatPace(p.run_threshold_pace_s_per_km)} unit="/km" detail={`LTHR ${p.lthr_bpm} lpm`} />
        <StatTile label="CSS natación" value={formatPace(p.swim_css_s_per_100m)} unit="/100 m" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Progresión de FTP · 12 meses">
          <SimpleLineChart data={ftpHistory} x="month" y="ftp" name="FTP" unit="W" height={260} />
        </Panel>
        <Panel title="Curva de potencia · mejores marcas (90 días)">
          <SimpleLineChart data={powerCurve} x="label" y="watts" name="Potencia" unit="W" height={260} area />
        </Panel>
      </div>

      <Panel title="Zonas de potencia">
        <div className="space-y-2">
          {ZONES.map((z) => {
            const m = INTENSITY_META[z.key];
            return (
              <div key={z.key} className="grid grid-cols-[72px_1fr_120px] items-center gap-3 text-sm">
                <span className="num text-muted-foreground">{m.zone}</span>
                <div className="relative h-6 rounded-[3px] bg-muted">
                  <div className="absolute inset-y-0 rounded-[3px]" style={{ left: `${(z.from / 1.2) * 100}%`, width: `${((z.to - z.from) / 1.2) * 100}%`, background: m.color }} />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[13px] text-foreground">{m.label}</span>
                </div>
                <span className="num text-right">
                  {Math.round(p.ftp_w * z.from)}-{Math.round(p.ftp_w * z.to)} W
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Performance Agent · beta">
        <p className="text-sm text-muted-foreground">
          El Performance Agent ya participa del staff en el panel de Today. En la próxima iteración va a detectar
          estancamientos de FTP y proponer tests de umbral sin que haya que tocar el Head Coach: se suma como un
          especialista más en el registry.
        </p>
      </Panel>
    </div>
  );
}
