"use client";

import { Loader2, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { connectedProviders, PROVIDER_META, useSetup } from "@/lib/setup";
import { useCoach } from "@/lib/store";

const PHASE = { build: "Bloque de construcción", taper: "Taper", race_week: "Semana de carrera" };

function Field({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-band-muted [font-stretch:78%]">
        {label}
      </span>
      <span className="num text-[15px] font-semibold text-band-ink" suppressHydrationWarning={live}>
        {value}
      </span>
    </div>
  );
}

/** Encabezado del protocolo del día, como la cabecera impresa de un informe de laboratorio. */
export function ProtocolBand() {
  const s = useCoach((st) => st.snapshot);
  const threadId = useCoach((st) => st.threadId);
  const runStatus = useCoach((st) => st.runStatus);
  const runTeam = useCoach((st) => st.runTeam);
  const pathname = usePathname();
  const onToday = pathname === "/" || pathname === "/analisis";
  const devices = useSetup((st) => st.devices);
  const on = connectedProviders(devices);
  const today = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <header className="sticky top-0 z-20 border-b border-black/20 bg-band text-band-ink">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="mr-auto flex items-baseline gap-3">
          <span className="text-[17px] font-bold tracking-tight [font-stretch:72%]">
            Protocolo diario
          </span>
          {threadId ? (
            <span className="code text-band-muted">{threadId}</span>
          ) : (
            <span className="text-[13px] text-band-muted">sin correr</span>
          )}
        </div>
        <Field label="Fecha" value={today} live />
        <Field label="Atleta" value={s.profile.name} />
        <Field label="FTP" value={`${s.profile.ftp_w} W`} />
        <Field label="Carrera" value={`D-${s.days_to_race} · ${s.race.distance}`} />
        <Field label="Fase" value={PHASE[s.race_phase]} />
        <Field label="Datos" value={api.mode === "mock" ? "Mock" : "API en vivo"} />
        <Link href="/datos" className="flex flex-col leading-tight" aria-label="Dispositivos conectados">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-band-muted [font-stretch:78%]">Dispositivos</span>
          <span className="num flex items-center gap-1.5 text-[15px] font-semibold text-band-ink">
            <span className="relative inline-flex size-2.5" aria-hidden>
              {on.length > 0 && <span className="absolute inset-0 animate-ping rounded-full bg-[#1f9d55] opacity-60 motion-reduce:hidden" />}
              <span className={`relative inline-flex size-2.5 rounded-full ${on.length ? "bg-[#1f9d55]" : "bg-band-muted"}`} />
            </span>
            {on.length ? on.map((p) => PROVIDER_META[p].label.split(" ")[0]).join(" · ") : "Ninguno"}
          </span>
        </Link>
        {onToday && (
          <button
            type="button"
            onClick={runTeam}
            disabled={runStatus === "running"}
            className="inline-flex h-9 items-center gap-2 rounded-[3px] bg-band-ink px-3.5 text-[14px] font-semibold text-band transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {runStatus === "running" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {runStatus === "running" ? "Analizando…" : "Ask Coaching Team"}
          </button>
        )}
      </div>
    </header>
  );
}
