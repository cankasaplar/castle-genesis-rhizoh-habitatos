/**
 * CastleFieldTick — temporal spine (v0)
 * One browser interval drives hierarchical phases so physics / memory / consolidation
 * share a single clock instead of unrelated timers + event-only simulation.
 */

import { TCEE_PHASE, recordPreBreathIdlePulse } from "./tceeDualPhaseBoot.js";
import { sampleCspeIdleField } from "./cspeIdleEngine.js";
import { advanceCastleSocialIdentity } from "../social/csil/socialRegistry.js";
import { snapshotBrowserPresenceForCsil } from "../social/csil/browserPresenceSensors.js";
import { castlePeersForSocial } from "../social/csil/castlePeers.js";
import { readIdentityGraph } from "../../kernel/rhizohIdentityKernelV1.js";
import {
  resolveCoherentTickPlan,
  buildCastleTickProfile,
  listSuppressedLaneAlternatives,
  executionMetricsFromBackpressure
} from "./castleFieldTemporalPolicyV0.js";
import { withRuntimeMergeCommit } from "./castleRuntimeMergeLayerV0.js";
import { applyIdleMemoryDecayToMeta, applyIdleMemoryPruneToMeta } from "./castleIdleLearningV0.js";
import { buildMemoryEpisodesFromTurns } from "../memory/index.js";

/** 4 Hz base cadence */
export const CASTLE_FIELD_TICK_MS = 250;
export const CASTLE_FIELD_PHYSICS_HZ = 4;
/** At 4 Hz base: memory/identity cadence = 1 Hz */
export const CASTLE_FIELD_MEMORY_STRIDE = 4;
/** At 4 Hz base: consolidation cadence = 0.25 Hz */
export const CASTLE_FIELD_CONSOLIDATION_STRIDE = 16;

/**
 * Canonical field slice after a physics step (single read model for slow lanes).
 * @typedef {{
 *   at: number,
 *   tickIndex: number,
 *   tceePhase: string,
 *   presenceSeq: number | null,
 *   socialPhysics: Record<string, unknown> | null,
 *   presenceTelemetryLite: { qppLabel?: string, qppMode?: string } | null,
 *   preBreathEntropy: number | null,
 *   lastIdleSample: unknown | null,
 *   effectivePlan: { physics: boolean, memoryIdentity: boolean, consolidation: boolean },
 *   policy: Record<string, unknown>,
 *   suppressed: Array<{ lane: string, reason: string, wouldRun?: string, blockedBy?: string }>,
 *   context: { coherence: Record<string, unknown>, backpressure: { skipped: number, lastPhysicsMs: number }, policyEngine?: string }
 * }} CastleFieldCanonicalSnapshot
 */

/**
 * @param {object} canonicalBase
 * @param {object} boot
 * @param {number} tickIndex
 * @param {{ physics: boolean, memoryIdentity: boolean, consolidation: boolean }} basePlan
 * @param {{ physics: boolean, memoryIdentity: boolean, consolidation: boolean }} coherentPlan
 * @param {object} ctx
 */
function withTemporalPolicy(canonicalBase, boot, tickIndex, basePlan, coherentPlan, ctx) {
  const profile = buildCastleTickProfile({
    tceePhase: boot.phase,
    tickIndex,
    plan: coherentPlan,
    wakeSealedAt: boot.wakeSealedAt,
    memoryClockEpoch: boot.memoryClockEpoch
  });
  const suppressed = listSuppressedLaneAlternatives({
    basePlan,
    coherentPlan,
    profile,
    tceePhase: boot.phase
  });
  const bp =
    ctx && typeof ctx.getBackpressure === "function" ? executionMetricsFromBackpressure(ctx.getBackpressure()) : null;
  return {
    ...canonicalBase,
    effectivePlan: coherentPlan,
    policy: profile,
    suppressed,
    context: {
      coherence: {
        tceePhase: boot.phase,
        wakeSealedAt: boot.wakeSealedAt ?? null,
        memoryClockEpoch: boot.memoryClockEpoch ?? null
      },
      backpressure: bp || { skipped: 0, lastPhysicsMs: 0 },
      policyEngine: "castleFieldTemporalPolicyV0"
    }
  };
}

/**
 * @param {number} tickIndex monotonic count since conductor start
 */
export function castleFieldTickPlan(tickIndex) {
  const i = Math.max(0, Math.floor(Number(tickIndex) || 0));
  return {
    physics: true,
    memoryIdentity: i % CASTLE_FIELD_MEMORY_STRIDE === 0,
    consolidation: i > 0 && i % CASTLE_FIELD_CONSOLIDATION_STRIDE === 0
  };
}

/**
 * @param {object} ctx
 * @param {() => { turns?: unknown[], persona?: unknown, meta?: Record<string, unknown> }} ctx.readClientContinuity
 * @param {(next: { turns?: unknown[], persona?: unknown, meta?: Record<string, unknown> }) => void} ctx.writeClientContinuity
 * @param {(next: { turns?: unknown[], persona?: unknown, meta?: Record<string, unknown> }) => void} ctx.syncClientContinuityRef
 * @param {import("react").MutableRefObject<unknown>} ctx.browserPresenceRef
 * @param {import("react").MutableRefObject<unknown[]>} ctx.liveAgentsRef
 * @param {{ user?: { uid?: string, displayName?: string } | null, profile?: { displayName?: string } | null }} ctx.castleAuth
 * @param {unknown} ctx.remoteCastles
 * @param {string} ctx.rhizohFirstName
 * @param {() => string} ctx.getCastleDevUid
 * @param {number} [ctx.tickIndex]
 * @param {{ physics: boolean, memoryIdentity: boolean, consolidation: boolean }} [ctx.tickPlan] base stride plan (pre-coherence)
 * @param {() => unknown} [ctx.getBackpressure]
 * @returns {{ canonical: CastleFieldCanonicalSnapshot } | null}
 */
export function runCastleFieldPhysicsTick(ctx) {
  const {
    readClientContinuity,
    writeClientContinuity,
    syncClientContinuityRef,
    browserPresenceRef,
    liveAgentsRef,
    castleAuth,
    remoteCastles,
    rhizohFirstName,
    getCastleDevUid,
    tickIndex: tickIndexRaw,
    tickPlan: tickPlanRaw
  } = ctx;
  const tickIndex = Math.max(0, Math.floor(Number(tickIndexRaw) || 0));
  const devUid = typeof getCastleDevUid === "function" ? getCastleDevUid() : "";

  const disk = readClientContinuity();
  const meta = disk.meta && typeof disk.meta === "object" ? { ...disk.meta } : {};
  const boot = meta.tceeBoot && typeof meta.tceeBoot === "object" ? meta.tceeBoot : null;
  if (!boot || !boot.phase) return null;

  const basePlan =
    tickPlanRaw && typeof tickPlanRaw === "object"
      ? {
          physics: !!tickPlanRaw.physics,
          memoryIdentity: !!tickPlanRaw.memoryIdentity,
          consolidation: !!tickPlanRaw.consolidation
        }
      : castleFieldTickPlan(tickIndex);
  const coherentPlan = resolveCoherentTickPlan(basePlan, boot.phase);

  if (boot.phase === TCEE_PHASE.PRE_BREATH) {
    const snap = snapshotBrowserPresenceForCsil(browserPresenceRef.current);
    const prevE = Number(boot.cumulativeIdleEntropy) || 0;
    const idle = sampleCspeIdleField({ ...snap, prevEntropy: prevE });
    const nextMeta = recordPreBreathIdlePulse(meta, idle);
    const next = { ...disk, meta: nextMeta };
    writeClientContinuity(next);
    syncClientContinuityRef(next);
    const ent = Number(nextMeta.tceeBoot?.cumulativeIdleEntropy);
    const canonicalBase = {
      at: Date.now(),
      tickIndex,
      tceePhase: TCEE_PHASE.PRE_BREATH,
      presenceSeq: null,
      socialPhysics: null,
      presenceTelemetryLite: null,
      preBreathEntropy: Number.isFinite(ent) ? ent : null,
      lastIdleSample: idle
    };
    return {
      canonical: withTemporalPolicy(canonicalBase, boot, tickIndex, basePlan, coherentPlan, ctx)
    };
  }

  if (boot.phase !== TCEE_PHASE.AWAKE) return null;

  const ig = readIdentityGraph();
  const ir = ig.rhizoh || {};
  const trust = Number(ir.trust || 0);
  const familiarity = Number(ir.familiarity || 0);
  const operatorId = String(castleAuth.user?.uid || devUid || "local-operator");
  const operatorLabel = String(
    castleAuth.profile?.displayName || castleAuth.user?.displayName || rhizohFirstName || "you"
  ).slice(0, 48);
  const castlePeers = castlePeersForSocial(remoteCastles, castleAuth.user?.uid || "");
  const browserPresence = snapshotBrowserPresenceForCsil(browserPresenceRef.current);
  const agents = liveAgentsRef.current || [];
  const ecsAgentEvent = agents.length ? { kind: "ecs_agent_presence", count: agents.length } : null;
  const sf = meta.rhizohSocialField && typeof meta.rhizohSocialField === "object" ? meta.rhizohSocialField : null;
  const csil = advanceCastleSocialIdentity(meta.rhizohSocialRegistry, {
    message: "",
    operatorId,
    operatorLabel,
    trust,
    familiarity,
    hasFirebaseUser: !!castleAuth.user,
    firebaseUid: castleAuth.user?.uid || "",
    sessionKey: operatorId,
    roomTension: Number(sf?.roomState?.tension),
    routerIntent: "CHAT",
    identityRecallClosure: meta.rhizohLastRecallClosure || null,
    countUserMessage: false,
    browserPresence,
    castlePeers,
    avatarActivity: agents.length > 0,
    agentEvent: ecsAgentEvent
  });
  const nextMeta = { ...meta, rhizohSocialRegistry: csil.registry };
  const next = { ...disk, meta: nextMeta };
  withRuntimeMergeCommit(() => {
    writeClientContinuity(next);
    syncClientContinuityRef(next);
  });
  const reg = csil.registry && typeof csil.registry === "object" ? csil.registry : {};
  const tel = reg.presenceTelemetry && typeof reg.presenceTelemetry === "object" ? reg.presenceTelemetry : null;
  const sp = reg.socialPhysics && typeof reg.socialPhysics === "object" ? reg.socialPhysics : null;
  const canonicalBase = {
    at: Date.now(),
    tickIndex,
    tceePhase: TCEE_PHASE.AWAKE,
    presenceSeq: Number.isFinite(Number(reg.presenceSeq)) ? Number(reg.presenceSeq) : null,
    socialPhysics: sp ? { ...sp } : null,
    presenceTelemetryLite: tel
      ? {
          qppLabel: String(tel.qppLabel || ""),
          qppMode: String(tel.qppMode || "")
        }
      : null,
    preBreathEntropy: null,
    lastIdleSample: null
  };
  return {
    canonical: withTemporalPolicy(canonicalBase, boot, tickIndex, basePlan, coherentPlan, ctx)
  };
}

/**
 * 1 Hz — passive weighted-memory decay (awake + pre-breath if turns exist).
 * @param {object} ctx
 * @param {CastleFieldCanonicalSnapshot | null | undefined} canonical
 */
export function runCastleFieldMemoryIdentityTick(ctx, canonical) {
  if (!ctx || typeof ctx.readClientContinuity !== "function" || typeof ctx.writeClientContinuity !== "function") {
    return;
  }
  const phase = canonical?.tceePhase || "";
  if (phase !== TCEE_PHASE.AWAKE && phase !== TCEE_PHASE.PRE_BREATH) return;
  const disk = ctx.readClientContinuity();
  const meta0 = disk.meta && typeof disk.meta === "object" ? { ...disk.meta } : {};
  const meta = applyIdleMemoryDecayToMeta(meta0, Date.now());
  if (meta === meta0) return;
  const next = { ...disk, meta };
  withRuntimeMergeCommit(() => {
    ctx.writeClientContinuity(next);
    if (typeof ctx.syncClientContinuityRef === "function") ctx.syncClientContinuityRef(next);
  });
}

/**
 * 0.25 Hz — prune weak imprints + refresh memory episodes.
 * @param {object} ctx
 * @param {CastleFieldCanonicalSnapshot | null | undefined} canonical
 */
export function runCastleFieldConsolidationTick(ctx, canonical) {
  if (!ctx || typeof ctx.readClientContinuity !== "function" || typeof ctx.writeClientContinuity !== "function") {
    return;
  }
  const phase = canonical?.tceePhase || "";
  if (phase !== TCEE_PHASE.AWAKE && phase !== TCEE_PHASE.PRE_BREATH) return;
  const disk = ctx.readClientContinuity();
  const meta0 = disk.meta && typeof disk.meta === "object" ? { ...disk.meta } : {};
  const meta = applyIdleMemoryPruneToMeta(meta0, Date.now(), { aggressive: true });
  if (meta === meta0) return;
  const turns = Array.isArray(meta.rhizohWeightedTurns) ? meta.rhizohWeightedTurns : [];
  const episodes = buildMemoryEpisodesFromTurns(turns);
  const next = { ...disk, meta: { ...meta, rhizohMemoryEpisodes: episodes } };
  withRuntimeMergeCommit(() => {
    ctx.writeClientContinuity(next);
    if (typeof ctx.syncClientContinuityRef === "function") ctx.syncClientContinuityRef(next);
  });
}
