import React, { memo, useEffect } from "react";
import { Send, Loader2, Layers } from "lucide-react";
import { isCastleLayerRenderableV1, publishCastleLayerAuditV1 } from "../castle/layers/castleLayerGateV1.js";
import { RhizohGatewayBanner } from "./RhizohGatewayBanner.jsx";
import { RhizohTrustUpdateStrip } from "./RhizohTrustUpdateStrip.jsx";
import { RhizohCohortInspectStrip } from "./RhizohCohortInspectStrip.jsx";
import { RhizohWorldContinuityStrip } from "./RhizohWorldContinuityStrip.jsx";

/**
 * T0 clean shell — chat + minimal state + advanced layer toggle only.
 */
export const RhizohT0ShellChromeV1 = memo(function RhizohT0ShellChromeV1({
  phaseLabel,
  goals,
  gatewayUx,
  gatewayConnected,
  hasHttpOrigin,
  llmHostLabel,
  conversationPhaseLabel,
  onGatewayRetry,
  advancedOpen,
  onToggleAdvanced,
  cmd,
  setCmd,
  onSend,
  busy,
  inputRef,
  placeholder = "Rhizoh'a yaz…",
  fieldState = "IDLE",
  inlineError,
  onDismissError,
  mainHudReply,
  onDismissReply,
  rhizohGenerationMode,
  onGenerationModeChange,
  generationModeOptions = [],
  generationModeMax = {},
  showOnboardingLine = false,
  firstInteractionSeeds = [],
  onSeedIntent,
  showSemanticChips = false,
  showVerboseHints = false,
  commandHint = "",
  commandLog = [],
  showCommandLog,
  onToggleCommandLog,
  runtimeHealth
}) {
  const showVoiceUi = isCastleLayerRenderableV1("voice_v1_loop_mic_ui", { advancedOpen });
  const showGatewayBanner =
    isCastleLayerRenderableV1("gateway_banner_panel", { advancedOpen }) &&
    (advancedOpen || (gatewayUx?.phase && gatewayUx.phase !== "connected"));
  const showTrustStrip = isCastleLayerRenderableV1("trust_strip_expanded", { advancedOpen });
  const showChips =
    isCastleLayerRenderableV1("first_interaction_chips", { advancedOpen }) &&
    firstInteractionSeeds.length > 0;

  useEffect(() => {
    publishCastleLayerAuditV1({
      advancedOpen,
      mounted: {
        voice_v1_loop_mic_ui: showVoiceUi,
        voice_v3_dock_mic: false,
        gateway_banner_panel: showGatewayBanner,
        trust_strip_expanded: showTrustStrip,
        first_interaction_chips: showChips,
        t0_slot_chat_surface: true,
        t0_slot_state_indicator: true,
        t0_slot_layer_toggle: true
      }
    });
  }, [advancedOpen, showVoiceUi, showGatewayBanner, showTrustStrip, showChips]);

  const stateLine =
    fieldState === "SPEAKING"
      ? "yanıt"
      : fieldState === "INTERPRETING"
        ? "düşünüyor"
        : busy
          ? "işliyor"
          : "hazır";

  return (
    <div
      className="flex justify-center mb-6 px-2"
      data-rhizoh-t0-shell="1"
      data-advanced={advancedOpen ? "1" : "0"}
    >
      <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-black/88 p-2.5 sm:p-3 flex flex-col gap-2 backdrop-blur-md pointer-events-auto">
        {isCastleLayerRenderableV1("t0_slot_state_indicator") ? (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[9px] normal-case">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                gatewayConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
              aria-hidden
            />
            <span className="font-semibold text-white/85">{phaseLabel || "—"}</span>
            <span className="text-white/45">
              güven {goals?.bondScore != null ? Number(goals.bondScore).toFixed(2) : "—"} · {stateLine}
            </span>
            {gatewayUx?.headline ? (
              <span className="text-white/40 truncate max-w-[10rem]">{gatewayUx.headline}</span>
            ) : null}
            {isCastleLayerRenderableV1("t0_slot_layer_toggle") ? (
              <button
                type="button"
                onClick={onToggleAdvanced}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/12 bg-white/5 px-2 py-1 text-[9px] text-white/60 hover:text-cyan-100"
                aria-expanded={advancedOpen}
              >
                <Layers className="h-3 w-3" aria-hidden />
                {advancedOpen ? "Katmanları gizle" : "Gelişmiş"}
              </button>
            ) : null}
          </div>
        ) : null}

        {advancedOpen && showTrustStrip ? (
          <RhizohTrustUpdateStrip
            phaseLabel={phaseLabel}
            goals={goals}
            gatewayHeadline={gatewayUx?.headline}
            className="mx-0"
          />
        ) : null}

        {showGatewayBanner ? (
          <RhizohGatewayBanner
            model={gatewayUx}
            onRetry={onGatewayRetry}
            hasHttpOrigin={hasHttpOrigin}
            conversationPhaseLabel={conversationPhaseLabel}
            className="mx-0"
          />
        ) : null}

        {advancedOpen && isCastleLayerRenderableV1("debug_overlay_panels", { advancedOpen }) ? (
          <div className="mx-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 normal-case text-[9px]">
            <label htmlFor="castle-rhizoh-generation-mode" className="text-white/50 shrink-0">
              Sohbet derinliği
            </label>
            <select
              id="castle-rhizoh-generation-mode"
              value={rhizohGenerationMode}
              onChange={(e) => onGenerationModeChange?.(e.target.value)}
              className="rounded border border-white/15 bg-black/50 px-2 py-1 text-white/85"
            >
              {generationModeOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} (~{generationModeMax[m.id]} tok)
                </option>
              ))}
            </select>
            <span className="sm:ml-auto text-white/45">
              Geçit: {gatewayConnected ? "canlı" : gatewayUx?.phase}
              {hasHttpOrigin ? ` · ${llmHostLabel}` : ""}
            </span>
          </div>
        ) : null}

        {inlineError ? (
          <div role="alert" className="rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-2 text-[10px] normal-case">
            <div className="font-semibold text-red-100">{inlineError.title}</div>
            <p className="mt-1 text-white/85">{inlineError.detail}</p>
            {onDismissError ? (
              <button type="button" className="mt-2 text-[9px] text-white/70 underline" onClick={onDismissError}>
                Kapat
              </button>
            ) : null}
          </div>
        ) : null}

        {mainHudReply?.text ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-400/30 bg-emerald-950/20 px-3 py-2 text-[11px] text-white/90 normal-case whitespace-pre-wrap"
          >
            {mainHudReply.text.slice(0, 400)}
            {mainHudReply.text.length > 400 ? "…" : ""}
            {onDismissReply ? (
              <button type="button" className="mt-1 block text-[9px] text-white/55 underline" onClick={onDismissReply}>
                Kapat
              </button>
            ) : null}
          </div>
        ) : null}

        {advancedOpen && showOnboardingLine ? (
          <p className="text-[10px] text-emerald-100/80 px-1 normal-case">Rhizoh seni tanımaya başlıyor.</p>
        ) : null}

        {showChips ? (
          <div className="flex flex-wrap gap-1.5 px-1">
            {showSemanticChips
              ? ["explore", "create", "ask", "build", "join"].map((hint) => (
                  <span
                    key={hint}
                    className="rounded-full border border-white/15 px-2 py-0.5 text-[8px] text-white/50"
                  >
                    {hint}
                  </span>
                ))
              : null}
            {firstInteractionSeeds.map((seed) => (
              <button
                key={seed}
                type="button"
                onClick={() => onSeedIntent?.(seed)}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[9px] text-white/65 hover:border-cyan-400/30"
              >
                {seed}
              </button>
            ))}
          </div>
        ) : null}

        {advancedOpen && showVerboseHints ? (
          <p className="px-1 text-[9px] text-white/40 normal-case">{commandHint}</p>
        ) : null}

        {isCastleLayerRenderableV1("t0_slot_chat_surface") ? (
          <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-black/50 px-2 py-1.5">
            <input
              ref={inputRef}
              id="castle-rhizoh-command"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !busy) {
                  e.preventDefault();
                  onSend?.();
                }
              }}
              autoComplete="off"
              disabled={busy}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35 normal-case"
              aria-label="Mesaj"
            />
            <button
              type="button"
              id="castle-rhizoh-send"
              onClick={() => onSend?.()}
              disabled={busy || !String(cmd || "").trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/90 text-black disabled:opacity-40"
              aria-label="Gönder"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        ) : null}

        {advancedOpen && commandLog.length > 0 ? (
          <div className="normal-case">
            <button type="button" className="text-[9px] text-cyan-200/80" onClick={onToggleCommandLog}>
              {showCommandLog ? "Günlüğü gizle" : `Komut günlüğü (${commandLog.length})`}
            </button>
            {showCommandLog ? (
              <ul className="mt-1 max-h-24 overflow-y-auto text-[9px] text-white/60 space-y-0.5">
                {commandLog.slice(-8).map((row, i) => (
                  <li key={`${row.ts}-${i}`}>
                    {new Date(row.ts).toLocaleTimeString()} · {String(row.raw).slice(0, 80)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {advancedOpen && isCastleLayerRenderableV1("debug_overlay_panels", { advancedOpen }) ? (
          <>
            <RhizohCohortInspectStrip />
            <RhizohWorldContinuityStrip gatewayPhase={gatewayUx?.phase} />
          </>
        ) : null}
      </div>
    </div>
  );
});

RhizohT0ShellChromeV1.displayName = "RhizohT0ShellChromeV1";
