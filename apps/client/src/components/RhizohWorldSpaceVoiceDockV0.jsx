import React, { memo, useCallback, useMemo } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { useRhizohConversationDockV0 } from "../rhizoh/runtime/useRhizohConversationDockV0.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";
import { resolveChatPlaceholderV0 } from "../rhizoh/runtime/rhizohProductCopyI18nV0.js";
import { getCastleWorldDataStateV2 } from "../castleFlight/castleWorldDataProviderV2.js";
import { resolveWorldMapBootstrapGeoV0 } from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { getWorldMapLiveFeedSnapshotV0 } from "../rhizoh/runtime/worldMapLiveFeedV0.js";
import { readActiveSpatialMemoryMapPinsV1 } from "../rhizoh/runtime/rhizohSpatialMemoryAnchorV1.js";
import { readCastleSocialAvSessionV0 } from "../castleSocial/castleSocialAvSessionV0.js";
import { getRhizohWorldMapToolSnapshotV0 } from "../rhizoh/runtime/rhizohWorldMapToolV0.js";
import { buildRhizohMapBrainActionsV1 } from "../rhizoh/runtime/rhizohMapBrainV1.js";
import { buildRhizohLiveContextEnvelopeV2,
  formatRhizohLiveContextActionLabelV2
} from "../rhizoh/runtime/rhizohLiveContextEngineV2.js";
import { RhizohAskRhizohSourceBadgeV0 } from "./RhizohAskRhizohSourceBadgeV0.jsx";

/**
 * Map-stage voice dock — mic + text only. No fox / Octo / cube stage.
 */
export const RhizohWorldSpaceVoiceDockV0 = memo(function RhizohWorldSpaceVoiceDockV0({
  firebaseUser,
  uiLocale,
  className = ""
}) {
  const locale = uiLocale || readUiLocaleV0();
  const tr = locale === "tr";
  const buildContextEnvelope = useCallback(
    ({ message }) => {
      const anchor = resolveWorldMapBootstrapGeoV0();
      const worldData = getCastleWorldDataStateV2();
      const liveFeed = getWorldMapLiveFeedSnapshotV0();
      const memoryPins = readActiveSpatialMemoryMapPinsV1();
      const activeSession = readCastleSocialAvSessionV0();
      const activeMapTool = getRhizohWorldMapToolSnapshotV0();
      const mapBrain = buildRhizohMapBrainActionsV1({
        conversationState: {
          lastIntent: message,
          activeThreads: memoryPins.length ? ["spatial_memory"] : [],
          unresolvedTasks: activeSession?.spatialSession?.conversationContext?.openLoops || []
        },
        mapState: {
          active: true,
          activeMapTool,
          hasActiveCastle: anchor.source !== "origin_seed_serencebey",
          memoryNodeCount: memoryPins.length,
          hasUserLocation: anchor.source !== "origin_seed_serencebey",
          worldDataReady: worldData.feed !== "unavailable"
        },
        limit: 3
      });

      return buildRhizohLiveContextEnvelopeV2({
        userMessage: message,
        spatial: {
          ...anchor,
          mapTool: activeMapTool,
          worldData
        },
        memory: {
          spatial: memoryPins.map((pin) => pin.label || pin.anchorId || pin.id),
          intents: activeSession?.spatialSession?.conversationContext?.openLoops || [],
          narrative: activeSession ? ["castle_session_active"] : [],
          openLoopCount: activeSession?.spatialSession?.conversationContext?.openLoops?.length || 0
        },
        liveWorld: liveFeed || { source: "world_feed_cache_empty" },
        activeSession: activeSession
          ? {
              sessionId: activeSession.sessionId,
              lifecycle: activeSession.lifecycle,
              roomKey: activeSession.roomKey,
              spatialSession: activeSession.spatialSession
            }
          : null,
        suggestedActions: mapBrain.actions
      });
    },
    []
  );
  const dock = useRhizohConversationDockV0({
    firebaseUser,
    conversationPhase: "EXPLORE_MAP",
    contextProvider: buildContextEnvelope
  });

  const contextPreview = useMemo(
    () => buildContextEnvelope({ message: dock.draft || "" }),
    [buildContextEnvelope, dock.draft]
  );
  const suggestedActions = dock.lastContextEnvelope?.suggestedActions?.length
    ? dock.lastContextEnvelope.suggestedActions
    : contextPreview.suggestedActions;

  const statusLine =
    dock.fieldState === "listening"
      ? tr
        ? "Dinliyorum…"
        : "Listening…"
      : dock.fieldState === "thinking"
        ? tr
          ? "Yanıt hazırlanıyor…"
          : "Thinking…"
        : dock.fieldState === "speaking"
          ? tr
            ? "Konuşuyor…"
            : "Speaking…"
          : tr
            ? "Hazır · yaz veya mikrofona dokun"
            : "Ready · type or tap mic";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#050810] shadow-lg ${className}`.trim()}
      data-rhizoh-world-space-voice-dock="1"
      data-field-state={dock.fieldState}
    >
      {dock.lastReply ? (
        <div className="border-b border-white/8 px-3 py-2 text-[11px] leading-snug text-white/88 normal-case">
          <div className="mb-1 flex items-center gap-2">
            <RhizohAskRhizohSourceBadgeV0 source={dock.lastReplySource} uiLocale={locale} compact />
          </div>
          {dock.lastReply.slice(0, 280)}
          {dock.lastReply.length > 280 ? "…" : ""}
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 px-2 py-2">
        {dock.voiceV3Enabled ? (
          <button
            type="button"
            onClick={() => void dock.toggleMic()}
            disabled={dock.busy && !dock.micActive}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
              dock.micActive
                ? "border-rose-400/50 bg-rose-500/20 text-rose-100"
                : "border-white/15 bg-white/5 text-white/75 hover:border-cyan-400/40"
            }`}
            aria-label={dock.micActive ? (tr ? "Mikrofonu kapat" : "Stop mic") : tr ? "Mikrofon" : "Mic"}
            aria-pressed={dock.micActive}
          >
            {dock.micActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        ) : null}

        <input
          value={dock.draft}
          onChange={(e) => dock.setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !dock.busy) {
              e.preventDefault();
              void dock.sendText();
            }
          }}
          disabled={dock.busy}
          placeholder={resolveChatPlaceholderV0(locale)}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none normal-case placeholder:text-white/40"
          aria-label={tr ? "Rhizoh mesajı" : "Message Rhizoh"}
        />

        <button
          type="button"
          onClick={() => void dock.sendText()}
          disabled={dock.busy || !String(dock.draft || "").trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/90 text-black disabled:opacity-40"
          aria-label={tr ? "Gönder" : "Send"}
        >
          {dock.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <p className="px-3 pb-2 text-[9px] text-cyan-200/65 normal-case">{statusLine}</p>
      {suggestedActions?.length ? (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {suggestedActions.slice(0, 3).map((action) => (
            <span
              key={action.id}
              className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[8px] text-cyan-100/75"
            >
              {formatRhizohLiveContextActionLabelV2(action, tr ? "tr" : "en")}
            </span>
          ))}
        </div>
      ) : null}
      {dock.lastError ? (
        <p className="px-3 pb-2 text-[9px] text-rose-300/80 normal-case">{dock.lastError}</p>
      ) : null}
    </div>
  );
});
