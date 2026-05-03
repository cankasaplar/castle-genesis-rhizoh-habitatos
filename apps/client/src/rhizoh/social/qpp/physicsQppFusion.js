/**
 * Physics → QPP fusion (hybrid):
 * - Discrete: threshold presets map socialPhysics.phase + scores → qppLabel/qppMode when CSIL has not locked a high-priority semantic state.
 * - Continuous: qppKinetics always derived from stability/drift/reconcile/trustFlux + field interference (breath, blur, orbit, color tension).
 *
 * Spatial field (grid macro + hero N-body) is intentionally NOT solved here at O(N²).
 * Future: Layer 1 — diffuse ρ_T and attention on CityMind HEATMAP_LEN; Layer 2 — local kernels around Rhizoh + hero IDs; feed cell samples into this fusion as scalar inputs.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * CSIL-owned states: physics must not override narrative (introduction, suspicion, ambient, etc.).
 * @param {Record<string, unknown>} tel
 */
function csilLocksDiscretePhysics(tel) {
  const t = tel && typeof tel === "object" ? tel : {};
  const stage = String(t.stage || "");
  if (stage === "entry_detection" || stage === "identity_attempt") return true;
  const label = String(t.qppLabel || "").toLowerCase();
  if (label === "ambient" || label === "welcoming") return true;
  if (label.includes("noticing presence") || label.includes("identity attempt")) return true;
  if (label.includes("observing") && t.qppMode === "cautious") return true;
  return false;
}

/**
 * @param {Record<string, unknown>} tel — presenceTelemetry (mutated copy returned)
 * @param {Record<string, unknown> | null | undefined} socialPhysics
 * @param {Record<string, unknown> | null | undefined} socialFieldTheory
 */
export function fusePhysicsIntoPresenceTelemetry(tel, socialPhysics, socialFieldTheory) {
  const base = tel && typeof tel === "object" ? { ...tel } : {};
  const sp = socialPhysics && typeof socialPhysics === "object" ? socialPhysics : {};
  const ft = socialFieldTheory && typeof socialFieldTheory === "object" ? socialFieldTheory : {};
  const inf = ft.interference && typeof ft.interference === "object" ? ft.interference : {};

  const phase = String(sp.phase || "stable");
  const stab = clamp01(sp.stabilityScore);
  const drift = clamp01(sp.driftScore);
  const recon = clamp01(sp.reconciliationNeed);
  const flux = clamp01(sp.trustFlux);
  const obs = clamp01(sp.observationMode);
  const qProb = clamp01(sp.quietStateProbability);
  const destructive = inf.pattern === "destructive";

  const slowBreath =
    1 +
    drift * 1.35 +
    recon * 0.95 +
    (1 - stab) * 0.38 +
    (destructive ? 0.35 : 0) +
    obs * 0.42 +
    qProb * 0.28 -
    flux * 0.18;
  const blurExtraPx = drift * 9 + recon * 5 + (destructive ? 3.5 : 0) + flux * 2.2 + obs * 2;
  const orbitDriftScale = 0.72 + stab * 0.38 - drift * 0.28 + recon * 0.12 - obs * 0.08;
  const traceBreathSec = 4.2 + slowBreath * 0.55 + drift * 0.85 + obs * 0.65;
  const colorTension = clamp01(
    drift * 0.5 +
      recon * 0.48 -
      stab * 0.28 +
      (destructive ? 0.2 : 0) +
      flux * 0.22 +
      obs * 0.35
  );
  const resonanceLineSecScale = 0.85 + stab * 0.22 - drift * 0.18 + (flux > 0.55 ? 0.12 : 0);

  const out = {
    ...base,
    qppKinetics: {
      slowBreath: Math.round(Math.max(0.85, Math.min(3.2, slowBreath)) * 1000) / 1000,
      blurExtraPx: Math.round(Math.max(0, Math.min(14, blurExtraPx)) * 100) / 100,
      orbitDriftScale: Math.round(Math.max(0.55, Math.min(1.45, orbitDriftScale)) * 1000) / 1000,
      traceBreathSec: Math.round(Math.max(3.5, Math.min(9.5, traceBreathSec)) * 100) / 100,
      colorTension,
      resonanceLineSecScale: Math.round(Math.max(0.72, Math.min(1.45, resonanceLineSecScale)) * 1000) / 1000
    },
    qppPhysics: {
      phase,
      stabilityScore: stab,
      driftScore: drift,
      reconciliationNeed: recon,
      trustFlux: flux,
      interference: inf.pattern || "mixed",
      quietStateProbability: qProb,
      observationMode: obs,
      interactionEnergy: clamp01(
        Number.isFinite(Number(sp.interactionEnergy)) ? Number(sp.interactionEnergy) : 0.85
      ),
      reconcileDurationMs: Number(sp.reconcileDurationMs) || 0
    }
  };

  const mayDiscrete = !csilLocksDiscretePhysics(base);
  const labelLo = String(base.qppLabel || "present").toLowerCase();
  const modeIdle = String(base.qppMode || "idle") === "idle";
  const baselinePresent = labelLo === "present" || labelLo === "" || labelLo === "idle";

  if (mayDiscrete && baselinePresent && modeIdle) {
    if (phase === "reconcile" && recon > 0.52) {
      out.qppLabel = "field reconcile";
      out.qppMode = "cautious";
      out.qppPhysicsNudge = "reconcile";
    } else if (phase === "drifting" && drift > 0.54) {
      out.qppLabel = "social drift";
      out.qppMode = "soft_pulse";
      out.qppPhysicsNudge = "drift";
    } else if (phase === "coherent" && stab > 0.74 && drift < 0.42 && flux < 0.4) {
      out.qppPhysicsNudge = "coherent";
    }
  }

  return out;
}
