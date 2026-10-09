// Cliente único para el frontend. NEXT_PUBLIC_API_MODE=api usa FastAPI; por defecto, mock.
import { SPECIALISTS } from "@/lib/agents";
import { askAnswer, directAnswer, headCoachDecision, routeQuestion, specialistOpinion } from "@/lib/mock/coaching";
import { type DayItem } from "@/lib/day";
import { heuristicMealPlan, type MealPlan, type MealPlanRequest } from "@/lib/meal-plan";
import {
  heuristicDebrief,
  heuristicKnowledge,
  type KnowledgeBase,
  type KnowledgeRequest,
  type RaceDebrief,
  type RaceDebriefRequest,
  type TrainingFacts,
} from "@/lib/race-log";
import { heuristicStrategy, type RaceStrategy, type RaceStrategyRequest, type TrainingSummary } from "@/lib/strategy";
import type {
  AskResponse,
  AthleteSnapshot,
  AthleteStateUpdate,
  FeedbackRequest,
  GraphEvent,
} from "@/lib/types";

export interface TriMindApi {
  mode: "mock" | "api";
  /** Corre el grafo y emite eventos por nodo. Devuelve una función para cancelar. */
  streamRecommendation(snapshot: AthleteSnapshot, onEvent: (e: GraphEvent) => void): () => void;
  /** Respuesta del atleta al interrupt de human-in-the-loop. */
  resume(threadId: string, action: "accept" | "reject", onEvent: (e: GraphEvent) => void): Promise<void>;
  updateAthleteState(update: AthleteStateUpdate): Promise<void>;
  ask(question: string, snapshot: AthleteSnapshot): Promise<AskResponse>;
  feedback(req: FeedbackRequest): Promise<void>;
  /** Estrategia por segmento del Race Agent. `training` solo lo usa el modo mock (el backend tiene los datos). */
  raceStrategy(req: RaceStrategyRequest, training: TrainingSummary): Promise<RaceStrategy>;
  /** Plan de comidas del Nutrition Agent. `items` y `daysToRace` solo los usa el modo mock. */
  nutritionPlan(req: MealPlanRequest, items: DayItem[], daysToRace: number): Promise<MealPlan>;
  /** Pregunta directa a un agente. `head_coach` responde con su equipo detrás. */
  askAgent(agent: string, question: string, snapshot: AthleteSnapshot, context?: Record<string, unknown>): Promise<AgentAnswer>;
  /** Análisis de una carrera completada por el Race Agent. */
  raceDebrief(req: RaceDebriefRequest): Promise<RaceDebrief>;
  /** Base de conocimiento del atleta. `name` y `facts` solo los usa el modo mock. */
  buildKnowledge(req: KnowledgeRequest, name: string, facts: TrainingFacts): Promise<KnowledgeBase>;
  /** Le devuelve al backend el resumen guardado en el navegador, para el contexto de los agentes. */
  restoreKnowledge(text: string): Promise<void>;
  /** Llamadas al LLM, caché, fallbacks y el último eval (solo con backend). */
  observability(): Promise<Observability | null>;
  clearLlmCache(): Promise<number>;
}

export interface LlmCall {
  ts: string;
  label: string;
  model: string;
  requested_model: string;
  latency_ms: number;
  ok: boolean;
  cached: boolean;
  fallback: boolean;
  retry: boolean;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  error: string;
}

export interface EvalCase {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
  rule_retries: number;
  models: string[];
  seconds: number;
}

export interface Observability {
  calls: LlmCall[];
  summary: {
    total: number;
    llm_ok: number;
    cached: number;
    errors: number;
    fallbacks: number;
    avg_latency_ms: number;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    cache_entries: number;
  };
  evals: { ran_at: string; llm_mode: string; passed: number; total: number; cases: EvalCase[]; models: Record<string, string> } | null;
  config: { llm_mode: string; specialist_model: string; coach_model: string; fallback_model: string; cache: boolean };
}

export interface AgentAnswer {
  agent: string;
  answer: string;
  model: string;
  consulted_agents: string[];
}

const now = () => new Date().toISOString();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- mock
const pending = new Map<string, Extract<GraphEvent, { type: "awaiting_approval" }>>();

const mockApi: TriMindApi = {
  mode: "mock",

  streamRecommendation(snapshot, onEvent) {
    const run_id = `run_${Date.now().toString(36)}`;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const agents = SPECIALISTS.map((a) => a.id);

    at(300, () => onEvent({ type: "router_decided", run_id, ts: now(), intent: "daily", agents }));
    // Fan-out: todos arrancan casi juntos y terminan en distinto orden.
    const finish = agents.map((_, i) => [1900, 2700, 2300, 3200, 2500][i % 5]);
    const opinions = agents.map((id) => specialistOpinion(id, snapshot));
    agents.forEach((agent, i) => {
      at(700 + i * 120, () => onEvent({ type: "agent_started", run_id, ts: now(), agent }));
      at(finish[i], () =>
        onEvent({ type: "agent_completed", run_id, ts: now(), opinion: { ...opinions[i], latency_ms: finish[i] - 700 - i * 120 } }),
      );
    });
    const fanIn = Math.max(...finish) + 300;
    at(fanIn, () => onEvent({ type: "agent_started", run_id, ts: now(), agent: "head_coach" }));
    const decision = headCoachDecision(snapshot, opinions);
    at(fanIn + 2200, () =>
      onEvent({ type: "rules_checked", run_id, ts: now(), attempt: 1, result: { violations: [], passed: true } }),
    );
    at(fanIn + 2700, () => {
      if (decision.decision === "modify") {
        const event = { type: "awaiting_approval" as const, run_id, ts: now(), decision, thread_id: run_id };
        pending.set(run_id, event);
        onEvent(event);
      } else {
        onEvent({ type: "decision_final", run_id, ts: now(), decision, status: "auto" });
      }
    });
    return () => timers.forEach(clearTimeout);
  },

  async resume(threadId, action, onEvent) {
    const waiting = pending.get(threadId);
    if (!waiting) return;
    pending.delete(threadId);
    await sleep(400);
    onEvent({
      type: "decision_final",
      run_id: waiting.run_id,
      ts: now(),
      decision: waiting.decision,
      status: action === "accept" ? "accepted" : "rejected",
    });
  },

  async updateAthleteState() {},

  async ask(question, snapshot) {
    const consulted = routeQuestion(question);
    await sleep(2200);
    return {
      answer: askAnswer(question, snapshot, consulted),
      consulted_agents: consulted,
      opinions: consulted.map((id) => specialistOpinion(id, snapshot)),
    };
  },

  async feedback() {
    await sleep(300);
  },

  async raceStrategy(req, training) {
    await sleep(2600);
    return heuristicStrategy(req, training, "gemma-4-31b (simulado)");
  },

  async nutritionPlan(req, items, daysToRace) {
    await sleep(2400);
    return heuristicMealPlan(req, items, daysToRace, "gemma-4-31b (simulado)");
  },

  async askAgent(agent, question, snapshot, context) {
    if (agent === "head_coach") {
      const r = await mockApi.ask(question, snapshot);
      return { agent, answer: r.answer, model: "gemini-flash (simulado)", consulted_agents: r.consulted_agents };
    }
    await sleep(1600);
    return { agent, answer: directAnswer(agent, question, snapshot, context), model: "gemini-flash-lite (simulado)", consulted_agents: [] };
  },

  async raceDebrief(req) {
    await sleep(2200);
    return heuristicDebrief(req, "gemini-flash-lite (simulado)");
  },

  async buildKnowledge(req, name, facts) {
    await sleep(2800);
    return heuristicKnowledge(req, name, facts, "gemini-flash (simulado)");
  },

  async restoreKnowledge() {},

  async observability() {
    return null;
  },

  async clearLlmCache() {
    return 0;
  },
};

// ---------------------------------------------------------------- FastAPI
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

function listen(url: string, onEvent: (e: GraphEvent) => void): () => void {
  const source = new EventSource(url);
  source.onmessage = (msg) => {
    const event = JSON.parse(msg.data) as GraphEvent;
    onEvent(event);
    if (event.type === "decision_final" || event.type === "awaiting_approval") source.close();
  };
  source.onerror = () => {
    onEvent({ type: "error", run_id: "", ts: now(), node: "stream", message: "Se perdió la conexión" });
    source.close();
  };
  return () => source.close();
}

const httpApi: TriMindApi = {
  mode: "api",
  streamRecommendation: (_snapshot, onEvent) => listen(`${BASE}/recommendation/stream`, onEvent),
  async resume(threadId, action, onEvent) {
    const event = await post<GraphEvent>("/recommendation/resume", { thread_id: threadId, action });
    onEvent(event);
  },
  updateAthleteState: (update) => post("/athlete/state", update),
  ask: (question) => post<AskResponse>("/ask", { question }),
  feedback: (req) => post("/feedback", req),
  raceStrategy: (req) => post<RaceStrategy>("/race/strategy", req),
  nutritionPlan: (req) => post<MealPlan>("/nutrition/plan", req),
  raceDebrief: (req) => post<RaceDebrief>("/race/debrief", req),
  buildKnowledge: (req) => post<KnowledgeBase>("/athlete/knowledge", req),
  async restoreKnowledge(text) {
    await fetch(`${BASE}/athlete/knowledge/context`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
  },
  async observability() {
    const res = await fetch(`${BASE}/observability`);
    if (!res.ok) throw new Error(`/observability: ${res.status}`);
    return (await res.json()) as Observability;
  },
  async clearLlmCache() {
    const res = await fetch(`${BASE}/observability/cache`, { method: "DELETE" });
    return ((await res.json()) as { cleared: number }).cleared;
  },
  askAgent: (agent, question, _snapshot, context) => post<AgentAnswer>(`/agents/${agent}/ask`, { question, context: context ?? {} }),
};

const MODE = process.env.NEXT_PUBLIC_API_MODE;
export const api: TriMindApi = MODE === "api" || MODE === "http" ? httpApi : mockApi;
