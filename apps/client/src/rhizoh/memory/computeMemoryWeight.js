import { RHIZOH_MEMORY_LAMBDA_PER_DAY } from "./constants.js";
import { intentAlignmentFactor } from "./intentAlignmentFactor.js";
import { computeFieldResonanceOverlap } from "./fieldResonanceOverlap.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Semantic core (Layer 1–2): wide-net score before field collapse.
 * I blends turn importance with co-presence imprint × current (CSPE coupling).
 */
export function computeSemanticMemoryCore(turn, ctx = {}) {
  const now = Number(ctx.now) || Date.now();
  const I0 = Math.max(0.05, Math.min(1, Number(turn.importance) || 0.35));
  const E = Math.max(0, Math.min(1, Number(turn.emotionalSalience) || 0.2));
  const Rsem = Math.max(0.08, Math.min(1, Number(turn.resonance) || 0.45));
  const Bturn = Math.max(0.08, Math.min(1, Number(turn.bond) || 0.35));
  const currentBond = Math.max(0.08, Math.min(1, Number(ctx.currentBond) ?? 0.35));
  const Bbond = Math.min(1, (Bturn + currentBond) / 2);

  const cur = ctx.currentPhysics && typeof ctx.currentPhysics === "object" ? ctx.currentPhysics : {};
  const im = turn.physicsImprint && typeof turn.physicsImprint === "object" ? turn.physicsImprint : null;
  const coI = im ? clamp01(im.coPresenceMomentum) : clamp01(cur.coPresenceMomentum);
  const coC = clamp01(cur.coPresenceMomentum);
  const Icoh = Math.max(0.05, Math.min(1, Math.sqrt(coI * coC) + 0.18 * coC));
  const I = Math.max(0.05, Math.min(1, I0 * (0.4 + 0.6 * Icoh)));

  const dtMs = Math.max(0, now - Number(turn.ts) || 0);
  const dtDays = dtMs / 86_400_000;
  const driftNow = clamp01(cur.driftScore);
  const lambdaBase = Number(ctx.lambda) >= 0 ? Number(ctx.lambda) : RHIZOH_MEMORY_LAMBDA_PER_DAY;
  const lambdaEff = lambdaBase * (1 + 1.05 * driftNow);
  const decay = Math.exp(-lambdaEff * dtDays);

  const A = intentAlignmentFactor(turn.intent, ctx.queryIntent || "");

  const flux = clamp01(cur.trustFlux);
  const stab = clamp01(cur.stabilityScore);
  const B = Math.max(0.06, Math.min(1, (Bbond * 0.55 + (0.45 + 0.55 * stab) * 0.25 + (0.35 + 0.65 * flux) * 0.2)));

  const tsgeG = clamp01(Number(cur.tsgeLocalGravityMean) || 0);
  const core = Math.max(0, I * decay * (1 + E) * A * Rsem * B);
  const gravityBias = Math.min(1.12, 1 + 0.065 * tsgeG);
  return Math.max(0, core * gravityBias);
}

/**
 * Physics collapse factor (Layer 3): field alignment × local stability/drift shaping.
 */
export function computePhysicsMemoryFactor(turn, ctx = {}) {
  const cur = ctx.currentPhysics && typeof ctx.currentPhysics === "object" ? ctx.currentPhysics : {};
  const cft = ctx.currentFieldTheory && typeof ctx.currentFieldTheory === "object" ? ctx.currentFieldTheory : {};
  const overlap = computeFieldResonanceOverlap(turn.physicsImprint, cur, cft);
  const drift = clamp01(cur.driftScore);
  const stab = clamp01(cur.stabilityScore);
  const recon = clamp01(cur.reconciliationNeed);
  return Math.max(
    0.06,
    overlap * (0.38 + 0.62 * stab) * (1 - drift * 0.24) * (1 - recon * 0.08)
  );
}

/**
 * W ≈ SemanticCore × PhysicsFactor — post-retrieval collapse (not pre-filter).
 * @param {{
 *   ts: number,
 *   importance?: number,
 *   emotionalSalience?: number,
 *   resonance?: number,
 *   bond?: number,
 *   intent?: string,
 *   physicsImprint?: Record<string, unknown>
 * }} turn
 * @param {{
 *   now?: number,
 *   queryIntent?: string,
 *   currentBond?: number,
 *   lambda?: number,
 *   currentPhysics?: Record<string, unknown>,
 *   currentFieldTheory?: Record<string, unknown>
 * }} ctx
 */
export function computeMemoryWeight(turn, ctx = {}) {
  const semantic = computeSemanticMemoryCore(turn, ctx);
  const physics = computePhysicsMemoryFactor(turn, ctx);
  const W = semantic * physics;
  return Math.max(0, Math.round(W * 1e6) / 1e6);
}
