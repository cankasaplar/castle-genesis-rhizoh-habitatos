/**
 * TCEE / TFCE phase controller
 * Layer 1 — pre_breath: CSPE idle sampler, CSIL latent, recall→identity off
 * Layer 2 — WAKE seal: irreversible commit (memoryClockEpoch, baseline)
 * Layer 3 — post_wake: full CSPE + QPP + recall→identity + physics closure (behavioral; phase stays "awake")
 */

export const TCEE_PHASE = Object.freeze({
  PRE_BREATH: "pre_breath",
  AWAKE: "awake"
});

/**
 * @param {Record<string, unknown> | null | undefined} meta
 */
export function getTceeBoot(meta) {
  const m = meta && typeof meta === "object" ? meta : {};
  const b = m.tceeBoot && typeof m.tceeBoot === "object" ? m.tceeBoot : {};
  return b;
}

/**
 * @param {Record<string, unknown> | null | undefined} meta
 */
export function ensurePreBreathSeed(meta) {
  const m = meta && typeof meta === "object" ? { ...meta } : {};
  if (m.tceeBoot && typeof m.tceeBoot === "object" && m.tceeBoot.phase) return m;
  const now = Date.now();
  return {
    ...m,
    tceeBoot: {
      phase: TCEE_PHASE.PRE_BREATH,
      preBreathStartedAt: now,
      wakeSealedAt: null,
      memoryClockEpoch: null,
      idlePulseCount: 0,
      lastIdlePulseAt: null,
      cumulativeIdleEntropy: 0,
      lastIdleSample: null,
      version: 1
    }
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} meta
 * @param {{ presenceProbability?: number, entropyEstimate?: number, sampledAt?: number } | null} [idleFieldSample] — from sampleCspeIdleField
 */
export function recordPreBreathIdlePulse(meta, idleFieldSample = null) {
  const m = meta && typeof meta === "object" ? { ...meta } : {};
  const b = m.tceeBoot && typeof m.tceeBoot === "object" ? { ...m.tceeBoot } : {};
  if (b.phase !== TCEE_PHASE.PRE_BREATH) return m;
  const now = Date.now();
  const prevE = Number(b.cumulativeIdleEntropy) || 0;
  let cumulativeIdleEntropy = prevE;
  if (idleFieldSample && typeof idleFieldSample === "object" && idleFieldSample.entropyEstimate != null) {
    cumulativeIdleEntropy = Math.max(0, Math.min(0.82, Number(idleFieldSample.entropyEstimate) || 0));
  } else {
    cumulativeIdleEntropy = Math.max(0, Math.min(0.82, prevE * 0.96 + 0.006));
  }
  return {
    ...m,
    tceeBoot: {
      ...b,
      idlePulseCount: Number(b.idlePulseCount || 0) + 1,
      lastIdlePulseAt: now,
      cumulativeIdleEntropy,
      lastIdleSample: idleFieldSample && typeof idleFieldSample === "object" ? idleFieldSample : b.lastIdleSample || null
    }
  };
}

/**
 * Authority commit — deterministic seal (Phase B).
 * @param {Record<string, unknown>} meta
 * @param {{ reason?: string, sessionKey?: string }} [opts]
 */
export function commitWakeSeal(meta, opts = {}) {
  const m = meta && typeof meta === "object" ? { ...meta } : {};
  const now = Date.now();
  const reg = m.rhizohSocialRegistry && typeof m.rhizohSocialRegistry === "object" ? m.rhizohSocialRegistry : {};
  const entities = reg.entities && typeof reg.entities === "object" ? reg.entities : {};
  const prevBoot = m.tceeBoot && typeof m.tceeBoot === "object" ? m.tceeBoot : {};
  return {
    ...m,
    tceeBoot: {
      ...prevBoot,
      phase: TCEE_PHASE.AWAKE,
      preBreathStartedAt: Number(prevBoot.preBreathStartedAt) || now,
      wakeSealedAt: now,
      wakeReason: String(opts.reason || "kernel_wake").slice(0, 64),
      memoryClockEpoch: now,
      csilBaselineSummary: {
        entityCount: Object.keys(entities).length,
        sessionKey: String(opts.sessionKey || "").slice(0, 64)
      },
      cumulativeIdleEntropy: 0,
      lastIdleSample: null,
      version: 1
    }
  };
}

/**
 * Return to pre-breath without wiping memory (debug / controlled hibernate).
 * @param {Record<string, unknown>} meta
 */
export function revertTceeToPreBreath(meta) {
  const m = meta && typeof meta === "object" ? { ...meta } : {};
  const prevBoot = m.tceeBoot && typeof m.tceeBoot === "object" ? m.tceeBoot : {};
  const now = Date.now();
  return {
    ...m,
    tceeBoot: {
      ...prevBoot,
      phase: TCEE_PHASE.PRE_BREATH,
      wakeSealedAt: null,
      memoryClockEpoch: null,
      wakeReason: null,
      lastHibernateAt: now,
      cumulativeIdleEntropy: 0,
      lastIdleSample: null
    }
  };
}
