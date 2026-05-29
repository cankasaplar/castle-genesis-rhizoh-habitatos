/**
 * Shadow continuity buffer — local substrate segment without bootValidityToken.
 */

import {
  createSubstrateContinuityIdbAdapterV0,
  openSubstrateContinuityIdbV0
} from "../substrateContinuityIdbV0.js";
import {
  foldWalSegmentHashV0,
  WAL_HASH_CHAIN_GENESIS_V0
} from "../continuity/walHashChainV0.js";
import { SOVEREIGN_NODE_ONBOARDING_SCHEMA_V0 } from "./sovereignNodeOnboardingContractV0.js";

export const SHADOW_CONTINUITY_DISK_KEY_V0 = "sovereign_shadow_onboarding_v0";
export const SHADOW_CONTINUITY_SCHEMA_V0 = "castle.rhizoh.shadow_continuity_buffer.v0";

/**
 * @typedef {Object} ShadowContinuityRecordV0
 * @property {string} schema
 * @property {string} nodeId
 * @property {{ lat: number, lon: number, zoom?: number }} anchor
 * @property {string} continuity
 * @property {string} epistemicRole
 * @property {string} state
 * @property {number} walTick
 * @property {string} segmentHash
 * @property {boolean} bootValidityTokenCreated
 */

/**
 * @param {{
 *   nodeId: string,
 *   anchor: { lat: number, lon: number, zoom?: number },
 *   epistemicRole?: string,
 *   fingerprintId?: string | null
 * }} node
 * @returns {Promise<ShadowContinuityRecordV0>}
 */
export async function initializeShadowContinuityBufferV0(node) {
  if (typeof indexedDB === "undefined") {
    const mem = buildShadowRecordV0(node, null);
    syncShadowMirrorV0(mem);
    return mem;
  }

  const db = await openSubstrateContinuityIdbV0();
  try {
    const adapter = createSubstrateContinuityIdbAdapterV0(db, SHADOW_CONTINUITY_DISK_KEY_V0);
    const body = {
      schema: SHADOW_CONTINUITY_SCHEMA_V0,
      type: "sovereign_anchor_v0",
      nodeId: node.nodeId,
      anchor: node.anchor,
      continuity: "pending",
      epistemicRole: node.epistemicRole || "satellite-observer",
      fingerprintId: node.fingerprintId ?? null,
      bootValidityTokenCreated: false
    };
    const hash = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, body);
    const seg = await adapter.appendWalSegment({ tick: 0, hash, body });
    if (!seg.ok) {
      throw new Error(String(seg.code || "shadow_wal_append_failed"));
    }
    const cursor = await adapter.writeReplayCursorMonotonic({
      lastTick: 0,
      lastHash: hash,
      bootGeneration: 0
    });
    if (!cursor.ok) {
      throw new Error(String(cursor.code || "shadow_cursor_failed"));
    }
    const record = buildShadowRecordV0(node, hash);
    syncShadowMirrorV0(record);
    return record;
  } finally {
    db.close();
  }
}

/**
 * @param {object} node
 * @param {string|null} hash
 */
function buildShadowRecordV0(node, hash) {
  return Object.freeze({
    schema: SHADOW_CONTINUITY_SCHEMA_V0,
    onboardingSchema: SOVEREIGN_NODE_ONBOARDING_SCHEMA_V0,
    nodeId: String(node.nodeId),
    anchor: { ...node.anchor },
    continuity: "pending",
    epistemicRole: String(node.epistemicRole || "satellite-observer"),
    state: "SOFT_INIT",
    walTick: 0,
    segmentHash: hash,
    bootValidityTokenCreated: false
  });
}

/**
 * @param {ShadowContinuityRecordV0} record
 */
function syncShadowMirrorV0(record) {
  if (typeof window === "undefined") return;
  window.__rhizoh_shadow_continuity = record;
}

export function getShadowContinuityMirrorV0() {
  if (typeof window === "undefined") return null;
  return window.__rhizoh_shadow_continuity ?? null;
}

export function clearShadowContinuityMirrorV0() {
  if (typeof window === "undefined") return;
  try {
    delete window.__rhizoh_shadow_continuity;
  } catch {
    /* noop */
  }
}
