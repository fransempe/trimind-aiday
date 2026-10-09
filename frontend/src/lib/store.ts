"use client";

import { create } from "zustand";
import { SPECIALISTS } from "@/lib/agents";
import { api } from "@/lib/api";
import { type AthleteInputs, buildSnapshot, PRESETS } from "@/lib/engine";
import type { AgentOpinion, AthleteSnapshot, CoachDecision, GraphEvent, RulesResult, Workout } from "@/lib/types";

export type AgentStatus = "idle" | "pending" | "analyzing" | "done";
export type RunStatus = "idle" | "running" | "awaiting_approval" | "done";

export interface LogEntry {
  ts: number;
  text: string;
}

interface CoachState {
  inputs: AthleteInputs;
  snapshot: AthleteSnapshot;
  preset: keyof typeof PRESETS | "custom";

  runStatus: RunStatus;
  threadId: string | null;
  agentStatus: Record<string, AgentStatus>;
  opinions: Record<string, AgentOpinion>;
  rules: RulesResult | null;
  decision: CoachDecision | null;
  finalStatus: "auto" | "accepted" | "rejected" | null;
  /** Lo que el atleta va a hacer hoy (original o el modificado y aceptado). */
  activeWorkout: Workout;
  log: LogEntry[];

  setInputs(patch: Partial<AthleteInputs>): void;
  applyPreset(name: keyof typeof PRESETS): void;
  runTeam(): void;
  respond(action: "accept" | "reject"): Promise<void>;
}

const ALL_AGENTS = [...SPECIALISTS.map((a) => a.id), "head_coach"];
const idleAgents = () => Object.fromEntries(ALL_AGENTS.map((id) => [id, "idle" as AgentStatus]));

let cancelRun: (() => void) | null = null;

function syncAthlete(inputs: AthleteInputs) {
  void api
    .updateAthleteState({
      sleep_hours: inputs.sleep_hours,
      hrv_deviation_pct: inputs.hrv_deviation_pct,
      rpe: inputs.rpe ?? undefined,
      legs: inputs.legs,
      hard_run_yesterday: inputs.hard_run_yesterday,
    })
    .catch(() => {});
}

export const useCoach = create<CoachState>((set, get) => {
  const log = (text: string) => set((s) => ({ log: [...s.log, { ts: Date.now(), text }].slice(-40) }));

  const handle = (e: GraphEvent) => {
    switch (e.type) {
      case "router_decided":
        log(`Router → intent "${e.intent}", consulta ${e.agents.length} agentes`);
        set((s) => ({
          agentStatus: { ...s.agentStatus, ...Object.fromEntries(e.agents.map((a) => [a, "pending"])) },
        }));
        break;
      case "agent_started":
        log(`${e.agent} → analizando`);
        set((s) => ({ agentStatus: { ...s.agentStatus, [e.agent]: "analyzing" } }));
        break;
      case "agent_completed":
        log(`${e.opinion.agent} → ${e.opinion.recommendation} (score ${e.opinion.score}, conf. ${e.opinion.confidence})`);
        set((s) => ({
          agentStatus: { ...s.agentStatus, [e.opinion.agent]: "done" },
          opinions: { ...s.opinions, [e.opinion.agent]: e.opinion },
        }));
        break;
      case "rules_checked":
        log(`Reglas (intento ${e.attempt}) → ${e.result.passed ? "OK" : e.result.violations.map((v) => v.rule_id).join(", ")}`);
        set({ rules: e.result });
        break;
      case "awaiting_approval":
        log("Head Coach → modify · esperando confirmación del atleta");
        set((s) => ({
          decision: e.decision,
          threadId: e.thread_id,
          runStatus: "awaiting_approval",
          agentStatus: { ...s.agentStatus, head_coach: "done" },
        }));
        break;
      case "decision_final": {
        log(`Decisión final → ${e.decision.decision} (${e.status})`);
        const accepted = e.status !== "rejected" && e.decision.new_workout;
        set((s) => ({
          decision: e.decision,
          finalStatus: e.status,
          runStatus: "done",
          activeWorkout: accepted ? e.decision.new_workout! : e.decision.original_workout,
          agentStatus: { ...s.agentStatus, head_coach: "done" },
        }));
        break;
      }
      case "error":
        log(`Error en ${e.node}: ${e.message}`);
        set({ runStatus: "idle" });
        break;
    }
  };

  const initial = buildSnapshot(PRESETS.normal);
  // En modo API el backend arranca con el mismo estado que muestra la pantalla.
  if (typeof window !== "undefined" && api.mode === "api") syncAthlete(PRESETS.normal);
  return {
    inputs: PRESETS.normal,
    snapshot: initial,
    preset: "normal",
    runStatus: "idle",
    threadId: null,
    agentStatus: idleAgents(),
    opinions: {},
    rules: null,
    decision: null,
    finalStatus: null,
    activeWorkout: initial.planned_workout,
    log: [],

    setInputs(patch) {
      const inputs = { ...get().inputs, ...patch };
      set({ inputs, snapshot: buildSnapshot(inputs), preset: "custom" });
      void syncAthlete(inputs);
    },

    applyPreset(name) {
      get().setInputs(PRESETS[name]);
      set({ preset: name });
    },

    runTeam() {
      cancelRun?.();
      set({
        runStatus: "running",
        agentStatus: idleAgents(),
        opinions: {},
        rules: null,
        decision: null,
        finalStatus: null,
        threadId: null,
        log: [],
      });
      log("POST /recommendation · arrancando grafo");
      cancelRun = api.streamRecommendation(get().snapshot, handle);
    },

    async respond(action) {
      const { threadId } = get();
      if (!threadId) return;
      log(`Atleta → ${action === "accept" ? "acepta" : "rechaza"} el cambio`);
      await api.resume(threadId, action, handle);
    },
  };
});
