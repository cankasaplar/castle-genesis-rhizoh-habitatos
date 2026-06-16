import React, { memo, useCallback, useEffect, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, Send, Layers } from "lucide-react";
import { isCastleLayerRenderableV1, publishCastleLayerAuditV1 } from "../castle/layers/castleLayerGateV1.js";
import { RhizohGatewayBanner } from "./RhizohGatewayBanner.jsx";
import { RhizohTrustUpdateStrip } from "./RhizohTrustUpdateStrip.jsx";
import { RhizohCohortInspectStrip } from "./RhizohCohortInspectStrip.jsx";
import { RhizohWorldContinuityStrip } from "./RhizohWorldContinuityStrip.jsx";
import { RhizohConversationContinuityStripV1 } from "./RhizohConversationContinuityStripV1.jsx";
import { RhizohInputThoughtGlowV0 } from "./RhizohInputThoughtGlowV0.jsx";
import { OctoConversationStageV1 } from "../studio/OctoConversationStageV1.jsx";
import { isFoxAnchorSpeciesV0, resolveConversationAnchorSpeciesIdV0 } from "../studio/conversationAnchorSpeciesV0.js";
import {
  resolveChatStatusLineV0,
  resolveChatPlaceholderV0
} from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { isRhizohT0FirstMatchIdentityV0 } from "../rhizoh/runtime/rhizohT0FirstMatchIdentityV0.js";
import { OBSERVATION_FEED_COPY_TR_V0 } from "../rhizoh/runtime/rhizohObservationFeedV0.js";
import { shouldShowPerceptionAlignmentObservationStripV0 } from "../castleFlight/perceptionAlignmentObservationV0.js";
import { PerceptionAlignmentObservationStripV0 } from "./PerceptionAlignmentObservationStripV0.jsx";
import { StabilityLearningTraceStripGateV0 } from "./StabilityLearningTraceStripV0.jsx";
import { RhizohFoxProactiveCalibrationChipGateV0 } from "./RhizohFoxProactiveCalibrationChipV0.jsx";
import { RhizohFoxFirstContactStripGateV0 } from "./RhizohFoxFirstContactStripV0.jsx";
import { PerceptionFractureLayerV0 } from "./PerceptionFractureLayerV0.jsx";
import { RhizohPresenceContractStripV0 } from "./RhizohPresenceContractStripV0.jsx";

/**
 * T0 product shell — unified input (mic · camera · thought glow · text · send).
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
  /** @deprecated B3 — SCR supplies density inside RhizohInputThoughtGlowV0 */
  collectiveDensity,
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
  runtimeHealth,
  unifiedDock = false,
  showProductMic = true,
  showProductCamera = true,
  micActive = false,
  voiceMicDeviceLabel = "",
  onMicClick,
  voiceInputReady = false,
  cameraActive = false,
  onCameraClick,
  productCameraStream = null,
  uiLocale,
  habitatFocusMode = "navigation",
  octoHeightPx = 108,
  octoHeightMaxPx = 124,
  /** Read-only T0 alignment inputs — mirror only, no control path. */
  alignmentRuntime = null,
  alignmentSnapshot = null,
  fractureAtmosphere = null,
  conversationContinuitySnap = null
}) {
  const conversationHero = habitatFocusMode === "conversation";
  const octoMountId = unifiedDock ? "t0_shell_unified_dock" : "t0_shell_default";
  const showAlignmentStrip = shouldShowPerceptionAlignmentObservationStripV0();
  const locale = uiLocale || readUiLocaleV0();
  const t0FirstMatch = isRhizohT0FirstMatchIdentityV0();
  const anchorSpeciesId = resolveConversationAnchorSpeciesIdV0();
  const foxAnchor = isFoxAnchorSpeciesV0(anchorSpeciesId);
  const stageHeightPx = foxAnchor ? Math.max(octoHeightPx, 176) : octoHeightPx;
  const stageHeightMaxPx = foxAnchor ? Math.max(octoHeightMaxPx, 200) : octoHeightMaxPx;
  const [octoSubmitPulse, setOctoSubmitPulse] = useState(0);
  const fireOctoGrab = useCallback(() => {
    if (!String(cmd || "").trim()) return;
    setOctoSubmitPulse((p) => p + 1);
  }, [cmd]);
  const handleSend = useCallback(() => {
    fireOctoGrab();
    onSend?.();
  }, [fireOctoGrab, onSend]);
  const showLegacyVoiceMic =
    !unifiedDock && isCastleLayerRenderableV1("voice_v1_loop_mic_ui", { advancedOpen });
  const showMic =
    showProductMic !== false && (unifiedDock ? true : showProductMic || showLegacyVoiceMic);
  const showCamera = unifiedDock ? showProductCamera !== false : showProductCamera;
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
        voice_v1_loop_mic_ui: showLegacyVoiceMic,
        voice_v3_dock_mic: showMic,
        product_camera_dock: showCamera,
        gateway_banner_panel: showGatewayBanner,
        trust_strip_expanded: showTrustStrip,
        first_interaction_chips: showChips,
        t0_slot_chat_surface: true,
        t0_slot_state_indicator: !unifiedDock,
        t0_slot_layer_toggle: !unifiedDock
      }
    });
  }, [
    advancedOpen,
    showLegacyVoiceMic,
    showMic,
    showCamera,
    showGatewayBanner,
    showTrustStrip,
    showChips,
    unifiedDock
  ]);

  const stateLine = resolveChatStatusLineV0(
    {
      connected: gatewayConnected,
      busy,
      fieldState
    },
    locale
  );
  const inputPlaceholder = placeholder === "Rhizoh'a yaz…" || placeholder === "Message Rhizoh…"
    ? resolveChatPlaceholderV0(locale)
    : placeholder;

  const inputRow = (
    <div className="relative flex flex-col gap-1 px-2 py-2">
      <div className="relative flex items-center gap-1.5">
      {showCamera ? (
        <button
          type="button"
          title={
            cameraActive
              ? OBSERVATION_FEED_COPY_TR_V0.cameraButtonTitleOn
              : OBSERVATION_FEED_COPY_TR_V0.cameraButtonTitle
          }
          onClick={() => onCameraClick?.()}
          disabled={busy && !cameraActive}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
            cameraActive
              ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
              : "border-white/15 bg-white/5 text-white/75 hover:border-violet-400/40 hover:text-violet-100"
          }`}
          aria-pressed={cameraActive}
          data-rhizoh-layer="observation_feed"
          aria-label={
            cameraActive ? OBSERVATION_FEED_COPY_TR_V0.cameraAriaOn : OBSERVATION_FEED_COPY_TR_V0.cameraAriaOff
          }
        >
          {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </button>
      ) : null}
      {showMic ? (
        <button
          type="button"
          title={micActive ? "Dinlemeyi durdur" : "Mikrofon"}
          onClick={() => onMicClick?.()}
          disabled={busy && !micActive}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
            micActive
              ? "border-rose-400/50 bg-rose-500/20 text-rose-100"
              : "border-white/15 bg-white/5 text-white/75 hover:border-cyan-400/40 hover:text-cyan-100"
          }`}
          aria-pressed={micActive}
          aria-label={micActive ? "Mikrofon açık" : "Mikrofon"}
        >
          {micActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      ) : null}
      <input
        ref={inputRef}
        id="castle-rhizoh-command"
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !busy) {
            e.preventDefault();
            handleSend();
          }
        }}
        autoComplete="off"
        disabled={busy}
        placeholder={inputPlaceholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-white/40"
        aria-label="Mesaj"
      />
      <button
        type="button"
        id="castle-rhizoh-send"
        onClick={handleSend}
        disabled={busy || !String(cmd || "").trim()}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/90 text-black disabled:opacity-40 ${
          busy ? "opacity-55" : ""
        }`}
        aria-label="Gönder"
        aria-busy={busy}
      >
        <Send className="h-4 w-4" />
      </button>
      </div>
    </div>
  );

  if (unifiedDock) {
    return (
      <div className="flex justify-center mb-0 px-0" data-rhizoh-t0-shell="1" data-unified-dock="1">
        <div className="w-full max-w-3xl flex flex-col gap-2 pointer-events-auto">
          {showGatewayBanner && gatewayUx ? (
            <RhizohGatewayBanner
              model={gatewayUx}
              onRetry={onGatewayRetry}
              hasHttpOrigin={hasHttpOrigin}
              conversationPhaseLabel={conversationPhaseLabel}
              className="text-[10px]"
            />
          ) : null}

          {t0FirstMatch ? null : (
            <RhizohConversationContinuityStripV1
              continuitySnap={conversationContinuitySnap}
              uiLocale={uiLocale}
            />
          )}

          <RhizohPresenceContractStripV0 className="mb-1 text-white/70" />

          {inlineError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-[10px] normal-case backdrop-blur-md"
            >
              <div className="font-semibold text-red-100">{inlineError.title}</div>
              <p className="mt-1 text-white/85">{inlineError.detail}</p>
              {onDismissError ? (
                <button type="button" className="mt-2 text-[9px] text-white/70 underline" onClick={onDismissError}>
                  Kapat
                </button>
              ) : null}
            </div>
          ) : null}

          {mainHudReply?.text || (busy && fieldState !== "idle") ? (
            <div
              role="status"
              className="rounded-lg border border-emerald-400/30 bg-emerald-950/30 px-3 py-2 text-[11px] text-white/90 normal-case whitespace-pre-wrap backdrop-blur-md"
              data-rhizoh-reply-text="1"
            >
              <div className="min-w-0">
                {mainHudReply?.text ? (
                  <>
                    {mainHudReply.text.slice(0, 400)}
                    {mainHudReply.text.length > 400 ? "…" : ""}
                  </>
                ) : (
                  <span className="text-cyan-200/70 italic">Yanıt hazırlanıyor…</span>
                )}
                {onDismissReply && mainHudReply?.text ? (
                  <button
                    type="button"
                    className="mt-1 block text-[9px] text-white/55 underline"
                    onClick={onDismissReply}
                  >
                    Kapat
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showAlignmentStrip ? (
            <PerceptionAlignmentObservationStripV0
              snapshot={alignmentSnapshot}
              className="mb-1"
            />
          ) : null}

          <StabilityLearningTraceStripGateV0 className="mb-1" />

          <RhizohFoxFirstContactStripGateV0 uiLocale={locale} className="mx-1 mb-1" />

          <RhizohFoxProactiveCalibrationChipGateV0 uiLocale={locale} className="mx-1 mb-1" />

          <PerceptionFractureLayerV0
            atmosphere={fractureAtmosphere}
            layer="octo"
            className="[perspective:900px]"
            data-rhizoh-octo-mount={octoMountId}
          >
            <OctoConversationStageV1
              fieldState={fieldState}
              replyText={mainHudReply?.text || ""}
              draftText={cmd}
              busy={busy}
              submitPulse={octoSubmitPulse}
              mediaStream={productCameraStream}
              height={stageHeightPx}
              heightMax={stageHeightMaxPx}
              fracturePhaseMs={fractureAtmosphere?.octo?.phaseMs ?? 0}
              anchorSpeciesId={anchorSpeciesId}
              className={`mb-0 rounded-xl transition-shadow duration-300 ${
                conversationHero
                  ? "shadow-[0_0_28px_rgba(34,211,238,0.18)] ring-1 ring-cyan-400/30"
                  : ""
              }`}
            />
          </PerceptionFractureLayerV0>

          {isCastleLayerRenderableV1("t0_slot_chat_surface") ? (
            <div
              className="relative overflow-hidden rounded-b-2xl rounded-t-none border border-white/15 border-t-0 bg-black/75 shadow-[0_0_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              data-rhizoh-unified-input="1"
            >
              <RhizohInputThoughtGlowV0 fieldState={fieldState} />
              {inputRow}
              <div className="flex items-center gap-2 border-t border-white/8 px-3 py-1.5 text-[8px] normal-case text-white/45">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    gatewayConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                  aria-hidden
                />
                <span className="truncate">{stateLine}</span>
                {voiceMicDeviceLabel ? (
                  <span
                    className="ml-auto truncate max-w-[10rem] text-cyan-200/70"
                    title={voiceMicDeviceLabel}
                    data-rhizoh-active-mic="1"
                  >
                    Mic: {voiceMicDeviceLabel}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center mb-0 px-0"
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
            <span className="font-semibold text-white/85 normal-case">{stateLine}</span>
            {!gatewayConnected && gatewayUx?.headline ? (
              <span className="text-white/45 truncate max-w-[12rem] normal-case text-[8px]">
                {gatewayUx.headline}
              </span>
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

        {t0FirstMatch ? null : (
          <RhizohConversationContinuityStripV1
            continuitySnap={conversationContinuitySnap}
            uiLocale={uiLocale}
          />
        )}

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

        {mainHudReply?.text || (busy && fieldState !== "idle") ? (
          <div
            role="status"
            className="rounded-lg border border-emerald-400/30 bg-emerald-950/20 px-3 py-2 text-[11px] text-white/90 normal-case whitespace-pre-wrap"
            data-rhizoh-reply-text="1"
          >
            <div className="min-w-0">
              {mainHudReply?.text ? (
                <>
                  {mainHudReply.text.slice(0, 400)}
                  {mainHudReply.text.length > 400 ? "…" : ""}
                </>
              ) : (
                <span className="text-cyan-200/70 italic">Yanıt hazırlanıyor…</span>
              )}
              {onDismissReply && mainHudReply?.text ? (
                <button type="button" className="mt-1 block text-[9px] text-white/55 underline" onClick={onDismissReply}>
                  Kapat
                </button>
              ) : null}
            </div>
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

        {showAlignmentStrip ? (
          <PerceptionAlignmentObservationStripV0 snapshot={alignmentSnapshot} className="mb-1" />
        ) : null}

        <StabilityLearningTraceStripGateV0 className="mb-1" />

        <PerceptionFractureLayerV0
          atmosphere={fractureAtmosphere}
          layer="octo"
          className="[perspective:900px]"
          data-rhizoh-octo-mount={octoMountId}
        >
          <OctoConversationStageV1
            fieldState={fieldState}
            replyText={mainHudReply?.text || ""}
            draftText={cmd}
            busy={busy}
            submitPulse={octoSubmitPulse}
            mediaStream={productCameraStream}
            height={stageHeightPx}
            heightMax={stageHeightMaxPx}
            fracturePhaseMs={fractureAtmosphere?.octo?.phaseMs ?? 0}
            anchorSpeciesId={anchorSpeciesId}
            className={
              conversationHero
                ? "rounded-xl shadow-[0_0_28px_rgba(34,211,238,0.18)] ring-1 ring-cyan-400/30"
                : ""
            }
          />
        </PerceptionFractureLayerV0>

        {isCastleLayerRenderableV1("t0_slot_chat_surface") ? (
          <div className="relative overflow-hidden rounded-b-2xl rounded-t-none border border-white/12 border-t-0 bg-black/50">
            <RhizohInputThoughtGlowV0 fieldState={fieldState} collectiveDensity={collectiveDensity} />
            {inputRow}
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
