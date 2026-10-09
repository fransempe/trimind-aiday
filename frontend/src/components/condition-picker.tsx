"use client";

import { Check } from "lucide-react";
import { CONDITION_META, type DietCondition, useSetup } from "@/lib/setup";
import { cn } from "@/lib/utils";

/** Condiciones alimentarias (celiaquía, lactosa, diabetes, vegetariano): adaptan el plan de comidas. */
export function ConditionPicker({ label }: { label?: string }) {
  const conditions = useSetup((s) => s.conditions);
  const toggle = useSetup((s) => s.toggleCondition);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="mr-1 text-[14px] text-muted-foreground">{label}</span>}
      {(Object.keys(CONDITION_META) as DietCondition[]).map((c) => {
        const on = conditions.includes(c);
        return (
          <button key={c} type="button" onClick={() => toggle(c)} aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
              on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}>
            {on && <Check className="size-3.5" />} {CONDITION_META[c].label}
          </button>
        );
      })}
    </div>
  );
}
