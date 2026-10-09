"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type EnduranceProfile, FITNESS_META, type FitnessState, PROFILE_META, useSetup } from "@/lib/setup";

/** Perfil deportivo, estado y datos corporales. Se guarda al instante en el navegador. */
export function ProfileForm() {
  const s = useSetup();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-[13px] font-normal text-muted-foreground">Perfil de endurance</Label>
        <Select value={s.profile} onValueChange={(v) => s.update({ profile: v as EnduranceProfile })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(PROFILE_META) as EnduranceProfile[]).map((k) => (
              <SelectItem key={k} value={k}>{PROFILE_META[k].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[13px] font-normal text-muted-foreground">Cómo venís entrenando</Label>
        <Select value={s.fitness} onValueChange={(v) => s.update({ fitness: v as FitnessState })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(FITNESS_META) as FitnessState[]).map((k) => (
              <SelectItem key={k} value={k}>{FITNESS_META[k].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cfg-weight" className="text-[13px] font-normal text-muted-foreground">Peso (kg)</Label>
        <Input id="cfg-weight" type="number" inputMode="decimal" min={35} max={150} step={0.5} value={s.weightKg}
          onChange={(e) => s.update({ weightKg: Number(e.target.value) || s.weightKg })} className="num text-[16px]" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cfg-height" className="text-[13px] font-normal text-muted-foreground">Altura (cm)</Label>
        <Input id="cfg-height" type="number" inputMode="numeric" min={130} max={220} value={s.heightCm}
          onChange={(e) => s.update({ heightCm: Number(e.target.value) || s.heightCm })} className="num text-[16px]" />
      </div>
    </div>
  );
}
