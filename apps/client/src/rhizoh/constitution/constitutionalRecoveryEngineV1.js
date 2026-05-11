/**
 * R3 — Constitutional recovery engine — deterministik geri dönüş (checkpoint, attractor snap, IR önek onarımı).
 * Rastgele yok; aynı checkpoint + aynı bozuk girdi → aynı çıktı.
 */

import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";
import { computeRhizohThetaAttractorField } from "./thetaAttractorFieldV1.js";

export const RHIZOH_CONSTITUTIONAL_RECOVERY_ENGINE_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   version: string,
 *   at: number,
 *   thetaStar: number,
 *   phase: string,
 *   adaptation?: Record<string, unknown>,
 *   stressIndex?: number,
 *   irOpsFingerprint?: string | null,
 *   traceTailHash?: string | null
 * }} RhizohConstitutionalRecoveryCheckpoint
 */

/**
 * @param {{
 *   thetaEffective: number,
 *   phase?: string,
 *   adaptation?: Record<string, unknown>,
 *   stressIndex?: number,
 *   irOpsFingerprint?: string | null,
 *   traceTailHash?: string | null
 * }} snapshot
 */
export function createRhizohConstitutionalRecoveryCheckpoint(snapshot) {
  const theta = clamp01(snapshot.thetaEffective);
  const phase =
    snapshot.phase || resolveRhizohThetaPhase(theta).phase;
  return {
    version: RHIZOH_CONSTITUTIONAL_RECOVERY_ENGINE_VERSION,
    at: Date.now(),
    thetaStar: theta,
    phase,
    adaptation: snapshot.adaptation ? { ...snapshot.adaptation } : {},
    stressIndex:
      snapshot.stressIndex != null ? clamp01(Number(snapshot.stressIndex)) : undefined,
    irOpsFingerprint: snapshot.irOpsFingerprint ?? null,
    traceTailHash: snapshot.traceTailHash ?? null
  };
}

/**
 * Checkpoint’ten θ ve adaptasyon geri yükleme (deterministik merge).
 * @param {Record<string, unknown>} currentState
 * @param {RhizohConstitutionalRecoveryCheckpoint} checkpoint
 */
export function rollbackRhizohConstitutionalToCheckpoint(currentState, checkpoint) {
  const base = currentState && typeof currentState === "object" ? { ...currentState } : {};
  const prevAdapt =
    base.adaptation && typeof base.adaptation === "object"
      ? /** @type {Record<string, unknown>} */ (base.adaptation)
      : {};
  const ckAdapt =
    checkpoint.adaptation && typeof checkpoint.adaptation === "object"
      ? checkpoint.adaptation
      : {};
  return {
    ...base,
    theta: checkpoint.thetaStar,
    thetaEffective: checkpoint.thetaStar,
    constitutionalTheta: checkpoint.thetaStar,
    phase: checkpoint.phase,
    adaptation: {
      ...prevAdapt,
      ...ckAdapt,
      thetaPrev: checkpoint.thetaStar
    },
    recovery: {
      mode: "checkpoint_rollback",
      checkpointAt: checkpoint.at,
      engineVersion: RHIZOH_CONSTITUTIONAL_RECOVERY_ENGINE_VERSION
    }
  };
}

/**
 * Güvenli attractor bileşik merkezine doğru deterministik snap.
 */
export function snapRhizohThetaToSafeAttractor(theta, opts = {}) {
  const t = clamp01(theta);
  const blend = clamp01(opts.blend ?? 0.24);
  const field = computeRhizohThetaAttractorField(t, opts.fieldOpts || {});
  const snapped = clamp01((1 - blend) * t + blend * field.compositeAttractorTheta);
  return {
    thetaBefore: t,
    thetaAfter: Math.round(snapped * 10000) / 10000,
    dominantAttractorId: field.dominantAttractorId,
    recovery: { mode: "safe_attractor_snap", blend }
  };
}

/**
 * Trace’te son güvenli opcode indeksini bulup IR programını kısaltır (replay recovery).
 * @param {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrProgram} program
 * @param {ReadonlyArray<{ op?: string }>} trace
 * @param {{ safeOps?: ReadonlySet<string> }} [policy]
 */
export function repairRhizohIrProgramFromTrace(program, trace, policy) {
  const safeDefault = new Set(["NOP", "SET_THETA", "SET_STRESS", "HALT"]);
  const safeOps = policy?.safeOps instanceof Set ? policy.safeOps : safeDefault;
  const ops = [...(program.ops || [])];
  let lastSafeIdx = -1;
  const tr = trace || [];
  for (let i = 0; i < Math.min(ops.length, tr.length); i++) {
    const ran = String(tr[i]?.op || "");
    const planned = String(ops[i]?.op || "");
    if (ran === planned && safeOps.has(ran)) lastSafeIdx = i;
  }
  if (lastSafeIdx < 0) {
    return {
      repairedProgram: { ...program, ops: [] },
      lastSafeIndex: -1,
      recovery: { mode: "ir_empty_prefix", note: "no_safe_alignment" }
    };
  }
  return {
    repairedProgram: { ...program, ops: ops.slice(0, lastSafeIdx + 1) },
    lastSafeIndex: lastSafeIdx,
    recovery: { mode: "ir_prefix_truncate", truncatedFrom: ops.length }
  };
}

/**
 * Kısmi gözlemlerden deterministik minimum durum yeniden kurulumu.
 */
export function reconstructRhizohPartialConstitutionalState(parts = {}) {
  const theta = clamp01(parts.theta ?? parts.thetaEffective ?? 0.46);
  const stressIndex = parts.stressIndex != null ? clamp01(Number(parts.stressIndex)) : 0.42;
  const phase = parts.phase ? String(parts.phase) : resolveRhizohThetaPhase(theta).phase;
  return {
    theta,
    thetaEffective: theta,
    stressIndex,
    phase,
    adaptation:
      parts.adaptation && typeof parts.adaptation === "object"
        ? { .../** @type {object} */ (parts.adaptation), thetaPrev: theta }
        : { thetaPrev: theta },
    recovery: {
      mode: "partial_reconstruction",
      engineVersion: RHIZOH_CONSTITUTIONAL_RECOVERY_ENGINE_VERSION
    }
  };
}
