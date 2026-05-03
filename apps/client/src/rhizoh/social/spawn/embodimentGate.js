/**
 * Ontological court for Phase 3 — not a raw threshold.
 * Embodiment requires three seals; mesh/avatar remains last and optional.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

const W_U = 0.22;
const W_P = 0.18;
const W_D = 0.14;
const W_C = 0.16;
const W_F = 0.18;
const W_R = 0.12;

const SCORE_CANDIDATE = 0.72;
const SCORE_EARNED_AUTHORITY = 0.82;

/**
 * @param {unknown} protoOrThread
 * @param {{
 *   now?: number,
 *   routerIntent?: string,
 *   bondScore?: number,
 *   trust?: number,
 *   familiarity?: number,
 *   socialPhysics?: Record<string, unknown> | null,
 *   socialFieldTheory?: Record<string, unknown> | null,
 *   tsge?: Record<string, unknown> | null,
 *   peerRoles?: string[],
 *   identityCoherenceHint?: number,
 *   manualAuthorityGranted?: boolean
 * }} context
 */
export function evaluateEmbodiment(protoOrThread, context = {}) {
  const t = protoOrThread && typeof protoOrThread === "object" ? protoOrThread : {};
  const now = Number(context.now) || Date.now();
  const bond = clamp01(Number(context.bondScore ?? (context.trust + context.familiarity) / 2) || 0.35);
  const trust = clamp01(Number(context.trust) || 0);
  const fam = clamp01(Number(context.familiarity) || 0);

  const U = clamp01(Number(t.utilityAccumulator) || 0);
  const ageMs = Math.max(0, now - Number(t.bornAt || now));
  const P = clamp01(Math.min(1, ageMs / 480_000));
  const peers = Array.isArray(context.peerRoles) ? context.peerRoles.filter(Boolean) : [];
  const role = String(t.role || "");
  const sameRoleCount = peers.filter((r) => r === role).length;
  const D =
    peers.length === 0 ? 0.52 : clamp01(1 - sameRoleCount / Math.max(1, peers.length));

  const ri = String(context.routerIntent || "").toUpperCase();
  const mix = t.sourceIntentMix && typeof t.sourceIntentMix === "object" ? t.sourceIntentMix : {};
  let align = 0.45;
  if (ri.includes("CRISIS") && Number(mix.CRISIS) > 0.22) align += 0.28;
  if (ri.includes("BUILD") && Number(mix.BUILD) > 0.22) align += 0.22;
  if (ri.includes("PLAY") && Number(mix.PLAY) > 0.18) align += 0.18;
  const C = clamp01((align / 1.2) * (0.55 + 0.45 * bond) * (Number(context.identityCoherenceHint ?? 0.72) || 0.72));

  const sp = context.socialPhysics && typeof context.socialPhysics === "object" ? context.socialPhysics : {};
  const tsge = context.tsge && typeof context.tsge === "object" ? context.tsge : {};
  const streak = Number(tsge.saturationStreak) || 0;
  const maxRaw = Number(tsge.lastMaxRawPairwiseForce) || 0;
  const varCurv = Number(tsge.attentionCurvatureVariance) ?? 0.5;
  const F = clamp01(0.55 * (1 - Math.min(1, streak / 22)) + 0.25 * (1 - Math.min(1, maxRaw / 2.4)) + 0.2 * (1 - Math.min(1, varCurv / 0.08)));
  const drift = clamp01(Number(sp.driftScore) || 0);
  const recon = clamp01(Number(sp.reconciliationNeed) || 0);
  const crisisBias = Number(mix.CRISIS) || 0;
  let R = clamp01(0.35 * drift + 0.25 * recon + 0.2 * (role === "scout" ? crisisBias : 0) + 0.2 * (trust < 0.22 ? 0.35 : 0));

  const Eraw =
    W_U * U + W_P * P + W_D * D + W_C * C + W_F * F - W_R * R;
  const E = clamp01((Eraw + 0.15) / 1.15);

  const capabilitySeal = U >= 0.32 && Number(t.activationCount || 0) >= 2;
  const fieldSeal = streak < 18 && F >= 0.38;
  const authorityEarned =
    E >= SCORE_EARNED_AUTHORITY && P >= 0.62 && U >= 0.42 && trust >= 0.38 && fam >= 0.28 && R < 0.42;
  const authorityManual = !!context.manualAuthorityGranted;
  const authoritySeal = authorityEarned || authorityManual;

  const passesOntologicalCourt = E >= SCORE_CANDIDATE && capabilitySeal && fieldSeal;
  const meshEligible = passesOntologicalCourt && authoritySeal;

  let route = "continue_cognitive";
  if (passesOntologicalCourt) route = "candidate_embodiment";
  else if (U < 0.12 && P < 0.18 && R > 0.55) route = "hibernate";

  const reasons = [];
  if (!capabilitySeal) reasons.push("capability_unproven");
  if (!fieldSeal) reasons.push("field_not_ready");
  if (!authoritySeal) reasons.push("authority_pending_mesh_requires_seal");
  if (R > 0.5) reasons.push("trust_safety_margin");

  return {
    eligible: passesOntologicalCourt,
    meshEligible,
    score: Math.round(E * 1000) / 1000,
    reason: reasons.length ? reasons.join("; ") : "court_pass",
    route,
    seals: {
      capability: capabilitySeal,
      field: fieldSeal,
      authority: authoritySeal,
      authorityMode: authorityManual ? "manual" : authorityEarned ? "earned" : "none"
    },
    components: {
      U: Math.round(U * 1000) / 1000,
      P: Math.round(P * 1000) / 1000,
      D: Math.round(D * 1000) / 1000,
      C: Math.round(C * 1000) / 1000,
      F: Math.round(F * 1000) / 1000,
      R: Math.round(R * 1000) / 1000
    }
  };
}
