"use client";

import { Activity, DatabaseZap, Flag, Gauge, HeartPulse, House, Microscope, Settings, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DeviceLed } from "@/components/device-led";
import { connectedProviders, PROVIDER_META, useSetup } from "@/lib/setup";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/inicio", label: "Inicio", icon: House },
  { href: "/", label: "Today", icon: Gauge },
  { href: "/analisis", label: "Análisis del staff", icon: Microscope },
  { href: "/training", label: "Training", icon: Activity },
  { href: "/performance", label: "Performance", icon: TrendingUp },
  { href: "/recovery", label: "Recovery", icon: HeartPulse },
  { href: "/race", label: "Race", icon: Flag },
  { href: "/athlete", label: "Athlete", icon: User },
  { href: "/datos", label: "Datos importados", icon: DatabaseZap },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function useNav() {
  const completed = useSetup((s) => s.completed);
  return NAV.filter((n) => n.href !== "/inicio" || !completed);
}

function Wordmark() {
  return (
    <Link href="/" className="block leading-none">
      <span className="block text-[26px] font-bold tracking-[-0.02em] [font-stretch:66%]">
        TriMind<span className="text-reagent">.</span>
      </span>
      <span className="mt-1 block text-[11px] text-muted-foreground">Staff de entrenadores IA</span>
    </Link>
  );
}

function DevicesStatus() {
  const devices = useSetup((s) => s.devices);
  const on = connectedProviders(devices);
  return (
    <Link href="/datos" className="block border-t border-sidebar-border pt-3 text-[13px] hover:text-foreground">
      <span className="flex items-center gap-2 font-semibold">
        <DeviceLed on={on.length > 0} />
        {on.length ? `${on.length} ${on.length === 1 ? "dispositivo conectado" : "dispositivos conectados"}` : "Sin dispositivos"}
      </span>
      <span className="mt-1 block pl-[18px] text-muted-foreground">
        {on.length ? on.map((p) => PROVIDER_META[p].label).join(" · ") : "Conectá Garmin, Strava o Wahoo"}
      </span>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const nav = useNav();
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Wordmark />
        <nav className="mt-9 flex flex-col">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 border-t border-sidebar-border py-2.5 text-[14px] text-muted-foreground transition-colors last:border-b hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                <Icon className={cn("size-4", active && "text-reagent")} strokeWidth={1.75} />
                <span className={cn(active && "font-semibold")}>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-reagent" aria-hidden />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <DevicesStatus />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            4 especialistas y un Head Coach. Apoyo al entrenamiento, no diagnóstico médico.
          </p>
        </div>
      </aside>

      <div className="z-30 border-b border-sidebar-border bg-sidebar lg:hidden">
        <div className="px-4 pt-3">
          <Wordmark />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[13px] text-muted-foreground",
                pathname === href && "bg-sidebar-accent text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
