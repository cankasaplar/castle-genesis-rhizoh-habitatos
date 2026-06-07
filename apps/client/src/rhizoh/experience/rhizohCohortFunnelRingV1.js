/**
 * Sunday cohort funnel ring — local append-only observation (no WAL).
 */

export const RHIZOH_COHORT_FUNNEL_SCHEMA_V1 = "castle.rhizoh_cohort_funnel.v1";
export const RHIZOH_COHORT_FUNNEL_EVENT_V1 = "rhizoh:cohort-funnel-v1";

export const RHIZOH_COHORT_FUNNEL_STEP_V1 = Object.freeze({
  LINK_OPEN: "link_open",
  INVITE_JOIN: "invite_join",
  FIRST_MESSAGE: "first_message",
  VOICE_ATTEMPT: "voice_attempt",
  CAMERA_ATTEMPT: "camera_attempt",
  MAP_OPEN: "map_open",
  EVENT_CREATE: "event_create",
  INVITE_SHARE: "invite_share",
  FRIEND_JOIN: "friend_join"
});

const LS_KEY_V1 = "rhizoh.cohort.funnel.v1";
const RING_MAX_V1 = 128;

/** @type {ReturnType<typeof buildCohortFunnelEntryV1>[]} */
let memoryRing = [];

/**
 * @param {string} step
 * @param {Record<string, unknown>} [meta]
 */
function buildCohortFunnelEntryV1(step, meta = {}) {
  return Object.freeze({
    schema: RHIZOH_COHORT_FUNNEL_SCHEMA_V1,
    step: String(step || ""),
    atMs: Date.now(),
    meta: Object.freeze(meta && typeof meta === "object" ? meta : {})
  });
}

function readPersistedRingV1() {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(LS_KEY_V1) || "[]");
    return Array.isArray(raw) ? raw.slice(-RING_MAX_V1) : [];
  } catch {
    return [];
  }
}

function writePersistedRingV1(ring) {
  if (typeof window === "undefined") return ring;
  try {
    window.localStorage.setItem(LS_KEY_V1, JSON.stringify(ring.slice(-RING_MAX_V1)));
  } catch {
    /* noop */
  }
  return ring;
}

function publishFunnelV1(entry, ring) {
  if (typeof window !== "undefined") {
    window.__RHIZOH_COHORT_FUNNEL__ = Object.freeze({
      schema: RHIZOH_COHORT_FUNNEL_SCHEMA_V1,
      readOnly: true,
      count: ring.length,
      last: entry,
      steps: Object.freeze(ring.map((r) => r.step)),
      ring: Object.freeze(ring.slice(-48))
    });
    window.dispatchEvent(new CustomEvent(RHIZOH_COHORT_FUNNEL_EVENT_V1, { detail: entry }));
  }
  return entry;
}

/**
 * @param {string} step
 * @param {Record<string, unknown>} [meta]
 */
export function recordCohortFunnelStepV1(step, meta = {}) {
  const entry = buildCohortFunnelEntryV1(step, meta);
  memoryRing.push(entry);
  if (memoryRing.length > RING_MAX_V1) memoryRing.shift();
  const persisted = [...readPersistedRingV1(), entry];
  writePersistedRingV1(persisted);
  return publishFunnelV1(entry, persisted);
}

/**
 * @param {string} step
 */
export function hasCohortFunnelStepV1(step) {
  const s = String(step || "");
  return readPersistedRingV1().some((row) => row.step === s) || memoryRing.some((row) => row.step === s);
}

/**
 * @param {string} step
 * @param {Record<string, unknown>} [meta]
 */
export function recordCohortFunnelStepOnceV1(step, meta = {}) {
  if (hasCohortFunnelStepV1(step)) return null;
  return recordCohortFunnelStepV1(step, meta);
}

export function exportCohortFunnelSnapshotV1() {
  const ring = readPersistedRingV1();
  return Object.freeze({
    schema: RHIZOH_COHORT_FUNNEL_SCHEMA_V1,
    count: ring.length,
    ring: Object.freeze(ring),
    exportedAtMs: Date.now()
  });
}

/** @internal vitest */
export function __resetCohortFunnelForTestV1() {
  memoryRing = [];
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY_V1);
      delete window.__RHIZOH_COHORT_FUNNEL__;
    }
  } catch {
    /* noop */
  }
}
