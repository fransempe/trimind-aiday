"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sortSlots, useSetup } from "@/lib/setup";

const DURATIONS = [30, 45, 60, 75, 90, 120, 180, 240];

/** Horarios disponibles para entrenar: el staff acomoda las sesiones del día en estas franjas. */
export function SlotsEditor() {
  const { slots, addSlot, updateSlot, removeSlot } = useSetup();
  return (
    <div>
      <ul>
        {sortSlots(slots).map((s) => (
          <li key={s.id} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 border-t border-rule py-2.5 first:border-t-0">
            <Input type="time" value={s.time} aria-label="Hora de inicio" onChange={(e) => e.target.value && updateSlot(s.id, { time: e.target.value })} className="num text-[16px]" />
            <Select value={String(s.minutes)} onValueChange={(v) => updateSlot(s.id, { minutes: Number(v) })}>
              <SelectTrigger className="w-full max-w-44" aria-label="Tiempo disponible"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60} min` : ""}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => removeSlot(s.id)} aria-label={`Quitar horario ${s.time}`}>
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={addSlot} className="mt-2 gap-1.5">
        <Plus className="size-3.5" /> Agregar horario
      </Button>
    </div>
  );
}
