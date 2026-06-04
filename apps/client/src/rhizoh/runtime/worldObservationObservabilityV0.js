/**
 * Cohort / Friday inspect surface — readonly DevTools snapshot.
 */

import { getWorldObservationRingV0 } from "./worldObservationBusV0.js";
import { getWorldObservationIngressQueueSnapshotV0 } from "./worldObservationIngressQueueV0.js";
import { getRhizohUiTextModeV0, getRhizohUiTextVisibilityV0 } from "./rhizohUiTextModeV0.js";
import { getVoiceAdapterRegistrySnapshot, ensureVoiceAdapterRegistered } from "./voiceInputAdapterRegistryV0.js";
import {
  buildCohortInvitePackV0,
  exportCohortInvitePackV0,
  serializeCohortInvitePackV0
} from "../cohort/cohortInvitePackV0.js";
import { installFridayPromptRunnerV0 } from "../cohort/cohortFridayPromptRunnerV0.js";

export const WORLD_OBSERVATION_SNAPSHOT_SCHEMA_V0 = "castle.world_observation.snapshot.v0";

/**
 * Coerce observe.snapshot args — label lives under `meta`, never spread as string indices.
 * @param {string | Record<string, unknown>} [extra]
 * @returns {{ meta: Record<string, unknown> }}
 */
export function normalizeWorldObservationSnapshotExtraV0(extra = {}) {
  if (typeof extra === "string") {
    const label = extra.trim();
    return { meta: label ? { label } : {} };
  }
  if (extra && typeof extra === "object") {
    if (extra.meta && typeof extra.meta === "object") {
      return { meta: { ...extra.meta } };
    }
    const { label, laptop, ...rest } = extra;
    const meta = {
      ...(label != null && String(label).trim() ? { label: String(label).trim() } : {}),
      ...(laptop != null ? { laptop: String(laptop) } : {})
    };
    return { meta, ...rest };
  }
  return { meta: {} };
}

export function captureWorldObservationSnapshotV0(extra = {}) {
  ensureVoiceAdapterRegistered();
  const { meta, ...rest } = normalizeWorldObservationSnapshotExtraV0(extra);
  return Object.freeze({
    schema: WORLD_OBSERVATION_SNAPSHOT_SCHEMA_V0,
    atMs: Date.now(),
    ring: getWorldObservationRingV0(),
    ingressQueue: getWorldObservationIngressQueueSnapshotV0(),
    uiTextMode: getRhizohUiTextModeV0(),
    uiTextVisibility: getRhizohUiTextVisibilityV0(),
    voiceAdapter: getVoiceAdapterRegistrySnapshot(),
    page: typeof window !== "undefined" ? window.location.href : "",
    meta: Object.freeze({ ...meta }),
    ...rest
  });
}

export function buildSessionReplayInspectUrlV0(fromSeq, toSeq) {
  try {
    const base = String(import.meta.env?.VITE_LIVE_GATEWAY_BASE || "").trim().replace(/\/+$/, "");
    if (!base || !fromSeq || !toSeq) return "";
    return `${base}/rhizoh/genesis/replay?range=${fromSeq}-${toSeq}&type=WorldObservation`;
  } catch {
    return "";
  }
}

/** @returns {() => void} stop */
export function installWorldObservationObservabilityV0() {
  if (typeof window === "undefined") return () => {};
  const stopFriday = installFridayPromptRunnerV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.observe = Object.freeze({
    snapshot: (extra) => captureWorldObservationSnapshotV0(extra),
    replayUrl: (fromSeq, toSeq) => buildSessionReplayInspectUrlV0(fromSeq, toSeq),
    ingressQueue: () => getWorldObservationIngressQueueSnapshotV0(),
    cohortPack: (opts) => buildCohortInvitePackV0(opts),
    exportCohortPack: async (opts) => exportCohortInvitePackV0(buildCohortInvitePackV0(opts)),
    serializeCohortPack: (opts) => serializeCohortInvitePackV0(buildCohortInvitePackV0(opts))
  });
  return () => {
    stopFriday();
    try {
      delete window.__rhizoh.observe;
    } catch {
      /* noop */
    }
  };
}
