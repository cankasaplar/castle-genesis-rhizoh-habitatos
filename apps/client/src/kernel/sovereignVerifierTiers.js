/**
 * Sovereign Verification — Z3/SMT ana döngüde değil; async sidecar.
 * Chronos tick içine gömülü solver = ölçeklenmez (ms–s latency).
 */

export const VerifierTier = {
  REJECT: "reject",
  QUARANTINE: "quarantine",
  EDGE: "edge",
  CLOUD: "cloud",
  FORMAL: "formal"
};

/** Karantina sonrası müdahale durumu — Compliance Sentinel / governance. */
export const QuarantineState = {
  OBSERVE: "observe",
  SANDBOX: "sandbox",
  THROTTLE: "throttle",
  /** Düşük kota + gözlem; tam release öncesi güvenli geçiş. */
  REHABILITATE: "rehabilitate",
  RELEASE: "release",
  TERMINATE: "terminate"
};

/** Yaşam döngüsü sırası (Sentinel ilerletir). */
export const QUARANTINE_LIFECYCLE_ORDER = [
  QuarantineState.OBSERVE,
  QuarantineState.SANDBOX,
  QuarantineState.THROTTLE,
  QuarantineState.REHABILITATE,
  QuarantineState.RELEASE,
  QuarantineState.TERMINATE
];

/**
 * Doğrulama şeridi: reject → quarantine → provisional (edge) → blocking → formal.
 * Quarantine: doğrudan kötü değil; şüpheli (spawn burst, ağ burst, bellek drift) — izole gözlem, Compliance Sentinel.
 */
export const VERIFIER_FLOW_ORDER = [
  VerifierTier.REJECT,
  VerifierTier.QUARANTINE,
  VerifierTier.EDGE,
  VerifierTier.CLOUD,
  VerifierTier.FORMAL
];

const Q_THRESH = {
  spawnBurst: 0.92,
  networkBurst: 0.9,
  memoryDrift: 0.88
};

/** Şüpheli örüntü — provizyonel yolu kapatmadan karantina bandına alır. */
export function quarantineSuspicionCheck(proposal) {
  if (!proposal || typeof proposal !== "object") return { quarantine: false };
  const spawn = Number(proposal.spawnBurstScore ?? 0);
  const net = Number(proposal.networkBurstScore ?? 0);
  const mem = Number(proposal.memoryDriftScore ?? 0);
  if (spawn >= Q_THRESH.spawnBurst) {
    return { quarantine: true, tier: VerifierTier.QUARANTINE, reason: "spawn_burst", score: spawn };
  }
  if (net >= Q_THRESH.networkBurst) {
    return { quarantine: true, tier: VerifierTier.QUARANTINE, reason: "network_burst", score: net };
  }
  if (mem >= Q_THRESH.memoryDrift) {
    return { quarantine: true, tier: VerifierTier.QUARANTINE, reason: "memory_drift", score: mem };
  }
  return { quarantine: false };
}

/**
 * Şüpheli örüntü → önerilen durum (ör. bellek drift → throttle, spawn burst → sandbox).
 * Tekrar ihlal: ctx.quarantineStrikeCount ≥ 3 → TERMINATE.
 */
export function quarantinePolicyFor(reason, ctx = {}) {
  const mem = ctx.quarantineMemory;
  if (mem?.sameErrorStreak?.(reason) >= 3) {
    return { state: QuarantineState.TERMINATE, reason: "repeat_trajectory", prior: reason, nextStageHint: null };
  }
  const strikes = Number(ctx.quarantineStrikeCount ?? 0);
  if (strikes >= 3) {
    return { state: QuarantineState.TERMINATE, reason: "repeat_offense", prior: reason, nextStageHint: null };
  }
  switch (reason) {
    case "memory_drift":
      return {
        state: QuarantineState.THROTTLE,
        reason,
        nextStageHint: QuarantineState.REHABILITATE
      };
    case "spawn_burst":
      return {
        state: QuarantineState.SANDBOX,
        reason,
        nextStageHint: QuarantineState.REHABILITATE
      };
    case "network_burst":
      return {
        state: QuarantineState.OBSERVE,
        reason,
        nextStageHint: QuarantineState.REHABILITATE
      };
    default:
      return {
        state: QuarantineState.OBSERVE,
        reason,
        nextStageHint: QuarantineState.REHABILITATE
      };
  }
}

/** Politika / fizik sınırı ihlali — async kuyruk yok. */
export function instantRejectCheck(proposal) {
  if (!proposal || typeof proposal !== "object") {
    return { reject: true, tier: VerifierTier.REJECT, reason: "empty" };
  }
  if (proposal.policyForbidden === true) {
    return { reject: true, tier: VerifierTier.REJECT, reason: "policy_forbidden" };
  }
  if (proposal.batteryImpossible === true) {
    return { reject: true, tier: VerifierTier.REJECT, reason: "battery_impossible" };
  }
  if (proposal.collisionImpossible === true) {
    return { reject: true, tier: VerifierTier.REJECT, reason: "collision_impossible" };
  }
  return { reject: false };
}

/** Hafif: politika + sınır + imza (istemci). */
export function edgeQuickCheck(proposal) {
  const ir = instantRejectCheck(proposal);
  if (ir.reject) return { ok: false, tier: VerifierTier.REJECT, reason: ir.reason };
  const q = quarantineSuspicionCheck(proposal);
  if (q.quarantine) {
    proposal?.quarantineMemory?.imprint?.({ reason: q.reason, score: q.score });
    const policy = quarantinePolicyFor(q.reason, { ...proposal, quarantineMemory: proposal?.quarantineMemory });
    return {
      ok: false,
      tier: VerifierTier.QUARANTINE,
      reason: q.reason,
      quarantineScore: q.score,
      quarantineState: policy.state,
      quarantineNextHint: policy.nextStageHint
    };
  }
  const risk = Number(proposal.risk ?? proposal.riskScore ?? 0);
  if (!Number.isFinite(risk)) return { ok: false, tier: VerifierTier.EDGE, reason: "risk_nan" };
  return { ok: true, tier: VerifierTier.EDGE, risk };
}

/**
 * Önerilen akış:
 * Proposal → quick policy → provisional dispatch → deep verify async → approve | revoke | quarantine
 */
export function verificationLaneForRisk(risk) {
  if (risk >= 0.65) return { blocking: true, tiers: [VerifierTier.EDGE, VerifierTier.FORMAL] };
  if (risk >= 0.25) return { blocking: false, tiers: [VerifierTier.EDGE, VerifierTier.CLOUD] };
  return { blocking: false, tiers: [VerifierTier.EDGE] };
}

/** wasm z3 ağır — FormalVerifier sunucu kümesinde tutulmalı; istemci yalnız light path. */
export const VERIFIER_DEPLOYMENT = {
  client: [VerifierTier.REJECT, VerifierTier.QUARANTINE, VerifierTier.EDGE],
  server: [VerifierTier.CLOUD, VerifierTier.FORMAL]
};
