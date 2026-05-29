/**
 * Boot-time reality continuity — which world continues after hydrate?
 *
 * Handles: partial seal corruption, divergent replay, stale witness, interrupted persistence.
 */

import { createDefaultRealitySealLayerStateV0, replaySealAuditTrailV0 } from "./realitySealingCoreV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "./realitySealDiskV0.js";

export const REALITY_SEAL_BOOT_CONTINUITY_SCHEMA_V0 = "castle.rhizoh.reality_seal_boot_continuity.v0";

export const BOOT_REALITY_DECISION_V0 = Object.freeze({
  CONTINUE_SEALED_WORLD: "continue_sealed_world",
  RESET_GENESIS: "reset_genesis",
  QUARANTINE_GENESIS: "quarantine_genesis"
});

/** Witness older than this is stale (default 7 days). */
export const DEFAULT_WITNESS_MAX_AGE_MS_V0 = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {number} nowMs
 */
function genesisRealitySealV0(nowMs) {
  return createDefaultRealitySealLayerStateV0(null, { nowMs });
}

/**
 * @param {unknown} raw
 */
function readDiskPayloadV0(raw) {
  if (!raw || typeof raw !== "string") return { ok: false, code: "disk_empty" };
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, code: "disk_json_corrupt" };
  }
}

/**
 * @param {unknown} rs
 */
function validateSealShapeV0(rs) {
  if (!rs || typeof rs !== "object") return { ok: false, code: "seal_missing" };
  const o = /** @type {Record<string, unknown>} */ (rs);
  if (!Number.isFinite(o.realityEpoch) || o.realityEpoch < 0) {
    return { ok: false, code: "seal_epoch_corrupt" };
  }
  if (typeof o.sealHashHead !== "string" || !o.sealHashHead) {
    return { ok: false, code: "seal_hash_head_corrupt" };
  }
  if (!Array.isArray(o.auditTrail)) {
    return { ok: false, code: "seal_audit_missing" };
  }
  return { ok: true };
}

/**
 * @param {Record<string, unknown>} payload
 * @param {number} nowMs
 * @param {{ witnessMaxAgeMs?: number }} [opts]
 */
export function resolveBootRealitySealContinuityV0(payload, nowMs, opts = {}) {
  const t = Number(nowMs) || Date.now();
  const maxAge = Number(opts.witnessMaxAgeMs) || DEFAULT_WITNESS_MAX_AGE_MS_V0;
  const issues = [];

  if (!payload?.ok) {
    return {
      decision: BOOT_REALITY_DECISION_V0.RESET_GENESIS,
      seal: genesisRealitySealV0(t),
      issues: [payload?.code || "no_payload"]
    };
  }

  const disk = payload.payload;
  const shape = validateSealShapeV0(disk?.realitySeal);
  if (!shape.ok) {
    return {
      decision: BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS,
      seal: genesisRealitySealV0(t),
      issues: [shape.code]
    };
  }

  const hydrated = createDefaultRealitySealLayerStateV0(disk.realitySeal, { nowMs: t });
  const replay = replaySealAuditTrailV0(hydrated.auditTrail);
  if (!replay.ok) {
    issues.push(`replay_${replay.code}`);
    return {
      decision: BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS,
      seal: genesisRealitySealV0(t),
      issues,
      quarantinedEpoch: hydrated.realityEpoch
    };
  }

  const savedAt = Number(disk.savedAtMs) || 0;
  const age = t - savedAt;
  const witness = disk.witness && typeof disk.witness === "object" ? disk.witness : null;
  if (savedAt > 0 && age > maxAge) {
    issues.push("witness_stale");
  }

  if (witness && witness.realityEpoch !== undefined && witness.realityEpoch !== hydrated.realityEpoch) {
    issues.push("witness_epoch_divergence");
  }

  if (witness && witness.sealHashHead && witness.sealHashHead !== hydrated.sealHashHead) {
    issues.push("witness_hash_divergence");
  }

  const interrupted =
    Array.isArray(hydrated.sealQueue) &&
    hydrated.sealQueue.length > 0 &&
    witness &&
    witness.replayOk === true &&
    issues.length === 0;
  if (interrupted) {
    issues.push("interrupted_persistence_queue_retained");
  }

  if (issues.some((x) => x.startsWith("witness_") && x.includes("divergence"))) {
    return {
      decision: BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS,
      seal: genesisRealitySealV0(t),
      issues,
      quarantinedEpoch: hydrated.realityEpoch
    };
  }

  if (issues.includes("witness_stale") && hydrated.realityEpoch > 0) {
    return {
      decision: BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS,
      seal: genesisRealitySealV0(t),
      issues
    };
  }

  const liveReplay = replaySealAuditTrailV0(hydrated.auditTrail);
  if (!liveReplay.ok) {
    return {
      decision: BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS,
      seal: genesisRealitySealV0(t),
      issues: [...issues, `live_replay_${liveReplay.code}`]
    };
  }

  return {
    decision: BOOT_REALITY_DECISION_V0.CONTINUE_SEALED_WORLD,
    seal: hydrated,
    issues,
    witness: {
      realityEpoch: hydrated.realityEpoch,
      sealHashHead: hydrated.sealHashHead,
      replayOk: true
    }
  };
}

/**
 * Read disk + resolve which world continues.
 *
 * @param {number} [nowMs]
 * @param {{ witnessMaxAgeMs?: number }} [opts]
 */
export function resolveBootRealitySealFromDiskV0(nowMs, opts = {}) {
  const t = Number(nowMs) || Date.now();
  if (typeof window === "undefined" || !window.localStorage) {
    return resolveBootRealitySealContinuityV0({ ok: false, code: "no_local_storage" }, t, opts);
  }
  const raw = window.localStorage.getItem(REALITY_SEAL_DISK_KEY_V0) || "";
  return resolveBootRealitySealContinuityV0(readDiskPayloadV0(raw), t, opts);
}

/**
 * @param {import("../../studio/types/rskOntology.js").StudioKernelState} kernel
 * @param {{ nowMs?: number, witnessMaxAgeMs?: number }} [opts]
 */
export function applyBootRealitySealContinuityToKernelV0(kernel, opts = {}) {
  const boot = resolveBootRealitySealFromDiskV0(opts.nowMs, opts);
  return {
    kernel: { ...kernel, realitySeal: boot.seal },
    boot
  };
}

/**
 * @param {ReturnType<typeof resolveBootRealitySealFromDiskV0>} boot
 * @returns {Record<string, unknown>}
 */
export function buildRealitySealBootContinuitySnapshotV0(boot) {
  return {
    schema: REALITY_SEAL_BOOT_CONTINUITY_SCHEMA_V0,
    ts: Date.now(),
    decision: boot.decision,
    issues: boot.issues ?? [],
    realityEpoch: boot.seal?.realityEpoch ?? 0,
    sealHashHead: boot.seal?.sealHashHead ?? "h00000000",
    queueDepth: boot.seal?.sealQueue?.length ?? 0
  };
}
