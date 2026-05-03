/**
 * socialRegistry — entities, relationships, introductions, permissions + temporal context
 */

import { detectPresence } from "./presenceDetection.js";
import { resolveEntityFromSignals, ENTITY_CLASS } from "./identityResolution.js";
import { advanceRelationshipRecord, REL_STAGE } from "./relationshipGraph.js";
import {
  INTRO_PHASE,
  advanceIntroductionPhase,
  parseSelfIntroductionName,
  parseConsentLikely,
  introductionGuidanceForLlm
} from "./introductionProtocol.js";
import { permissionsFor } from "./trustBoundary.js";
import { mergeCastlePeersIntoRegistry } from "./castlePeers.js";
import {
  createInitialSocialPhysicsState,
  advanceSocialPhysics,
  computeTsgeEdgeStep,
  stepTsgeSingularityDiagnostics,
  maxAbsRawForceForEntity
} from "../physics/index.js";
import {
  stepProtoAgentGestationQueue,
  createInitialSpawnEnvelopeQueue,
  computePhantomMassScale,
  phantomShadowAdditive,
  graduateEmbryosToCognitiveThreads
} from "../spawn/index.js";
import { createInitialSocialFieldTheoryState, advanceSocialFieldTheory } from "../fieldTheory/index.js";
import { fusePhysicsIntoPresenceTelemetry } from "../qpp/physicsQppFusion.js";

function buildIdentityLifecycle(prev, resolved, introPhase, relStage) {
  const p = String(prev || "unknown");
  if (relStage === REL_STAGE.TRUSTED || relStage === REL_STAGE.BONDED) return "trusted";
  if (resolved.class !== ENTITY_CLASS.UNKNOWN && resolved.confidence >= 0.74) return "resolved";
  if (resolved.class !== ENTITY_CLASS.UNKNOWN && resolved.confidence >= 0.56) return "tentative_label";
  if (introPhase === INTRO_PHASE.OBSERVING || p === "observing") return "observing";
  return "unknown";
}

function pushBounded(arr, item, maxN) {
  const next = [...(Array.isArray(arr) ? arr : []), item];
  if (next.length > maxN) next.splice(0, next.length - maxN);
  return next;
}

function pairKey(a, b) {
  const x = String(a || "").trim();
  const y = String(b || "").trim();
  if (!x || !y || x === y) return "";
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

export function createInitialSocialRegistry() {
  return {
    entities: {},
    relationships: {},
    introductions: {},
    introductionGraph: {},
    permissions: {},
    contextTimeline: {
      events: [],
      interactions: [],
      coPresenceGraph: {},
      spawnEnvelopeQueue: createInitialSpawnEnvelopeQueue(),
      pglFailureImprints: [],
      cognitiveSubThreads: [],
      cognitiveLifecycleImprints: []
    },
    socialPhysics: createInitialSocialPhysicsState(),
    socialFieldTheory: createInitialSocialFieldTheoryState(),
    presenceSeq: 0,
    presenceTelemetry: {
      lastPresence: null,
      qppLabel: "present",
      qppMode: "idle",
      stage: "social_state"
    },
    updatedAt: Date.now()
  };
}

/**
 * @param {unknown} reg
 */
function ensureRegistry(reg) {
  const b = createInitialSocialRegistry();
  const r = reg && typeof reg === "object" ? reg : {};
  const ct = r.contextTimeline && typeof r.contextTimeline === "object" ? r.contextTimeline : {};
  return {
    entities: typeof r.entities === "object" && r.entities ? { ...r.entities } : { ...b.entities },
    relationships:
      typeof r.relationships === "object" && r.relationships ? { ...r.relationships } : { ...b.relationships },
    introductions:
      typeof r.introductions === "object" && r.introductions ? { ...r.introductions } : { ...b.introductions },
    introductionGraph:
      typeof r.introductionGraph === "object" && r.introductionGraph ? { ...r.introductionGraph } : { ...b.introductionGraph },
    permissions:
      typeof r.permissions === "object" && r.permissions ? { ...r.permissions } : { ...b.permissions },
    contextTimeline: {
      events: Array.isArray(ct.events) ? ct.events.slice(-120) : [],
      interactions: Array.isArray(ct.interactions) ? ct.interactions.slice(-180) : [],
      coPresenceGraph:
        ct.coPresenceGraph && typeof ct.coPresenceGraph === "object" ? { ...ct.coPresenceGraph } : {},
      tsge: ct.tsge && typeof ct.tsge === "object" ? { ...ct.tsge } : undefined,
      spawnEnvelopeQueue: Array.isArray(ct.spawnEnvelopeQueue)
        ? ct.spawnEnvelopeQueue.map((x) => (x && typeof x === "object" ? { ...x } : x)).filter(Boolean)
        : createInitialSpawnEnvelopeQueue(),
      pglFailureImprints: Array.isArray(ct.pglFailureImprints)
        ? ct.pglFailureImprints.slice(-28)
        : [],
      cognitiveSubThreads: Array.isArray(ct.cognitiveSubThreads)
        ? ct.cognitiveSubThreads.map((x) => (x && typeof x === "object" ? { ...x } : x)).filter(Boolean)
        : [],
      cognitiveLifecycleImprints: Array.isArray(ct.cognitiveLifecycleImprints)
        ? ct.cognitiveLifecycleImprints.slice(-36)
        : []
    },
    socialPhysics:
      r.socialPhysics && typeof r.socialPhysics === "object"
        ? { ...b.socialPhysics, ...r.socialPhysics }
        : { ...b.socialPhysics },
    socialFieldTheory:
      r.socialFieldTheory && typeof r.socialFieldTheory === "object"
        ? { ...b.socialFieldTheory, ...r.socialFieldTheory }
        : { ...b.socialFieldTheory },
    presenceSeq: Number(r.presenceSeq) || 0,
    presenceTelemetry:
      r.presenceTelemetry && typeof r.presenceTelemetry === "object"
        ? { ...b.presenceTelemetry, ...r.presenceTelemetry }
        : { ...b.presenceTelemetry },
    updatedAt: Date.now()
  };
}

/**
 * @param {{
 *   message?: string,
 *   assistantSnippet?: string,
 *   operatorId?: string,
 *   operatorLabel?: string,
 *   trust?: number,
 *   familiarity?: number,
 *   hasFirebaseUser?: boolean,
 *   firebaseUid?: string,
 *   sessionKey?: string,
 *   micActive?: boolean,
 *   voiceActivity?: boolean,
 *   cursorActivity?: boolean,
 *   avatarActivity?: boolean,
 *   agentEvent?: unknown,
 *   sensorEvent?: unknown,
 *   signedAgentKey?: boolean,
 *   agentId?: string,
 *   ghostPetActive?: boolean,
 *   roomTension?: number,
 *   identityRecallClosure?: Record<string, unknown> | null,
 *   routerIntent?: string,
 *   countUserMessage?: boolean,
 *   browserPresence?: {
 *     micActive?: boolean,
 *     voiceActivity?: boolean,
 *     cursorActivity?: boolean,
 *     sensorEvent?: unknown,
 *     tabFocused?: boolean,
 *     windowFocused?: boolean,
 *     pointerVelocity?: number
 *   },
 *   castlePeers?: { id: string, label: string, bridged?: boolean }[],
 *   introducedBy?: string[]
 * }} input
 */
export function advanceCastleSocialIdentity(prevRegistry, input) {
  const reg = ensureRegistry(prevRegistry);
  const ins = input && typeof input === "object" ? input : {};

  const msg = String(ins.message || "");
  const hasText = msg.trim().length > 0;
  const countUserMessage = ins.countUserMessage !== false;

  const sessionKey = String(ins.sessionKey || ins.operatorId || "anon").slice(0, 64);
  const eidGuess =
    ins.hasFirebaseUser && String(ins.firebaseUid || "").trim()
      ? `u_${String(ins.firebaseUid).trim()}`
      : `guest_${sessionKey}`;
  const priorRow = reg.entities[eidGuess] || null;

  const bp = ins.browserPresence && typeof ins.browserPresence === "object" ? ins.browserPresence : {};
  const presence = detectPresence(
    {
      message: msg,
      micActive: ins.micActive !== undefined ? !!ins.micActive : !!bp.micActive,
      voiceActivity: ins.voiceActivity !== undefined ? !!ins.voiceActivity : !!bp.voiceActivity,
      cursorActivity: ins.cursorActivity !== undefined ? !!ins.cursorActivity : !!bp.cursorActivity,
      avatarActivity: !!ins.avatarActivity,
      agentEvent: ins.agentEvent,
      sensorEvent: ins.sensorEvent !== undefined ? ins.sensorEvent : bp.sensorEvent,
      tabFocused: bp.tabFocused,
      windowFocused: bp.windowFocused,
      pointerVelocity: bp.pointerVelocity
    },
    { seq: reg.presenceSeq }
  );
  reg.presenceSeq += 1;
  reg.presenceTelemetry.lastPresence = presence;

  const selfName = parseSelfIntroductionName(msg);
  const consentLikely = parseConsentLikely(msg);

  const resolved = resolveEntityFromSignals(
    {
      hasFirebaseUser: !!ins.hasFirebaseUser,
      firebaseUid: ins.firebaseUid,
      displayName: ins.operatorLabel,
      signedAgentKey: !!ins.signedAgentKey,
      agentId: ins.agentId,
      sessionKey,
      selfIntroductionName: selfName || undefined,
      ghostPetActive: !!ins.ghostPetActive
    },
    priorRow ? { entityId: priorRow.entityId, class: priorRow.class } : { entityId: eidGuess, class: ENTITY_CLASS.UNKNOWN }
  );

  const eid = resolved.entityId;
  const now = Date.now();
  const prevEnt = reg.entities[eid] || {};
  const displayName =
    selfName ||
    String(ins.operatorLabel || "").trim() ||
    String(prevEnt.displayName || resolved.displayNameHint || "").trim();

  reg.entities[eid] = {
    entityId: eid,
    displayName: displayName || "",
    class: resolved.class,
    introduced: !!(prevEnt.introduced || selfName || (ins.hasFirebaseUser && displayName.length > 0)),
    voiceSignature: prevEnt.voiceSignature || null,
    firstSeenAt: prevEnt.firstSeenAt || now,
    lastSeenAt: now,
    identityConfidence: resolved.confidence,
    identitySource: resolved.source,
    identityHierarchy: resolved.hierarchy || "soft",
    identityConfidenceBreakdown: resolved.confidenceBreakdown || {}
  };

  const prevRel = reg.relationships[eid] || {};
  const incrementMessages = countUserMessage && hasText;
  reg.relationships[eid] = advanceRelationshipRecord(prevRel, {
    trust: ins.trust,
    familiarity: ins.familiarity,
    introduced: reg.entities[eid].introduced,
    displayName: reg.entities[eid].displayName,
    incrementMessages
  });

  const tension = Number(ins.roomTension);
  const suspicious = Number.isFinite(tension) && tension > 0.62 && resolved.class === ENTITY_CLASS.UNKNOWN;

  const introRow = reg.introductions[eid] || { phase: INTRO_PHASE.NONE };
  const asst = String(ins.assistantSnippet || "").toLowerCase();
  reg.introductions[eid] = advanceIntroductionPhase(introRow, {
    hasStrongIdentity: !!ins.hasFirebaseUser || resolved.class === ENTITY_CLASS.HUMAN_USER,
    consentLikely,
    nameLearned: !!selfName,
    suspicious,
    presenceDetected: presence.modality.length > 0,
    consentOffered: asst.includes("tanış") || asst.includes("introduc") || asst.includes("meet you")
  });
  reg.relationships[eid].identityLifecycle = buildIdentityLifecycle(
    prevRel.identityLifecycle,
    resolved,
    reg.introductions[eid].phase,
    reg.relationships[eid].stage
  );

  reg.permissions[eid] = permissionsFor(reg.relationships[eid].stage, reg.entities[eid].class);

  let qppLabel = "present";
  let qppMode = "idle";
  let qppStage = "social_state";
  if (resolved.class === ENTITY_CLASS.AMBIENT) {
    qppLabel = "ambient";
  } else if (suspicious) {
    qppLabel = "observing";
    qppMode = "cautious";
  } else if (presence.modality.length && reg.relationships[eid].identityLifecycle === "unknown") {
    qppLabel = "noticing presence";
    qppMode = "soft_pulse";
    qppStage = "entry_detection";
  } else if (reg.relationships[eid].identityLifecycle === "tentative_label") {
    qppLabel = "identity attempt";
    qppMode = "soft_pulse";
    qppStage = "identity_attempt";
  } else if (reg.introductions[eid].phase === INTRO_PHASE.WELCOMED) {
    qppLabel = "welcoming";
    qppMode = "open";
  }

  reg.presenceTelemetry.qppLabel = qppLabel;
  reg.presenceTelemetry.qppMode = qppMode;
  reg.presenceTelemetry.stage = qppStage;
  reg.updatedAt = now;

  const introBy = Array.isArray(ins.introducedBy) ? ins.introducedBy : [];
  if (selfName && introBy.length) {
    const prior = Array.isArray(reg.introductionGraph[eid]) ? reg.introductionGraph[eid] : [];
    const merged = [...prior];
    for (const by of introBy) {
      const k = String(by || "").trim();
      if (!k || merged.some((m) => m.by === k)) continue;
      merged.push({ by: k, confidence: 0.72, at: now });
    }
    reg.introductionGraph[eid] = merged.slice(-8);
  }

  if (Array.isArray(ins.castlePeers) && ins.castlePeers.length) {
    mergeCastlePeersIntoRegistry(reg, ins.castlePeers);
  }

  const eventType = hasText ? "message" : ins.assistantSnippet ? "assistant" : "presence_tick";
  reg.contextTimeline.events = pushBounded(
    reg.contextTimeline.events,
    {
      ts: now,
      type: eventType,
      entityId: eid,
      intent: String(ins.routerIntent || "").slice(0, 24) || undefined,
      identityLifecycle: reg.relationships[eid].identityLifecycle,
      introPhase: reg.introductions[eid].phase,
      qpp: { label: qppLabel, mode: qppMode, stage: qppStage },
      modality: presence.modality,
      confidence: presence.confidence
    },
    120
  );
  if (hasText || String(ins.assistantSnippet || "").trim()) {
    reg.contextTimeline.interactions = pushBounded(
      reg.contextTimeline.interactions,
      {
        ts: now,
        entityId: eid,
        message: msg ? msg.slice(0, 160) : "",
        assistant: String(ins.assistantSnippet || "").slice(0, 180),
        stage: reg.relationships[eid].stage
      },
      180
    );
  }
  const presentIds = [eid, ...(Array.isArray(ins.castlePeers) ? ins.castlePeers.map((p) => String(p.id || "").trim()) : [])].filter(Boolean);
  const closureForEdges =
    ins.identityRecallClosure && typeof ins.identityRecallClosure === "object" ? ins.identityRecallClosure : null;
  const prevProtoQueue = Array.isArray(reg.contextTimeline.spawnEnvelopeQueue)
    ? reg.contextTimeline.spawnEnvelopeQueue
    : [];
  const phantomMassScale = computePhantomMassScale(prevProtoQueue);
  for (let i = 0; i < presentIds.length; i += 1) {
    for (let j = i + 1; j < presentIds.length; j += 1) {
      const pk = pairKey(presentIds[i], presentIds[j]);
      if (!pk) continue;
      const idA = presentIds[i];
      const idB = presentIds[j];
      const cur = reg.contextTimeline.coPresenceGraph[pk] || { count: 0, lastSeenAt: 0 };
      const nextCount = Number(cur.count || 0) + 1;
      const phantomAdd = phantomShadowAdditive(idA, idB, cur, prevProtoQueue, phantomMassScale);
      reg.contextTimeline.coPresenceGraph[pk] = computeTsgeEdgeStep({
        prev: cur,
        count: nextCount,
        entityA: idA,
        entityB: idB,
        operatorId: eid,
        relA: reg.relationships[idA],
        relB: reg.relationships[idB],
        closure: closureForEdges,
        now,
        phantomAdditive: phantomAdd
      });
    }
  }
  reg.contextTimeline.tsge = stepTsgeSingularityDiagnostics(
    reg.contextTimeline.coPresenceGraph,
    reg.contextTimeline.tsge,
    now
  );
  const seedMaxRaw = maxAbsRawForceForEntity(reg.contextTimeline.coPresenceGraph, eid);
  reg.contextTimeline.spawnEnvelopeQueue = stepProtoAgentGestationQueue(
    reg.contextTimeline.spawnEnvelopeQueue,
    {
      now,
      seedEntityId: eid,
      seedEntityClass: reg.entities[eid]?.class,
      tsge: reg.contextTimeline.tsge,
      lastMaxRawPairwiseForce: reg.contextTimeline.tsge?.lastMaxRawPairwiseForce,
      seedMaxRaw,
      routerIntent: String(ins.routerIntent || "CHAT").slice(0, 24),
      contextEvents: reg.contextTimeline.events,
      contextTimeline: reg.contextTimeline,
      gridClimate: reg.socialPhysics,
      fieldTheorySnapshot: reg.socialFieldTheory
    }
  );
  const trClamped = Math.max(0, Math.min(1, Number(ins.trust) || 0.45));
  const famClamped = Math.max(0, Math.min(1, Number(ins.familiarity) || 0.4));
  const graduated = graduateEmbryosToCognitiveThreads(
    reg.contextTimeline.spawnEnvelopeQueue,
    reg.contextTimeline.cognitiveSubThreads,
    reg.contextTimeline,
    {
      now,
      routerIntent: String(ins.routerIntent || "CHAT").slice(0, 24),
      seedMaxRaw,
      trust: trClamped,
      familiarity: famClamped,
      bondScore: (trClamped + famClamped) / 2,
      socialPhysics: reg.socialPhysics,
      fieldTheory: reg.socialFieldTheory,
      tsge: reg.contextTimeline.tsge,
      identityCoherenceHint: 0.72
    }
  );
  reg.contextTimeline.spawnEnvelopeQueue = graduated.queue;
  reg.contextTimeline.cognitiveSubThreads = graduated.cognitiveThreads;
  reg.socialPhysics = advanceSocialPhysics(reg.socialPhysics, {
    contextTimeline: reg.contextTimeline,
    relationships: reg.relationships,
    presenceTelemetry: reg.presenceTelemetry
  });
  reg.socialFieldTheory = advanceSocialFieldTheory(reg.socialFieldTheory, {
    socialPhysics: reg.socialPhysics,
    relationships: reg.relationships,
    entities: reg.entities,
    presenceTelemetry: reg.presenceTelemetry
  });
  reg.presenceTelemetry = fusePhysicsIntoPresenceTelemetry(
    reg.presenceTelemetry,
    reg.socialPhysics,
    reg.socialFieldTheory
  );

  return {
    registry: reg,
    presenceDetection: presence,
    resolvedEntity: resolved,
    introductionGuidance: introductionGuidanceForLlm(reg.introductions[eid].phase, {
      entityClass: reg.entities[eid].class,
      displayName: reg.entities[eid].displayName
    }),
    toneHint: toneHintForClass(reg.entities[eid].class),
    socialPhysics: reg.socialPhysics,
    socialFieldTheory: reg.socialFieldTheory
  };
}

/**
 * @param {string} entityClass
 */
export function toneHintForClass(entityClass) {
  const c = String(entityClass || ENTITY_CLASS.UNKNOWN);
  const map = {
    [ENTITY_CLASS.HUMAN_USER]: "personal_warm",
    [ENTITY_CLASS.HUMAN_GUEST]: "polite_explanatory",
    [ENTITY_CLASS.AI_AGENT]: "protocol_neutral",
    [ENTITY_CLASS.GHOST_PET]: "playful_symbolic",
    [ENTITY_CLASS.AMBIENT]: "no_reply",
    [ENTITY_CLASS.UNKNOWN]: "cautious_presence"
  };
  return map[c] || map[ENTITY_CLASS.UNKNOWN];
}

/**
 * @param {ReturnType<typeof ensureRegistry>} reg
 */
export function formatSocialRegistryForPrompt(reg) {
  const r = reg && typeof reg === "object" ? reg : createInitialSocialRegistry();
  const ids = Object.keys(r.entities || {}).slice(0, 8);
  if (!ids.length) {
    return "Castle Social Identity (CSIL): no resolved entities yet; treat room as occupied but identity-uncertain.";
  }
  const eventsN = Array.isArray(r.contextTimeline?.events) ? r.contextTimeline.events.length : 0;
  const interactionsN = Array.isArray(r.contextTimeline?.interactions) ? r.contextTimeline.interactions.length : 0;
  const coN = r.contextTimeline?.coPresenceGraph ? Object.keys(r.contextTimeline.coPresenceGraph).length : 0;
  const lines = [
    "Castle Social Identity (CSIL) — registry snapshot:",
    "Hard identity overrides; soft identity merges; social claims inform relationship but do not override hard ID.",
    "Trust boundary accessLevel controls response and memory writes.",
    `Temporal context: events=${eventsN} interactions=${interactionsN} coPresenceEdges=${coN}`
  ];
  const phys = r.socialPhysics && typeof r.socialPhysics === "object" ? r.socialPhysics : null;
  if (phys) {
    lines.push(
      `Social physics: phase=${phys.phase ?? "stable"} trustRegime=${phys.trustRegime ?? "observe-only"} attention=${phys.attentionDirection ?? "self_anchor"} stability=${phys.stabilityScore ?? 0} drift=${phys.driftScore ?? 0} reconcile=${phys.reconciliationNeed ?? 0}`
    );
    if (phys.quietStateProbability != null || phys.observationMode != null) {
      lines.push(
        `QPP bias field: quietP=${phys.quietStateProbability ?? 0} interactionE=${phys.interactionEnergy ?? 0} observe=${phys.observationMode ?? 0} reconcileMs=${phys.reconcileDurationMs ?? 0}`
      );
    }
  }
  const ft = r.socialFieldTheory && typeof r.socialFieldTheory === "object" ? r.socialFieldTheory : null;
  const af = ft?.attentionField && typeof ft.attentionField === "object" ? ft.attentionField : null;
  const inf = ft?.interference && typeof ft.interference === "object" ? ft.interference : null;
  if (af && inf) {
    lines.push(
      `Social field theory: attention_vector=(${af.vx ?? 0},${af.vy ?? 0}) |ρ_trust|=${ft.trustDensity?.meanRho ?? 0} interference=${inf.pattern ?? "mixed"} contrast=${inf.contrast ?? 0}`
    );
  }
  for (const id of ids) {
    const e = r.entities[id];
    const rel = r.relationships[id] || {};
    const intro = r.introductions[id] || {};
    const perm = r.permissions[id] || {};
    if (!e) continue;
    lines.push(
      `- ${id}: class=${e.class} lifecycle=${rel.identityLifecycle ?? "unknown"} stage=${rel.stage ?? "?"} intro=${intro.phase ?? "?"} name=${e.displayName || "—"} idSrc=${e.identitySource || "?"} access=${perm.accessLevel || "observe-only"}`
    );
  }
  const tel = r.presenceTelemetry || {};
  if (tel.qppLabel) {
    const nudge = tel.qppPhysicsNudge ? ` physics=${tel.qppPhysicsNudge}` : "";
    lines.push(`QPP hint: ${tel.qppLabel} (${tel.qppMode || "idle"}) stage=${tel.stage || "social_state"}${nudge}`);
  }
  return lines.join("\n");
}

