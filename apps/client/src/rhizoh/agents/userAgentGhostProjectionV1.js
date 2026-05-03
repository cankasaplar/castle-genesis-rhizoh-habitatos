/**
 * User-agent ghost stack — mirrors L10 diagnostics slice for continuity / prompt wiring.
 * Read-only ecology projection.
 */

import { conductCognitiveChorus } from "../social/spawn/cognitiveConductor.js";
import { computeGhostEcologyV1 } from "../social/ecology/ghostEcologyV1.js";
import { buildUserAgentEcologyPerception } from "./agentEcologyPerceptionBridge.js";
import { computeReactiveAgentLayerV1 } from "./reactiveAgentLayerV1.js";
import { compileGhostPerceptionV1 } from "./ghostPerceptionCompilerV1.js";
import { arbitratePerceptionV1 } from "./perceptionArbitrationLayerV1.js";
import { buildIntentFeedbackClosureV1 } from "./intentFeedbackClosureV1.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Highest-utility active cognitive thread id (chorus-adjacent selection).
 * @param {Record<string, unknown> | null | undefined} socialRegistry
 */
export function pickPrimaryCognitiveThreadId(socialRegistry) {
  const reg = socialRegistry && typeof socialRegistry === "object" ? socialRegistry : {};
  const ct = reg.contextTimeline && typeof reg.contextTimeline === "object" ? reg.contextTimeline : {};
  const cogs = Array.isArray(ct.cognitiveSubThreads) ? ct.cognitiveSubThreads : [];
  const active = cogs.filter((t) => t && String(t.status || "") === "active");
  active.sort((a, b) => Number(b.utilityAccumulator || 0) - Number(a.utilityAccumulator || 0));
  const id = active[0]?.id;
  return id != null && String(id).trim() ? String(id).trim() : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} socialRegistry
 * @param {string | null | undefined} subjectThreadId — required non-empty
 * @param {{
 *   ghostEcology?: Record<string, unknown> | null,
 *   chorus?: Record<string, unknown> | null,
 *   field?: Record<string, unknown> | null,
 *   arbitrationGovernorBuffer?: Record<string, unknown> | null,
 *   arbitrationGovernorDisabled?: boolean
 * }} [precomputed] — when provided by L10 diagnostics, avoids duplicate ecology tick
 */
export function computeGhostUserAgentStackV1(socialRegistry, subjectThreadId, precomputed = {}) {
  const sub = String(subjectThreadId || "").trim();
  if (!sub) return null;

  const reg = socialRegistry && typeof socialRegistry === "object" ? socialRegistry : {};
  const ct = reg.contextTimeline && typeof reg.contextTimeline === "object" ? reg.contextTimeline : {};
  const sp = reg.socialPhysics && typeof reg.socialPhysics === "object" ? reg.socialPhysics : {};
  const cogs = Array.isArray(ct.cognitiveSubThreads) ? ct.cognitiveSubThreads : [];

  const prec = precomputed && typeof precomputed === "object" ? precomputed : {};
  let chorus = prec.chorus && typeof prec.chorus === "object" ? prec.chorus : null;
  if (!chorus) {
    const activeForChorus = cogs.filter((t) => t && String(t.status || "") === "active").slice(0, 3);
    chorus = conductCognitiveChorus(activeForChorus, {});
  }

  let ghostEcology =
    prec.ghostEcology && typeof prec.ghostEcology === "object" ? prec.ghostEcology : null;
  if (!ghostEcology) {
    ghostEcology = computeGhostEcologyV1({
      cognitiveThreads: cogs,
      chorus,
      socialPhysics: sp,
      now: Date.now()
    });
  }

  let field = prec.field && typeof prec.field === "object" ? prec.field : null;
  if (!field) {
    field = {
      phase: String(sp.phase || "—"),
      driftScore: clamp01(Number(sp.driftScore) || 0),
      stabilityScore: clamp01(Number(sp.stabilityScore) || 0),
      reconciliationNeed: clamp01(Number(sp.reconciliationNeed) || 0)
    };
  }

  const perception = buildUserAgentEcologyPerception(ghostEcology, sub);
  const reactiveLayer = computeReactiveAgentLayerV1(perception, { chorus, field });
  const ghostPerceptionV1 = compileGhostPerceptionV1(perception, { chorus, field, reactiveLayer });
  const govBuf = prec.arbitrationGovernorBuffer ?? prec.governorBuffer ?? null;
  const perceptionArbitrationV1 = arbitratePerceptionV1(
    {
      ghostPerceptionV1,
      reactiveLayer,
      chorus,
      perception
    },
    {
      governorBuffer: govBuf,
      governorDisabled: !!prec.arbitrationGovernorDisabled
    }
  );

  const intentFeedbackClosureV1 = buildIntentFeedbackClosureV1({
    perceptionArbitrationV1,
    ghostPerceptionV1,
    reactiveLayer,
    chorus,
    perception
  });

  return {
    subjectThreadId: sub,
    perception,
    reactiveLayer,
    ghostPerceptionV1,
    perceptionArbitrationV1,
    intentFeedbackClosureV1,
    ghostEcology,
    chorus,
    field
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} socialRegistry
 * @param {string | null | undefined} explicitSubjectThreadId — if omitted, picks primary active thread
 * @param {{
 *   arbitrationGovernorBuffer?: Record<string, unknown> | null,
 *   arbitrationGovernorDisabled?: boolean
 * }} [opts]
 */
export function buildUserAgentGhostProjectionV1(socialRegistry, explicitSubjectThreadId = null, opts = {}) {
  const chosen =
    explicitSubjectThreadId != null && String(explicitSubjectThreadId).trim()
      ? String(explicitSubjectThreadId).trim()
      : pickPrimaryCognitiveThreadId(socialRegistry);
  if (!chosen) return null;
  const o = opts && typeof opts === "object" ? opts : {};
  return computeGhostUserAgentStackV1(socialRegistry, chosen, {
    arbitrationGovernorBuffer: o.arbitrationGovernorBuffer ?? null,
    arbitrationGovernorDisabled: !!o.arbitrationGovernorDisabled
  });
}
