"use client";

import { CircleCheck, CircleX, Database, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TopBar } from "@/components/layout/top-bar";
import { Empty, Panel, StatTile } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api, type Observability } from "@/lib/api";
import { cn } from "@/lib/utils";

const READINGS = "grid grid-cols-2 border-y border-rule-strong md:grid-cols-3 xl:grid-cols-6 [&>*+*]:xl:border-l [&>*+*]:xl:border-rule [&>*+*]:xl:pl-4";

function Tag({ tone, children }: { tone: "good" | "reagent" | "critical" | "muted"; children: React.ReactNode }) {
  const cls = { good: "border-good/50 text-good", reagent: "border-reagent/60 text-reagent", critical: "border-critical/60 text-critical", muted: "border-border text-muted-foreground" }[tone];
  return <span className={cn("rounded-[3px] border px-1.5 py-0.5 text-[11px] font-semibold", cls)}>{children}</span>;
}

export default function ObservabilidadPage() {
  const [data, setData] = useState<Observability | null>(null);
  const [live, setLive] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    api.observability().then((d) => { setData(d); setFailed(false); }).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
    if (!live) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [live, load]);

  const clear = async () => {
    const n = await api.clearLlmCache();
    toast("Caché vaciada", { description: `${n} respuestas borradas: la próxima corrida vuelve a llamar al modelo.` });
    load();
  };

  if (api.mode === "mock")
    return (
      <div className="space-y-10">
        <TopBar title="Observabilidad" subtitle="Cada llamada al LLM: agente, modelo, latencia, tokens, caché y fallbacks." />
        <Empty>En modo mock no hay llamadas reales al LLM. Corré el frontend con NEXT_PUBLIC_API_MODE=api y el backend en modo live.</Empty>
      </div>
    );

  const s = data?.summary;
  return (
    <div className="space-y-10">
      <TopBar title="Observabilidad" subtitle="Cada llamada al LLM: qué agente, qué modelo, cuánto tardó, cuántos tokens, si vino de caché o cayó en un fallback." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-muted-foreground">
          {data ? (
            <>
              <span className="code">{data.config.llm_mode}</span> · especialistas <span className="code">{data.config.specialist_model}</span> · Head Coach{" "}
              <span className="code">{data.config.coach_model}</span> · fallback <span className="code">{data.config.fallback_model || "—"}</span>
            </>
          ) : failed ? "No se pudo leer el backend." : "Cargando…"}
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Switch checked={live} onCheckedChange={setLive} aria-label="Actualizar en vivo" /> En vivo
          </label>
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCw className="size-3.5" /> Actualizar</Button>
          <Button variant="ghost" size="sm" onClick={clear} className="gap-1.5 text-muted-foreground"><Trash2 className="size-3.5" /> Vaciar caché</Button>
        </div>
      </div>

      {s && (
        <div className={READINGS}>
          <StatTile label="Llamadas al LLM" value={s.llm_ok} detail={`${s.total} registros en total`} />
          <StatTile label="Desde caché" value={s.cached} detail={`${s.cache_entries} respuestas guardadas`} />
          <StatTile label="Latencia media" value={(s.avg_latency_ms / 1000).toFixed(1)} unit="s" detail="Llamadas reales" />
          <StatTile label="Fallbacks" value={s.fallbacks} detail="Otro modelo o heurística" />
          <StatTile label="Errores" value={s.errors} detail="Reintentados" />
          <StatTile label="Tokens" value={`${Math.round((s.tokens_in + s.tokens_out) / 1000)}k`} detail={s.cost_usd ? `≈ US$ ${s.cost_usd.toFixed(3)} si fuera pago` : `${s.tokens_in} in · ${s.tokens_out} out`} />
        </div>
      )}

      <Panel id="evals" title="Evals contra el LLM real"
        action={data?.evals && <span className="num text-[13px] text-muted-foreground">{data.evals.passed}/{data.evals.total} pasaron · {new Date(data.evals.ran_at).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}>
        {data?.evals ? (
          <ul>
            {data.evals.cases.map((c) => (
              <li key={c.id} className="grid grid-cols-[auto_1fr] gap-3 border-t border-rule py-3 first:border-t-0">
                {c.passed ? <CircleCheck className="mt-0.5 size-5 text-good" /> : <CircleX className="mt-0.5 size-5 text-critical" />}
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{c.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{c.detail}</p>
                  <p className="code mt-1 text-faint">{c.seconds} s{c.rule_retries ? ` · ${c.rule_retries} reintentos de reglas` : ""}{c.models.length ? ` · ${c.models.join(", ")}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-muted-foreground">Todavía no corrieron. Desde backend/: <span className="code">PYTHONPATH=. uv run python evals/run_evals.py</span></p>
        )}
      </Panel>

      <Panel id="calls" title={`Llamadas · últimas ${data?.calls.length ?? 0}`}>
        {data && data.calls.length ? (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-muted-foreground [font-stretch:80%]">
                  <th className="pr-3 pb-2 font-semibold">Hora</th>
                  <th className="pr-3 pb-2 font-semibold">Agente</th>
                  <th className="pr-3 pb-2 font-semibold">Modelo</th>
                  <th className="pr-3 pb-2 text-right font-semibold">Latencia</th>
                  <th className="pr-3 pb-2 text-right font-semibold">Tokens</th>
                  <th className="pb-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.calls.map((c, i) => (
                  <tr key={`${c.ts}-${i}`} className="border-t border-rule align-top">
                    <td className="num py-2 pr-3 text-muted-foreground">{c.ts.slice(11, 19)}</td>
                    <td className="py-2 pr-3 font-medium">{c.label}</td>
                    <td className="code py-2 pr-3 text-muted-foreground">{c.model}</td>
                    <td className="num py-2 pr-3 text-right">{c.cached ? "—" : `${(c.latency_ms / 1000).toFixed(1)} s`}</td>
                    <td className="num py-2 pr-3 text-right text-muted-foreground">{c.tokens_in + c.tokens_out || "—"}</td>
                    <td className="py-2">
                      <span className="flex flex-wrap gap-1">
                        {c.cached && <Tag tone="muted"><Database className="mr-0.5 inline size-3" />caché</Tag>}
                        {c.ok && !c.cached && c.model !== "heuristic-fallback" && <Tag tone="good">ok</Tag>}
                        {c.model === "heuristic-fallback" && <Tag tone="reagent">heurística</Tag>}
                        {c.fallback && c.model !== "heuristic-fallback" && <Tag tone="reagent">fallback</Tag>}
                        {c.retry && <Tag tone="muted">reintento</Tag>}
                        {!c.ok && <Tag tone="critical">{c.error || "error"}</Tag>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Todavía no hubo llamadas al LLM desde que arrancó el backend. Tocá Ask Coaching Team y volvé acá.</Empty>
        )}
      </Panel>
    </div>
  );
}
