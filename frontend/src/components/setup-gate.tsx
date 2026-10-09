"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { knowledgeContext, useRaceLog } from "@/lib/race-log";
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
    const setup = useSetup.persist;
    if (!setup) return;
    const unsub = setup.onFinishHydration(() => setReady(true));
    void setup.rehydrate();
    void useSessionLog.persist?.rehydrate();
    // La base de conocimiento vive en el navegador: se la devolvemos al backend para que los agentes la usen.
    void Promise.resolve(useRaceLog.persist?.rehydrate()).then(() => {
      const k = useRaceLog.getState().knowledge;
      if (k) api.restoreKnowledge(knowledgeContext(k)).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!completed && pathname !== "/inicio") router.replace("/inicio");
    if (completed && pathname === "/inicio") router.replace("/");
  }, [ready, completed, pathname, router]);

  return null;
}
