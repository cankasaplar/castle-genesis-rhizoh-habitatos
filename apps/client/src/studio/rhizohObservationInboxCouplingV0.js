/**
 * Rhizoh Observation Inbox Coupling v0 — Sprint E: soft coupling (Yol A).
 * Octo discovery → Rhizoh observationInbox → attentionField (tek yönlü, düşük ağırlık).
 * Emir değil; cube novelty baskın kalır. Her inbox kaydı en fazla bir kez besler.
 * Invariant: cube.topology is never agent-owned — inbox coupling writes attention only.
 * @see octoObservationReportV0.js · rhizohAttentionFieldV0.js
 */

import { depositRhizohAttentionFieldV0 } from "./rhizohAttentionFieldV0.js";
import { OCTO_DISCOVERY_MIN_CONFIDENCE_V0 } from "./octoObservationReportV0.js";

export const RHIZOH_INBOX_COUPLING_SCHEMA_V0 = "castle.rhizoh_inbox_coupling.v0";
export const INBOX_COUPLING_MAX_DEPOSIT_V0 = 0.07;
export const INBOX_COUPLING_CONFIDENCE_SCALE_V0 = 0.09;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {{ receivedAtMs?: number, observation?: string }} entry
 */
export function buildInboxCouplingKeyV0(entry) {
  const at = entry?.receivedAtMs ?? 0;
  const obs = String(entry?.observation || "").trim();
  if (!obs || !at) return "";
  return `${at}::${obs}`;
}

/**
 * @param {import("./rhizohMemoryV0.js").ReturnType<typeof import("./rhizohMemoryV0.js").createRhizohMemoryV0>} memory
 * @param {{ nowMs?: number, enabled?: boolean }} [opts]
 */
export function stepRhizohObservationInboxCouplingV0(memory, opts = {}) {
  const enabled = opts.enabled !== false;
  const nowMs = opts.nowMs ?? Date.now();
  if (!enabled) {
    return Object.freeze({
      schema: RHIZOH_INBOX_COUPLING_SCHEMA_V0,
      enabled: false,
      applied: 0,
      deposits: Object.freeze([])
    });
  }

  if (!memory.observationInboxCoupledKeys) {
    memory.observationInboxCoupledKeys = {};
  }

  /** @type {ReturnType<typeof depositRhizohAttentionFieldV0>[]} */
  const deposits = [];

  for (const entry of memory.observationInbox) {
    const key = buildInboxCouplingKeyV0(entry);
    if (!key || memory.observationInboxCoupledKeys[key]) continue;

    const confidence = clamp01(entry?.confidence ?? 0);
    if (confidence < OCTO_DISCOVERY_MIN_CONFIDENCE_V0) continue;

    const geometry = String(entry?.geometry || "").trim();
    if (!geometry) continue;

    const weight = Math.min(INBOX_COUPLING_MAX_DEPOSIT_V0, confidence * INBOX_COUPLING_CONFIDENCE_SCALE_V0);
    const deposited = depositRhizohAttentionFieldV0(memory.attentionField, geometry, weight);
    if (!deposited) continue;

    memory.observationInboxCoupledKeys[key] = nowMs;
    deposits.push(
      Object.freeze({
        ...deposited,
        observation: entry.observation,
        confidence,
        source: "octo_inbox",
        atMs: nowMs
      })
    );
  }

  return Object.freeze({
    schema: RHIZOH_INBOX_COUPLING_SCHEMA_V0,
    enabled: true,
    applied: deposits.length,
    deposits: Object.freeze(deposits)
  });
}
