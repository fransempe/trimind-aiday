"use client";

import { Bed, CircleCheck, CircleSlash, PencilLine, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ImpactLevel, Intensity, ReadinessBand, Recommendation, Sport } from "@/lib/types";

/** Hoja del protocolo: superficie con filete de cabecera, sin sombra ni esquinas blandas. */
export function Panel({
  title,
  action,
  className,
  children,
  glow,
  id,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  glow?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        "relative border-t border-rule-strong pb-2 transition-colors duration-500",
        glow && "border-t-2 border-reagent",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex min-h-12 items-center justify-between gap-3 border-b border-rule py-2.5">
          {title && (
            <h2 id={id ? `${id}-title` : undefined} className="text-[15px] font-semibold tracking-[-0.005em]">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[40px] leading-none font-bold tracking-[-0.025em] [font-stretch:68%]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-[68ch] text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export const BAND_META: Record<ReadinessBand, { label: string; color: string; text: string }> = {
  green: { label: "Listo para entrenar", color: "var(--good)", text: "text-good" },
  amber: { label: "Precaución", color: "var(--warning)", text: "text-warning" },
  red: { label: "Recuperación comprometida", color: "var(--critical)", text: "text-critical" },
};

export const DECISION_META: Record<
  Recommendation,
  { label: string; sub: string; color: string; text: string; icon: typeof CircleCheck }
> = {
  train: { label: "Train", sub: "Mantener el plan", color: "var(--good)", text: "text-good", icon: CircleCheck },
  modify: { label: "Modify", sub: "Ajustar la sesión", color: "var(--warning)", text: "text-warning", icon: PencilLine },
  rest: { label: "Recover", sub: "Descanso", color: "var(--critical)", text: "text-critical", icon: Bed },
};

/** Sello de recomendación: borde fino, mayúsculas condensadas e ícono (nunca solo color). */
export function DecisionBadge({ value, size = "sm" }: { value: Recommendation; size?: "sm" | "lg" }) {
  const m = DECISION_META[value];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] border font-semibold uppercase tracking-[0.04em] [font-stretch:76%]",
        size === "lg" ? "px-2.5 py-1 text-[15px]" : "px-1.5 py-0.5 text-[12px]",
        m.text,
      )}
      style={{ borderColor: `color-mix(in oklab, ${m.color} 55%, transparent)` }}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3.5"} strokeWidth={2} />
      {m.label}
    </span>
  );
}

const IMPACT_META: Record<ImpactLevel, { label: string; size: number; color: string }> = {
  low: { label: "Bajo", size: 6, color: "var(--faint)" },
  moderate: { label: "Moderado", size: 10, color: "var(--muted-foreground)" },
  high: { label: "Alto", size: 15, color: "var(--critical)" },
};

/** Rampa fija de magnitudes: el diámetro del punto lleva el nivel, la etiqueta lo confirma. */
export function ImpactMeter({ level }: { level: ImpactLevel }) {
  const m = IMPACT_META[level];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid grid-cols-1 size-4 place-items-center" aria-hidden>
        <span className="rounded-full" style={{ width: m.size, height: m.size, background: m.color }} />
      </span>
      <span className="w-16 text-[13px] text-muted-foreground">{m.label}</span>
    </span>
  );
}

export const SPORT_META: Record<Sport, { label: string; color: string }> = {
  swim: { label: "Natación", color: "var(--swim)" },
  bike: { label: "Ciclismo", color: "var(--bike)" },
  run: { label: "Running", color: "var(--run)" },
  strength: { label: "Fuerza", color: "var(--chart-5)" },
};

export function SportDot({ sport }: { sport: Sport }) {
  return <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: SPORT_META[sport].color }} />;
}

export const INTENSITY_META: Record<Intensity, { label: string; zone: string; color: string }> = {
  // Rampa de valor grafito → hueso: más claro = más intenso. Los colores de deporte
  // quedan solo para deportes y el ámbar solo para techos y lo que espera al atleta.
  recovery: { label: "Recuperación", zone: "Z1", color: "#3d4247" },
  endurance: { label: "Resistencia", zone: "Z2", color: "#6b675f" },
  tempo: { label: "Tempo", zone: "Z3", color: "#9a9487" },
  sweet_spot: { label: "Sweet spot", zone: "Z3-4", color: "#c4bdaf" },
  threshold: { label: "Umbral", zone: "Z4", color: "#e2dccf" },
  vo2max: { label: "VO2max", zone: "Z5", color: "#f7f3ea" },
  anaerobic: { label: "Anaeróbico", zone: "Z6", color: "#ffffff" },
};

export function RuleBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex items-center gap-1 text-[13px] text-good">
      <CircleCheck className="size-3.5" /> Reglas OK
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[13px] text-warning">
      <TriangleAlert className="size-3.5" /> Regla violada
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 border-t border-dashed border-rule-strong pt-4 text-[14px] text-muted-foreground">
      <CircleSlash className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  );
}

/** Lectura de planilla: celda de una franja de lecturas separadas por filetes. */
export function StatTile({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  detail?: ReactNode;
}) {
  return (
    <div className="py-3 pr-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 leading-none">
        <span className="num text-[28px] font-semibold">{value}</span>
        {unit && <span className="ml-1 text-[13px] text-muted-foreground">{unit}</span>}
      </p>
      {detail && <p className="mt-1.5 text-[12px] text-muted-foreground">{detail}</p>}
    </div>
  );
}
