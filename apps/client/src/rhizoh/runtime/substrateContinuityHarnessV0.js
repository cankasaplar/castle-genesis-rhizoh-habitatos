/**
 * Faz 2.0 — first continuity harness: real append → IDB → cold rehydrate proof.
 *
 * Per successful sealer drain: appendWalSegment + monotonic cursor.
 * On boot: assessHydrate({ requireContinuityProof: true }).
 *
 * Env: `VITE_SUBSTRATE_CONTINUITY_IDB=1`
 *
 * Out of scope: snapshots, outbox, peer sync, gateway merge.
 */

import {
  deriveWalSegmentIdV0,
  withSubstrateContinuityIdbSessionV0
} from "./substrateContinuityIdbV0.js";
import {
  buildContinuityRecoverySnapshotV0,
  runContinuityRecoveryOrchestratorV0
} from "./continuity/continuityRecoveryOrchestratorV0.js";
import { REHYDRATE_GATE_V0 } from "./continuity/continuityRecoveryOrchestratorV0.js";
import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";

export const SUBSTRATE_CONTINUITY_HARNESS_SCHEMA_V0 = "castle.rhizoh.substrate_continuity_harness.v0";

const harnessState = {
  enabled: false,
  bootHydrate: null,
  bootGuard: null,
  recovery: null,
  bootHydrateAtMs: 0,
  segmentsAppended: 0,
  lastAppendAtMs: 0,
  lastAppendTick: null,
  lastAppendSegmentId: null,
  lastError: null
};

export function substrateContinuityHarnessEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_SUBSTRATE_CONTINUITY_IDB === "1";
  } catch {
    return false;
  }
}

/**
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {Record<string, unknown>} witness
 * @param {number} tick
 */
export function buildDrainContinuitySegmentV0(seal, witness, tick, prevHash = WAL_HASH_CHAIN_GENESIS_V0) {
  const body = {
    schema: "castle.rhizoh.substrate_continuity_drain_segment.v0",
    realityEpoch: seal?.realityEpoch ?? 0,
    sealHashHead: String(witness?.sealHashHead || ""),
    replayOk: witness?.replayOk === true,
    auditDepth: witness?.auditDepth ?? 0,
    inflationStatus: witness?.inflationStatus ?? null
  };
  const hash = foldWalSegmentHashV0(prevHash, body);
  return {
    tick: Number(tick),
    hash,
    body
  };
}

/**
 * Cold-start continuity proof — cursor must anchor to wal segment chain.
 * @returns {Promise<ReturnType<typeof assessContinuityHydrateV0> & { ok?: boolean }>}
 */
export async function runColdContinuityHydrateProofV0() {
  if (!substrateContinuityHarnessEnabledV0()) {
    return { mode: "disabled", ok: false, issues: ["harness_disabled"] };
  }
  if (typeof indexedDB === "undefined") {
    return { mode: "unavailable", ok: false, issues: ["indexeddb_unavailable"] };
  }
  return withSubstrateContinuityIdbSessionV0(undefined, async (idb) =>
    runContinuityRecoveryOrchestratorV0(
      {
        diskKey: idb.diskKey,
        readReplayCursor: () => idb.readReplayCursor(),
        getWalSegment: (tick) => idb.getWalSegment(tick),
        writeReplayCursor: async (c) => {
          const r = await idb.writeReplayCursorMonotonic(c);
          return { ok: r.ok === true };
        }
      },
      { applyRepair: false, minEpoch: 0 }
    )
  );
}

/**
 * One IDB segment per sealer drain tick (when sealed > 0).
 *
 * @param {import("../../studio/types/rskOntology.js").RealitySealLayerState} seal
 * @param {Record<string, unknown>} witness
 * @param {{ sealed?: number }} [meta]
 */
export async function recordDrainContinuitySegmentV0(seal, witness, meta = {}) {
  if (!substrateContinuityHarnessEnabledV0()) {
    return { ok: false, code: "harness_disabled" };
  }

  return withSubstrateContinuityIdbSessionV0(undefined, async (idb) => {
    const cur = await idb.readReplayCursor();
    const tick = (Number(cur?.lastTick) >= 0 ? Number(cur.lastTick) : -1) + 1;
    const prevHash =
      tick > 0 ? String((await idb.getWalSegment(tick - 1))?.hash || WAL_HASH_CHAIN_GENESIS_V0) : WAL_HASH_CHAIN_GENESIS_V0;
    const draft = buildDrainContinuitySegmentV0(seal, witness, tick, prevHash);
    const hash = draft.hash;
    if (!hash) return { ok: false, code: "witness_hash_missing" };
    const appended = await idb.appendWalSegment({
      tick: draft.tick,
      hash: draft.hash,
      body: { ...draft.body, sealed: Number(meta.sealed) || 0 }
    });
    if (!appended.ok) return appended;

    const segmentId =
      appended.segment?.segmentId ?? deriveWalSegmentIdV0(idb.diskKey, tick, hash);
    const cursorWrite = await idb.writeReplayCursorMonotonic({
      lastTick: tick,
      lastHash: hash,
      lastSegmentId: segmentId,
      bootGeneration: Number(cur?.bootGeneration) || 0
    });
    if (!cursorWrite.ok) return cursorWrite;

    harnessState.segmentsAppended += 1;
    harnessState.lastAppendAtMs = Date.now();
    harnessState.lastAppendTick = tick;
    harnessState.lastAppendSegmentId = segmentId;
    harnessState.lastError = null;

    return {
      ok: true,
      tick,
      segmentId,
      cursor: cursorWrite.cursor
    };
  });
}

/**
 * Fire-and-forget hook from sealer drain path.
 * @param {{ sealed?: number, seal?: import("../../studio/types/rskOntology.js").RealitySealLayerState, witness?: Record<string, unknown> }} tick
 */
export function maybeRecordDrainContinuitySegmentV0(tick) {
  if (!substrateContinuityHarnessEnabledV0()) return;
  if ((tick?.sealed ?? 0) <= 0 || !tick?.seal || !tick?.witness) return;

  void recordDrainContinuitySegmentV0(tick.seal, tick.witness, { sealed: tick.sealed }).catch((err) => {
    harnessState.lastError = String(err?.message || err || "append_failed");
  });
}

/**
 * Run once at app boot — process-death rehydrate proof (prior session segments).
 * @returns {() => void}
 */
export function installSubstrateContinuityHarnessV0() {
  harnessState.enabled = substrateContinuityHarnessEnabledV0();
  if (!harnessState.enabled) {
    return () => {};
  }

  void runColdContinuityHydrateProofV0()
    .then((r) => {
      harnessState.recovery = r;
      harnessState.bootGuard = r?.bootAfter ?? r?.bootBefore ?? null;
      harnessState.bootHydrate = r?.bootAfter?.hydrate ?? r?.bootBefore?.hydrate ?? null;
      harnessState.bootHydrateAtMs = Date.now();
      if (r?.rehydrateGate === REHYDRATE_GATE_V0.CLOSED) {
        harnessState.lastError = String(r.epistemic?.past || "rehydrate_closed");
      }
    })
    .catch((err) => {
      harnessState.bootHydrate = {
        mode: "error",
        ok: false,
        issues: [String(err?.message || err || "boot_hydrate_failed")]
      };
      harnessState.bootHydrateAtMs = Date.now();
    });

  return () => {};
}

/** @returns {Record<string, unknown>} */
export function buildSubstrateContinuityHarnessSnapshotV0() {
  return {
    schema: SUBSTRATE_CONTINUITY_HARNESS_SCHEMA_V0,
    enabled: harnessState.enabled,
    envGate: "VITE_SUBSTRATE_CONTINUITY_IDB=1",
    bootHydrate: harnessState.bootHydrate,
    bootGuard: harnessState.bootGuard,
    continuityRecovery: harnessState.recovery
      ? buildContinuityRecoverySnapshotV0(harnessState.recovery)
      : null,
    bootHydrateAtMs: harnessState.bootHydrateAtMs || null,
    mayRehydrate: harnessState.recovery?.mayRehydrate ?? null,
    epistemicPast: harnessState.recovery?.epistemic?.past ?? null,
    segmentsAppended: harnessState.segmentsAppended,
    lastAppendAtMs: harnessState.lastAppendAtMs || null,
    lastAppendTick: harnessState.lastAppendTick,
    lastAppendSegmentId: harnessState.lastAppendSegmentId,
    lastError: harnessState.lastError,
    scope: {
      walSegments: true,
      replayCursor: true,
      snapshotHydrate: false,
      outbox: false,
      peerSync: false,
      gatewayMerge: false
    }
  };
}

/** @param {typeof harnessState} next */
export function resetSubstrateContinuityHarnessStateForTestsV0(next = {}) {
  harnessState.enabled = false;
  harnessState.bootHydrate = next.bootHydrate ?? null;
  harnessState.bootGuard = next.bootGuard ?? null;
  harnessState.recovery = next.recovery ?? null;
  harnessState.bootHydrateAtMs = next.bootHydrateAtMs ?? 0;
  harnessState.segmentsAppended = next.segmentsAppended ?? 0;
  harnessState.lastAppendAtMs = next.lastAppendAtMs ?? 0;
  harnessState.lastAppendTick = next.lastAppendTick ?? null;
  harnessState.lastAppendSegmentId = next.lastAppendSegmentId ?? null;
  harnessState.lastError = next.lastError ?? null;
}
