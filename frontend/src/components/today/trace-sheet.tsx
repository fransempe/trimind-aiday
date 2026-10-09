"use client";

import { useEffect, useRef } from "react";
import { Empty, Panel } from "@/components/shared";
import { useCoach } from "@/lib/store";

/** Observabilidad: cada evento del grafo, con su tiempo relativo. */
export function TraceSheet() {
  const log = useCoach((s) => s.log);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  const t0 = log[0]?.ts ?? 0;
  return (
    <Panel id="trace" title="Traza del grafo">
      {log.length === 0 ? (
        <Empty>La traza muestra cada nodo del grafo a medida que corre: router, especialistas, Head Coach, reglas y aprobación.</Empty>
      ) : (
        <ol ref={list} className="max-h-72 overflow-y-auto pr-1" aria-live="polite">
          {log.map((l, i) => (
            <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-2 border-t border-rule py-1.5 first:border-t-0">
              <span className="code text-right text-muted-foreground">+{((l.ts - t0) / 1000).toFixed(2)}s</span>
              <span className="text-[13px] leading-snug">{l.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
