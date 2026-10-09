"use client";

import { INTENSITY_META } from "@/components/shared";
import { formatDuration } from "@/lib/engine";
import type { Workout } from "@/lib/types";

interface Block {
  start: number;
  minutes: number;
  watts: number | null;
  label: string;
  color: string;
  isRecovery?: boolean;
}

function toBlocks(workout: Workout, ftp: number): Block[] {
  const blocks: Block[] = [];
  let t = 0;
  for (const step of workout.steps) {
    const meta = INTENSITY_META[step.intensity];
    const watts = step.power ? (step.power.low_w + step.power.high_w) / 2 : null;
    const label = step.power
      ? step.power.high_w - step.power.low_w <= 10
        ? `${Math.round(watts!)} W`
        : `${step.power.low_w}-${step.power.high_w} W`
      : meta.label;
    for (let i = 0; i < step.repeat; i++) {
      blocks.push({ start: t, minutes: step.duration_min, watts, label, color: meta.color });
      t += step.duration_min;
      if (i < step.repeat - 1 && step.recovery_min) {
        blocks.push({
          start: t,
          minutes: step.recovery_min,
          watts: ftp * 0.55,
          label: "Recuperación",
          color: INTENSITY_META.recovery.color,
          isRecovery: true,
        });
        t += step.recovery_min;
      }
    }
  }
  return blocks;
}

/** Perfil de potencia del entrenamiento: ancho = duración, alto = % FTP. */
export function WorkoutProfile({ workout, ftp, height = 120 }: { workout: Workout; ftp: number; height?: number }) {
  const blocks = toBlocks(workout, ftp);
  const total = blocks.reduce((a, b) => a + b.minutes, 0);
  const maxPct = 1.1;
  const ftpY = height - (1 / maxPct) * height;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img"
        aria-label={`Perfil de potencia de ${workout.title}`}>
        <line x1={0} x2={1000} y1={ftpY} y2={ftpY} stroke="var(--axis)" strokeWidth={1} strokeDasharray="0" opacity={0.5} vectorEffect="non-scaling-stroke" />
        {blocks.map((b, i) => {
          const x = (b.start / total) * 1000;
          const w = (b.minutes / total) * 1000;
          const pct = (b.watts ?? ftp * 0.5) / ftp;
          const h = Math.max(6, (pct / maxPct) * height);
          return (
            <rect key={i} x={x + 1} y={height - h} width={Math.max(1, w - 2)} height={h} rx={3} fill={b.color}
              opacity={b.isRecovery ? 0.45 : 0.9}>
              <title>{`${formatDuration(b.minutes)} · ${b.label} · ${Math.round(pct * 100)}% FTP`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="num mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>0&apos;</span>
        <span>FTP {ftp} W ─ línea de referencia</span>
        <span>{formatDuration(total)}</span>
      </div>
    </div>
  );
}

export function WorkoutSteps({ workout }: { workout: Workout }) {
  return (
    <ul className="space-y-1.5">
      {workout.steps.map((s, i) => {
        const meta = INTENSITY_META[s.intensity];
        return (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-sm" style={{ background: meta.color }} />
              <span className="num">
                {s.repeat > 1 ? `${s.repeat}x` : ""}
                {formatDuration(s.duration_min)}
              </span>
              <span className="text-muted-foreground">
                {meta.label} · {meta.zone}
                {s.recovery_min ? ` · rec. ${s.recovery_min}'` : ""}
              </span>
            </span>
            {s.power && (
              <span className="num shrink-0 whitespace-nowrap text-foreground">
                {s.power.low_w}-{s.power.high_w} W
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
