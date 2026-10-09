"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeviceLed } from "@/components/device-led";
import { TopBar } from "@/components/layout/top-bar";
import { ProfileForm } from "@/components/profile-form";
import { Panel } from "@/components/shared";
import { SlotsEditor } from "@/components/slots-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PROVIDER_META, type Provider, useSetup } from "@/lib/setup";

export default function ConfiguracionPage() {
  const router = useRouter();
  const s = useSetup();

  return (
    <div className="space-y-10">
      <TopBar title="Configuración" subtitle="Tu perfil quedó guardado. Cambiá acá lo que necesites: se aplica al plan y al día al instante." />

      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-2">
        <Panel id="cfg-profile" title="Perfil y datos corporales">
          <ProfileForm />
        </Panel>

        <Panel id="cfg-slots" title="Horarios disponibles para entrenar">
          <SlotsEditor />
        </Panel>

        <Panel id="cfg-devices" title="Dispositivos"
          action={
            <Link href="/datos" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
              Datos importados <ArrowRight className="size-3.5" />
            </Link>
          }>
          {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
            <div key={p} className="flex items-center justify-between gap-4 border-t border-rule py-3 first:border-t-0">
              <div className="flex items-center gap-3">
                <DeviceLed on={s.devices[p]} />
                <div>
                  <Label htmlFor={`cfg-dev-${p}`} className="text-[15px] font-semibold">{PROVIDER_META[p].label}</Label>
                  <p className="text-[13px] text-muted-foreground">{PROVIDER_META[p].imports}</p>
                </div>
              </div>
              <Switch id={`cfg-dev-${p}`} checked={s.devices[p]} onCheckedChange={(v) => s.setDevice(p, v)} />
            </div>
          ))}
        </Panel>

        <Panel id="cfg-onboarding" title="Empezar de nuevo">
          <p className="mb-4 max-w-[60ch] text-[14px] text-muted-foreground">
            Volvé a pasar por el onboarding si cambiaste de disciplina o de momento de entrenamiento. Tu agenda de carreras se mantiene.
          </p>
          <Button variant="outline" onClick={() => { s.restart(); router.push("/inicio"); }} className="gap-2">
            <RotateCcw className="size-4" /> Rehacer el onboarding
          </Button>
        </Panel>
      </div>
    </div>
  );
}
