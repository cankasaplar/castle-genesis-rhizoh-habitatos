/**
 * Memory Anchor System v0 — origin seed + user + cohort anchors.
 * @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md
 */

import {
  buildAnchorDriftObservationV0,
  recordAnchorBalanceSampleV0,
  resetAnchorDriftMonitorV0
} from "./anchorDriftMonitorV0.js";

export const MEMORY_ANCHOR_CONTRACT_V0 = "memory-anchor-system-v0";

export const ANCHOR_TYPE_ORIGIN_SEED_V0 = "origin_seed";
export const ANCHOR_TYPE_USER_V0 = "user_anchor";
export const ANCHOR_TYPE_COHORT_V0 = "cohort_anchor";

const USER_ANCHOR_KEY_V0 = "rhizoh.anchor.user.v0";
const COHORT_ANCHOR_KEY_V0 = "rhizoh.anchor.cohort.v0";

/** Immutable global seed — semantic gravity producer, not narrative center. */
export const ORIGIN_SEED_SERENCEBEY_V0 = Object.freeze({
  contract_version: MEMORY_ANCHOR_CONTRACT_V0,
  type: ANCHOR_TYPE_ORIGIN_SEED_V0,
  anchor_id: "origin_serencebey_castle_v0",
  label: readOriginSeedEnvLabel(),
  place_name: readOriginSeedEnvPlace(),
  location: Object.freeze({ lat: 41.0422, lon: 29.0089, place_name: "Beşiktaş" }),
  immutable: true,
  role: "semantic_gravity_seed"
});

/** @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md */
export const ANCHOR_SYSTEM_BINDING_SENTENCE_V0 =
  "Every user has a personal origin, but all origins emerge within a shared seeded topology.";

/** @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md */
export const ANCHOR_SYSTEM_PRODUCT_SPINE_V0 = "Rhizoh does not center users. It seeds continuities.";

/** Continuity-centric physics (not user-centric UX paradigm). */
export const ANCHOR_SYSTEM_CONTINUITY_CENTRIC_V0 =
  "Rhizoh does not optimize for user centrality; it optimizes for continuity coherence.";

/** Single-sentence engine definition (SSOT). */
export const ANCHOR_SYSTEM_ENGINE_DEFINITION_V0 =
  "Rhizoh is a continuity engine built on semantic gravity seeds and real-time perceptual transitions.";

/** Experience closure — not a data store. */
export const ANCHOR_SYSTEM_EXPERIENCE_CLOSURE_V0 =
  "Rhizoh does not store experience. It stabilizes continuity across time, space, and interaction.";

/** Engineering anchor kinds → stability → function */
export const ANCHOR_ENGINEERING_MODEL_V0 = Object.freeze({
  types: Object.freeze({
    semantic_gravity_seed: ANCHOR_TYPE_ORIGIN_SEED_V0,
    user_origin: ANCHOR_TYPE_USER_V0,
    cohort_cluster: ANCHOR_TYPE_COHORT_V0
  }),
  stability: Object.freeze({
    [ANCHOR_TYPE_ORIGIN_SEED_V0]: "immutable",
    [ANCHOR_TYPE_USER_V0]: "versioned",
    [ANCHOR_TYPE_COHORT_V0]: "mergeable"
  }),
  function: "continuity_attractor"
});

const ANCHOR_DISPLAY_SUBTITLE_V0 =
  "Personal origin · emerge in shared seeded topology";

/**
 * @param {ReturnType<typeof import('./expressiveRealityMicroTransitionV0.js').extractPalAnchorFromLifeProjectionV0>} pal
 * @param {Record<string, unknown> | null} user
 * @param {Record<string, unknown> | null} cohort
 * @returns {"pal" | "user" | "cohort" | "seed"}
 */
export function resolvePrimaryAnchorSourceV0(pal, user, cohort) {
  if (pal?.visible && pal?.label) return "pal";
  if (user?.label) return "user";
  if (cohort?.label) return "cohort";
  return "seed";
}

function readOriginSeedEnvLabel() {
  if (typeof import.meta === "undefined" || !import.meta.env) return "Serencebey Castle";
  return String(import.meta.env.VITE_RHIZOH_ORIGIN_SEED_LABEL || "Serencebey Castle").trim();
}

function readOriginSeedEnvPlace() {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return "Beşiktaş · shared seed topology";
  }
  return String(import.meta.env.VITE_RHIZOH_ORIGIN_SEED_PLACE || "Beşiktaş · shared seed topology").trim();
}

function readJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/**
 * @returns {typeof ORIGIN_SEED_SERENCEBEY_V0}
 */
export function getOriginSeedAnchorV0() {
  return ORIGIN_SEED_SERENCEBEY_V0;
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function readUserAnchorV0() {
  const row = readJson(USER_ANCHOR_KEY_V0);
  if (!row?.current) return null;
  return /** @type {Record<string, unknown>} */ (row.current);
}

/**
 * @returns {Record<string, unknown> | null}
 */
export function readCohortAnchorV0() {
  return readJson(COHORT_ANCHOR_KEY_V0);
}

/**
 * First meaningful binding — version 1 only if absent.
 * @param {{ threadId?: string, label?: string, messageExcerpt?: string, palLabel?: string }} input
 */
export function establishUserAnchorIfAbsentV0(input = {}) {
  const existing = readUserAnchorV0();
  if (existing) return { ok: true, created: false, anchor: existing };

  const thread_id = String(input.threadId || "").trim();
  const label =
    String(input.palLabel || input.label || "").trim() ||
    (thread_id ? `Thread ${thread_id.slice(0, 12)}` : "First coherence");

  const anchor = Object.freeze({
    contract_version: MEMORY_ANCHOR_CONTRACT_V0,
    type: ANCHOR_TYPE_USER_V0,
    anchor_id: `usr_anchor_${thread_id || "v1"}`.slice(0, 128),
    version: 1,
    thread_id: thread_id || undefined,
    label,
    message_excerpt: String(input.messageExcerpt || "").slice(0, 280) || undefined,
    created_at: new Date().toISOString(),
    origin_seed_id: ORIGIN_SEED_SERENCEBEY_V0.anchor_id
  });

  writeJson(USER_ANCHOR_KEY_V0, {
    contract_version: MEMORY_ANCHOR_CONTRACT_V0,
    current_version: 1,
    versions: [anchor],
    current: anchor
  });

  emitAnchorUpdate(anchor, "user_anchor_established");
  return { ok: true, created: true, anchor };
}

/**
 * @param {{ cohortId?: string, label?: string, inviteRef?: string }} input
 */
export function mergeCohortAnchorV0(input = {}) {
  const prev = readCohortAnchorV0();
  const label = String(input.label || prev?.label || "Cohort cluster").trim();
  const merged = Object.freeze({
    contract_version: MEMORY_ANCHOR_CONTRACT_V0,
    type: ANCHOR_TYPE_COHORT_V0,
    anchor_id: String(input.cohortId || prev?.anchor_id || "cohort_default").slice(0, 128),
    label,
    invite_ref: input.inviteRef || prev?.invite_ref,
    merged_at: new Date().toISOString(),
    origin_seed_id: ORIGIN_SEED_SERENCEBEY_V0.anchor_id,
    previous: prev || undefined
  });
  writeJson(COHORT_ANCHOR_KEY_V0, merged);
  emitAnchorUpdate(merged, "cohort_anchor_merged");
  return merged;
}

/**
 * @param {ReturnType<typeof import('./expressiveRealityMicroTransitionV0.js').extractPalAnchorFromLifeProjectionV0>} pal
 * @param {{ threadId?: string, traceId?: string, kind?: string }} [meta]
 */
export function mergePalIntoAnchorContextV0(pal, meta = {}) {
  const user = readUserAnchorV0();
  const cohort = readCohortAnchorV0();
  const origin = getOriginSeedAnchorV0();

  const activeSource = resolvePrimaryAnchorSourceV0(pal, user, cohort);
  const primary =
    activeSource === "pal"
      ? pal?.label
      : activeSource === "user"
        ? user?.label
        : activeSource === "cohort"
          ? cohort?.label
          : origin.label;

  const primaryLabel = String(primary);
  recordAnchorBalanceSampleV0(activeSource);

  const display = Object.freeze({
    contract_version: MEMORY_ANCHOR_CONTRACT_V0,
    primary_label: primaryLabel,
    label: primaryLabel,
    active_source: activeSource,
    origin_seed_label: origin.label,
    user_anchor_label: user?.label ? String(user.label) : undefined,
    cohort_anchor_label: cohort?.label ? String(cohort.label) : undefined,
    memory_anchor: pal?.memory_anchor || `Bağlandığın yer: ${primary}`,
    subtitle: ANCHOR_DISPLAY_SUBTITLE_V0,
    pal_visible: Boolean(pal?.visible),
    last_event: meta.kind || null,
    thread_id: meta.threadId || user?.thread_id || null,
    trace_id: meta.traceId || null
  });

  try {
    sessionStorage.setItem("rhizoh.rtl.emotional_anchor.v0", JSON.stringify(display));
  } catch {
    /* ignore */
  }

  emitAnchorUpdate(display, meta.kind || "pal_merge");
  return display;
}

/**
 * UI + micro-RTL display resolution.
 */
export function resolveDisplayAnchorV0() {
  const cached = readJson("rhizoh.rtl.emotional_anchor.v0");
  if (cached?.primary_label) return cached;

  const origin = getOriginSeedAnchorV0();
  const user = readUserAnchorV0();
  const cohort = readCohortAnchorV0();
  const activeSource = resolvePrimaryAnchorSourceV0(null, user, cohort);
  const primary = String(
    activeSource === "user"
      ? user?.label
      : activeSource === "cohort"
        ? cohort?.label
        : origin.label
  );
  recordAnchorBalanceSampleV0(activeSource);

  return Object.freeze({
    contract_version: MEMORY_ANCHOR_CONTRACT_V0,
    primary_label: primary,
    label: primary,
    active_source: activeSource,
    origin_seed_label: origin.label,
    memory_anchor: `Bağlandığın yer: ${primary}`,
    subtitle: ANCHOR_DISPLAY_SUBTITLE_V0
  });
}

/**
 * Ops-level anchor balance snapshot (observation only).
 */
export function observeAnchorBalanceFieldV0() {
  const user = readUserAnchorV0();
  return buildAnchorDriftObservationV0({ hasUserAnchor: Boolean(user) });
}

/**
 * Gateway `context.life_continuity` hints from anchor state.
 */
export function buildLifeContinuityContextHintsV0() {
  const user = readUserAnchorV0();
  const display = resolveDisplayAnchorV0();
  const origin = getOriginSeedAnchorV0();
  /** @type {Record<string, unknown>} */
  const life_continuity = {
    origin_seed_id: origin.anchor_id,
    origin_seed_label: origin.label
  };
  if (user?.thread_id) life_continuity.thread_id = user.thread_id;
  if (display.primary_label) {
    life_continuity.castle_label = display.primary_label;
    life_continuity.anchor_label = display.primary_label;
  }
  return life_continuity;
}

/**
 * @param {unknown} anchor
 * @param {string} kind
 */
function emitAnchorUpdate(anchor, kind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("rhizoh:emotional-anchor", {
      detail: Object.freeze({ anchor, kind })
    })
  );
  window.dispatchEvent(
    new CustomEvent("rhizoh:memory-anchor", {
      detail: Object.freeze({ anchor, kind })
    })
  );
}

export function resetMemoryAnchorSessionV0() {
  try {
    sessionStorage.removeItem(USER_ANCHOR_KEY_V0);
    sessionStorage.removeItem(COHORT_ANCHOR_KEY_V0);
    sessionStorage.removeItem("rhizoh.rtl.emotional_anchor.v0");
  } catch {
    /* ignore */
  }
  resetAnchorDriftMonitorV0();
}
