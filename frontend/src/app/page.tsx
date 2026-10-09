"use client";

import { MessagesSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";
import { TopBar } from "@/components/layout/top-bar";
import { MonthView, WeekView } from "@/components/today/calendar-views";
import { DayView } from "@/components/today/day-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchedule } from "@/lib/use-schedule";

const TABS = ["day", "week", "month", "ask"] as const;
type Tab = (typeof TABS)[number];

function TodayTabs() {
  const { today, schedule } = useSchedule(42);
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("tab");
  const tab: Tab = TABS.includes(q as Tab) ? (q as Tab) : "day";

  return (
    <Tabs value={tab} onValueChange={(v) => router.replace(v === "day" ? "/" : `/?tab=${v}`, { scroll: false })} className="gap-6">
      <TabsList aria-label="Vista">
        <TabsTrigger value="day">Hoy</TabsTrigger>
        <TabsTrigger value="week">Semana</TabsTrigger>
        <TabsTrigger value="month">Mes</TabsTrigger>
        <TabsTrigger value="ask" className="gap-1.5">
          <MessagesSquare className="size-3.5" /> Ask Coaches
        </TabsTrigger>
      </TabsList>
      <TabsContent value="day">
        <DayView items={today} />
      </TabsContent>
      <TabsContent value="week">
        <WeekView schedule={schedule} />
      </TabsContent>
      <TabsContent value="month">
        <MonthView schedule={schedule} />
      </TabsContent>
      {/* Montada siempre: la conversación no se pierde al cambiar de pestaña. */}
      <TabsContent value="ask" forceMount className="data-[state=inactive]:hidden">
        <AskChat />
      </TabsContent>
    </Tabs>
  );
}

export default function TodayPage() {
  const date = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <TopBar title="Today" subtitle={`Tu entrenamiento en tus horarios disponibles · ${date}`} />
      <Suspense>
        <TodayTabs />
      </Suspense>
    </div>
  );
}
