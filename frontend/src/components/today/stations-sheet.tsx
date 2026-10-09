"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { DecisionBadge, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { type AgentMeta, HEAD_COACH, SPECIALISTS } from "@/lib/agents";
import { type AgentStatus, useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AskTeamButton({ className, size }: { className?: string; size?: "lg" }) {
  const runStatus = useCoach((s) => s.runStatus);
  const runTeam = useCoach((s) => s.runTeam);
  const running = runStatus === "running";
  return (
    <Button onClick={runTeam} disabled={running} size={size} className={cn("gap-2", className)}>
      {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {running ? "Analizando…" : "Ask Coaching Team"}
    </Button>
  );
}

const STATUS: Record<AgentStatus, { label: string; className: string }> = {
  idle: { label: "En espera", className: "text-faint" },
  pending: { label: "Pendiente", className: "text-muted-foreground" },
  analyzing: { label: "Analizando", className: "text-reagent" },
  done: { label: "Listo", className: "text-good" },
};

function Status({ status }: { status: AgentStatus }) {
  const s = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px]", s.className)}>
      {status === "analyzing" ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <span className={cn("size-1.5 rounded-full", status === "done" ? "bg-good" : "bg-current")} aria-hidden />
      )}
      {s.label}
    </span>
  );
}

const STAGES = ["Snapshot", "Router", "Especialistas", "Head Coach", "Reglas", "Atleta"];

function usePipelineStage(): number {
  return useCoach((s) => {
    if (s.runStatus === "idle") return -1;
    if (s.runStatus === "done") return STAGES.length;
    if (s.runStatus === "awaiting_approval") return 5;
    if (s.rules) return 4;
    if (s.agentStatus.head_coach === "analyzing") return 3;
    if (SPECIALISTS.some((a) => s.agentStatus[a.id] !== "idle")) return 2;
    return 1;
  });
}

function Pipeline() {
  const stage = usePipelineStage();
  return (
    <ol className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px]" aria-label="Etapas del grafo">
      {STAGES.map((label, i) => {
        const state = i < stage ? "done" : i === stage ? "now" : "next";
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-[2px] px-1.5 py-0.5",
                state === "done" && "text-foreground",
                state === "now" && "bg-reagent/15 font-semibold text-reagent",
                state === "next" && "text-faint",
              )}
              aria-current={state === "now" ? "step" : undefined}
            >
              {label}
            </span>
            {i < STAGES.length - 1 && <span className="text-faint" aria-hidden>→</span>}
          </li>
        );
      })}
    </ol>
  );
}

function ScanLine() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden
      className="absolute bottom-0 left-0 h-px w-1/3 bg-reagent"
      initial={{ x: "-100%" }}
      animate={{ x: "300%" }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
    />
  );
}

function StationRow({ agent }: { agent: AgentMeta }) {
  const status = useCoach((s) => s.agentStatus[agent.id]);
  const opinion = useCoach((s) => s.opinions[agent.id]);
  const decision = useCoach((s) => s.decision);
  const Icon = agent.icon;
  const dissent = opinion && decision && opinion.recommendation !== decision.decision;

  return (
    <tr className={cn("relative border-t border-rule align-top", dissent && "bg-reagent/[0.05]")}>
      <td className="relative py-3 pr-3">
        <div className="flex items-start gap-2.5">
          <Icon className={cn("mt-0.5 size-4 shrink-0", status === "analyzing" ? "text-reagent" : "text-muted-foreground")} strokeWidth={1.75} />
          <div>
            <p className="text-[14px] font-semibold leading-tight">
              {agent.name}
              {agent.beta && <span className="ml-1.5 text-[11px] font-medium text-reagent">beta</span>}
            </p>
            <p className="text-[12px] text-muted-foreground">{agent.role}</p>
            {opinion && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:hidden">
                <DecisionBadge value={opinion.recommendation} />
                <span className="num text-[14px] text-muted-foreground">
                  {opinion.score} · {opinion.confidence.toFixed(2)}
                </span>
                {dissent && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-reagent">
                    <TriangleAlert className="size-3" /> Discrepa
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {status === "analyzing" && <ScanLine />}
      </td>
      <td className="py-3 pr-3"><Status status={status} /></td>
      <td className="hidden py-3 pr-3 md:table-cell">
        {opinion ? (
          <div className="flex flex-col items-start gap-1">
            <DecisionBadge value={opinion.recommendation} />
            {dissent && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-reagent">
                <TriangleAlert className="size-3" /> Discrepa
              </span>
            )}
          </div>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
      <td className="num hidden py-3 pr-3 text-right text-[15px] md:table-cell">{opinion ? opinion.score : "—"}</td>
      <td className="num hidden py-3 pr-3 text-right text-[15px] md:table-cell">{opinion ? opinion.confidence.toFixed(2) : "—"}</td>
      <td className="hidden py-3 pr-3 text-[13px] leading-snug text-muted-foreground md:table-cell">
        {opinion ? opinion.observations.at(-1) : ""}
      </td>
      <td className="code hidden py-3 text-right whitespace-nowrap text-muted-foreground xl:table-cell">
        {opinion ? `${opinion.model} · ${(opinion.latency_ms / 1000).toFixed(1)}s` : ""}
      </td>
    </tr>
  );
}

function HeadCoachRow() {
  const status = useCoach((s) => s.agentStatus.head_coach);
  const decision = useCoach((s) => s.decision);
  const Icon = HEAD_COACH.icon;
  return (
    <tr className="relative border-t-2 border-rule-strong align-top">
      <td className="relative py-3 pr-3">
        <div className="flex items-start gap-2.5">
          <Icon className={cn("mt-0.5 size-4 shrink-0", status === "analyzing" ? "text-reagent" : "text-foreground")} strokeWidth={1.75} />
          <div>
            <p className="text-[14px] font-semibold leading-tight">{HEAD_COACH.name}</p>
            <p className="text-[12px] text-muted-foreground">Recibe solo opiniones estructuradas</p>
            {decision && (
              <div className="mt-2 md:hidden">
                <DecisionBadge value={decision.decision} />
              </div>
            )}
          </div>
        </div>
        {status === "analyzing" && <ScanLine />}
      </td>
      <td className="py-3 pr-3"><Status status={status} /></td>
      <td className="hidden py-3 pr-3 md:table-cell">{decision ? <DecisionBadge value={decision.decision} /> : <span className="text-faint">—</span>}</td>
      <td className="num hidden py-3 pr-3 text-right text-[15px] md:table-cell">—</td>
      <td className="num hidden py-3 pr-3 text-right text-[15px] md:table-cell">{decision ? decision.confidence.toFixed(2) : "—"}</td>
      <td className="hidden py-3 pr-3 text-[13px] leading-snug md:table-cell">{decision?.primary_reason ?? ""}</td>
      <td className="hidden xl:table-cell" />
    </tr>
  );
}

function CompactRow({ agent }: { agent: AgentMeta }) {
  const status = useCoach((s) => s.agentStatus[agent.id]);
  const opinion = useCoach((s) => s.opinions[agent.id]);
  const decision = useCoach((s) => s.decision);
  const Icon = agent.icon;
  const dissent = opinion && decision && opinion.recommendation !== decision.decision;
  return (
    <li className={cn("relative border-t border-rule py-3", dissent && "bg-reagent/[0.05]")}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <Icon className={cn("size-4 shrink-0", status === "analyzing" ? "text-reagent" : "text-muted-foreground")} strokeWidth={1.75} />
          {agent.name}
        </p>
        <Status status={status} />
      </div>
      {opinion && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <DecisionBadge value={opinion.recommendation} />
            <span className="num text-[13px] text-muted-foreground">score {opinion.score} · conf. {opinion.confidence.toFixed(2)}</span>
            {dissent && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-reagent">
                <TriangleAlert className="size-3" /> Discrepa
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{opinion.observations.at(-1)}</p>
          <p className="code mt-1 text-muted-foreground">{opinion.model} · {(opinion.latency_ms / 1000).toFixed(1)}s</p>
        </>
      )}
      {status === "analyzing" && <ScanLine />}
    </li>
  );
}

export function StationsSheet({ compact }: { compact?: boolean }) {
  if (compact)
    return (
      <Panel id="stations" title="Especialistas">
        <Pipeline />
        <ul>
          {SPECIALISTS.map((a) => <CompactRow key={a.id} agent={a} />)}
        </ul>
      </Panel>
    );
  return (
    <Panel id="stations" title="Coaching team · lecturas por especialista">
      <Pipeline />
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
              <th className="pr-3 pb-2 font-semibold">Especialista</th>
              <th className="pr-3 pb-2 font-semibold">Estado</th>
              <th className="hidden pr-3 pb-2 font-semibold md:table-cell">Recomienda</th>
              <th className="hidden pr-3 pb-2 text-right font-semibold md:table-cell">Score</th>
              <th className="hidden pr-3 pb-2 text-right font-semibold md:table-cell">Conf.</th>
              <th className="hidden pr-3 pb-2 font-semibold md:table-cell">Lectura</th>
              <th className="hidden pb-2 text-right font-semibold xl:table-cell">Modelo</th>
            </tr>
          </thead>
          <tbody>
            {SPECIALISTS.map((a) => (
              <StationRow key={a.id} agent={a} />
            ))}
            <HeadCoachRow />
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
