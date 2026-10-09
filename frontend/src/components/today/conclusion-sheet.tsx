"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CeilingProfile } from "@/components/ceiling-profile";
import { DECISION_META, Panel, RuleBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { WorkoutSteps } from "@/components/workout-profile";
import { intensityCeiling } from "@/lib/ceiling";
import { formatDuration } from "@/lib/engine";
import { SPECIALISTS } from "@/lib/agents";
import { useCoach } from "@/lib/store";

function DecisionWord() {
  const decision = useCoach((s) => s.decision);
  const runStatus = useCoach((s) => s.runStatus);
  const done = useCoach((s) => Object.entries(s.agentStatus).filter(([k, v]) => k !== "head_coach" && v === "done").length);

  if (!decision) {
    return (
      <div className="space-y-4">
        <p className="text-[56px] leading-[0.9] font-bold tracking-[-0.03em] text-faint [font-stretch:62%]">
          {runStatus === "running" ? "Analizando" : "Sin conclusión"}
        </p>
        {runStatus === "running" ? (
          <p className="flex items-center gap-2 text-[15px] text-muted-foreground" aria-live="polite">
            <Loader2 className="size-4 animate-spin text-reagent" />
            {done} de {SPECIALISTS.length} especialistas listos. El Head Coach decide cuando terminen todos.
          </p>
        ) : (
          <>
            <p className="max-w-[52ch] text-[15px] text-muted-foreground">
              Tocá <span className="font-semibold text-foreground">Ask Coaching Team</span> en la banda superior: cinco
              especialistas opinan en paralelo y el Head Coach decide si mantener, modificar o descansar.
            </p>
          </>
        )}
      </div>
    );
  }

  const m = DECISION_META[decision.decision];
  const Icon = m.icon;
  return (
    <motion.div key={decision.primary_reason} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
      <p className={`flex items-center gap-3 text-[72px] leading-[0.85] font-bold uppercase tracking-[-0.02em] [font-stretch:62%] ${m.text}`}>
        <Icon className="size-12 shrink-0" strokeWidth={2.25} aria-hidden />
        {m.label}
      </p>
      <div className="space-y-3">
        <p className="max-w-[36ch] text-[24px] leading-[1.2] font-semibold tracking-[-0.01em] text-balance">
          {decision.primary_reason}
        </p>
        <p className="max-w-[66ch] text-[15px] leading-relaxed text-muted-foreground">{decision.explanation}</p>
      </div>
    </motion.div>
  );
}

function PlanChange() {
  const decision = useCoach((s) => s.decision);
  if (!decision?.new_workout) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule pt-3 text-[15px]">
      <span className="text-muted-foreground line-through decoration-critical/80 decoration-2">
        {decision.original_workout.title}
      </span>
      <ArrowRight className="size-4 text-reagent" aria-label="se reemplaza por" />
      <span className="font-semibold">{decision.new_workout.title}</span>
    </div>
  );
}

export function Approval() {
  const runStatus = useCoach((s) => s.runStatus);
  const finalStatus = useCoach((s) => s.finalStatus);
  const respond = useCoach((s) => s.respond);

  const onRespond = async (action: "accept" | "reject") => {
    await respond(action);
    toast(action === "accept" ? "Plan actualizado" : "Se mantiene el plan original", {
      description: action === "accept" ? "El entrenamiento de hoy fue reemplazado." : "El Head Coach registra tu decisión.",
    });
  };

  if (runStatus === "awaiting_approval") {
    return (
      <div className="space-y-3 rounded-[3px] border border-reagent/60 bg-reagent/[0.06] p-3.5" role="group" aria-label="Aprobación del atleta">
        <p className="text-[14px] font-medium text-reagent">El grafo está en pausa: el atleta tiene que aprobar el cambio.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onRespond("accept")} className="gap-1.5">
            <Check className="size-4" /> Aceptar ajuste
          </Button>
          <Button variant="outline" onClick={() => onRespond("reject")} className="gap-1.5">
            <X className="size-4" /> Mantener plan
          </Button>
        </div>
      </div>
    );
  }
  if (finalStatus === "accepted")
    return (
      <p className="flex items-center gap-1.5 text-[14px] text-good">
        <Check className="size-4" /> Aceptado por el atleta
      </p>
    );
  if (finalStatus === "rejected") return <p className="text-[14px] text-muted-foreground">Rechazado: se mantiene el plan original</p>;
  return null;
}

/** Cierre del protocolo: quién firma, cuándo, qué corrida y si pasó las reglas. */
function Signature() {
  const decision = useCoach((s) => s.decision);
  const rules = useCoach((s) => s.rules);
  const threadId = useCoach((s) => s.threadId);
  const signedAt = useCoach((s) => s.log.at(-1)?.ts);
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-rule pt-3 text-[13px] text-muted-foreground">
      {decision ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-foreground">Firma: Head Coach</span>
          <span className="num">
            {signedAt ? new Date(signedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : ""}
          </span>
          {threadId && <span className="code">{threadId}</span>}
          {rules && <span>{rules.passed ? "Reglas OK" : "Reglas con observaciones"}</span>}
          <span>{decision.rule_retries} reintentos de reglas</span>
        </p>
      ) : (
        <p>Sin firma: el protocolo todavía no corrió.</p>
      )}
      <p>Apoyo al entrenamiento, no diagnóstico médico.</p>
    </div>
  );
}

export function ConclusionSheet({ compact }: { compact?: boolean }) {
  const snapshot = useCoach((s) => s.snapshot);
  const decision = useCoach((s) => s.decision);
  const rules = useCoach((s) => s.rules);
  const active = useCoach((s) => s.activeWorkout);
  const threadId = useCoach((s) => s.threadId);
  const runStatus = useCoach((s) => s.runStatus);

  const original = decision?.original_workout ?? snapshot.planned_workout;
  const revised = decision?.new_workout ?? null;
  const shown = revised ?? (decision ? original : active);

  return (
    <Panel
      id="conclusion"
      title="Conclusión del Head Coach"
      glow={runStatus === "awaiting_approval"}
      action={
        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
          {rules && <RuleBadge passed={rules.passed} />}
          {decision && <span className="num">Confianza {Math.round(decision.confidence * 100)}%</span>}
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="wait">
          <DecisionWord key={decision ? "d" : runStatus} />
        </AnimatePresence>
        <PlanChange />
        <Approval />
      </div>

      <div className="mt-6 min-w-0 border-t border-rule pt-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-[16px] font-semibold">{shown.title}</h3>
          <span className="num text-[14px] text-muted-foreground">
            {formatDuration(shown.total_duration_min)} · TSS {Math.round(shown.planned_tss)}
          </span>
        </div>
        <CeilingProfile
          original={decision ? original : active}
          revised={revised}
          ftp={snapshot.profile.ftp_w}
          ceiling={intensityCeiling(snapshot)}
          decisionKey={decision ? (threadId ?? "decision") : null}
        />
        {!compact && (
          <div className="mt-4 max-w-xl border-t border-rule pt-3">
            <WorkoutSteps workout={shown} />
          </div>
        )}
      </div>
      <Signature />
    </Panel>
  );
}
