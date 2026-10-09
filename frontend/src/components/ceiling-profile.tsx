"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { INTENSITY_META } from "@/components/shared";
import type { Ceiling } from "@/lib/ceiling";
import { formatDuration } from "@/lib/engine";
import type { Workout } from "@/lib/types";

interface Block {
  start: number;
  minutes: number;
  watts: number;
  color: string;
  label: string;
}

const H = 230;
const PAD_L = 64;
const PAD_R = 12;
const PAD_B = 28;
const PAD_T = 26;
const MIN_W = 100; // el eje arranca en 100 W para que la franja del techo tenga altura

function blocks(workout: Workout, ftp: number): Block[] {
  const out: Block[] = [];
  let t = 0;
  for (const s of workout.steps) {
    const meta = INTENSITY_META[s.intensity];
    const watts = s.power ? (s.power.low_w + s.power.high_w) / 2 : ftp * 0.5;
    for (let i = 0; i < s.repeat; i++) {
      out.push({ start: t, minutes: s.duration_min, watts, color: meta.color, label: meta.label });
      t += s.duration_min;
      if (i < s.repeat - 1 && s.recovery_min) {
        out.push({ start: t, minutes: s.recovery_min, watts: ftp * 0.55, color: INTENSITY_META.recovery.color, label: "Recuperación" });
        t += s.recovery_min;
      }
    }
  }
  return out;
}

/**
 * Movimiento distintivo: el perfil de potencia contra el techo que fijan las reglas.
 * El plan original (fantasma) y el ajuste (tinta hueso) se dibujan registrados, mismos ejes;
 * lo que del original cruza el techo queda tachado con su exceso en vatios.
 */
export function CeilingProfile({
  original,
  revised,
  ftp,
  ceiling,
  decisionKey,
}: {
  original: Workout;
  revised: Workout | null;
  ftp: number;
  ceiling: Ceiling | null;
  decisionKey: string | null;
}) {
  const reduce = useReducedMotion();
  // Se dibuja en píxeles reales: el texto y los trazos no escalan con el ancho.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const orig = blocks(original, ftp);
  const rev = revised ? blocks(revised, ftp) : [];
  const total = Math.max(orig.reduce((a, b) => a + b.minutes, 0), rev.reduce((a, b) => a + b.minutes, 0));
  const maxW = ftp * 1.12;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_B - PAD_T;
  const x = (min: number) => PAD_L + (min / total) * plotW;
  const y = (watts: number) => PAD_T + plotH - ((Math.max(watts, MIN_W) - MIN_W) / (maxW - MIN_W)) * plotH;
  const base = y(MIN_W);

  const showCeiling = !!(ceiling && decisionKey);
  const cy = ceiling ? y(ceiling.watts) : 0;
  const overBlocks = showCeiling ? orig.filter((b) => b.watts > ceiling!.watts) : [];
  const excess = overBlocks.length ? Math.round(Math.max(...overBlocks.map((b) => b.watts)) - ceiling!.watts) : 0;
  const firstOver = overBlocks[0];
  const ticks = [150, 200, ftp].filter((t) => !showCeiling || Math.abs(t - ceiling!.watts) > 14);
  const minuteTicks = [0, 15, 30, 45, 60, 75, 90].filter((m) => m <= total);
  const ghost = !!revised;

  return (
    <figure className="w-full">
      <div ref={box} className="w-full">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img"
          aria-label={`Perfil de potencia de ${original.title}${revised ? `, reemplazado por ${revised.title}` : ""}${showCeiling ? `. ${ceiling!.label} en ${ceiling!.watts} W${excess ? `; el plan original lo supera por ${excess} W` : ""}` : ""}`}>
          <defs>
            <pattern id="struck" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--critical)" strokeWidth="3" />
            </pattern>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={PAD_L - 10} y={y(t) + 4} textAnchor="end" fontSize="13" fill="var(--axis)" className="num">
                {t === ftp ? `FTP ${t}` : `${t} W`}
              </text>
            </g>
          ))}
          {minuteTicks.map((m) => (
            <text key={m} x={x(m)} y={H - 7} textAnchor="middle" fontSize="13" fill="var(--axis)" className="num">
              {m}&apos;
            </text>
          ))}
          <line x1={PAD_L} x2={W - PAD_R} y1={base} y2={base} stroke="var(--rule-strong)" strokeWidth={1} />

          {/* Plan original: tinta de zona si se mantiene, fantasma si fue reemplazado */}
          {orig.map((b, i) => {
            const bx = x(b.start) + 1;
            const bw = Math.max(1, x(b.start + b.minutes) - x(b.start) - 2);
            const top = y(b.watts);
            return (
              <rect key={`o${i}`} x={bx} y={top} width={bw} height={base - top} rx={1.5}
                fill={ghost ? "var(--foreground)" : b.color} fillOpacity={ghost ? 0.1 : 0.95}
                stroke={ghost ? "var(--faint)" : "none"} strokeWidth={1.5} strokeDasharray={ghost ? "4 3" : undefined}>
                <title>{`Plan original · ${formatDuration(b.minutes)} · ${b.label} · ${Math.round(b.watts)} W`}</title>
              </rect>
            );
          })}

          {/* Ajuste del Head Coach en tinta hueso, registrado sobre los mismos ejes */}
          {rev.map((b, i) => {
            const bx = x(b.start) + 1;
            const bw = Math.max(1, x(b.start + b.minutes) - x(b.start) - 2);
            const top = y(b.watts);
            return (
              <motion.rect key={`r${i}-${decisionKey}`} x={bx} y={top} width={bw} height={base - top} rx={1.5}
                fill={b.color}
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 1.1, duration: 0.4 }}>
                <title>{`Ajuste · ${formatDuration(b.minutes)} · ${b.label} · ${Math.round(b.watts)} W`}</title>
              </motion.rect>
            );
          })}

          {/* Lo que cruza el techo: tachado completo con línea de corte */}
          {overBlocks.map((b, i) => {
            const bx = x(b.start) + 1;
            const bw = Math.max(1, x(b.start + b.minutes) - x(b.start) - 2);
            const top = y(b.watts);
            return (
              <motion.g key={`s${i}-${decisionKey}`} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.85, duration: 0.35 }}>
                <rect x={bx} y={top} width={bw} height={cy - top} fill="url(#struck)" />
                <rect x={bx} y={top} width={bw} height={cy - top} fill="none" stroke="var(--critical)" strokeWidth={1.5} />
                <line x1={bx} y1={cy} x2={bx + bw} y2={top} stroke="var(--critical)" strokeWidth={2.5} />
              </motion.g>
            );
          })}

          {showCeiling && (
            <g key={`c-${decisionKey}`}>
              <motion.line x1={PAD_L} x2={W - PAD_R} y1={cy} y2={cy} stroke="var(--reagent)" strokeWidth={3}
                initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }} />
              <text x={PAD_L - 10} y={cy + 4} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--reagent)" className="num">
                {ceiling!.watts} W
              </text>
              <motion.text x={PAD_L + 6} y={cy + 18} textAnchor="start" fontSize="14" fontWeight="700" fill="var(--reagent)" className="num" stroke="var(--background)" strokeWidth={5} paintOrder="stroke"
                initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.7 }}>
                {ceiling!.label}
              </motion.text>
              {firstOver && (
                <motion.text x={x(firstOver.start) + 2} y={y(firstOver.watts) - 8} fontSize="14" fontWeight="700" fill="var(--critical)" className="num"
                  initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1 }}>
                  +{excess} W tachado
                </motion.text>
              )}
            </g>
          )}
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
        {ghost ? (
          <>
            <span className="flex items-center gap-2">
              <span className="h-3 w-4 rounded-[1px] border-[1.5px] border-dashed border-faint bg-foreground/10" /> Plan original
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-4 rounded-[1px] bg-foreground" /> Ajuste del Head Coach
            </span>
          </>
        ) : (
          <span className="flex items-center gap-2">
            <span className="h-3 w-4 rounded-[1px] bg-foreground/80" /> Plan del día (más claro = más intenso)
          </span>
        )}
        {showCeiling && (
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-4 bg-reagent" /> {ceiling!.label} {ceiling!.watts} W ({ceiling!.reason})
          </span>
        )}
        {overBlocks.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="h-3 w-4 rounded-[1px]" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--critical) 0 3px, transparent 3px 6px)" }} />
            Por encima del techo
          </span>
        )}
      </figcaption>
    </figure>
  );
}
