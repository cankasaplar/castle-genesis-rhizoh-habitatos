/**
 * Castle Session Entity Behavior v1 — silent local behavior only.
 *
 * Fox / Companion are not chatbots and not media participants. They are local
 * spatial entities whose posture reacts to camera, conversation intensity,
 * spatial density, and memory triggers.
 */

export const CASTLE_SESSION_ENTITY_BEHAVIOR_SCHEMA_V1 = "castle.session_entity_behavior.v1";
export const CASTLE_SESSION_ENTITY_LAYER_SCHEMA_V1 = "castle.session_entity_layer.v1";

export const CASTLE_SESSION_ENTITY_KIND_V1 = Object.freeze({
  FOX: "fox",
  COMPANION: "companion",
  GHOST: "ghost"
});

export const CASTLE_SESSION_BEHAVIOR_STATE_V1 = Object.freeze({
  IDLE: "idle",
  OBSERVING: "observing",
  FOLLOWING: "following",
  REACTING: "reacting",
  DRIFTING: "drifting"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function slugV1(value, fallback = "entity") {
  const s = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || fallback;
}

function normalizeSignalsV1(signals = {}) {
  return Object.freeze({
    cameraMotion01: clamp01(signals.cameraMotion01),
    conversationIntensity01: clamp01(signals.conversationIntensity01),
    spatialEventDensity01: clamp01(signals.spatialEventDensity01),
    memoryTrigger: signals.memoryTrigger === true,
    silence01: clamp01(signals.silence01)
  });
}

function resolveStateV1(signals) {
  if (signals.memoryTrigger) return CASTLE_SESSION_BEHAVIOR_STATE_V1.REACTING;
  if (signals.conversationIntensity01 >= 0.72) return CASTLE_SESSION_BEHAVIOR_STATE_V1.FOLLOWING;
  if (signals.spatialEventDensity01 >= 0.48) return CASTLE_SESSION_BEHAVIOR_STATE_V1.OBSERVING;
  if (signals.silence01 >= 0.72 || signals.cameraMotion01 >= 0.64) {
    return CASTLE_SESSION_BEHAVIOR_STATE_V1.DRIFTING;
  }
  return CASTLE_SESSION_BEHAVIOR_STATE_V1.IDLE;
}

function behaviorForStateV1(kind, state, signals) {
  const fox = kind === CASTLE_SESSION_ENTITY_KIND_V1.FOX;
  const companion = kind === CASTLE_SESSION_ENTITY_KIND_V1.COMPANION;
  const intensity = signals.conversationIntensity01;
  const density = signals.spatialEventDensity01;

  if (state === CASTLE_SESSION_BEHAVIOR_STATE_V1.REACTING) {
    return Object.freeze({
      animationState: "react",
      gazeDirection: "memory_event",
      proximityShift: companion ? "near_user" : "pause_observe",
      positionDelta: Object.freeze({ forward01: companion ? 0.34 : 0.08, lateral01: fox ? 0.18 : 0.04, vertical01: 0.08 }),
      glow01: Math.max(0.55, Math.min(1, 0.5 + intensity * 0.35 + density * 0.25))
    });
  }

  if (state === CASTLE_SESSION_BEHAVIOR_STATE_V1.FOLLOWING) {
    return Object.freeze({
      animationState: "follow",
      gazeDirection: companion ? "user_focus" : "peer_castle",
      proximityShift: companion ? "near_user" : "near_session_edge",
      positionDelta: Object.freeze({ forward01: 0.22 + intensity * 0.18, lateral01: fox ? 0.12 : 0.02, vertical01: 0.02 }),
      glow01: 0.32 + intensity * 0.28
    });
  }

  if (state === CASTLE_SESSION_BEHAVIOR_STATE_V1.OBSERVING) {
    return Object.freeze({
      animationState: "observe",
      gazeDirection: fox ? "camera_field" : "attention_target",
      proximityShift: "hold",
      positionDelta: Object.freeze({ forward01: 0.06, lateral01: density * 0.12, vertical01: 0.01 }),
      glow01: 0.22 + density * 0.22
    });
  }

  if (state === CASTLE_SESSION_BEHAVIOR_STATE_V1.DRIFTING) {
    return Object.freeze({
      animationState: "drift",
      gazeDirection: "horizon",
      proximityShift: "far",
      positionDelta: Object.freeze({ forward01: -0.12, lateral01: 0.1 + signals.cameraMotion01 * 0.12, vertical01: 0.03 }),
      glow01: 0.16
    });
  }

  return Object.freeze({
    animationState: "idle",
    gazeDirection: fox ? "session_field" : "user",
    proximityShift: "hold",
    positionDelta: Object.freeze({ forward01: 0, lateral01: 0, vertical01: 0 }),
    glow01: 0.18
  });
}

function buildBehaviorV1(kind, signals) {
  const normalized = normalizeSignalsV1(signals);
  const state = resolveStateV1(normalized);
  const behavior = behaviorForStateV1(kind, state, normalized);
  return Object.freeze({
    schema: CASTLE_SESSION_ENTITY_BEHAVIOR_SCHEMA_V1,
    kind,
    state,
    silent: true,
    mediaParticipant: false,
    canSpeakAsPrimary: false,
    inputs: normalized,
    output: behavior
  });
}

export function buildFoxBehaviorModelV1(signals = {}) {
  return buildBehaviorV1(CASTLE_SESSION_ENTITY_KIND_V1.FOX, signals);
}

export function buildCompanionBehaviorModelV1(signals = {}) {
  return buildBehaviorV1(CASTLE_SESSION_ENTITY_KIND_V1.COMPANION, signals);
}

export function buildGhostBehaviorModelV1(signals = {}) {
  const base = buildBehaviorV1(CASTLE_SESSION_ENTITY_KIND_V1.GHOST, {
    ...signals,
    memoryTrigger: signals.memoryTrigger === true
  });
  return Object.freeze({
    ...base,
    state: signals.memoryTrigger === true ? CASTLE_SESSION_BEHAVIOR_STATE_V1.REACTING : base.state,
    output: Object.freeze({
      ...base.output,
      animationState: signals.memoryTrigger === true ? "echo" : base.output.animationState,
      gazeDirection: signals.memoryTrigger === true ? "memory_trace" : base.output.gazeDirection,
      proximityShift: "non_interactive"
    })
  });
}

/**
 * @param {{
 *   castleId: string,
 *   entityKind: string,
 *   label?: string,
 *   binding?: "user_bound" | "observer_bound" | "memory_bound",
 *   signals?: object
 * }} input
 */
export function buildCastleSessionEntityInstanceV1(input = {}) {
  const castleId = String(input.castleId || "local_castle").trim();
  const entityKind = String(input.entityKind || CASTLE_SESSION_ENTITY_KIND_V1.FOX);
  const behavior =
    entityKind === CASTLE_SESSION_ENTITY_KIND_V1.COMPANION
      ? buildCompanionBehaviorModelV1(input.signals)
      : entityKind === CASTLE_SESSION_ENTITY_KIND_V1.GHOST
        ? buildGhostBehaviorModelV1(input.signals)
        : buildFoxBehaviorModelV1(input.signals);

  return Object.freeze({
    schema: CASTLE_SESSION_ENTITY_BEHAVIOR_SCHEMA_V1,
    instanceId: `${slugV1(castleId, "castle")}:${slugV1(entityKind, "entity")}`,
    castleId,
    entityKind,
    label: String(input.label || entityKind),
    binding: String(input.binding || (entityKind === "companion" ? "user_bound" : "observer_bound")),
    localOnly: true,
    globalSingleton: false,
    mediaParticipant: false,
    canSpeakAsPrimary: false,
    behavior
  });
}

/**
 * @param {{ hostCastleId?: string, peerCastleId?: string | null, signals?: object }} input
 */
export function buildDefaultCastleSessionEntityLayerV1(input = {}) {
  const hostCastleId = String(input.hostCastleId || "local_castle");
  const peerCastleId = input.peerCastleId ? String(input.peerCastleId) : null;
  const signals = input.signals || {};
  const localEntities = [
    buildCastleSessionEntityInstanceV1({
      castleId: hostCastleId,
      entityKind: CASTLE_SESSION_ENTITY_KIND_V1.COMPANION,
      label: "Companion",
      binding: "user_bound",
      signals
    }),
    buildCastleSessionEntityInstanceV1({
      castleId: peerCastleId || hostCastleId,
      entityKind: CASTLE_SESSION_ENTITY_KIND_V1.FOX,
      label: "Fox",
      binding: "observer_bound",
      signals
    }),
    buildCastleSessionEntityInstanceV1({
      castleId: hostCastleId,
      entityKind: CASTLE_SESSION_ENTITY_KIND_V1.GHOST,
      label: "Ghost",
      binding: "memory_bound",
      signals
    })
  ];

  return Object.freeze({
    schema: CASTLE_SESSION_ENTITY_LAYER_SCHEMA_V1,
    model: "local_behavior_entities",
    rule: "ai_does_not_speak_space_behaves",
    localEntities: Object.freeze(localEntities),
    readOnly: true
  });
}
