"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSessionLog } from "@/lib/session-log";
import { useSetup } from "@/lib/setup";

/** Rehidrata la configuración guardada y manda al onboarding si todavía no se completó. */
export function SetupGate() {
  const pathname = usePathname();
  const router = useRouter();
  const completed = useSetup((s) => s.completed);
  // En el servidor no hay localStorage y zustand no adjunta la API de persist.
  const [ready, setReady] = useState(() => useSetup.persist?.hasHydrated() ?? false);

  useEffect(() => {
    const api = useSetup.persist;
    if (!api) return;
    const unsub = api.onFinishHydration(() => setReady(true));
    void api.rehydrate();
    void useSessionLog.persist?.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!completed && pathname !== "/inicio") router.replace("/inicio");
    if (completed && pathname === "/inicio") router.replace("/");
  }, [ready, completed, pathname, router]);

  return null;
}
