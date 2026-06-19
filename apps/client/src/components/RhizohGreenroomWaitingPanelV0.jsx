import React, { memo, useCallback, useMemo } from "react";
import { Clock, Radio, Swords, Video, Wifi, WifiOff } from "lucide-react";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import { openOctoYuvaEightCameraLabV1 } from "../rhizoh/runtime/octoYuvaMediaLabBridgeV1.js";
import { CHESS_GAME_MODE_V0 } from "../rhizoh/runtime/chessArenaEngineV0.js";
import {
  isRhizohLegalPendingHoldV0,
  maybeDispatchLegalPendingChessArenaV0
} from "../rhizoh/runtime/rhizohLegalPendingWaitLoopV0.js";
import { resolveIngressRouteV0 } from "../rhizoh/ingress/ingress_router.js";
import { isTowerElevenLabsVoiceEnabledV0 } from "../rhizoh/runtime/towerVoiceAdapterV0.js";

/**
 * Greenroom / broadcast waiting room — cross-device status + play-while-you-wait chess.
 */
export const RhizohGreenroomWaitingPanelV0 = memo(function RhizohGreenroomWaitingPanelV0({
  uiLocale = "en",
  gatewayPhase = "unknown",
  gatewayHeadline = "",
  experienceSessionId = null,
  surface = "greenroom"
}) {
  const tr = uiLocale === "tr";
  const ingress = useMemo(() => resolveIngressRouteV0(), []);
  const legalHold = isRhizohLegalPendingHoldV0();
  const gatewayConnected =
    gatewayPhase === "connected" ||
    gatewayPhase === "uncertain" ||
    gatewayPhase === "degraded" ||
    gatewayPhase === "degraded_llm" ||
    gatewayPhase === "degraded_storage";
  const elevenLabsReady = isTowerElevenLabsVoiceEnabledV0();

  const onPlayChess = useCallback(() => {
    maybeDispatchLegalPendingChessArenaV0({ force: true });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
          detail: Object.freeze({
            source: "greenroom_waiting_panel",
            initialMode: CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH,
            autoPlay: true,
            node: Object.freeze({
              id: "chess_arena",
              type: "zone",
              label: "GREENROOM",
              name: tr ? "Beklerken satranç" : "Chess while waiting",
              color: "#34d399"
            })
          })
        })
      );
    }
  }, [tr]);

  const onOpenOctoLab = useCallback(() => {
    openOctoYuvaEightCameraLabV1({
      source: "greenroom_waiting_panel",
      title: tr ? "Octo Lab · Bekleme odası" : "Octo Lab · Waiting room"
    });
  }, [tr]);

  const statusRows = [
    {
      key: "legal",
      ok: !legalHold && ingress.acked,
      label: tr ? "Yasal onay" : "Legal approval",
      detail: legalHold
        ? tr
          ? "Onay bekleniyor — Rhizoh satranç döngüsü aktif"
          : "Approval pending — Rhizoh chess loop active"
        : tr
          ? "Onaylı"
          : "Acknowledged"
    },
    {
      key: "gateway",
      ok: gatewayConnected,
      label: tr ? "Gateway / LLM worker" : "Gateway / LLM worker",
      detail: gatewayHeadline || (gatewayConnected ? (tr ? "Bağlı" : "Connected") : tr ? "Bekleniyor" : "Waiting")
    },
    {
      key: "voice",
      ok: elevenLabsReady || gatewayConnected,
      label: tr ? "Kule ses adaptörü" : "Tower voice adapter",
      detail: elevenLabsReady
        ? tr
          ? "ElevenLabs (yasal kapı açık)"
          : "ElevenLabs (legal gate open)"
        : tr
          ? "Tarayıcı TTS · kule başına preset"
          : "Browser TTS · per-tower preset"
    },
    {
      key: "mesh",
      ok: Boolean(experienceSessionId),
      label: tr ? "Deneyim oturumu" : "Experience session",
      detail: experienceSessionId
        ? String(experienceSessionId).slice(0, 18)
        : tr
          ? "Oturum oluşturuluyor"
          : "Session booting"
    }
  ];

  return (
    <div
      className="mb-3 rounded-xl border border-emerald-400/30 bg-[#061a14] p-3 shadow-inner"
      data-rhizoh-greenroom-waiting-panel="1"
      data-rhizoh-surface={surface}
    >
      <div className="mb-2 flex items-center gap-2">
        <Clock size={14} className="text-emerald-300/90" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/90">
          {tr ? "Bekleme odası" : "Waiting room"}
        </p>
        <span className="ml-auto flex items-center gap-1 text-[8px] uppercase text-white/40">
          <Radio size={10} />
          {surface === "broadcast" ? "LIVE PREP" : "GREENROOM"}
        </span>
      </div>

      <p className="mb-3 text-[10px] leading-relaxed text-white/60 normal-case">
        {tr
          ? "Yasal onay ve gateway hazır olana kadar bekleme modundasın. Rhizoh gerçek Stockfish maçlarıyla döngüyü tamamlar; her kule kendi ses profiline sahiptir."
          : "You are in hold mode until legal approval and gateway are ready. Rhizoh completes the cycle with real Stockfish matches; each tower keeps its own voice profile."}
      </p>

      <ul className="mb-3 space-y-1.5">
        {statusRows.map((row) => (
          <li
            key={row.key}
            className="flex items-start gap-2 rounded-lg border border-white/8 bg-[#030a08] px-2 py-1.5"
          >
            {row.ok ? (
              <Wifi size={12} className="mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <WifiOff size={12} className="mt-0.5 shrink-0 text-amber-400/90" />
            )}
            <div className="min-w-0">
              <p className="text-[9px] font-semibold text-white/80">{row.label}</p>
              <p className="text-[8px] text-white/45 normal-case">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onOpenOctoLab}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/35 bg-purple-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-purple-100 hover:bg-purple-500/20"
      >
        <Video size={14} />
        {tr ? "Octo Lab (8 kamera)" : "Octo Lab (8 cameras)"}
      </button>
      <button
        type="button"
        onClick={onPlayChess}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-100 hover:bg-cyan-500/25"
      >
        <Swords size={14} />
        {tr ? "Beklerken Rhizoh satranç" : "Rhizoh chess while waiting"}
      </button>
    </div>
  );
});
