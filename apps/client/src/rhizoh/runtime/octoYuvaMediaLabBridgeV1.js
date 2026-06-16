/**
 * Octo yuva → 8-camera lab + YouTube ↔ 3D performance bridge (v1).
 * Dual map: Leaflet observation + Cesium Ion world lens (no executor merge).
 * @see docs/CAMERA_UNIFICATION_SPEC_V1.md · docs/OCTO_PRESENCE_FIELD_V1.md
 */

import { buildOctoPerformanceFeedV0, OCTO_PERFORMANCE_SIGNAL_KIND_V0 } from "../../castleSocial/octoPerformanceFeedV0.js";
import { fetchYoutubePublisherAnalyticsSnapshotV0, bridgeAnalyticsSnapshotToCoherenceIngestV0 } from "../social/multiUser/youtubePublisherAnalyticsCoherenceHookV0.js";
import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 } from "./sovereignWorldMapNodesV0.js";
import { STUDIO_CAMERA_MODE_V1 } from "../../studio/studioLiveRoomCameraV1.js";

export const OCTO_YUVA_MEDIA_LAB_BRIDGE_SCHEMA_V1 = "castle.octo_yuva_media_lab_bridge.v1";
export const RHIZOH_OCTO_YUVA_ACTIVATED_EVENT_V1 = "rhizoh:octo-yuva-activated-v1";
export const RHIZOH_OCTO_PERFORMANCE_FEED_EVENT_V1 = "rhizoh:octo-performance-feed-v1";

/** Eight observation lenses — Leaflet + Cesium Ion + YouTube lab + studio + cube. */
export const OCTO_YUVA_EIGHT_CAMERA_LENSES_V1 = Object.freeze([
  Object.freeze({ id: "lens_castle_genesis", kind: "youtube_lab", channelId: "castle_genesis", label: "Castle Genesis Live" }),
  Object.freeze({ id: "lens_nasa", kind: "youtube_lab", channelId: "nasa", label: "NASA ISS Earth" }),
  Object.freeze({ id: "lens_lofi", kind: "youtube_lab", channelId: "lofi", label: "Quantum Lofi" }),
  Object.freeze({ id: "lens_local", kind: "local_capture", channelId: "local", label: "Local Camera" }),
  Object.freeze({ id: "lens_cesium_ion", kind: "cesium_ion", mapTool: "terrain", label: "Cesium Ion 3D" }),
  Object.freeze({ id: "lens_leaflet_satellite", kind: "leaflet_satellite", mapTool: "satellite", label: "Leaflet Satellite" }),
  Object.freeze({ id: "lens_studio_stage", kind: "studio_camera", mode: STUDIO_CAMERA_MODE_V1.STAGE_FOCUS, label: "Studio Stage" }),
  Object.freeze({ id: "lens_octo_cube", kind: "octo_cube", mode: "cognitive", label: "Octo Cube Camera" })
]);

const ACTIVATION_THRESHOLD_V1 = 0.55;
const YOUTUBE_POLL_MS_V1 = 45_000;

let yuvaActivatedPublished = false;
let youtubePollTimer = null;
let lastPerformanceIntensity = 0;

function readBridgeUrlV1() {
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    return String(env.VITE_YOUTUBE_PUBLISHER_BRIDGE_URL || "").trim();
  } catch {
    return "";
  }
}

/**
 * @returns {number} 0..1 engagement proxy for Octo motion bias
 */
export function readOctoLabPerformanceIntensityV1() {
  if (typeof window !== "undefined" && window.__rhizoh?.octoPerformanceFeed?.intensity != null) {
    return Math.min(1, Math.max(0, Number(window.__rhizoh.octoPerformanceFeed.intensity) || 0));
  }
  return lastPerformanceIntensity;
}

/**
 * @param {import('../../castleSocial/octoPerformanceFeedV0.js').buildOctoPerformanceFeedV0 extends Function ? ReturnType<typeof buildOctoPerformanceFeedV0> : object} feed
 */
export function publishOctoPerformanceFeedV1(feed) {
  if (!feed?.ok) return feed;
  lastPerformanceIntensity = Number(feed.intensity) || 0;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.octoPerformanceFeed = feed;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OCTO_PERFORMANCE_FEED_EVENT_V1, {
          detail: Object.freeze({ schema: OCTO_YUVA_MEDIA_LAB_BRIDGE_SCHEMA_V1, feed })
        })
      );
    } catch {
      /* noop */
    }
  }
  return feed;
}

/**
 * Prime dual-map observation: Leaflet satellite + Cesium Ion terrain slot armed.
 */
export function primeDualMapObservationForOctoLabV1() {
  void applyRhizohWorldMapToolV0("satellite", {
    leafletOnly: true,
    source: "OCTO_YUVA_LAB_LEAFLET"
  });
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    if (String(env.VITE_RHIZOH_WORLD_SPACE_CESIUM || "").trim() === "1") {
      void applyRhizohWorldMapToolV0("terrain", {
        leafletOnly: false,
        source: "OCTO_YUVA_LAB_CESIUM_ION"
      });
    }
  } catch {
    /* noop */
  }
}

/**
 * Open YouTube lab media tube + register eight camera lenses.
 */
export function openOctoYuvaEightCameraLabV1(opts = {}) {
  const lenses = OCTO_YUVA_EIGHT_CAMERA_LENSES_V1;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.octoEightCameraLab = Object.freeze({
      schema: OCTO_YUVA_MEDIA_LAB_BRIDGE_SCHEMA_V1,
      lenses,
      armedAtMs: Date.now(),
      source: String(opts.source || "octo_yuva")
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OCTO_YUVA_ACTIVATED_EVENT_V1, {
          detail: Object.freeze({
            schema: OCTO_YUVA_MEDIA_LAB_BRIDGE_SCHEMA_V1,
            lenses,
            source: opts.source || "octo_yuva"
          })
        })
      );
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, {
          detail: Object.freeze({
            source: "octo_yuva_lab",
            initialChannelId: "castle_genesis",
            title: opts.title || "Octo Lab · Castle Genesis",
            node: Object.freeze({
              id: "event",
              type: "broadcast",
              label: "OCTO LAB",
              color: "#06b6d4"
            }),
            octoLabMode: true,
            lenses
          })
        })
      );
    } catch {
      /* noop */
    }
  }
  primeDualMapObservationForOctoLabV1();
}

/**
 * @param {{ activation?: number, live?: boolean }} drive
 * @param {{ force?: boolean, source?: string }} [opts]
 */
export function maybePublishOctoYuvaActivationV1(drive = {}, opts = {}) {
  const activation = Number(drive.activation) || 0;
  const live = Boolean(drive.live);
  if (!opts.force && (yuvaActivatedPublished || !live || activation < ACTIVATION_THRESHOLD_V1)) {
    return false;
  }
  yuvaActivatedPublished = true;
  openOctoYuvaEightCameraLabV1({ source: opts.source || "octo_yuva_activation" });
  return true;
}

export function resetOctoYuvaLabBridgeForTestsV1() {
  yuvaActivatedPublished = false;
  lastPerformanceIntensity = 0;
  if (youtubePollTimer) {
    clearInterval(youtubePollTimer);
    youtubePollTimer = null;
  }
}

/**
 * Pull YouTube publisher analytics → Octo performance feed (engagement proxy).
 */
export async function tickYoutubeLabOctoPerformanceFeedV1(fetchImpl) {
  const baseUrl = readBridgeUrlV1();
  if (!baseUrl) {
    const sim = buildOctoPerformanceFeedV0({
      sessionId: "octo_lab_local",
      signalKind: OCTO_PERFORMANCE_SIGNAL_KIND_V0.ENGAGEMENT_PROXY,
      intensity: 0.12 + Math.sin(Date.now() / 12000) * 0.06,
      engagementProxy: 0.15,
      atMs: Date.now()
    });
    publishOctoPerformanceFeedV1(sim);
    return sim;
  }

  const snap = await fetchYoutubePublisherAnalyticsSnapshotV0(baseUrl, fetchImpl);
  const raw = bridgeAnalyticsSnapshotToCoherenceIngestV0(snap);
  const intensity = Math.min(
    1,
    Math.max(0, Number(raw?.viewVelocity01) || Number(raw?.retentionQuality01) || 0.2)
  );
  const feed = buildOctoPerformanceFeedV0({
    sessionId: "youtube_lab_bridge",
    signalKind: OCTO_PERFORMANCE_SIGNAL_KIND_V0.ENGAGEMENT_PROXY,
    intensity,
    engagementProxy: intensity,
    crowdDensity: raw?.retentionQuality01 != null ? Number(raw.retentionQuality01) : null,
    atMs: Date.now()
  });
  publishOctoPerformanceFeedV1(feed);
  return feed;
}

/**
 * Boot YouTube lab ↔ Octo 3D poll loop (World Space / T0).
 */
export function startYoutubeLabOctoBridgeV1() {
  if (typeof window === "undefined" || youtubePollTimer) return () => {};
  void tickYoutubeLabOctoPerformanceFeedV1();
  youtubePollTimer = window.setInterval(() => {
    void tickYoutubeLabOctoPerformanceFeedV1();
  }, YOUTUBE_POLL_MS_V1);
  return () => {
    if (youtubePollTimer) {
      clearInterval(youtubePollTimer);
      youtubePollTimer = null;
    }
  };
}
