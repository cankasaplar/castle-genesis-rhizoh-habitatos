/**
 * World Bridge → Shadow Trace Ledger bridge v0.
 * RESEARCH-ONLY — append-only MAP source projection; no execution feedback.
 */

import {
  appendShadowTraceRecordV0,
  SHADOW_SOURCE_SYSTEM_V0,
  SHADOW_TRUST_CLASS_V0
} from "./rhizohShadowTraceLedgerV0.js";

export const WORLD_BRIDGE_SHADOW_TRACE_BRIDGE_SCHEMA_V0 =
  "castle.rhizoh.world_bridge_shadow_trace_bridge.v0";

let projectionCountV0 = 0;
/** @type {object | null} */
let lastProjectionV0 = null;

/**
 * @param {object} shadowEntry
 * @param {"calendar"|"media"|"user_activity"} source
 */
export function projectWorldBridgeShadowToLedgerV0(shadowEntry, source) {
  const shadow = shadowEntry?.shadow || {};
  const record = appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.MAP,
    eventType: "WORLD_BRIDGE_SHADOW",
    trustClass: SHADOW_TRUST_CLASS_V0.TRUSTED,
    hypotheticalOutcome: shadow.narrative || null,
    payload: Object.freeze({
      bridgeSource: source,
      branchId: shadow.branchId || null,
      sourceId:
        shadowEntry?.eventId || shadowEntry?.mediaId || shadowEntry?.activityId || null,
      outcomeScore01: shadow.outcomeScore01 ?? shadow.attentionScore01 ?? null,
      writeback: "shadow_to_ledger",
      feedbackToExecution: false
    })
  });

  if (record) {
    projectionCountV0 += 1;
    lastProjectionV0 = Object.freeze({
      schema: WORLD_BRIDGE_SHADOW_TRACE_BRIDGE_SCHEMA_V0,
      recordId: record.recordId,
      source,
      atMs: Date.now()
    });
  }

  return Object.freeze({
    schema: WORLD_BRIDGE_SHADOW_TRACE_BRIDGE_SCHEMA_V0,
    projected: Boolean(record),
    record,
    projectionCount: projectionCountV0,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function getWorldBridgeShadowTraceBridgeSnapshotV0() {
  return Object.freeze({
    schema: `${WORLD_BRIDGE_SHADOW_TRACE_BRIDGE_SCHEMA_V0}.snapshot`,
    projectionCount: projectionCountV0,
    lastProjection: lastProjectionV0,
    atMs: Date.now(),
    interpretationOnly: true
  });
}

export function ensureWorldBridgeShadowTraceBridgeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldBridgeShadowWriteback = () => getWorldBridgeShadowTraceBridgeSnapshotV0();
  return window.__rhizoh.worldBridgeShadowWriteback;
}

/** @internal vitest */
export function resetWorldBridgeShadowTraceBridgeForTestV0() {
  projectionCountV0 = 0;
  lastProjectionV0 = null;
}
