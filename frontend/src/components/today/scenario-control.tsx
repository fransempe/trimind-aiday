"use client";

import { FlaskConical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Panel } from "@/components/shared";
import { formatSleep } from "@/lib/engine";
import { useCoach } from "@/lib/store";
import type { LegsFeeling } from "@/lib/types";

const PRESET_LABELS = { normal: "Normal", fatigued: "Fatigado", recovered: "Recuperado" } as const;
const LEGS: { value: LegsFeeling; label: string }[] = [
  { value: "fresh", label: "Frescas" },
  { value: "normal", label: "Normales" },
  { value: "heavy", label: "Pesadas" },
  { value: "sore", label: "Cargadas" },
];

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-normal text-muted-foreground">{label}</Label>
        <span className="num text-[16px] font-semibold">{value}</span>
      </div>
      {children}
    </div>
  );
}

export function ScenarioControl({ compact = false }: { compact?: boolean }) {
  const inputs = useCoach((s) => s.inputs);
  const preset = useCoach((s) => s.preset);
  const setInputs = useCoach((s) => s.setInputs);
  const applyPreset = useCoach((s) => s.applyPreset);

  return (
    <Panel
      id="conditions"
      title={
        <span className="flex items-center gap-2">
          <FlaskConical className="size-4 text-muted-foreground" strokeWidth={1.75} /> Condiciones del test
        </span>
      }
    >
      {!compact && (
        <div className="mb-5">
          <p className="mb-2 text-[13px] text-muted-foreground">Escenarios de demo</p>
          <ToggleGroup
            type="single"
            variant="outline"
            value={preset === "custom" ? "" : preset}
            onValueChange={(v) => v && applyPreset(v as keyof typeof PRESET_LABELS)}
            className="w-full"
          >
            {Object.entries(PRESET_LABELS).map(([k, label]) => (
              <ToggleGroupItem key={k} value={k} className="flex-1 text-[13px]">
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      <div className="space-y-5">
        <Row label="Sueño" value={formatSleep(inputs.sleep_hours)}>
          <Slider min={4} max={9.5} step={0.05} value={[inputs.sleep_hours]}
            onValueChange={([v]) => setInputs({ sleep_hours: v })} />
        </Row>
        <Row label="HRV vs. baseline 30 días" value={`${inputs.hrv_deviation_pct > 0 ? "+" : ""}${inputs.hrv_deviation_pct.toFixed(0)}%`}>
          <Slider min={-35} max={15} step={1} value={[inputs.hrv_deviation_pct]}
            onValueChange={([v]) => setInputs({ hrv_deviation_pct: v })} />
        </Row>
        <Row label="Fatiga percibida (RPE)" value={inputs.rpe ? `${inputs.rpe}/10` : "—"}>
          <Slider min={1} max={10} step={1} value={[inputs.rpe ?? 5]} onValueChange={([v]) => setInputs({ rpe: v })} />
        </Row>
        <div className="space-y-2">
          <Label className="text-[13px] font-normal text-muted-foreground">Sensación de piernas</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={inputs.legs}
            onValueChange={(v) => v && setInputs({ legs: v as LegsFeeling })} className="w-full">
            {LEGS.map((l) => (
              <ToggleGroupItem key={l.value} value={l.value} className="flex-1 text-[13px]">
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between border-t border-rule pt-4">
          <Label htmlFor="hard-run" className="text-[14px] font-normal">Ayer: run fuerte (umbral 5x6&apos;)</Label>
          <Switch id="hard-run" checked={inputs.hard_run_yesterday}
            onCheckedChange={(v) => setInputs({ hard_run_yesterday: v })} />
        </div>
      </div>
    </Panel>
  );
}
