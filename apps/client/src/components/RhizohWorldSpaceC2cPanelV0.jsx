import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Video } from "lucide-react";
import {
  endCastleC2cCallV0,
  startCastleC2cCallV0
} from "../castleSocial/castleC2cWebRtcTransportV0.js";
import { readCastleSocialAvSessionV0 } from "../castleSocial/castleSocialAvSessionV0.js";
import { CASTLE_C2C_STATE_EVENT_V0 } from "../castleSocial/castleC2cWebRtcTransportV0.js";
import { RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0 } from "../rhizoh/runtime/rhizohWorldMapPanelSurfaceV0.js";

/**
 * C2C A/V panel — gateway WebRTC signaling + castleSocialAvSessionV0 lifecycle.
 */
export const RhizohWorldSpaceC2cPanelV0 = memo(function RhizohWorldSpaceC2cPanelV0({
  peer,
  userId,
  uiLocale = "en",
  onClose,
  recordBridgePeer
}) {
  const tr = uiLocale === "tr";
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sessionSnap, setSessionSnap] = useState(() => readCastleSocialAvSessionV0());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const onState = () => setSessionSnap(readCastleSocialAvSessionV0());
    window.addEventListener(CASTLE_C2C_STATE_EVENT_V0, onState);
    return () => {
      window.removeEventListener(CASTLE_C2C_STATE_EVENT_V0, onState);
    };
  }, []);

  useEffect(() => {
    const onRemote = (ev) => {
      const stream = ev?.detail?.stream;
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
      }
    };
    window.addEventListener("castle:c2c-remote-stream-v0", onRemote);
    return () => window.removeEventListener("castle:c2c-remote-stream-v0", onRemote);
  }, []);

  const onStartCall = useCallback(async () => {
    if (!peer?.uid || !userId) return;
    setBusy(true);
    setStatus(tr ? "Bağlanıyor…" : "Connecting…");
    const out = await startCastleC2cCallV0({
      userId,
      peerUid: peer.uid,
      peerClientId: peer.gatewayClientId,
      peerLabel: peer.displayName || peer.uid.slice(0, 8),
      mic: true,
      camera: false
    });
    setBusy(false);
    if (out.ok) {
      setStatus(tr ? "C2C oturumu LIVE" : "C2C session LIVE");
      void recordBridgePeer?.(peer.uid);
      return;
    }
    setStatus(
      out.reason === "peer_offline"
        ? tr
          ? "Peer çevrimdışı — gateway'de görünmüyor."
          : "Peer offline — not visible on gateway."
        : tr
          ? `Bağlantı hatası: ${out.reason}`
          : `Connection error: ${out.reason}`
    );
  }, [peer, userId, tr, recordBridgePeer]);

  const onEndCall = useCallback(() => {
    endCastleC2cCallV0();
    setSessionSnap(null);
    setStatus(tr ? "Arama sonlandı." : "Call ended.");
    onClose?.();
  }, [onClose, tr]);

  if (!peer?.uid) return null;

  return (
    <div
      className={`pointer-events-auto fixed bottom-28 right-4 z-[28] w-[min(100vw-2rem,22rem)] border-cyan-400/30 p-3 ${RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0}`}
      data-rhizoh-world-space-c2c-panel="1"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
            {tr ? "Peer Kale · C2C" : "Peer Castle · C2C"}
          </p>
          <h3 className="text-sm font-bold text-gray-100">
            {peer.displayName || `${peer.uid.slice(0, 8)}…`}
          </h3>
          <p className="text-[9px] text-gray-500">
            {sessionSnap?.lifecycle || "DRAFT"} · {sessionSnap?.transport || "idle"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/50 hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black/60">
          <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover opacity-40" />
          <span className="absolute bottom-1 left-1 text-[8px] text-white/40">{tr ? "Sen" : "You"}</span>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black/60">
          <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
          <span className="absolute bottom-1 left-1 text-[8px] text-white/40">{tr ? "Peer" : "Peer"}</span>
        </div>
      </div>

      {status ? <p className="mb-2 text-[9px] text-cyan-200/75 normal-case">{status}</p> : null}

      <div className="flex gap-2">
        {!sessionSnap ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onStartCall()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[10px] font-bold uppercase text-emerald-200 disabled:opacity-50"
          >
            <Phone size={14} /> {tr ? "Ara" : "Call"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEndCall}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-[10px] font-bold uppercase text-red-200"
          >
            <PhoneOff size={14} /> {tr ? "Kapat" : "End"}
          </button>
        )}
        <button
          type="button"
          title={tr ? "Kamera sonraki sprint" : "Camera next sprint"}
          disabled
          className="rounded-xl border border-white/10 px-3 py-2 text-white/30"
        >
          <Video size={14} />
        </button>
        <button
          type="button"
          title={sessionSnap?.micActive ? "Mic on" : "Mic off"}
          disabled
          className="rounded-xl border border-white/10 px-3 py-2 text-white/30"
        >
          {sessionSnap?.micActive ? <Mic size={14} /> : <MicOff size={14} />}
        </button>
      </div>
    </div>
  );
});
