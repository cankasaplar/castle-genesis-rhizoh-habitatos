/**
 * Spatial Memory Anchor v1 — consent-gated map beacons for high-significance future nodes.
 * Fox scores · Rhizoh narrates · Ghost renders feel · scheduler persists after consent.
 * RESEARCH-ONLY
 */

import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";
import {
  MEMORY_CONSENT_STATUS_V1,
  MEMORY_TIER_V1,
  probeFutureOrientationV1,
  SPATIAL_SIGNIFICANCE_THRESHOLD_V1
} from "./rhizohMemoryInvitationGateV1.js";
import { readUserCastleAnchorGeoV0, readCastleNexusGeoV0 } from "./worldMapBootstrapGeoV0.js";

export const RHIZOH_SPATIAL_MEMORY_ANCHOR_SCHEMA_V1 = "castle.rhizoh.spatial_memory_anchor.v1";
export const SPATIAL_MEMORY_STORAGE_KEY_V1 = "rhizoh.spatial_memory.v1";
export const SPATIAL_MEMORY_ANCHOR_EVENT_V1 = "rhizoh:spatial-memory-anchor";

/** Default fade — soft beacon decays (not permanent spam). */
export const SPATIAL_BEACON_FADE_MS_V1 = 14 * 24 * 60 * 60 * 1000;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

function readStoreV1() {
  try {
    if (typeof window === "undefined") return { anchors: [], pending: null };
    const raw = window.localStorage.getItem(SPATIAL_MEMORY_STORAGE_KEY_V1);
    if (!raw) return { anchors: [], pending: null };
    const parsed = JSON.parse(raw);
    return {
      anchors: Array.isArray(parsed?.anchors) ? parsed.anchors : [],
      pending: parsed?.pending && typeof parsed.pending === "object" ? parsed.pending : null
    };
  } catch {
    return { anchors: [], pending: null };
  }
}

function writeStoreV1(store) {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(
      SPATIAL_MEMORY_STORAGE_KEY_V1,
      JSON.stringify({
        schema: RHIZOH_SPATIAL_MEMORY_ANCHOR_SCHEMA_V1,
        anchors: store.anchors,
        pending: store.pending,
        updatedAt: Date.now()
      })
    );
    return true;
  } catch {
    return false;
  }
}

function emitSpatialAnchorEventV1(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SPATIAL_MEMORY_ANCHOR_EVENT_V1, {
      detail: Object.freeze(detail)
    })
  );
}

/**
 * @returns {object | null}
 */
export function readPendingSpatialMemoryInvitationV1() {
  return readStoreV1().pending;
}

/**
 * Fox-side spatial candidacy (no pin creation).
 * @param {{ significanceField?: Record<string, unknown> | null, message?: string, emotionalCharge?: number }} input
 */
export function computeSpatialCandidateScoreV1(input = {}) {
  const sig = clamp01(input.significanceField?.score ?? 0);
  const future = probeFutureOrientationV1(String(input.message || ""));
  const emotional =
    clamp01(input.emotionalCharge) ||
    (foldCanonicalSurfaceV1(String(input.message || "")).match(/\b(yorgun|stres|uzgun|mutlu|heyecan)\w*\b/)
      ? 0.55
      : 0);
  const worldImpact = clamp01(
    (Number(input.significanceField?.goalImpact) || 0) * 0.6 +
      (Number(input.significanceField?.longTermContinuityImpact) || 0) * 0.4
  );

  const score = round3(sig * 0.45 + future.score * 0.3 + emotional * 0.15 + worldImpact * 0.1);

  return Object.freeze({
    schema: RHIZOH_SPATIAL_MEMORY_ANCHOR_SCHEMA_V1,
    spatialCandidateScore: score,
    significanceScore: sig,
    futureOrientation: future.active,
    emotionalCharge: emotional,
    worldImpactWeight: worldImpact,
    pinEligible:
      sig >= SPATIAL_SIGNIFICANCE_THRESHOLD_V1 && future.active === true
  });
}

/**
 * @param {{ message: string, significanceField?: Record<string, unknown> | null, traceId?: string }} input
 */
export function stageSpatialMemoryInvitationV1(input = {}) {
  const message = String(input.message || "").trim();
  const candidate = computeSpatialCandidateScoreV1({
    message,
    significanceField: input.significanceField
  });
  if (!candidate.pinEligible) {
    return Object.freeze({ ok: false, reason: "not_spatial_candidate", candidate });
  }

  const store = readStoreV1();
  store.pending = Object.freeze({
    schema: RHIZOH_SPATIAL_MEMORY_ANCHOR_SCHEMA_V1,
    messageExcerpt: message.slice(0, 280),
    traceId: String(input.traceId || "").trim() || null,
    candidate,
    consent: MEMORY_CONSENT_STATUS_V1.PENDING,
    stagedAt: Date.now()
  });
  writeStoreV1(store);
  return Object.freeze({ ok: true, reason: "staged", pending: store.pending, candidate });
}

/**
 * Resolve geo for spatial pin — user castle nexus, else shared seed nexus.
 */
export function resolveSpatialAnchorGeoV1() {
  const user = readUserCastleAnchorGeoV0();
  if (Number.isFinite(user?.lat) && Number.isFinite(user?.lon)) {
    return Object.freeze({ lat: user.lat, lon: user.lon, source: "user_castle" });
  }
  const nexus = readCastleNexusGeoV0();
  if (Number.isFinite(nexus?.lat) && Number.isFinite(nexus?.lon)) {
    return Object.freeze({ lat: nexus.lat, lon: nexus.lon, source: "castle_nexus" });
  }
  return Object.freeze({ lat: 41.0422, lon: 29.0089, source: "origin_seed" });
}

/**
 * @param {{ label?: string, narrativeHint?: string, traceId?: string }} [opts]
 */
export function commitSpatialMemoryAnchorV1(opts = {}) {
  const store = readStoreV1();
  const pending = store.pending;
  if (!pending || pending.consent !== MEMORY_CONSENT_STATUS_V1.PENDING) {
    return Object.freeze({ ok: false, reason: "no_pending_invitation" });
  }

  const geo = resolveSpatialAnchorGeoV1();
  const now = Date.now();
  const anchor = Object.freeze({
    schema: RHIZOH_SPATIAL_MEMORY_ANCHOR_SCHEMA_V1,
    id: `sma_${now}_${Math.random().toString(36).slice(2, 8)}`,
    tier: MEMORY_TIER_V1.SPATIAL,
    label: String(opts.label || pending.messageExcerpt || "Future node").slice(0, 120),
    narrativeHint: String(opts.narrativeHint || pending.messageExcerpt || "").slice(0, 400),
    messageExcerpt: pending.messageExcerpt,
    traceId: pending.traceId || opts.traceId || null,
    geo,
    consent: MEMORY_CONSENT_STATUS_V1.GRANTED,
    significanceScore: pending.candidate?.significanceScore ?? null,
    spatialCandidateScore: pending.candidate?.spatialCandidateScore ?? null,
    createdAt: now,
    fadeAt: now + SPATIAL_BEACON_FADE_MS_V1,
    mapRenderToken: buildMapRenderTokenV1({ createdAt: now, fadeAt: now + SPATIAL_BEACON_FADE_MS_V1 }),
    ghostOverlay: buildGhostOverlayHintsV1(pending.candidate)
  });

  store.anchors = [...store.anchors.filter((a) => a?.id !== anchor.id), anchor].slice(-24);
  store.pending = null;
  writeStoreV1(store);
  emitSpatialAnchorEventV1({ kind: "committed", anchor });
  return Object.freeze({ ok: true, anchor });
}

/**
 * @param {string} rawReply
 */
export function resolvePendingSpatialConsentV1(rawReply) {
  const store = readStoreV1();
  if (!store.pending) return Object.freeze({ ok: false, reason: "no_pending" });

  const n = foldCanonicalSurfaceV1(String(rawReply || "").trim());
  const declined = /\b(hayir|hayır|gerek yok|kaydetme|no)\b/.test(n);
  const granted = /\b(evet|olur|tamam|kaydet|not al|hatirla|yes|sure)\b/.test(n) && !declined;

  if (declined) {
    store.pending = Object.freeze({
      ...store.pending,
      consent: MEMORY_CONSENT_STATUS_V1.DECLINED,
      resolvedAt: Date.now()
    });
    writeStoreV1({ anchors: store.anchors, pending: null });
    emitSpatialAnchorEventV1({ kind: "declined", pending: store.pending });
    return Object.freeze({ ok: true, status: MEMORY_CONSENT_STATUS_V1.DECLINED });
  }
  if (granted) {
    return commitSpatialMemoryAnchorV1();
  }
  return Object.freeze({ ok: false, reason: "ambiguous_consent" });
}

/**
 * @param {{ createdAt?: number, fadeAt?: number, intensity?: number }} [ctx]
 */
export function buildMapRenderTokenV1(ctx = {}) {
  const now = Date.now();
  const createdAt = Number(ctx.createdAt) || now;
  const fadeAt = Number(ctx.fadeAt) || createdAt + SPATIAL_BEACON_FADE_MS_V1;
  const ttl = Math.max(1, fadeAt - createdAt);
  const elapsed = Math.max(0, now - createdAt);
  const opacity = round3(Math.max(0.12, 1 - elapsed / ttl));

  return Object.freeze({
    pinType: "memory_beacon",
    pulse: true,
    opacity,
    intensity: round3(ctx.intensity ?? opacity),
    label: "FUTURE NODE",
    nonIntrusive: true
  });
}

/**
 * @param {ReturnType<typeof computeSpatialCandidateScoreV1>} [candidate]
 */
export function buildGhostOverlayHintsV1(candidate) {
  const score = clamp01(candidate?.spatialCandidateScore ?? 0.5);
  return Object.freeze({
    glowIntensity: round3(0.25 + score * 0.45),
    fadeDurationMs: SPATIAL_BEACON_FADE_MS_V1,
    presencePulse: score >= 0.8 ? "slow" : "quiet",
    emotionalCharge: candidate?.emotionalCharge ?? 0
  });
}

/**
 * Drop expired beacons; refresh render tokens.
 */
export function tickSpatialMemoryFadeLifecycleV1(atMs = Date.now()) {
  const store = readStoreV1();
  const now = Number(atMs) || Date.now();
  const before = store.anchors.length;
  const anchors = store.anchors
    .filter((a) => Number(a?.fadeAt) > now)
    .map((a) =>
      Object.freeze({
        ...a,
        mapRenderToken: buildMapRenderTokenV1({
          createdAt: a.createdAt,
          fadeAt: a.fadeAt,
          intensity: a.spatialCandidateScore
        })
      })
    );
  if (anchors.length !== before) {
    writeStoreV1({ anchors, pending: store.pending });
    emitSpatialAnchorEventV1({ kind: "fade_prune", removed: before - anchors.length });
  }
  return Object.freeze({ anchors, activeCount: anchors.length });
}

/**
 * @returns {object[]}
 */
export function readActiveSpatialMemoryMapPinsV1() {
  const { anchors } = tickSpatialMemoryFadeLifecycleV1();
  return anchors.map((a) =>
    Object.freeze({
      id: `castle-spatial-memory-${a.id}`,
      anchorId: a.id,
      lat: a.geo?.lat,
      lon: a.geo?.lon,
      label: a.label,
      pinType: "memory_beacon",
      mapRenderToken: a.mapRenderToken,
      ghostOverlay: a.ghostOverlay
    })
  );
}

/**
 * @param {{ message: string, significanceField?: Record<string, unknown> | null, traceId?: string, userConsent?: boolean }} input
 */
export function evaluateSpatialMemoryAnchorV1(input = {}) {
  const candidate = computeSpatialCandidateScoreV1({
    message: input.message,
    significanceField: input.significanceField
  });

  if (input.userConsent === true && candidate.pinEligible) {
    stageSpatialMemoryInvitationV1(input);
    return commitSpatialMemoryAnchorV1({ traceId: input.traceId });
  }

  if (candidate.pinEligible) {
    return stageSpatialMemoryInvitationV1(input);
  }

  return Object.freeze({ ok: false, reason: "below_spatial_threshold", candidate });
}
