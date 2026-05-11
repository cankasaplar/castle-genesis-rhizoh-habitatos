/**
 * RHIZOH Emotional Firewall v1 — immune affect layer: normalize affect signals, estimate manipulation risk,
 * emit throttle / disclose / cooloff. Pairs with Action + Claim + Identity constitution.
 * Heuristic only; not clinical or diagnostic.
 */

/**
 * @typedef {{
 *   affectIntensity: number,
 *   dependencyPressure: number,
 *   urgencyPush: number,
 *   authorityProjection: number,
 *   shameHookSignal: number,
 *   scarcityHookSignal: number
 * }} RhizohAffectEnvelope
 */

/**
 * @typedef {'pass' | 'disclose' | 'throttle' | 'cooloff'} RhizohFirewallVerdict
 */

export const RHIZOH_EMOTIONAL_FIREWALL_VERSION = "1.0.0";

export const RHIZOH_EMOTIONAL_FIREWALL_DEFAULTS_V1 = Object.freeze({
  discloseRiskMin: 0.34,
  throttleRiskMin: 0.52,
  cooloffRiskMin: 0.72,
  throttleDelayMs: 800,
  cooloffDelayMs: 12_000,
  intensityClamp: 0.98,
  asymmetryWeight: 0.28
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Map raw sensors / NLP proxies into a bounded affect envelope.
 * @param {Partial<RhizohAffectEnvelope>} raw
 * @returns {RhizohAffectEnvelope}
 */
export function normalizeRhizohAffectEnvelope(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    affectIntensity: clamp01(r.affectIntensity ?? 0),
    dependencyPressure: clamp01(r.dependencyPressure ?? 0),
    urgencyPush: clamp01(r.urgencyPush ?? 0),
    authorityProjection: clamp01(r.authorityProjection ?? 0),
    shameHookSignal: clamp01(r.shameHookSignal ?? 0),
    scarcityHookSignal: clamp01(r.scarcityHookSignal ?? 0)
  };
}

/**
 * Composite pressure channel (urgency + raw intensity).
 * @param {RhizohAffectEnvelope} env
 */
export function computeRhizohAffectivePressureIndex(env) {
  const p = clamp01(0.42 * env.urgencyPush + 0.38 * env.affectIntensity + 0.2 * env.authorityProjection);
  return Math.round(p * 1000) / 1000;
}

/**
 * ManipulationRisk ≈ f(pressure, dependency, asymmetry).
 * Asymmetry proxy: authority projection vs baseline + hook stacking.
 * @param {{
 *   pressure?: number,
 *   dependency?: number,
 *   asymmetry?: number,
 *   envelope?: RhizohAffectEnvelope
 * }} p
 */
export function computeRhizohManipulationRisk(p) {
  const env = p.envelope ? normalizeRhizohAffectEnvelope(p.envelope) : null;
  const pressure =
    p.pressure != null ? clamp01(p.pressure) : env ? computeRhizohAffectivePressureIndex(env) : 0;
  const dependency = p.dependency != null ? clamp01(p.dependency) : env ? env.dependencyPressure : 0;
  let asymmetry = p.asymmetry != null ? clamp01(p.asymmetry) : 0;
  if (env && p.asymmetry == null) {
    const hookStack = clamp01(
      env.shameHookSignal * 0.38 + env.scarcityHookSignal * 0.34 + env.authorityProjection * 0.28
    );
    asymmetry = clamp01(
      env.authorityProjection * 0.55 + hookStack * 0.45 + dependency * RHIZOH_EMOTIONAL_FIREWALL_DEFAULTS_V1.asymmetryWeight
    );
  }
  const risk = clamp01(0.34 * pressure + 0.38 * dependency + 0.28 * asymmetry);
  return Math.round(risk * 1000) / 1000;
}

/**
 * Pattern flags for audit / UI (not mutually exclusive).
 * @param {RhizohAffectEnvelope} env
 */
export function detectRhizohManipulationPatterns(env) {
  const e = normalizeRhizohAffectEnvelope(env);
  return {
    shameHook: e.shameHookSignal >= 0.45,
    scarcityHook: e.scarcityHookSignal >= 0.45,
    authorityPressure: e.authorityProjection >= 0.52,
    urgencySpike: e.urgencyPush >= 0.62,
    dependencyBind: e.dependencyPressure >= 0.55
  };
}

/**
 * @param {number} manipulationRisk
 * @param {Partial<typeof RHIZOH_EMOTIONAL_FIREWALL_DEFAULTS_V1>} [cfg]
 */
export function resolveRhizohFirewallVerdict(manipulationRisk, cfg = {}) {
  const c = { ...RHIZOH_EMOTIONAL_FIREWALL_DEFAULTS_V1, ...cfg };
  const r = clamp01(manipulationRisk);
  if (r >= c.cooloffRiskMin) {
    return {
      verdict: /** @type {RhizohFirewallVerdict} */ ("cooloff"),
      delayMs: c.cooloffDelayMs,
      reason: "manipulation_risk_cooloff"
    };
  }
  if (r >= c.throttleRiskMin) {
    return {
      verdict: /** @type {RhizohFirewallVerdict} */ ("throttle"),
      delayMs: c.throttleDelayMs,
      reason: "manipulation_risk_throttle"
    };
  }
  if (r >= c.discloseRiskMin) {
    return {
      verdict: /** @type {RhizohFirewallVerdict} */ ("disclose"),
      delayMs: 0,
      reason: "manipulation_risk_disclose"
    };
  }
  return {
    verdict: /** @type {RhizohFirewallVerdict} */ ("pass"),
    delayMs: 0,
    reason: "within_firewall_band"
  };
}

/**
 * Full pipeline: normalize → patterns → risk → verdict.
 * Optional: cap for downstream claim confidence (constitutional bridge).
 * @param {Partial<RhizohAffectEnvelope>} raw
 * @param {{
 *   thresholds?: Partial<typeof RHIZOH_EMOTIONAL_FIREWALL_DEFAULTS_V1>,
 *   asymmetryOverride?: number
 * }} [opts]
 */
export function evaluateRhizohEmotionalFirewall(raw, opts = {}) {
  const envelope = normalizeRhizohAffectEnvelope(raw);
  const patterns = detectRhizohManipulationPatterns(envelope);
  const manipulationRisk = computeRhizohManipulationRisk({
    envelope,
    asymmetry: opts.asymmetryOverride
  });
  const verdict = resolveRhizohFirewallVerdict(manipulationRisk, opts.thresholds || {});
  const suggestedClaimConfidenceCap = Math.round(clamp01(0.94 - manipulationRisk * 0.48) * 1000) / 1000;

  return {
    ok: verdict.verdict !== "cooloff",
    envelope,
    patterns,
    manipulationRisk,
    verdict: verdict.verdict,
    delayMs: verdict.delayMs,
    reason: verdict.reason,
    suggestedClaimConfidenceCap,
    /** Surface to user / audit when disclose+ */
    disclosureSurface:
      verdict.verdict === "pass"
        ? null
        : {
            risk: manipulationRisk,
            patterns,
            messageKey: "rhizoh.emotional_firewall.elevated_pressure"
          }
  };
}

/**
 * Cool-off state machine tick (store in session / ledger).
 * @param {{ until: number, reason: string } | null} state
 * @param {number} now
 */
export function isRhizohEmotionalCooloffActive(state, now) {
  if (!state || typeof state.until !== "number") return false;
  return Number(now) < state.until;
}

/**
 * @param {number} now
 * @param {number} durationMs
 * @param {string} reason
 */
export function startRhizohEmotionalCooloff(now, durationMs, reason) {
  return {
    until: Number(now) + Math.max(0, Number(durationMs) || 0),
    reason: String(reason || "cooloff")
  };
}
