/**
 * Projection-only snapshot for L10 Observatory (DOM/SVG). Does not touch simulation kernels.
 */

import { KERNEL_SEAL_V1 } from "../contracts/kernelSealV1.js";
import { CAPABILITY_MANIFEST_V1 } from "../contracts/capabilityManifest.js";
import { conductCognitiveChorus } from "../social/spawn/cognitiveConductor.js";
import { enrichProtoAgentsWithPulse } from "./l10ProtoPulseScratchpad.js";
import { computeGhostEcologyV1 } from "../social/ecology/ghostEcologyV1.js";
import { USER_AGENT_SKELETON_V1 } from "../agents/userAgentSkeletonV1.js";
import { computeGhostUserAgentStackV1 } from "../agents/userAgentGhostProjectionV1.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown> | null | undefined} socialRegistry
 * @param {{ userAgentSubjectThreadId?: string | null }} [options]
 */
export function buildL10Diagnostics(socialRegistry, options = {}) {
  const reg = socialRegistry && typeof socialRegistry === "object" ? socialRegistry : {};
  const ct = reg.contextTimeline && typeof reg.contextTimeline === "object" ? reg.contextTimeline : {};
  const tsge = ct.tsge && typeof ct.tsge === "object" ? ct.tsge : {};
  const sp = reg.socialPhysics && typeof reg.socialPhysics === "object" ? reg.socialPhysics : {};
  const co = ct.coPresenceGraph && typeof ct.coPresenceGraph === "object" ? ct.coPresenceGraph : {};
  let fsatSum = 0;
  let fsatN = 0;
  for (const k of Object.keys(co)) {
    const e = co[k];
    if (!e || typeof e !== "object") continue;
    const f = Math.abs(Number(e.pairwiseSaturatedForce) || 0);
    if (Number.isFinite(f)) {
      fsatSum += f;
      fsatN += 1;
    }
  }
  const forceMean = fsatN ? fsatSum / fsatN : 0;

  const protoQueue = Array.isArray(ct.spawnEnvelopeQueue) ? ct.spawnEnvelopeQueue : [];
  const protosRaw = protoQueue.filter((p) => p && p.status === "gestating");
  const protoAgents = enrichProtoAgentsWithPulse(protosRaw);

  const cogs = Array.isArray(ct.cognitiveSubThreads) ? ct.cognitiveSubThreads : [];
  const activeForChorus = cogs.filter((t) => t && String(t.status || "") === "active").slice(0, 3);
  const chorus = conductCognitiveChorus(activeForChorus, {});

  const embodimentCandidates = cogs.filter(
    (t) => t && t.lastEmbodimentGate && String(t.lastEmbodimentGate.route || "") === "candidate_embodiment"
  );

  const embodimentCourt = cogs
    .filter((t) => t && t.lastEmbodimentGate && typeof t.lastEmbodimentGate === "object")
    .sort((a, b) => Number(b.utilityAccumulator || 0) - Number(a.utilityAccumulator || 0))
    .slice(0, 5);

  const streak = Number(tsge.saturationStreak) || 0;
  const maxRaw = Number(tsge.lastMaxRawPairwiseForce) || 0;
  const varC = Number(tsge.attentionCurvatureVariance) || 0;
  const saturationPressure = clamp01(0.45 * (streak / 22) + 0.35 * Math.min(1, maxRaw / 2.4) + 0.2 * Math.min(1, varC / 0.1));

  const ghostEcology = computeGhostEcologyV1({
    cognitiveThreads: cogs,
    chorus,
    socialPhysics: sp,
    now: Date.now()
  });

  const field = {
    phase: String(sp.phase || "—"),
    driftScore: clamp01(Number(sp.driftScore) || 0),
    stabilityScore: clamp01(Number(sp.stabilityScore) || 0),
    reconciliationNeed: clamp01(Number(sp.reconciliationNeed) || 0)
  };

  const uaSubject =
    options.userAgentSubjectThreadId != null && String(options.userAgentSubjectThreadId).trim()
      ? String(options.userAgentSubjectThreadId).trim()
      : null;
  const stack = uaSubject
    ? computeGhostUserAgentStackV1(reg, uaSubject, {
        ghostEcology,
        chorus,
        field,
        arbitrationGovernorDisabled: true
      })
    : null;
  const perception = stack?.perception ?? null;
  const reactiveLayer = stack?.reactiveLayer ?? null;
  const ghostPerceptionV1 = stack?.ghostPerceptionV1 ?? null;
  const perceptionArbitrationV1 = stack?.perceptionArbitrationV1 ?? null;
  const intentFeedbackClosureV1 = stack?.intentFeedbackClosureV1 ?? null;

  const userAgent =
    perception != null
      ? {
          skeleton: USER_AGENT_SKELETON_V1,
          perception,
          ...(reactiveLayer ? { reactiveLayer } : {}),
          ...(ghostPerceptionV1 ? { ghostPerceptionV1 } : {}),
          ...(perceptionArbitrationV1 ? { perceptionArbitrationV1 } : {}),
          ...(intentFeedbackClosureV1 ? { intentFeedbackClosureV1 } : {})
        }
      : undefined;

  return {
    tsge: {
      saturationStreak: streak,
      attentionCurvatureVariance: varC,
      lastMaxRawPairwiseForce: maxRaw,
      stableAttractorHint: !!tsge.stableAttractorHint,
      spawnMitosisHint: !!tsge.spawnMitosisHint,
      localGravityMean: clamp01(Number(sp.tsgeLocalGravityMean) || 0),
      edgeForceMean: Math.round(forceMean * 1000) / 1000,
      saturationPressure
    },
    chorus,
    protoAgents,
    cognitiveThreads: cogs,
    embodimentCandidates,
    embodimentCourt,
    field,
    socialField: reg.socialField && typeof reg.socialField === "object" ? reg.socialField : null,
    ghostEcology,
    ...(userAgent ? { userAgent } : {}),
    kernelSeal: KERNEL_SEAL_V1,
    capabilityManifest: CAPABILITY_MANIFEST_V1
  };
}
