/**
 * City map legal-hold gate — countdown + Castle Genesis YouTube until legal ack.
 * Opens city_map; surfaces media tube with YouTube lab data hook for communities.
 */

import { resolveIngressRouteV0, hasLegalAccessAckV0 } from "../ingress/ingress_router.js";
import {
  readRhizohNeonCountdownDeadlineMsV0,
  resolveRhizohNeonCountdownRemainingMsV0
} from "./rhizohNeonCountdownV0.js";
import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 } from "./sovereignWorldMapNodesV0.js";
import { CASTLE_MEDIA_EVENT_STATE_V0 } from "./castleArchiveMediaMetaV0.js";
import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { ingestYoutubeCommunityLabV0 } from "./youtubeCommunityDataAdapterV0.js";

export const CITY_MAP_LEGAL_MEDIA_GATE_SCHEMA_V0 = "castle.city_map_legal_media_gate.v0";
export const RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0 = "rhizoh:city-map-legal-gate-tick-v0";

let gateBooted = false;
let gateTimer = null;

/**
 * @returns {object}
 */
export function readCityMapLegalGateSnapshotV0() {
  const ingress = resolveIngressRouteV0();
  const legalHold = isRhizohLegalPendingHoldV0();
  const deadlineMs = readRhizohNeonCountdownDeadlineMsV0();
  const remainingMs = resolveRhizohNeonCountdownRemainingMsV0(deadlineMs, Date.now());
  return Object.freeze({
    schema: CITY_MAP_LEGAL_MEDIA_GATE_SCHEMA_V0,
    legalHold,
    legalAcked: ingress.acked || hasLegalAccessAckV0(),
    ingressRoute: ingress.route,
    countdownRemainingMs: remainingMs,
    countdownComplete: remainingMs <= 0,
    eventState: legalHold ? CASTLE_MEDIA_EVENT_STATE_V0.COUNTDOWN : CASTLE_MEDIA_EVENT_STATE_V0.LIVE,
    atMs: Date.now()
  });
}

/**
 * Prime city_map + optional Castle Genesis YouTube holding broadcast.
 */
export function primeCityMapLegalCountdownSurfaceV0(opts = {}) {
  if (typeof window === "undefined") return false;
  const snap = readCityMapLegalGateSnapshotV0();
  void applyRhizohWorldMapToolV0("city_map", {
    leafletOnly: true,
    source: opts.source || "CITY_MAP_LEGAL_GATE"
  });

  if (snap.legalHold || opts.forceMedia) {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, {
          detail: Object.freeze({
            source: "city_map_legal_countdown",
            initialChannelId: "castle_genesis",
            title: opts.title || "Castle Genesis · Legal Hold",
            legalGate: true,
            countdownRemainingMs: snap.countdownRemainingMs,
            node: Object.freeze({
              id: "event",
              type: "broadcast",
              label: "CASTLE TV",
              color: "#ef4444",
              description:
                opts.uiLocale === "tr"
                  ? "Yasal onay bekleniyor — Castle Genesis yayını ve topluluk verisi"
                  : "Legal approval pending — Castle Genesis broadcast + community data"
            })
          })
        })
      );
    } catch {
      return false;
    }
  }

  try {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.cityMapLegalGate = snap;
    window.dispatchEvent(
      new CustomEvent(RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0, { detail: snap })
    );
  } catch {
    /* noop */
  }
  return true;
}

/**
 * Boot on World Space — poll until legal ack, then close hold state.
 */
export function startCityMapLegalCountdownMediaGateV0(opts = {}) {
  if (typeof window === "undefined" || gateBooted) return () => {};
  gateBooted = true;
  const pollMs = Math.max(5000, Number(opts.pollMs) || 15_000);

  primeCityMapLegalCountdownSurfaceV0(opts);
  void ingestYoutubeCommunityLabV0();

  gateTimer = window.setInterval(() => {
    const snap = readCityMapLegalGateSnapshotV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.cityMapLegalGate = snap;
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CITY_MAP_LEGAL_GATE_TICK_EVENT_V0, { detail: snap })
      );
    }
    if (snap.legalHold) {
      void ingestYoutubeCommunityLabV0();
    }
    if (!snap.legalHold && snap.legalAcked) {
      gateBooted = false;
      if (gateTimer) {
        clearInterval(gateTimer);
        gateTimer = null;
      }
    }
  }, pollMs);

  return () => {
    gateBooted = false;
    if (gateTimer) {
      clearInterval(gateTimer);
      gateTimer = null;
    }
  };
}

export function resetCityMapLegalGateForTestsV0() {
  gateBooted = false;
  if (gateTimer && typeof window !== "undefined") {
    clearInterval(gateTimer);
    gateTimer = null;
  }
}
