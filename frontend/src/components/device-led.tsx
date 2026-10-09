"use client";

import { cn } from "@/lib/utils";

/** LED de estado de dispositivo: verde parpadeando = conectado; gris = sin conexión. */
export function DeviceLed({ on, className }: { on: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2.5 shrink-0", className)} aria-hidden>
      {on && <span className="absolute inset-0 animate-ping rounded-full bg-good opacity-60 motion-reduce:hidden" />}
      <span className={cn("relative inline-flex size-2.5 rounded-full", on ? "bg-good" : "bg-faint")} />
    </span>
  );
}
