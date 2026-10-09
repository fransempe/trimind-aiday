"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agentById } from "@/lib/agents";
import { type AgentAnswer, api } from "@/lib/api";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "agent";
  text: string;
  meta?: AgentAnswer;
}

/** Chat directo con un agente del staff, para poner al pie (o arriba) de cada sección. */
export function AgentChat({ agent, suggestions, context, className }: {
  agent: string;
  suggestions: string[];
  /** Lo que la pantalla sabe y el backend no (ej. el plan de comidas o las condiciones). */
  context?: Record<string, unknown>;
  className?: string;
}) {
  const snapshot = useCoach((s) => s.snapshot);
  const meta = agentById(agent);
  const Icon = meta.icon;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (q: string) => {
    const question = q.trim();
    if (question.length < 3 || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await api.askAgent(agent, question, snapshot, context);
      setMessages((m) => [...m, { role: "agent", text: res.answer, meta: res }]);
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "No pude responder ahora. Revisá que el backend esté corriendo e intentá de nuevo." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel id={`ask-${agent}`} title={`Preguntale a tu ${meta.name}`} className={className}>
      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}
                className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto max-w-[85%] rounded-[3px] bg-primary px-3.5 py-2 text-[14px] text-primary-foreground">{m.text}</p>
          ) : (
            <div key={i} className="max-w-[92%]">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
                <Icon className="size-3.5" strokeWidth={1.75} /> {meta.name}
                {m.meta && !!m.meta.consulted_agents.length && (
                  <span className="font-normal">· consultó a {m.meta.consulted_agents.map((a) => agentById(a).name).join(", ")}</span>
                )}
              </p>
              <p className="mt-1 rounded-[3px] border border-border px-3.5 py-2.5 text-[14px] leading-relaxed">{m.text}</p>
              {m.meta && <p className="code mt-1 text-faint">{m.meta.model}</p>}
            </div>
          ),
        )}
        {busy && (
          <p className="flex items-center gap-2 text-[13px] text-reagent" aria-live="polite">
            <Loader2 className="size-3.5 animate-spin" /> {meta.name} está pensando…
          </p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className={cn("flex gap-2", messages.length > 0 && "border-t border-rule pt-3")}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Escribile a ${meta.name}…`} aria-label={`Pregunta para ${meta.name}`} />
          <Button type="submit" disabled={busy || input.trim().length < 3} className="gap-1.5">
            <Send className="size-4" /> Enviar
          </Button>
        </form>
      </div>
    </Panel>
  );
}
