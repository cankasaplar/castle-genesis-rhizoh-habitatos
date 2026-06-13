import React, { memo, useCallback, useMemo, useSyncExternalStore } from "react";
import { Radio, Swords, MessageCircle, Eye, Phone } from "lucide-react";
import {
  CASTLE_NETWORK_PRESENCE_EVENT_V0,
  listCastlePresenceV0,
  listNearbyCastlesV0,
  presenceColorForStateV0
} from "../rhizoh/runtime/castlePresenceRegistryV0.js";
import { readCastleNexusGeoV0 } from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1 } from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";
import { sendCastleSyncPingV0 } from "../castleSocial/castleC2cRealtimeBusV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";

function subscribePresence(cb) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, cb);
  return () => window.removeEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, cb);
}

function readPresenceSnapshot() {
  return listCastlePresenceV0().length;
}

function presenceStateLabelV0(state, tr) {
  const s = String(state || "ONLINE").toUpperCase();
  if (s === "BROADCASTING") return tr ? "YAYINDA" : "BROADCASTING";
  if (s === "THINKING") return tr ? "DÜŞÜNÜYOR" : "THINKING";
  if (s === "SYNCING") return tr ? "SENKRON" : "SYNCING";
  if (s === "OFFLINE") return tr ? "ÇEVRİMDIŞI" : "OFFLINE";
  return tr ? "ÇEVRİMİÇİ" : "ONLINE";
}

/**
 * Rhizoh Tower Portal — nearby castle discovery (Join · Observe · Message · Challenge).
 */
export const RhizohTowerPortalDiscoveryV0 = memo(function RhizohTowerPortalDiscoveryV0({
  open,
  onClose,
  userId = "",
  uiLocale = "en",
  node = null
}) {
  const tr = uiLocale === "tr";
  useSyncExternalStore(subscribePresence, readPresenceSnapshot, () => 0);

  const geo = readCastleNexusGeoV0();
  const nearby = useMemo(
    () =>
      listNearbyCastlesV0({
        lat: geo?.lat,
        lon: geo?.lon,
        radiusKm: 500,
        excludeCastleId: String(userId || "")
      }),
    [geo?.lat, geo?.lon, userId, open]
  );

  const onJoin = useCallback(
    (row) => {
      if (!row?.castleId && !row?.userId) return;
      const uid = String(row.userId || row.castleId);
      window.dispatchEvent(
        new CustomEvent(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, {
          detail: Object.freeze({
            uid,
            displayName: row.displayName || `Castle ${uid.slice(0, 6)}`,
            lat: row.lat,
            lon: row.lon,
            gatewayClientId: row.gatewayClientId || null,
            presenceState: row.state
          })
        })
      );
    },
    []
  );

  const onObserve = useCallback((row) => {
    const lat = Number(row?.lat);
    const lon = Number(row?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    window.dispatchEvent(
      new CustomEvent(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, {
        detail: Object.freeze({
          lat,
          lon,
          zoom: 16,
          name: row.displayName || row.castleId,
          source: "tower_portal_observe"
        })
      })
    );
  }, []);

  const onMessage = useCallback((row) => {
    const peerUid = String(row?.userId || row?.castleId || "");
    if (!peerUid) return;
    sendCastleSyncPingV0(peerUid);
  }, []);

  const onChallenge = useCallback(
    (row) => {
      const peerUid = String(row?.userId || row?.castleId || "");
      if (!peerUid) return;
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
          detail: Object.freeze({
            node: node || { id: "chess_arena", type: "zone", label: "CHESS" },
            peerCastle: Object.freeze({
              uid: peerUid,
              displayName: row.displayName || peerUid.slice(0, 8),
              gatewayClientId: row.gatewayClientId || null
            })
          })
        })
      );
      onClose?.();
    },
    [node, onClose]
  );

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[28] flex justify-center px-4">
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-purple-400/35 bg-black/88 p-4 text-white shadow-2xl backdrop-blur-md"
        data-rhizoh-tower-portal="1"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-purple-300/70">
              {tr ? "Rhizoh Kulesi · Portal" : "Rhizoh Tower · Portal"}
            </p>
            <h2 className="mt-1 text-sm font-black text-purple-200">
              {tr ? "Yakındaki Kaleler" : "Nearby Castles"}
            </h2>
            <p className="mt-1 text-[10px] text-white/50">
              {tr
                ? "Ağda görünen kaleler — katıl, izle, mesajlaş veya meydan oku."
                : "Castles visible on the network — join, observe, message, or challenge."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {nearby.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center text-[11px] text-white/55">
              {tr
                ? "Henüz yakında kale yok. Gateway relay açıkken başka kaleler PEER_JOIN ile görünür."
                : "No nearby castles yet. When gateway relay is live, other castles appear via PEER_JOIN."}
            </p>
          ) : (
            nearby.map((row) => {
              const color = presenceColorForStateV0(row.state);
              const stateLabel = presenceStateLabelV0(row.state, tr);
              return (
                <div
                  key={row.castleId}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  data-castle-id={row.castleId}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-white/90">
                        {row.displayName || `Castle ${String(row.castleId).slice(0, 8)}`}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/45">
                        {row.region || "GLOBAL"}
                        {Number.isFinite(row.distanceKm) ? ` · ${row.distanceKm.toFixed(0)} km` : ""}
                        {row.viewers > 0 ? ` · ${row.viewers} ${tr ? "izleyici" : "viewers"}` : ""}
                      </p>
                    </div>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider"
                      style={{ borderColor: `${color}55`, color, background: `${color}14` }}
                    >
                      {stateLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onJoin(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <Phone className="h-3 w-3" />
                      {tr ? "Katıl" : "Join"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onObserve(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-[9px] font-bold uppercase text-sky-200 hover:bg-sky-500/20"
                    >
                      <Eye className="h-3 w-3" />
                      {tr ? "İzle" : "Observe"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onMessage(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-[9px] font-bold uppercase text-cyan-200 hover:bg-cyan-500/20"
                    >
                      <MessageCircle className="h-3 w-3" />
                      {tr ? "Mesaj" : "Message"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChallenge(row)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase text-amber-200 hover:bg-amber-500/20"
                    >
                      <Swords className="h-3 w-3" />
                      {tr ? "Meydan Oku" : "Challenge"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-3 flex items-center gap-1 text-[9px] text-white/35">
          <Radio className="h-3 w-3" />
          {tr
            ? `${nearby.length} kale · gateway PEER_DISCOVER`
            : `${nearby.length} castle${nearby.length === 1 ? "" : "s"} · gateway PEER_DISCOVER`}
        </p>
      </div>
    </div>
  );
});
