"use client";

import { Bike, Check, Dumbbell, Footprints, Repeat, Waves } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeviceLed } from "@/components/device-led";
import { SlotsEditor } from "@/components/slots-editor";
import { PageHead } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type EnduranceProfile,
  FITNESS_META,
  type FitnessState,
  PROFILE_META,
  PROVIDER_META,
  type Provider,
  useSetup,
} from "@/lib/setup";
import { cn } from "@/lib/utils";

const PROFILE_ICON: Record<EnduranceProfile, typeof Bike> = {
  running: Footprints,
  cycling: Bike,
  duathlon: Repeat,
  triathlon: Waves,
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-rule-strong pt-4 lg:grid-cols-[14rem_1fr] lg:gap-10">
      <div>
        <p className="num text-[13px] text-muted-foreground">Paso {n} de 4</p>
        <h2 className="mt-1 text-[22px] leading-tight font-bold [font-stretch:72%]">{title}</h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Choice<T extends string>({
  value,
  selected,
  onSelect,
  label,
  detail,
  icon: Icon,
}: {
  value: T;
  selected: boolean;
  onSelect: (v: T) => void;
  label: string;
  detail: string;
  icon?: typeof Bike;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-center gap-3 border-t border-rule py-3 text-left transition-colors first:border-t-0 hover:text-foreground",
        selected ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          selected ? "border-foreground bg-foreground text-background" : "border-rule-strong",
        )}
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      {Icon && <Icon className="size-5 shrink-0" strokeWidth={1.75} />}
      <span className="min-w-0">
        <span className={cn("block text-[16px]", selected && "font-semibold")}>{label}</span>
        <span className="block text-[13px] text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

export default function InicioPage() {
  const router = useRouter();
  const s = useSetup();

  const start = () => {
    s.complete();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHead
        title="Inicio"
        subtitle="Contale al staff quién sos. Con esto arma tu plan, elige qué carreras mostrarte y sabe de dónde vienen tus datos."
      />

      <Step n={1} title="¿Qué perfil de endurance tenés?">
        <div role="radiogroup" aria-label="Perfil deportivo" className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {(Object.keys(PROFILE_META) as EnduranceProfile[]).map((p) => (
            <Choice key={p} value={p} selected={s.profile === p} onSelect={(v) => s.update({ profile: v })}
              label={PROFILE_META[p].label} detail={PROFILE_META[p].detail} icon={PROFILE_ICON[p]} />
          ))}
        </div>
      </Step>

      <Step n={2} title="¿Cómo venís entrenando?">
        <div role="radiogroup" aria-label="Estado físico">
          {(Object.keys(FITNESS_META) as FitnessState[]).map((f) => (
            <Choice key={f} value={f} selected={s.fitness === f} onSelect={(v) => s.update({ fitness: v })}
              label={FITNESS_META[f].label} detail={FITNESS_META[f].detail} icon={f === "gym_only" ? Dumbbell : undefined} />
          ))}
        </div>
      </Step>

      <Step n={3} title="¿En qué horarios podés entrenar?">
        <p className="mb-2 text-[14px] text-muted-foreground">
          El staff acomoda cada sesión del día en estas franjas: la sesión clave en la más larga.
        </p>
        <SlotsEditor />
      </Step>

      <Step n={4} title="Datos corporales y dispositivos">
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-[13px] font-normal text-muted-foreground">Peso (kg)</Label>
            <Input id="weight" type="number" inputMode="decimal" min={35} max={150} step={0.5} value={s.weightKg}
              onChange={(e) => s.update({ weightKg: Number(e.target.value) || s.weightKg })} className="num text-[16px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height" className="text-[13px] font-normal text-muted-foreground">Altura (cm)</Label>
            <Input id="height" type="number" inputMode="numeric" min={130} max={220} value={s.heightCm}
              onChange={(e) => s.update({ heightCm: Number(e.target.value) || s.heightCm })} className="num text-[16px]" />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-[13px] text-muted-foreground">Conectá tus cuentas para importar actividades, sueño y HRV.</p>
          {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
            <div key={p} className="flex items-center justify-between gap-4 border-t border-rule py-3">
              <div className="flex items-center gap-3">
                <DeviceLed on={s.devices[p]} />
                <div>
                  <Label htmlFor={`dev-${p}`} className="text-[15px] font-semibold">{PROVIDER_META[p].label}</Label>
                  <p className="text-[13px] text-muted-foreground">{PROVIDER_META[p].imports}</p>
                </div>
              </div>
              <Switch id={`dev-${p}`} checked={s.devices[p]} onCheckedChange={(v) => s.setDevice(p, v)} />
            </div>
          ))}
        </div>
      </Step>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule-strong pt-6">
        <Button size="lg" onClick={start} className="gap-2">
          <Check className="size-4" /> Empezar con este perfil
        </Button>
        <p className="text-[13px] text-muted-foreground">
          Queda guardado; podés cambiarlo cuando quieras desde Configuración. Los escenarios de Today usan el triatleta de la demo.
        </p>
      </div>
    </div>
  );
}
