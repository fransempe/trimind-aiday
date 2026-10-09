"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SPORT_META } from "@/components/shared";
import type { DailyPoint } from "@/lib/types";

// Estilo común: grilla y ejes recesivos, líneas de 2px, barras con punta redondeada de 4px.
const AXIS = { stroke: "var(--axis)", fontSize: 11, tickLine: false, axisLine: false } as const;
const GRID = <CartesianGrid stroke="var(--grid)" vertical={false} />;

export function dayLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

interface TipRow {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
}

function Tip({
  active,
  payload,
  label,
  unit,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TipRow[];
  label?: string | number;
  unit?: string;
  labelFormatter?: (l: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[3px] border border-border bg-popover px-3 py-2 text-[13px] shadow-xl">
      <p className="num mb-1 text-muted-foreground">{labelFormatter ? labelFormatter(label ?? "") : label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="num text-foreground">
            {typeof p.value === "number" ? p.value.toLocaleString("es-AR", { maximumFractionDigits: 1 }) : String(p.value)}
            {unit ? ` ${unit}` : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={i.dashed ? { borderTop: `2px dashed ${i.color}`, height: 0 } : { background: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Frame({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

const fmtDay = (l: string | number) => dayLabel(Number(l));

/** CTL (fitness) y ATL (fatiga): misma unidad, un solo eje. */
export function LoadChart({ data, height = 240 }: { data: DailyPoint[]; height?: number }) {
  return (
    <div className="space-y-3">
      <Legend items={[{ label: "CTL · fitness (42 d)", color: "var(--foreground)" }, { label: "ATL · fatiga (7 d)", color: "var(--chart-5)" }]} />
      <Frame height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          {GRID}
          <XAxis dataKey="day_offset" tickFormatter={fmtDay} {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} domain={["dataMin - 10", "dataMax + 10"]} tickFormatter={(v) => Math.round(v).toString()} />
          <Tooltip content={<Tip unit="TSS/d" labelFormatter={fmtDay} />} cursor={{ stroke: "var(--axis)" }} />
          <Line type="monotone" dataKey="ctl" name="CTL" stroke="var(--foreground)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
          <Line type="monotone" dataKey="atl" name="ATL" stroke="var(--chart-5)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
        </LineChart>
      </Frame>
    </div>
  );
}

/** TSB: balance de forma, separado porque cruza el cero. */
export function FormChart({ data, height = 160 }: { data: DailyPoint[]; height?: number }) {
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        {GRID}
        <XAxis dataKey="day_offset" tickFormatter={fmtDay} {...AXIS} minTickGap={24} />
        <YAxis {...AXIS} />
        <ReferenceLine y={0} stroke="var(--axis)" />
        <Tooltip content={<Tip labelFormatter={fmtDay} />} cursor={{ stroke: "var(--axis)" }} />
        <Area type="monotone" dataKey="tsb" name="TSB" stroke="var(--foreground)" strokeWidth={2} fill="var(--foreground)" fillOpacity={0.1} />
      </AreaChart>
    </Frame>
  );
}

export interface WeekVolume {
  week: string;
  swim: number;
  bike: number;
  run: number;
}

export function weeklyVolume(daily: DailyPoint[]): WeekVolume[] {
  const weeks: WeekVolume[] = [];
  for (let w = 0; w < 6; w++) {
    const days = daily.filter((d) => Math.floor((d.day_offset + 42) / 7) === w);
    weeks.push({
      week: `S${w + 1}`,
      swim: Math.round((days.reduce((a, d) => a + d.swim_min, 0) / 60) * 10) / 10,
      bike: Math.round((days.reduce((a, d) => a + d.bike_min, 0) / 60) * 10) / 10,
      run: Math.round((days.reduce((a, d) => a + d.run_min, 0) / 60) * 10) / 10,
    });
  }
  return weeks;
}

/** Horas por semana apiladas por deporte. */
export function WeeklyVolumeChart({ data, height = 240 }: { data: WeekVolume[]; height?: number }) {
  const sports = ["swim", "bike", "run"] as const;
  return (
    <div className="space-y-3">
      <Legend items={sports.map((s) => ({ label: SPORT_META[s].label, color: SPORT_META[s].color }))} />
      <Frame height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          {GRID}
          <XAxis dataKey="week" {...AXIS} />
          <YAxis {...AXIS} tickFormatter={(v) => `${v}h`} />
          <Tooltip content={<Tip unit="h" />} cursor={{ fill: "rgb(255 255 255 / 0.03)" }} />
          {sports.map((s, i) => (
            <Bar key={s} dataKey={s} name={SPORT_META[s].label} stackId="v" fill={SPORT_META[s].color} maxBarSize={24}
              stroke="var(--card)" strokeWidth={2} radius={i === sports.length - 1 ? [4, 4, 0, 0] : 0} />
          ))}
        </BarChart>
      </Frame>
    </div>
  );
}

/** HRV diario contra su baseline de 30 días (misma unidad). */
export function HrvChart({ data, height = 220 }: { data: { day_offset: number; hrv: number; baseline: number | null }[]; height?: number }) {
  return (
    <div className="space-y-3">
      <Legend items={[{ label: "HRV (rMSSD)", color: "var(--foreground)" }, { label: "Baseline 30 días", color: "var(--axis)", dashed: true }]} />
      <Frame height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          {GRID}
          <XAxis dataKey="day_offset" tickFormatter={(l) => (l === 0 ? "Hoy" : dayLabel(l))} {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={(v) => Math.round(v).toString()} />
          <Tooltip content={<Tip unit="ms" labelFormatter={(l) => (l === 0 ? "Hoy" : dayLabel(Number(l)))} />} cursor={{ stroke: "var(--axis)" }} />
          <Line type="monotone" dataKey="baseline" name="Baseline" stroke="var(--axis)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="hrv" name="HRV" stroke="var(--foreground)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
        </LineChart>
      </Frame>
    </div>
  );
}

export function SleepChart({ data, height = 200 }: { data: { day_offset: number; sleep: number }[]; height?: number }) {
  return (
    <Frame height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        {GRID}
        <XAxis dataKey="day_offset" tickFormatter={(l) => (l === 0 ? "Hoy" : dayLabel(l))} {...AXIS} minTickGap={16} />
        <YAxis {...AXIS} domain={[0, 10]} tickFormatter={(v) => `${v}h`} />
        <ReferenceLine y={8} stroke="var(--axis)" strokeDasharray="4 4" />
        <Tooltip content={<Tip unit="h" labelFormatter={(l) => (l === 0 ? "Hoy" : dayLabel(Number(l)))} />} cursor={{ fill: "rgb(255 255 255 / 0.03)" }} />
        <Bar dataKey="sleep" name="Sueño" fill="var(--foreground)" fillOpacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={14} />
      </BarChart>
    </Frame>
  );
}

export function SimpleLineChart({
  data,
  x,
  y,
  name,
  unit,
  color = "var(--foreground)",
  height = 220,
  area = false,
}: {
  data: Record<string, number | string>[];
  x: string;
  y: string;
  name: string;
  unit?: string;
  color?: string;
  height?: number;
  area?: boolean;
}) {
  const Chart = area ? AreaChart : LineChart;
  return (
    <Frame height={height}>
      <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        {GRID}
        <XAxis dataKey={x} {...AXIS} />
        <YAxis {...AXIS} domain={["dataMin - 10", "dataMax + 10"]} tickFormatter={(v) => Math.round(v).toString()} />
        <Tooltip content={<Tip unit={unit} />} cursor={{ stroke: "var(--axis)" }} />
        {area ? (
          <Area type="monotone" dataKey={y} name={name} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.1}
            dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
        ) : (
          <Line type="monotone" dataKey={y} name={name} stroke={color} strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} />
        )}
      </Chart>
    </Frame>
  );
}
