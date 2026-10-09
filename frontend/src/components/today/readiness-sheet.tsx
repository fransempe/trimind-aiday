"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, BedDouble, Gauge, HeartPulse } from "lucide-react";
import { BAND_META, Panel } from "@/components/shared";
import { formatSleep } from "@/lib/engine";
import { useCoach } from "@/lib/store";

const LEGS = { fresh: "frescas", normal: "normales", heavy: "pesadas", sore: "cargadas" } as const;
const ZONES = [
  { from: 0, to: 40, color: "var(--critical)", label: "Rojo" },
  { from: 40, to: 70, color: "var(--warning)", label: "Ámbar" },
  { from: 70, to: 100, color: "var(--good)", label: "Verde" },
];

/** Regla graduada 0-100: el readiness se lee como una medición sobre su escala, no como un número suelto. */
function Ruler({ score }: { score: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="pt-1">
      <div className="relative h-9">
        <motion.div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          initial={false}
          animate={{ left: `${score}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="h-9 w-[2.5px] bg-foreground" />
        </motion.div>
      </div>
      <div className="flex h-2.5 gap-[2px]" aria-hidden>
        {ZONES.map((z) => (
          <span key={z.label} className="h-full rounded-[1px]" style={{ width: `${z.to - z.from}%`, background: z.color, opacity: 0.85 }} />
        ))}
      </div>
      <div className="num relative mt-1.5 h-4 text-[12px] text-muted-foreground">
        {[0, 40, 70, 100].map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Reading({
  icon: Icon,
  label,
  raw,
  score,
}: {
  icon: typeof Gauge;
  label: string;
  raw: string;
  score: number;
}) {
  const color = score >= 70 ? "var(--good)" : score >= 40 ? "var(--warning)" : "var(--critical)";
  return (
    <tr className="border-t border-rule">
      <td className="py-2.5 pr-2">
        <span className="flex items-center gap-2 text-[14px]">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} /> {label}
        </span>
      </td>
      <td className="num py-2.5 pr-3 text-[14px] text-muted-foreground">{raw}</td>
      <td className="w-20 py-2.5 pr-2">
        <span className="block h-1.5 rounded-[1px] bg-muted">
          <motion.span className="block h-full rounded-[1px]" style={{ background: color }} initial={false}
            animate={{ width: `${score}%` }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
        </span>
      </td>
      <td className="num w-10 py-2.5 text-right text-[16px] font-semibold">{score}</td>
    </tr>
  );
}

export function ReadinessSheet() {
  const s = useCoach((st) => st.snapshot);
  const { score, band, components } = s.readiness;
  const meta = BAND_META[band];
  const w = s.wellness_today;
  const dev = s.hrv.deviation_pct;

  return (
    <Panel id="readiness" title="Readiness score">
      <div className="flex items-end justify-between gap-3">
        <p className="num text-[64px] leading-[0.85] font-bold tracking-[-0.03em] [font-stretch:66%]">
          {score}
          <span className="ml-1 text-[18px] font-medium text-muted-foreground">/ 100</span>
        </p>
        <p className={`pb-1 text-right text-[15px] font-semibold ${meta.text}`}>{meta.label}</p>
      </div>
      <Ruler score={score} />
      <table className="mt-3 w-full">
        <caption className="sr-only">Componentes del readiness</caption>
        <tbody>
          <Reading icon={BedDouble} label="Sleep" raw={formatSleep(w.sleep_hours)} score={components.sleep} />
          <Reading icon={HeartPulse} label="HRV" raw={`${s.hrv.today_ms.toFixed(0)} ms · ${dev > 0 ? "+" : ""}${dev.toFixed(0)}%`} score={components.hrv} />
          <Reading icon={Activity} label="Fatigue" raw={`Piernas ${LEGS[w.legs]}${w.rpe ? ` · RPE ${w.rpe}` : ""}`} score={components.subjective} />
          <Reading icon={Gauge} label="Training load" raw={`TSB ${s.load.tsb > 0 ? "+" : ""}${s.load.tsb.toFixed(1)}`} score={components.load} />
        </tbody>
      </table>
      <p className="mt-3 text-[12px] text-muted-foreground">
        Pesos: HRV 35% · sueño 25% · carga 25% · subjetivo 15%. Calculado en Python.
      </p>
    </Panel>
  );
}
