/**
 * Canonical serialization + fingerprint for replay router outputs (test + diff hooks).
 * Same closed-world inputs → same fingerprint (ordering + key sort fixed).
 */

import { createHash } from "node:crypto";

/** Fingerprint over merged replay projection (continuity + checkpoint identity slices). */
export const GENESIS_REPLAY_DETERMINISM_FINGERPRINT_SCHEMA = "castle.genesis.replay_determinism.fingerprint.v1";

/** @param {unknown} v */
export function stableStringifyGenesisReplayV1(v) {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "number" || t === "boolean") return JSON.stringify(v);
  if (t === "string") return JSON.stringify(v);
  if (t !== "object") return JSON.stringify(String(v));
  if (Array.isArray(v)) return `[${v.map((x) => stableStringifyGenesisReplayV1(x)).join(",")}]`;
  const o = /** @type {Record<string, unknown>} */ (v);
  const keys = Object.keys(o).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringifyGenesisReplayV1(o[k])}`).join(",")}}`;
}

/**
 * Subset used for “reconstructed stream” identity (excludes volatile telemetry).
 * @param {Record<string, unknown>} ev
 */
export function continuityEventIdentitySliceV1(ev) {
  if (!ev || typeof ev !== "object") return {};
  return {
    schema: ev.schema,
    seq: ev.seq,
    type: ev.type,
    id: ev.id,
    payload: ev.payload ?? null,
    serverTime: ev.serverTime
  };
}

/**
 * Checkpoint row slice for fingerprint (structured chain band).
 * @param {Record<string, unknown>} row
 */
export function checkpointRowIdentitySliceV1(row) {
  if (!row || typeof row !== "object") return {};
  const cp = row.checkpoint && typeof row.checkpoint === "object" ? row.checkpoint : row;
  const c = /** @type {Record<string, unknown>} */ (cp);
  return {
    seqCommittedThrough: c.seqCommittedThrough ?? row.seqCommittedThrough,
    ledgerRoot: c.ledgerRoot ?? row.ledgerRoot,
    prevLedgerRoot: c.prevLedgerRoot ?? row.prevLedgerRoot,
    checkpointHash: c.checkpointHash ?? row.checkpointHash
  };
}

/**
 * @param {{ continuityEvents?: unknown[], checkpoints?: unknown[] }} replayOut — `resolveGenesisReplayRouterV1` success body
 * @returns {string} hex sha256
 */
export function fingerprintGenesisReplayRouterOutputV1(replayOut) {
  const ce = Array.isArray(replayOut?.continuityEvents) ? replayOut.continuityEvents : [];
  const ck = Array.isArray(replayOut?.checkpoints) ? replayOut.checkpoints : [];
  const continuity = ce.map((e) => continuityEventIdentitySliceV1(/** @type {Record<string, unknown>} */ (e)));
  const checkpoints = ck.map((r) => checkpointRowIdentitySliceV1(/** @type {Record<string, unknown>} */ (r)));
  const payload = { continuity, checkpoints };
  const s = stableStringifyGenesisReplayV1(payload);
  return createHash("sha256").update(s, "utf8").digest("hex");
}
