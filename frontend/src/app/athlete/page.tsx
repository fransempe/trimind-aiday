"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Panel } from "@/components/shared";
import { formatPace } from "@/lib/engine";
import { CONDITION_META, FITNESS_META, PROFILE_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

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
    ["Condiciones alimentarias", setup.conditions.length ? setup.conditions.map((c) => CONDITION_META[c].label).join(", ") : "Ninguna"],
  ];

  return (
    <div className="space-y-10">
      <TopBar title="Athlete" subtitle="Tu perfil y tus umbrales." />
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
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
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="num text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[14px]">
            <Link href="/configuracion" className="underline">Editar perfil, peso, altura, horarios y condiciones en Configuración</Link>
          </p>
        </Panel>
        <Panel title="Base de conocimiento">
          <p className="max-w-[60ch] text-[14px] text-muted-foreground">
            Lo que el staff sabe de vos: cómo venís entrenando, tus carreras con sus resultados y comentarios, y un análisis de
            tus características como atleta y tus oportunidades de mejora.
          </p>
          <Link href="/conocimiento" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold hover:underline">
            Ver la base de conocimiento <ArrowRight className="size-4" />
          </Link>
        </Panel>
      </div>
    </div>
  );
}
