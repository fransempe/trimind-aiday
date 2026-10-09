// Cliente único para el frontend. NEXT_PUBLIC_API_MODE=api usa FastAPI; por defecto, mock.
import { SPECIALISTS } from "@/lib/agents";
import { askAnswer, headCoachDecision, routeQuestion, specialistOpinion } from "@/lib/mock/coaching";
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
    const finish = [1900, 2700, 2300, 3200];
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
};

const MODE = process.env.NEXT_PUBLIC_API_MODE;
export const api: TriMindApi = MODE === "api" || MODE === "http" ? httpApi : mockApi;
