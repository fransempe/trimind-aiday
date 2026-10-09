import { DisciplineSheet } from "@/components/analysis/discipline-sheet";
import { AgentChat } from "@/components/agent-chat";
import { TopBar } from "@/components/layout/top-bar";
import { ConclusionSheet } from "@/components/today/conclusion-sheet";
import { ReadinessSheet } from "@/components/today/readiness-sheet";
import { ScenarioControl } from "@/components/today/scenario-control";
import { StationsSheet } from "@/components/today/stations-sheet";
import { TraceSheet } from "@/components/today/trace-sheet";
import { WhyPanel } from "@/components/today/why-panel";

export default function AnalisisPage() {
  return (
    <div className="space-y-12">
      <TopBar title="Análisis del staff" subtitle="Cómo venís en cada disciplina y qué decidieron los agentes de IA para hoy." />

      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DisciplineSheet />
        </div>
        <div className="space-y-10 xl:col-span-4">
          <ReadinessSheet />
          <ScenarioControl />
        </div>
      </div>

      <section aria-labelledby="ai-results" className="space-y-10 border-t-2 border-rule-strong pt-6">
        <div>
          <h2 id="ai-results" className="text-[22px] font-bold tracking-[-0.01em] [font-stretch:80%]">Resultados de la IA</h2>
          <p className="mt-1 max-w-[70ch] text-[14px] text-muted-foreground">
            Cinco especialistas opinan en paralelo, el Head Coach decide y las reglas validan. Tocá Ask Coaching Team en la banda superior para correrlo.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-12">
          <div className="space-y-10 xl:col-span-8">
            <ConclusionSheet compact />
            <WhyPanel />
            <AgentChat agent="head_coach" suggestions={["¿Por qué decidiste esto hoy?", "¿Qué pasa si igual hago la sesión completa?", "¿Cómo llego a la carrera?"]} />
          </div>
          <div className="space-y-10 xl:col-span-4">
            <StationsSheet compact />
            <TraceSheet />
          </div>
        </div>
      </section>
    </div>
  );
}
