import React, { memo, useCallback, useState } from "react";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Loader2, Wrench } from "lucide-react";
import { rhizohGatewayPhaseShowsRetry } from "../rhizoh/gatewayPhaseUtils.js";
import { LS_RHIZOH_LLM_HTTP_OVERRIDE } from "../castleFlight/castleFlightConfig.js";
import {
  emitRhizohEngineActionTrace,
  emitRhizohUiIntent,
  RHIZOH_INTENT_LAYER_UI
} from "../rhizoh/telemetry/rhizohUiIntentTraceV0.js";

function statusDotClass(phase) {
  if (phase === "connected") return "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]";
  if (phase === "uncertain") return "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.55)]";
  if (phase === "degraded" || phase === "degraded_llm" || phase === "degraded_storage")
    return "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]";
  if (phase === "offline" || phase === "offline_dns") return "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.55)]";
  if (phase === "maintenance") return "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]";
  if (phase === "unconfigured") return "bg-slate-400";
  return "bg-cyan-400 animate-pulse";
}

export const RhizohGatewayBanner = memo(({ model, onRetry, hasHttpOrigin = false, conversationPhaseLabel = "", className = "" }) => {
  const { phase, headline, hint, detail, attempt, maxAttempts, showSlowLoading } = model;
  const [gateUrlDraft, setGateUrlDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleGatewayRetry = useCallback(() => {
    const cid = emitRhizohUiIntent({
      intentLayer: RHIZOH_INTENT_LAYER_UI,
      source: "right_panel",
      element: "RhizohGatewayBanner.retry",
      intent: "GATEWAY_RETRY",
      phase: String(model.phase || ""),
      healthConfidence: model.healthConfidence,
      healthSampleN: model.healthSampleN,
      healthFailN: model.healthFailN,
      healthChurnEscalated: model.healthChurnEscalated
    });
    emitRhizohEngineActionTrace({
      intent: "GATEWAY_RETRY",
      outcome: "invoke_gateway_monitor_retry",
      target: "useRhizohGatewayMonitor.retry",
      correlationId: cid
    });
    onRetry?.({ correlationId: cid });
  }, [onRetry, model.phase, model.healthConfidence, model.healthSampleN, model.healthFailN, model.healthChurnEscalated]);
  const Icon =
    phase === "offline" || phase === "offline_dns"
      ? WifiOff
      : phase === "connected"
        ? Wifi
        : phase === "uncertain"
          ? AlertTriangle
          : phase === "maintenance"
            ? Wrench
            : phase === "degraded" || phase === "degraded_llm" || phase === "degraded_storage"
              ? AlertTriangle
              : Loader2;

  return (
    <div
      role="region"
      aria-label="Rhizoh gateway bağlantı durumu"
      className={`rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-left normal-case ${className}`}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {model.liveMessage}
        {detail ? ` ${detail}` : ""}
      </span>
      <div className="flex flex-wrap items-start gap-2">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
          <Icon
            className={`h-4 w-4 ${phase === "connecting" || phase === "reconnecting" || phase === "initializing" ? "animate-spin text-cyan-300" : phase === "connected" ? "text-emerald-300" : phase === "uncertain" ? "text-amber-200" : "text-white/80"}`}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(phase)}`} aria-hidden />
            <span className="text-[10px] font-semibold tracking-wide text-white/95">{headline}</span>
            {conversationPhaseLabel ? (
              <span
                className="rounded-md border border-cyan-500/35 bg-cyan-950/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-100/95"
                title="Rhizoh konuşma fazı (ürün orkestrasyonu)"
              >
                {conversationPhaseLabel}
              </span>
            ) : null}
            {(phase === "reconnecting" || phase === "connecting") && attempt > 0 ? (
              <span className="text-[9px] font-mono text-cyan-200/80">
                {phase === "reconnecting" ? `${attempt}/${maxAttempts}` : ""}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-auto rounded border border-white/15 px-1.5 py-0.5 text-[8px] text-white/60 hover:bg-white/10"
            >
              {expanded ? "Gizle" : "Detay"}
            </button>
          </div>
          <p className="text-[9px] leading-relaxed text-white/70">{hint}</p>
          {expanded && detail ? (
            <p className="text-[9px] leading-relaxed text-amber-200/90 border-t border-white/5 pt-1.5 mt-1.5">
              <span className="font-semibold text-white/50">Ayrıntı: </span>
              {detail}
            </p>
          ) : null}
          {expanded &&
          typeof model.healthConfidence === "number" &&
          (model.healthSampleN > 0 || model.phase === "uncertain") ? (
            <p className="text-[8px] leading-relaxed text-white/50 border-t border-white/5 pt-1.5 mt-1.5 normal-case">
              Rolling sağlık: güven {(model.healthConfidence * 100).toFixed(0)}% · örnek {model.healthSampleN} · başarısız{" "}
              {model.healthFailN}
              {model.healthChurnEscalated ? " · churn eşiği (debounce bypass hazır)" : ""}
            </p>
          ) : null}
          {expanded && showSlowLoading && (phase === "connecting" || phase === "reconnecting" || phase === "initializing") ? (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/40 via-cyan-300/80 to-cyan-500/40" />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {rhizohGatewayPhaseShowsRetry(phase) && hasHttpOrigin ? (
              <button
                type="button"
                onClick={handleGatewayRetry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-[10px] font-semibold text-cyan-100 outline-none ring-offset-2 ring-offset-[#0a1b3a] focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Yeniden dene
              </button>
            ) : null}
            {expanded && phase === "unconfigured" ? (
              <div className="w-full space-y-1.5 rounded-lg border border-amber-400/25 bg-amber-950/20 p-2">
                <div className="text-[9px] font-semibold text-amber-100/90">Geçit URL (sayfa yenilenmeden)</div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    value={gateUrlDraft}
                    onChange={(e) => setGateUrlDraft(e.target.value)}
                    placeholder="https://gateway-host/rhizoh/llm"
                    className="min-w-[12rem] flex-1 rounded border border-white/15 bg-black/40 px-2 py-1 text-[10px] text-white placeholder:text-white/35 outline-none focus-visible:ring-1 focus-visible:ring-amber-400/60"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-amber-400/45 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-100 hover:bg-amber-500/25"
                    onClick={() => {
                      const u = String(gateUrlDraft || "").trim();
                      if (!u) return;
                      try {
                        window.localStorage.setItem(LS_RHIZOH_LLM_HTTP_OVERRIDE, u);
                      } catch {
                        /* noop */
                      }
                      setGateUrlDraft("");
                      onRetry?.();
                    }}
                  >
                    Kaydet ve bağlan
                  </button>
                </div>
                <p className="text-[8px] text-white/50 leading-relaxed">
                  Kalıcı çözüm: GitHub Actions veya yerel <span className="font-mono text-white/65">npm run build</span>{" "}
                  öncesi <span className="font-mono text-white/65">apps/client/.env.production</span> içinde{" "}
                  <span className="font-mono text-white/65">VITE_GATEWAY_HTTP=…</span>.
                </p>
              </div>
            ) : null}
            <span className="text-[8px] text-white/45 self-center">
              İpucu: bağlantı yoksa yine de komut gönderebilirsiniz — yerel demo yanıtı üretilir.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

RhizohGatewayBanner.displayName = "RhizohGatewayBanner";
