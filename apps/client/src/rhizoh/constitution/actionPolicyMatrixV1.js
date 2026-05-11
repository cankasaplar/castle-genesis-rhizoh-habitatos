/**
 * RHIZOH ActionPolicyMatrix v1 — constitutional membrane (identity / cost / audit / reversal).
 * Not legal advice; encodes product invariants for enforcement layers (KernelGuard, gateway, audit).
 *
 * Semantic kind → row; each kernel action maps to exactly one semantic kind (default: create).
 */

/** @typedef {'ghost' | 'trusted' | 'verified' | 'sovereign_verified'} RhizohIdentityFloor */
/** @typedef {'light' | 'standard' | 'full' | 'sovereign'} RhizohAuditFloor */
/** @typedef {'best_effort' | 'session_bound' | 'compensated' | 'governance_arbitration' | 'irreversible'} RhizohReversalPolicy */

/**
 * @typedef {'observe' | 'speak' | 'create' | 'delegate_agent' | 'economic_action' | 'governance_vote' | 'high_impact_act'} RhizohSemanticActionKind
 */

/**
 * @typedef {{
 *   identityFloor: RhizohIdentityFloor,
 *   costFloor: number,
 *   auditFloor: RhizohAuditFloor,
 *   reversalPolicy: RhizohReversalPolicy
 * }} RhizohActionPolicyRow
 */

export const RHIZOH_ACTION_POLICY_VERSION = "1.0.0";

/** Ordered strata for comparison (higher index = stronger verification required). */
export const RHIZOH_IDENTITY_FLOOR_RANK = Object.freeze(
  /** @type {Record<RhizohIdentityFloor, number>} */ ({
    ghost: 0,
    trusted: 1,
    verified: 2,
    sovereign_verified: 3
  })
);

/**
 * Single constitution table: semantic action class → membrane row.
 * identity_floor is the minimum actor stratum required to perform any kernel action of that class.
 */
export const RHIZOH_ACTION_POLICY_MATRIX_V1 = Object.freeze(
  /** @type {Record<RhizohSemanticActionKind, Readonly<RhizohActionPolicyRow>>} */ ({
    observe: Object.freeze({
      identityFloor: "ghost",
      costFloor: 0,
      auditFloor: "light",
      reversalPolicy: "best_effort"
    }),
    speak: Object.freeze({
      identityFloor: "ghost",
      costFloor: 0.02,
      auditFloor: "light",
      reversalPolicy: "best_effort"
    }),
    create: Object.freeze({
      identityFloor: "trusted",
      costFloor: 0.2,
      auditFloor: "standard",
      reversalPolicy: "session_bound"
    }),
    delegate_agent: Object.freeze({
      identityFloor: "trusted",
      costFloor: 0.28,
      auditFloor: "standard",
      reversalPolicy: "session_bound"
    }),
    economic_action: Object.freeze({
      identityFloor: "verified",
      costFloor: 0.55,
      auditFloor: "full",
      reversalPolicy: "compensated"
    }),
    governance_vote: Object.freeze({
      identityFloor: "verified",
      costFloor: 0.48,
      auditFloor: "full",
      reversalPolicy: "governance_arbitration"
    }),
    high_impact_act: Object.freeze({
      identityFloor: "sovereign_verified",
      costFloor: 0.92,
      auditFloor: "sovereign",
      reversalPolicy: "irreversible"
    })
  })
);

/** Every `KernelActionId` in rskOntology v0.9.9 must appear here (or fall back to `create`). */
export const RHIZOH_KERNEL_ACTION_SEMANTIC_KIND_V1 = Object.freeze(
  /** @type {Record<string, RhizohSemanticActionKind>} */ ({
    "sim.observe.run": "observe",
    "sim.shadow.run": "observe",
    "presence.agent.observe": "observe",
    "presence.agent.listen": "observe",
    "presence.pet.observe": "observe",

    "presence.avatar.speak.start": "speak",
    "presence.avatar.speak.stop": "speak",
    "presence.avatar.emote": "speak",
    "presence.avatar.react": "speak",
    "presence.avatar.raise_hand": "speak",

    "sim.draft.run": "create",
    "sim.sim.run": "create",
    "registry.mind.definition.register": "create",
    "registry.mind.instance.spawn": "create",
    "registry.mind.instance.upsert": "create",
    "registry.mind.tick": "create",
    "registry.link.attach": "create",
    "registry.soulMind.bind": "create",
    "registry.ghost.register": "create",
    "registry.memoryProfile.register": "create",
    "registry.entity.register": "create",
    "registry.spiral.upsert": "create",
    "registry.soul.entity.link": "create",
    "presence.avatar.bind": "create",
    "presence.avatar.spawn": "create",
    "presence.avatar.move": "create",
    "presence.avatar.zone.enter": "create",
    "presence.avatar.zone.leave": "create",
    "presence.avatar.zone.transition": "create",
    "presence.room.create": "create",
    "presence.room.join": "create",
    "presence.room.leave": "create",
    "presence.broadcast.create": "create",
    "presence.broadcast.join": "create",
    "presence.broadcast.leave": "create",
    "presence.pet.spawn": "create",
    "presence.pet.follow": "create",
    "presence.pet.react": "create",
    "presence.pet.depart": "create",
    "presence.avatar.pet.summon": "create",
    "world.avatar.region.enter": "create",
    "world.avatar.region.leave": "create",
    "world.chunk.activate": "create",
    "world.chunk.deactivate": "create",
    "presence.broadcast.segment.open": "create",
    "presence.broadcast.segment.close": "create",
    "presence.broadcast.overlay.push": "create",
    "presence.broadcast.overlay.remove": "create",
    "presence.broadcast.clip.mark": "create",
    "presence.broadcast.scene.set": "create",
    "presence.broadcast.camera.focus": "create",
    "presence.broadcast.camera.follow": "create",
    "presence.broadcast.camera.cut": "create",
    "presence.broadcast.audience.wave": "create",
    "presence.broadcast.audience.applause": "create",
    "presence.broadcast.audience.cheer": "create",
    "presence.broadcast.audience.emojiRain": "create",

    "presence.avatar.agent.invoke": "delegate_agent",
    "presence.agent.spawn": "delegate_agent",
    "presence.agent.follow": "delegate_agent",
    "presence.agent.respond": "delegate_agent",
    "presence.agent.depart": "delegate_agent",

    "registry.tool.register": "economic_action",
    "ops.entity.spawn": "economic_action",

    "presence.role.assign": "governance_vote",
    "presence.role.revoke": "governance_vote",
    "presence.stage.pin": "governance_vote",
    "presence.stage.invite": "governance_vote",
    "presence.moderate.mute": "governance_vote",
    "presence.broadcast.start": "governance_vote",
    "presence.broadcast.pause": "governance_vote",
    "presence.broadcast.resume": "governance_vote",
    "presence.broadcast.stop": "governance_vote",
    "presence.broadcast.spotlight.assign": "governance_vote",
    "presence.broadcast.spotlight.release": "governance_vote",

    "sim.shadow.execute": "high_impact_act",
    "registry.policy.register": "high_impact_act",
    "registry.soul.register": "high_impact_act",
    "world.portal.cross": "high_impact_act",
    "presence.moderate.kick": "high_impact_act",
    "physics.entity.move.apply": "high_impact_act"
  })
);

/** Canonical ordered list (parity check vs ontology). */
export const RHIZOH_KERNEL_ACTION_IDS_V1 = Object.freeze(
  /** @type {readonly string[]} */ (Object.keys(RHIZOH_KERNEL_ACTION_SEMANTIC_KIND_V1).sort())
);

/**
 * @param {RhizohIdentityFloor | string | null | undefined} actor
 * @param {RhizohIdentityFloor} required
 */
export function rhizohIdentityFloorMeets(actor, required) {
  const a = String(actor || "ghost");
  const r = String(required);
  const ar = RHIZOH_IDENTITY_FLOOR_RANK[/** @type {RhizohIdentityFloor} */ (a)];
  const rr = RHIZOH_IDENTITY_FLOOR_RANK[/** @type {RhizohIdentityFloor} */ (r)];
  if (typeof ar !== "number" || typeof rr !== "number") return false;
  return ar >= rr;
}

/**
 * @param {string} kernelActionId
 * @returns {RhizohSemanticActionKind}
 */
export function getRhizohSemanticKindForKernelAction(kernelActionId) {
  const id = String(kernelActionId || "");
  const k = RHIZOH_KERNEL_ACTION_SEMANTIC_KIND_V1[id];
  return k || "create";
}

/**
 * @param {RhizohSemanticActionKind} kind
 * @returns {Readonly<RhizohActionPolicyRow>}
 */
export function getRhizohPolicyRowForSemanticKind(kind) {
  const row = RHIZOH_ACTION_POLICY_MATRIX_V1[kind];
  return row || RHIZOH_ACTION_POLICY_MATRIX_V1.create;
}

/**
 * @param {string} kernelActionId
 */
export function getRhizohPolicyEnvelopeForKernelAction(kernelActionId) {
  const semanticKind = getRhizohSemanticKindForKernelAction(kernelActionId);
  const row = getRhizohPolicyRowForSemanticKind(semanticKind);
  return { semanticKind, ...row };
}

/**
 * Membrane gate: actor stratum must dominate required identity floor for this action.
 * @param {string} kernelActionId
 * @param {RhizohIdentityFloor | string | null | undefined} actorFloor
 * @returns {{ ok: true, policy: ReturnType<typeof getRhizohPolicyEnvelopeForKernelAction> } | { ok: false, error: string, policy: ReturnType<typeof getRhizohPolicyEnvelopeForKernelAction> }}
 */
export function evaluateRhizohMembraneGate(kernelActionId, actorFloor) {
  const policy = getRhizohPolicyEnvelopeForKernelAction(kernelActionId);
  if (!rhizohIdentityFloorMeets(actorFloor, policy.identityFloor)) {
    return { ok: false, error: "membrane_identity_floor", policy };
  }
  return { ok: true, policy };
}
