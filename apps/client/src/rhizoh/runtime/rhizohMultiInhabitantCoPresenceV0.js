/**
 * Multi-inhabitant Co-Presence v0 — pet + agent + user share one SCR now.
 * Pet = spatial anchor · Agent = RCAL subscriber · User = participant · Castle = projection surface.
 * @see docs/RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readPetCitizenV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { readCitizenProjectionV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";
import { SSL_SURFACE_ID_V0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { projectRcalCrystalTopologyV0 } from "./rhizohRcalCrystalTopologyV0.js";
import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import {
  evaluateAgentCognitionBoundaryV0,
  stampAgentBoundaryFlagsV0,
  validateCastleAgentRegistrationV0
} from "./rhizohAgentCognitionBoundaryV0.js";

export const CO_PRESENCE_SCHEMA_V0 = "castle.rhizoh.multi_inhabitant_co_presence.v0";

export const RHIZOH_CO_PRESENCE_EVENT_V0 = "rhizoh:co-presence-v0";

export const INHABITANT_KIND_V0 = Object.freeze({
  PET: "pet",
  AGENT: "agent",
  USER: "user"
});

export const INHABITANT_ROLE_V0 = Object.freeze({
  PET: "world_inhabitant_spatial_anchor",
  AGENT: "cognitive_extension_rcal_subscriber",
  USER: "interactive_observer_participant"
});

export const CO_PRESENCE_RULE_V0 = Object.freeze({
  SINGLE_WORLD: "single_world",
  SHARED_WAL: "shared_wal",
  SCR_FRAME_BOUND: "scr_frame_bound",
  NO_LOCAL_TEMPORAL_AUTHORITY: "no_local_temporal_authority"
});

/** @type {Map<string, { agent_id: string, label?: string }>} */
const agentRegistry = new Map();

/** @type {ReturnType<typeof tickMultiInhabitantCoPresenceV0> | null} */
let lastCoPresence = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{ agent_id: string, label?: string }} spec
 */
export function registerCastleAgentSubscriberV0(spec) {
  const validation = validateCastleAgentRegistrationV0(spec);
  if (!validation.ok) return false;
  const id = String(spec?.agent_id || "").trim();
  if (!id) return false;
  agentRegistry.set(id, Object.freeze({ agent_id: id, label: spec.label || id }));
  return true;
}

export function unregisterCastleAgentSubscriberV0(agentId) {
  return agentRegistry.delete(String(agentId || ""));
}

export function listCastleAgentSubscribersV0() {
  return Object.freeze([...agentRegistry.values()]);
}

/**
 * @param {ReturnType<typeof readPetCitizenV0>} pet
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 * @param {string} coherenceId
 */
function buildPetInhabitantV0(pet, frame, coherenceId) {
  if (!pet?.inhabited) return null;
  return Object.freeze({
    inhabitant_id: pet.pet_id || "pet_citizen_v0",
    kind: INHABITANT_KIND_V0.PET,
    role: INHABITANT_ROLE_V0.PET,
    spatial_anchor: true,
    owns_state: false,
    validates_scr: pet.validates_scr === true,
    coherence_id: pet.coherence_id || coherenceId,
    seq: pet.seq ?? null,
    position: pet.position || null,
    cartographic: pet.spatial?.cartographic || null
  });
}

/**
 * @param {object | null} cognitive
 * @param {ReturnType<typeof projectRcalCrystalTopologyV0>} topo
 * @param {string} coherenceId
 */
function buildAgentInhabitantsV0(cognitive, topo, coherenceId) {
  /** @type {object[]} */
  const out = [];

  const inertia = cognitive?.attention_inertia;
  if (inertia) {
    out.push(
      stampAgentBoundaryFlagsV0(
        Object.freeze({
          inhabitant_id: "agent_rcal_primary_v0",
          kind: INHABITANT_KIND_V0.AGENT,
          role: INHABITANT_ROLE_V0.AGENT,
          rcal_subscriber: true,
          coherence_id: coherenceId,
          experiential_now_id: inertia.ccf?.experiential_now_id || null,
          focus_intensity01: Number(
            topo?.nodes?.find((n) => n.id === "focus_lock")?.intensity01 ?? 0
          )
        })
      )
    );
  }

  for (const reg of agentRegistry.values()) {
    out.push(
      stampAgentBoundaryFlagsV0(
        Object.freeze({
          inhabitant_id: reg.agent_id,
          kind: INHABITANT_KIND_V0.AGENT,
          role: INHABITANT_ROLE_V0.AGENT,
          rcal_subscriber: true,
          coherence_id: coherenceId,
          label: reg.label || reg.agent_id
        })
      )
    );
  }

  return Object.freeze(out);
}

/**
 * @param {object | null} presence
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 * @param {string} coherenceId
 */
function buildUserInhabitantV0(presence, frame, coherenceId) {
  const present =
    presence?.rhizoh_is_present !== false && frame?.temporalPhase !== "absent";
  return Object.freeze({
    inhabitant_id: "user_participant_v0",
    kind: INHABITANT_KIND_V0.USER,
    role: INHABITANT_ROLE_V0.USER,
    participant: true,
    owns_state: false,
    present,
    coherence_id: coherenceId,
    attention: presence?.rhizoh_attention || null
  });
}

/**
 * @param {object[]} inhabitants
 * @param {string} expectedCoherenceId
 * @param {ReturnType<typeof readCastleProjectionV0>} castle
 */
export function evaluateCoPresenceRulesV0(inhabitants, expectedCoherenceId, castle) {
  /** @type {object[]} */
  const violations = [];

  if (castle && castle.single_world !== true) {
    violations.push({ code: "castle_not_single_world", rule: CO_PRESENCE_RULE_V0.SINGLE_WORLD });
  }
  if (castle && castle.shared_wal !== true) {
    violations.push({ code: "castle_wal_not_shared", rule: CO_PRESENCE_RULE_V0.SHARED_WAL });
  }

  for (const inh of inhabitants) {
    if (inh.owns_state === true) {
      violations.push({
        code: "inhabitant_owns_state",
        rule: CO_PRESENCE_RULE_V0.NO_LOCAL_TEMPORAL_AUTHORITY,
        inhabitant_id: inh.inhabitant_id
      });
    }
    if (inh.wal_authority === true) {
      violations.push({
        code: "inhabitant_wal_authority",
        rule: CO_PRESENCE_RULE_V0.SHARED_WAL,
        inhabitant_id: inh.inhabitant_id
      });
    }
    if (
      expectedCoherenceId &&
      inh.coherence_id &&
      String(inh.coherence_id) !== String(expectedCoherenceId)
    ) {
      violations.push({
        code: "coherence_drift",
        rule: CO_PRESENCE_RULE_V0.SCR_FRAME_BOUND,
        inhabitant_id: inh.inhabitant_id,
        expected: expectedCoherenceId,
        actual: inh.coherence_id
      });
    }
  }

  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations)
  });
}

/**
 * @param {{
 *   frame?: ReturnType<typeof readLastT0PresenceFrameV0>,
 *   cognitive?: object | null,
 *   presence?: object | null
 * }} [ctx]
 */
export function tickMultiInhabitantCoPresenceV0(ctx = {}) {
  const rh = readRhizohV0();
  const frame = ctx.frame || rh.presenceFrame || readLastT0PresenceFrameV0();
  const cognitive = ctx.cognitive ?? rh.cognitiveAttention ?? null;
  const presence = ctx.presence ?? rh.presenceState ?? null;
  const petProjection = readCitizenProjectionV0(SSL_SURFACE_ID_V0.PET);
  const castle = readCastleProjectionV0();

  const coherenceId =
    frame?.coherenceId ||
    petProjection?.coherence_id ||
    castle?.coherence_id ||
    rh.worldEpisode?.coherence_id ||
    "none";

  const pet = readPetCitizenV0();
  const topo = rh.rcalCrystalTopology || projectRcalCrystalTopologyV0(cognitive);

  const petInh = buildPetInhabitantV0(pet, frame, coherenceId);
  const agents = buildAgentInhabitantsV0(cognitive, topo, coherenceId);
  const user = buildUserInhabitantV0(presence, frame, coherenceId);

  /** @type {object[]} */
  const inhabitants = [];
  if (petInh) inhabitants.push(petInh);
  inhabitants.push(...agents);
  inhabitants.push(user);

  const rules = evaluateCoPresenceRulesV0(inhabitants, coherenceId, castle);
  const agentBoundary = evaluateAgentCognitionBoundaryV0(
    inhabitants.filter((i) => i.kind === INHABITANT_KIND_V0.AGENT)
  );

  /** @type {object[]} */
  const allViolations = [...rules.violations];
  if (!agentBoundary.ok) {
    allViolations.push(
      ...agentBoundary.violations.map((v) =>
        Object.freeze({ ...v, rule: "agent_cognition_boundary" })
      )
    );
  }

  const field = Object.freeze({
    schema: CO_PRESENCE_SCHEMA_V0,
    atMs: Number(frame?.masterNowMs) || Date.now(),
    coherence_id: coherenceId,
    castle_node_id: castle?.castle_node_id || null,
    world_identity_id: castle?.world_identity_id || rh.worldIdentity?.world_identity_id || null,
    rules: Object.freeze({
      [CO_PRESENCE_RULE_V0.SINGLE_WORLD]: castle?.single_world !== false,
      [CO_PRESENCE_RULE_V0.SHARED_WAL]: castle?.shared_wal !== false,
      [CO_PRESENCE_RULE_V0.SCR_FRAME_BOUND]: rules.ok,
      [CO_PRESENCE_RULE_V0.NO_LOCAL_TEMPORAL_AUTHORITY]: !inhabitants.some(
        (i) => i.owns_state === true || i.wal_authority === true
      ),
      agent_interpret_only: agentBoundary.ok === true
    }),
    agent_boundary: agentBoundary,
    inhabitants: Object.freeze(inhabitants),
    inhabitant_count: inhabitants.length,
    pet_present: petInh != null,
    agent_count: agents.length,
    user_present: user.present === true,
    violations: Object.freeze(allViolations),
    ok: rules.ok && agentBoundary.ok
  });

  lastCoPresence = field;
  publishCoPresenceV0(field);
  return field;
}

/**
 * @param {ReturnType<typeof tickMultiInhabitantCoPresenceV0>} field
 */
function publishCoPresenceV0(field) {
  if (typeof window === "undefined" || !field) return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.coPresence = field;
  window.__rhizoh.multiInhabitantCoPresence = field;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_CO_PRESENCE_EVENT_V0, {
        detail: Object.freeze({ field })
      })
    );
  } catch {
    /* noop */
  }
}

export function readMultiInhabitantCoPresenceV0() {
  return (
    lastCoPresence ||
    (typeof window !== "undefined" ? window.__rhizoh?.coPresence : null) ||
    null
  );
}

export function resetRhizohCoPresenceForTestV0() {
  lastCoPresence = null;
  agentRegistry.clear();
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.coPresence;
    delete window.__rhizoh.multiInhabitantCoPresence;
  }
}
