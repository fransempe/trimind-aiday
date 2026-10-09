"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DecisionBadge, Panel } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agentById, SPECIALISTS } from "@/lib/agents";
import { api } from "@/lib/api";
import { routeQuestion } from "@/lib/mock/coaching";
import { useCoach } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AskResponse } from "@/lib/types";

interface Message {
  role: "user" | "team";
  text: string;
  response?: AskResponse;
}

const SUGGESTIONS = [
  "¿Cómo debería encarar la bici en la carrera?",
  "Dormí mal y estoy cansado, ¿entreno igual?",
  "¿Cómo viene mi FTP?",
  "¿Qué hago mañana?",
];

function Thinking({ agents }: { agents: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="rounded-[3px] border border-reagent/30 bg-reagent/[0.04] p-4">
      <p className="flex items-center gap-2 text-sm text-reagent">
        <Loader2 className="size-4 animate-spin" /> El router consultó a {agents.length} agentes
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SPECIALISTS.map((a, i) => {
          const on = agents.includes(a.id);
          const Icon = a.icon;
          return (
            <motion.span key={a.id}
              animate={on ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
              transition={{ duration: 1.2, repeat: on ? Infinity : 0, delay: i * 0.2 }}
              className={cn("inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 text-[13px]",
                on ? "border-reagent/40 text-foreground" : "border-border text-muted-foreground")}>
              <Icon className="size-3.5" /> {a.name}
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Chat con el staff: el router elige a qué especialistas consultar y el Head Coach responde. */
export function AskChat() {
  const snapshot = useCoach((s) => s.snapshot);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState<string[] | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, thinking]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || thinking) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setThinking(routeQuestion(question));
    const response = await api.ask(question, snapshot);
    setThinking(null);
    setMessages((m) => [...m, { role: "team", text: response.answer, response }]);
  };

  return (
    <div>
      <p className="mb-4 text-[14px] text-muted-foreground">Preguntale lo que quieras al staff. El router decide a qué especialistas consultar.</p>
      <Panel className="flex min-h-[50vh] flex-col">
        <div className="flex-1 space-y-4">
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <ShieldCheck className="mx-auto size-8 text-reagent" />
              <p className="mt-3 font-medium">Tu staff está disponible</p>
              <p className="mt-1 text-sm text-muted-foreground">Probá con alguna de estas preguntas:</p>
              <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-reagent/40 hover:text-foreground">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[80%] rounded-[3px] rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</p>
              </div>
            ) : (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[90%] space-y-2">
                <p className="sheet-label flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-reagent" /> Head Coach · consultó a{" "}
                  {m.response!.consulted_agents.map((a) => agentById(a).name).join(", ")}
                </p>
                <div className="rounded-[3px] rounded-tl-sm border border-border px-4 py-3 text-sm leading-relaxed">{m.text}</div>
                <div className="flex flex-wrap gap-2">
                  {m.response!.opinions.map((o) => (
                    <span key={o.agent} className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 text-[11px] text-muted-foreground">
                      {agentById(o.agent).name} <DecisionBadge value={o.recommendation} />
                    </span>
                  ))}
                </div>
              </motion.div>
            ),
          )}
          <AnimatePresence>{thinking && <Thinking agents={thinking} />}</AnimatePresence>
          <div ref={bottom} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mt-5 flex gap-2 border-t border-border pt-4">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="¿Qué querés preguntarle al staff?" />
          <Button type="submit" disabled={!!thinking || !input.trim()} className="gap-1.5">
            <Send className="size-4" /> Enviar
          </Button>
        </form>
      </Panel>
    </div>
  );
}
