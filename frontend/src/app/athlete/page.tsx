"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/top-bar";
import { Panel } from "@/components/shared";
import { ScenarioControl } from "@/components/today/scenario-control";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";
import { formatPace } from "@/lib/engine";
import { FITNESS_META, PROFILE_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";
import type { LegsFeeling } from "@/lib/types";

function FeedbackForm() {
  const workout = useCoach((s) => s.activeWorkout);
  const [rpe, setRpe] = useState(5);
  const [legs, setLegs] = useState<LegsFeeling>("normal");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    await api.feedback({ workout_id: workout.id, rpe, legs, comment: comment || undefined });
    setSending(false);
    setComment("");
    toast("Feedback enviado", { description: "El staff lo va a tener en cuenta en la próxima decisión." });
  };

  return (
    <Panel title="Feedback post-entrenamiento">
      <p className="text-sm">
        Sesión: <span className="font-medium">{workout.title}</span>
      </p>
      <div className="mt-5 space-y-5">
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <Label className="text-[13px] text-muted-foreground">Esfuerzo percibido (RPE)</Label>
            <span className="num text-sm">{rpe}/10</span>
          </div>
          <Slider min={1} max={10} step={1} value={[rpe]} onValueChange={([v]) => setRpe(v)} />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] text-muted-foreground">Piernas</Label>
          <ToggleGroup type="single" variant="outline" size="sm" value={legs} onValueChange={(v) => v && setLegs(v as LegsFeeling)} className="w-full">
            {(["fresh", "normal", "heavy", "sore"] as const).map((l) => (
              <ToggleGroupItem key={l} value={l} className="flex-1 text-[13px]">
                {{ fresh: "Frescas", normal: "Normales", heavy: "Pesadas", sore: "Cargadas" }[l]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-[13px] text-muted-foreground">Comentario (opcional)</Label>
          <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Cómo te sentiste, molestias, clima…" />
        </div>
        <Button onClick={submit} disabled={sending} className="w-full gap-2">
          <Send className="size-4" /> Enviar feedback
        </Button>
      </div>
    </Panel>
  );
}

export default function AthletePage() {
  const p = useCoach((s) => s.snapshot.profile);
  const setup = useSetup();
  const rows: [string, string][] = [
    ["Edad", `${p.age} años`],
    ["Peso · altura", `${setup.weightKg} kg · ${setup.heightCm} cm`],
    ["FTP", `${p.ftp_w} W (${(p.ftp_w / setup.weightKg).toFixed(2)} W/kg)`],
    ["Ritmo umbral run", `${formatPace(p.run_threshold_pace_s_per_km)} /km`],
    ["CSS natación", `${formatPace(p.swim_css_s_per_100m)} /100 m`],
    ["FC umbral (LTHR)", `${p.lthr_bpm} lpm`],
  ];

  return (
    <div className="space-y-10">
      <TopBar title="Athlete" subtitle="Tu perfil, el estado de hoy y el feedback para el staff." />
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-3">
        <Panel title="Perfil">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-foreground text-lg font-semibold text-background">
              {p.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-[13px] text-muted-foreground">{PROFILE_META[setup.profile].label} · {FITNESS_META[setup.fitness].label}</p>
            </div>
          </div>
          <dl className="divide-y divide-border text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[14px]">
            <Link href="/configuracion" className="underline">Editar perfil, peso, altura y horarios en Configuración</Link>
          </p>
        </Panel>
        <ScenarioControl />
        <FeedbackForm />
      </div>
    </div>
  );
}
