import type {
  IdentityState,
  KernelGuardRunInput,
  KernelGuardRunResult,
  KernelActionId
} from "../types/rskOntology.js";
import { PRESENCE_ZONE_IDS } from "../lib/presenceRoomZones";
import { isPresenceRole } from "../lib/presenceRoles";
import { identityAllowsAction } from "./permissionResolver";
import { evaluateRhizohMembraneGate } from "../../rhizoh/constitution/actionPolicyMatrixV1.js";
import { isValidCompanionArchetypeV1 } from "./companionAgentRegistryV1.js";

function isPresenceZoneId(v: unknown): v is string {
  return typeof v === "string" && (PRESENCE_ZONE_IDS as readonly string[]).includes(v);
}

const AUDIT_CAP = 400;
const auditTrail: Array<{
  auditId: string;
  action: string;
  allowed: boolean;
  ownerId: string | null;
  actorKind: string | null;
  ts: number;
}> = [];

function newAuditId(): string {
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function authorize(identity: IdentityState, action: string): { ok: true } | { ok: false; error: string } {
  if (
    !identity.ownerId &&
    (action.startsWith("registry.") ||
      action.startsWith("ops.") ||
      action.startsWith("physics.") ||
      action.startsWith("presence.") ||
      action.startsWith("world."))
  ) {
    return { ok: false, error: "no_owner_session" };
  }
  const membraneFloor = identity.rhizohMembraneFloor;
  if (membraneFloor != null && String(membraneFloor).length > 0) {
    const gate = evaluateRhizohMembraneGate(action, membraneFloor);
    if (!gate.ok) return { ok: false, error: gate.error };
  }
  if (!identityAllowsAction(identity.permissions, action)) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}

function validate(action: string, payload: unknown): { ok: true } | { ok: false; error: string } {
  if (action.startsWith("sim.")) {
    if (action === "sim.shadow.execute") {
      if (payload === undefined || payload === null || typeof payload !== "object") {
        return { ok: false, error: "payload_invalid" };
      }
      const p = payload as Record<string, unknown>;
      if (typeof p.mindInstanceId !== "string" || !String(p.mindInstanceId).trim()) {
        return { ok: false, error: "mindInstanceId_required" };
      }
      return { ok: true };
    }
    if (payload === undefined || payload === null) return { ok: true };
    if (typeof payload === "object") return { ok: true };
    return { ok: false, error: "payload_invalid" };
  }
  if (action.startsWith("world.")) {
    if (payload == null || typeof payload !== "object") return { ok: false, error: "payload_object_required" };
    const wp = payload as Record<string, unknown>;
    const needAvatarRoomRegion = (px: Record<string, unknown>) => {
      if (typeof px.avatarUid !== "string" || !String(px.avatarUid).trim()) return { ok: false as const, error: "avatarUid_required" };
      if (typeof px.roomUid !== "string" || !String(px.roomUid).trim()) return { ok: false as const, error: "roomUid_required" };
      if (typeof px.regionUid !== "string" || !String(px.regionUid).trim()) return { ok: false as const, error: "regionUid_required" };
      if (typeof px.x !== "number" || !Number.isFinite(px.x)) return { ok: false as const, error: "x_required" };
      if (typeof px.z !== "number" || !Number.isFinite(px.z)) return { ok: false as const, error: "z_required" };
      return { ok: true as const };
    };
    if (action === "world.avatar.region.leave" || action === "world.avatar.region.enter") {
      const v = needAvatarRoomRegion(wp);
      if (!v.ok) return v;
      return { ok: true };
    }
    if (action === "world.portal.cross") {
      if (typeof wp.avatarUid !== "string" || !String(wp.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
      if (typeof wp.roomUid !== "string" || !String(wp.roomUid).trim()) return { ok: false, error: "roomUid_required" };
      if (typeof wp.x !== "number" || !Number.isFinite(wp.x)) return { ok: false, error: "x_required" };
      if (typeof wp.z !== "number" || !Number.isFinite(wp.z)) return { ok: false, error: "z_required" };
      if (typeof wp.fromRegionUid !== "string" || !String(wp.fromRegionUid).trim()) {
        return { ok: false, error: "fromRegionUid_required" };
      }
      if (typeof wp.toRegionUid !== "string" || !String(wp.toRegionUid).trim()) {
        return { ok: false, error: "toRegionUid_required" };
      }
      if (typeof wp.portalEdgeUid !== "string" || !String(wp.portalEdgeUid).trim()) {
        return { ok: false, error: "portalEdgeUid_required" };
      }
      return { ok: true };
    }
    if (action === "world.chunk.activate" || action === "world.chunk.deactivate") {
      if (typeof wp.regionUid !== "string" || !String(wp.regionUid).trim()) return { ok: false, error: "regionUid_required" };
      return { ok: true };
    }
    return { ok: false, error: "unknown_world_action" };
  }
  if (payload == null || typeof payload !== "object") {
    return { ok: false, error: "payload_object_required" };
  }
  const p = payload as Record<string, unknown>;
  if (action === "registry.mind.tick") {
    if (typeof p.instanceId !== "string" || !String(p.instanceId).trim()) {
      return { ok: false, error: "instanceId_required" };
    }
    return { ok: true };
  }
  if (action === "presence.avatar.bind") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.linkedEntityUid !== "string" || !String(p.linkedEntityUid).trim()) {
      return { ok: false, error: "linkedEntityUid_required" };
    }
    if (p.soulUid !== undefined && p.soulUid !== null && typeof p.soulUid !== "string") {
      return { ok: false, error: "soulUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.avatar.emote") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.emoteId !== "string" || !String(p.emoteId).trim()) return { ok: false, error: "emoteId_required" };
    return { ok: true };
  }
  if (action === "presence.avatar.spawn") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (!isPresenceZoneId(p.zoneId)) return { ok: false, error: "zoneId_invalid" };
    if (!isPresenceRole(p.role)) return { ok: false, error: "role_invalid" };
    for (const axis of ["x", "y", "z", "rotY"] as const) {
      const v = p[axis];
      if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false, error: `${axis}_required` };
    }
    if (p.status !== undefined) {
      const st = p.status;
      if (
        st !== "quiet" &&
        st !== "talking" &&
        st !== "broadcasting" &&
        st !== "watching" &&
        st !== "away"
      ) {
        return { ok: false, error: "status_invalid" };
      }
    }
    return { ok: true };
  }
  if (action === "presence.avatar.move") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    const pos = p.pos;
    if (pos == null || typeof pos !== "object") return { ok: false, error: "pos_required" };
    const o = pos as Record<string, unknown>;
    for (const axis of ["x", "y", "z"] as const) {
      const v = o[axis];
      if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false, error: `pos_${axis}_invalid` };
    }
    if (p.rotY !== undefined && (typeof p.rotY !== "number" || !Number.isFinite(p.rotY))) {
      return { ok: false, error: "rotY_invalid" };
    }
    if (p.status !== undefined) {
      const st = p.status;
      if (
        st !== "quiet" &&
        st !== "talking" &&
        st !== "broadcasting" &&
        st !== "watching" &&
        st !== "away"
      ) {
        return { ok: false, error: "status_invalid" };
      }
    }
    return { ok: true };
  }
  if (action === "presence.avatar.zone.enter" || action === "presence.avatar.zone.leave") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (!isPresenceZoneId(p.zoneId)) return { ok: false, error: "zoneId_invalid" };
    return { ok: true };
  }
  if (action === "presence.avatar.zone.transition") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (p.fromZoneId !== undefined && !isPresenceZoneId(p.fromZoneId)) return { ok: false, error: "fromZoneId_invalid" };
    if (!isPresenceZoneId(p.toZoneId)) return { ok: false, error: "toZoneId_invalid" };
    return { ok: true };
  }
  if (action === "presence.role.assign") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.targetAvatarUid !== "string" || !String(p.targetAvatarUid).trim()) {
      return { ok: false, error: "targetAvatarUid_required" };
    }
    if (!isPresenceRole(p.role)) return { ok: false, error: "role_invalid" };
    if (p.assignedByAvatarUid !== undefined && (typeof p.assignedByAvatarUid !== "string" || !String(p.assignedByAvatarUid).trim())) {
      return { ok: false, error: "assignedByAvatarUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.role.revoke") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.targetAvatarUid !== "string" || !String(p.targetAvatarUid).trim()) {
      return { ok: false, error: "targetAvatarUid_required" };
    }
    if (p.actorAvatarUid !== undefined && (typeof p.actorAvatarUid !== "string" || !String(p.actorAvatarUid).trim())) {
      return { ok: false, error: "actorAvatarUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.moderate.kick") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.targetAvatarUid !== "string" || !String(p.targetAvatarUid).trim()) {
      return { ok: false, error: "targetAvatarUid_required" };
    }
    if (p.actorAvatarUid !== undefined && (typeof p.actorAvatarUid !== "string" || !String(p.actorAvatarUid).trim())) {
      return { ok: false, error: "actorAvatarUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.moderate.mute") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.targetAvatarUid !== "string" || !String(p.targetAvatarUid).trim()) {
      return { ok: false, error: "targetAvatarUid_required" };
    }
    if (typeof p.muted !== "boolean") return { ok: false, error: "muted_required" };
    if (p.actorAvatarUid !== undefined && (typeof p.actorAvatarUid !== "string" || !String(p.actorAvatarUid).trim())) {
      return { ok: false, error: "actorAvatarUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.stage.pin") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.actorAvatarUid !== "string" || !String(p.actorAvatarUid).trim()) {
      return { ok: false, error: "actorAvatarUid_required" };
    }
    if (typeof p.summary !== "string" || !String(p.summary).trim()) return { ok: false, error: "summary_required" };
    return { ok: true };
  }
  if (action === "presence.stage.invite") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.fromAvatarUid !== "string" || !String(p.fromAvatarUid).trim()) {
      return { ok: false, error: "fromAvatarUid_required" };
    }
    if (typeof p.toAvatarUid !== "string" || !String(p.toAvatarUid).trim()) {
      return { ok: false, error: "toAvatarUid_required" };
    }
    return { ok: true };
  }
  if (action === "presence.avatar.speak.start" || action === "presence.avatar.speak.stop") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    return { ok: true };
  }
  if (action === "presence.avatar.react") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.kind !== "string" || !String(p.kind).trim()) return { ok: false, error: "kind_required" };
    return { ok: true };
  }
  if (action === "presence.avatar.raise_hand") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.raised !== "boolean") return { ok: false, error: "raised_required" };
    return { ok: true };
  }
  if (action === "presence.avatar.pet.summon") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.petUid !== "string" || !String(p.petUid).trim()) return { ok: false, error: "petUid_required" };
    return { ok: true };
  }
  if (action === "presence.avatar.agent.invoke") {
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    if (typeof p.agentUid !== "string" || !String(p.agentUid).trim()) return { ok: false, error: "agentUid_required" };
    if (p.intent !== undefined && (typeof p.intent !== "string" || !String(p.intent).trim())) {
      return { ok: false, error: "intent_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.agent.spawn") {
    if (typeof p.agentUid !== "string" || !String(p.agentUid).trim()) return { ok: false, error: "agentUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.ownerAvatarUid !== "string" || !String(p.ownerAvatarUid).trim()) {
      return { ok: false, error: "ownerAvatarUid_required" };
    }
    if (!isValidCompanionArchetypeV1(p.archetype)) return { ok: false, error: "archetype_invalid" };
    return { ok: true };
  }
  if (action === "presence.agent.listen") {
    if (typeof p.agentUid !== "string" || !String(p.agentUid).trim()) return { ok: false, error: "agentUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.ownerAvatarUid !== "string" || !String(p.ownerAvatarUid).trim()) {
      return { ok: false, error: "ownerAvatarUid_required" };
    }
    if (
      p.attentionTargetUid !== undefined &&
      (typeof p.attentionTargetUid !== "string" || !String(p.attentionTargetUid).trim())
    ) {
      return { ok: false, error: "attentionTargetUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.agent.respond") {
    if (typeof p.agentUid !== "string" || !String(p.agentUid).trim()) return { ok: false, error: "agentUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.summary !== "string" || !String(p.summary).trim()) return { ok: false, error: "summary_required" };
    return { ok: true };
  }
  if (action === "presence.agent.follow" || action === "presence.agent.observe" || action === "presence.agent.depart") {
    if (typeof p.agentUid !== "string" || !String(p.agentUid).trim()) return { ok: false, error: "agentUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (action === "presence.agent.observe" && p.subjectAvatarUid !== undefined) {
      if (typeof p.subjectAvatarUid !== "string" || !String(p.subjectAvatarUid).trim()) {
        return { ok: false, error: "subjectAvatarUid_invalid" };
      }
    }
    if (action === "presence.agent.follow") {
      if (typeof p.ownerAvatarUid !== "string" || !String(p.ownerAvatarUid).trim()) {
        return { ok: false, error: "ownerAvatarUid_required" };
      }
    }
    return { ok: true };
  }
  if (action === "presence.pet.spawn") {
    if (typeof p.petSlotUid !== "string" || !String(p.petSlotUid).trim()) return { ok: false, error: "petSlotUid_required" };
    if (typeof p.petUid !== "string" || !String(p.petUid).trim()) return { ok: false, error: "petUid_required" };
    if (typeof p.ownerAvatarUid !== "string" || !String(p.ownerAvatarUid).trim()) {
      return { ok: false, error: "ownerAvatarUid_required" };
    }
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    return { ok: true };
  }
  if (action === "presence.pet.follow") {
    if (typeof p.petSlotUid !== "string" || !String(p.petSlotUid).trim()) return { ok: false, error: "petSlotUid_required" };
    if (typeof p.ownerAvatarUid !== "string" || !String(p.ownerAvatarUid).trim()) {
      return { ok: false, error: "ownerAvatarUid_required" };
    }
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    return { ok: true };
  }
  if (action === "presence.pet.observe") {
    if (typeof p.petSlotUid !== "string" || !String(p.petSlotUid).trim()) return { ok: false, error: "petSlotUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (p.rhizohAgentUid !== undefined && (typeof p.rhizohAgentUid !== "string" || !String(p.rhizohAgentUid).trim())) {
      return { ok: false, error: "rhizohAgentUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.pet.react") {
    if (typeof p.petSlotUid !== "string" || !String(p.petSlotUid).trim()) return { ok: false, error: "petSlotUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.echoKind !== "string" || !String(p.echoKind).trim()) return { ok: false, error: "echoKind_required" };
    return { ok: true };
  }
  if (action === "presence.pet.depart") {
    if (typeof p.petSlotUid !== "string" || !String(p.petSlotUid).trim()) return { ok: false, error: "petSlotUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    return { ok: true };
  }
  if (action === "presence.room.create") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.title !== "string" || !String(p.title).trim()) return { ok: false, error: "title_required" };
    return { ok: true };
  }
  if (action === "presence.room.join" || action === "presence.room.leave") {
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.create") {
    if (typeof p.channelUid !== "string" || !String(p.channelUid).trim()) return { ok: false, error: "channelUid_required" };
    if (typeof p.title !== "string" || !String(p.title).trim()) return { ok: false, error: "title_required" };
    if (p.roomUid !== undefined && (typeof p.roomUid !== "string" || !String(p.roomUid).trim())) {
      return { ok: false, error: "roomUid_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.broadcast.join") {
    if (typeof p.channelUid !== "string" || !String(p.channelUid).trim()) return { ok: false, error: "channelUid_required" };
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    const role = p.role;
    if (role !== "speaker" && role !== "audience") return { ok: false, error: "role_invalid" };
    return { ok: true };
  }
  if (action === "presence.broadcast.leave") {
    if (typeof p.channelUid !== "string" || !String(p.channelUid).trim()) return { ok: false, error: "channelUid_required" };
    if (typeof p.avatarUid !== "string" || !String(p.avatarUid).trim()) return { ok: false, error: "avatarUid_required" };
    return { ok: true };
  }
  const broadcastUidActions = new Set([
    "presence.broadcast.pause",
    "presence.broadcast.resume",
    "presence.broadcast.stop",
    "presence.broadcast.spotlight.release",
    "presence.broadcast.camera.cut"
  ]);
  if (broadcastUidActions.has(action)) {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.segment.open") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.segmentId !== "string" || !String(p.segmentId).trim()) return { ok: false, error: "segmentId_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.segment.close") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.segmentId !== "string" || !String(p.segmentId).trim()) return { ok: false, error: "segmentId_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.spotlight.assign") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.targetAvatarUid !== "string" || !String(p.targetAvatarUid).trim()) {
      return { ok: false, error: "targetAvatarUid_required" };
    }
    return { ok: true };
  }
  if (action === "presence.broadcast.camera.focus") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.camera.follow") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.targetUid !== "string" || !String(p.targetUid).trim()) return { ok: false, error: "targetUid_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.overlay.push") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.overlayId !== "string" || !String(p.overlayId).trim()) return { ok: false, error: "overlayId_required" };
    if (typeof p.overlayKind !== "string" || !String(p.overlayKind).trim()) return { ok: false, error: "overlayKind_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.overlay.remove") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.overlayId !== "string" || !String(p.overlayId).trim()) return { ok: false, error: "overlayId_required" };
    return { ok: true };
  }
  if (
    action === "presence.broadcast.audience.wave" ||
    action === "presence.broadcast.audience.applause" ||
    action === "presence.broadcast.audience.cheer" ||
    action === "presence.broadcast.audience.emojiRain"
  ) {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (p.intensity !== undefined && (typeof p.intensity !== "number" || !Number.isFinite(p.intensity))) {
      return { ok: false, error: "intensity_invalid" };
    }
    return { ok: true };
  }
  if (action === "presence.broadcast.clip.mark") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.label !== "string" || !String(p.label).trim()) return { ok: false, error: "label_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.scene.set") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (typeof p.roomUid !== "string" || !String(p.roomUid).trim()) return { ok: false, error: "roomUid_required" };
    if (typeof p.sceneMode !== "string" || !String(p.sceneMode).trim()) return { ok: false, error: "sceneMode_required" };
    return { ok: true };
  }
  if (action === "presence.broadcast.start") {
    if (typeof p.broadcastUid !== "string" || !String(p.broadcastUid).trim()) return { ok: false, error: "broadcastUid_required" };
    if (p.roomUid !== undefined && (typeof p.roomUid !== "string" || !String(p.roomUid).trim())) {
      return { ok: false, error: "roomUid_invalid" };
    }
    if (p.hostAvatarUid !== undefined && (typeof p.hostAvatarUid !== "string" || !String(p.hostAvatarUid).trim())) {
      return { ok: false, error: "hostAvatarUid_invalid" };
    }
    if (p.sceneMode !== undefined && (typeof p.sceneMode !== "string" || !String(p.sceneMode).trim())) {
      return { ok: false, error: "sceneMode_invalid" };
    }
    return { ok: true };
  }
  if (action === "physics.entity.move.apply") {
    if (typeof p.entityUid !== "string" || !String(p.entityUid).trim()) {
      return { ok: false, error: "entityUid_required" };
    }
    const d = p.dpos;
    if (d == null || typeof d !== "object") return { ok: false, error: "dpos_required" };
    const o = d as Record<string, unknown>;
    for (const axis of ["x", "y", "z"] as const) {
      const v = o[axis];
      if (typeof v !== "number" || !Number.isFinite(v)) return { ok: false, error: `dpos_${axis}_invalid` };
    }
    return { ok: true };
  }
  if (action === "registry.soul.entity.link") {
    if (typeof p.entityId !== "string" || !String(p.entityId).trim()) return { ok: false, error: "entityId_required" };
    if (typeof p.soulUid !== "string" || !String(p.soulUid).trim()) return { ok: false, error: "soulUid_required" };
    return { ok: true };
  }
  if (action === "registry.mind.instance.spawn") {
    if (typeof p.uid !== "string" || !String(p.uid).trim()) return { ok: false, error: "uid_required" };
    if (typeof p.definitionUid !== "string" || !String(p.definitionUid).trim()) {
      return { ok: false, error: "definitionUid_required" };
    }
    return { ok: true };
  }
  if (action === "registry.mind.instance.upsert") {
    if (typeof p.uid !== "string" || !String(p.uid).trim()) return { ok: false, error: "uid_required" };
    return { ok: true };
  }
  if (action === "registry.link.attach") {
    for (const k of ["uid", "ownerId", "entityId", "mindInstanceId"] as const) {
      if (typeof p[k] !== "string" || !String(p[k]).trim()) return { ok: false, error: `${k}_required` };
    }
    return { ok: true };
  }
  if (action === "registry.spiral.upsert") {
    if (typeof p.id !== "string" || !String(p.id).trim()) return { ok: false, error: "id_required" };
    return { ok: true };
  }
  if (action === "registry.ghost.register") {
    if (typeof p.uid !== "string" || !String(p.uid).trim()) return { ok: false, error: "uid_required" };
    if (typeof p.soulUid !== "string" || !String(p.soulUid).trim()) return { ok: false, error: "soulUid_required" };
    return { ok: true };
  }
  if (action === "registry.soul.register") {
    if (typeof p.uid !== "string" || !String(p.uid).trim()) return { ok: false, error: "uid_required" };
    if (typeof p.ownerId !== "string" || !String(p.ownerId).trim()) {
      return { ok: false, error: "soul_owner_required" };
    }
    return { ok: true };
  }
  if (action === "registry.soulMind.bind") {
    for (const k of ["uid", "soulUid", "mindInstanceUid"] as const) {
      if (typeof p[k] !== "string" || !String(p[k]).trim()) return { ok: false, error: `${k}_required` };
    }
    return { ok: true };
  }
  if (action.startsWith("registry.") && action.endsWith(".register")) {
    if (typeof p.uid !== "string" || !String(p.uid).trim()) return { ok: false, error: "uid_required" };
    return { ok: true };
  }
  return { ok: true };
}

function sanitize(action: string, payload: unknown): unknown {
  if (action.startsWith("sim.")) {
    if (payload == null || typeof payload !== "object") return {};
    const o = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    if (typeof o.mindInstanceId === "string") o.mindInstanceId = String(o.mindInstanceId).trim().slice(0, 128);
    if (typeof o.input === "string") o.input = String(o.input).slice(0, 2000);
    return o;
  }
  const p = payload as Record<string, unknown>;
  const clone = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
  if (typeof clone.uid === "string") clone.uid = String(clone.uid).trim().slice(0, 128);
  if (typeof clone.definitionUid === "string") clone.definitionUid = String(clone.definitionUid).trim().slice(0, 128);
  if (typeof clone.ownerId === "string") clone.ownerId = String(clone.ownerId).trim().slice(0, 128);
  if (typeof clone.entityId === "string") clone.entityId = String(clone.entityId).trim().slice(0, 128);
  if (typeof clone.mindInstanceId === "string") clone.mindInstanceId = String(clone.mindInstanceId).trim().slice(0, 128);
  if (typeof clone.soulUid === "string") clone.soulUid = String(clone.soulUid).trim().slice(0, 128);
  if (typeof clone.mindInstanceUid === "string") clone.mindInstanceUid = String(clone.mindInstanceUid).trim().slice(0, 128);
  if (typeof clone.instanceId === "string") clone.instanceId = String(clone.instanceId).trim().slice(0, 128);
  if (typeof clone.entityId === "string") clone.entityId = String(clone.entityId).trim().slice(0, 128);
  if (action === "registry.link.attach") {
    if (typeof clone.authority === "number") clone.authority = Math.max(0, Math.min(1, clone.authority));
    if (typeof clone.sync === "number") clone.sync = Math.max(0, Math.min(1, clone.sync));
    if (typeof clone.bond === "number") clone.bond = Math.max(0, Math.min(1, clone.bond));
  }
  if (action === "physics.entity.move.apply") {
    if (typeof clone.entityUid === "string") clone.entityUid = String(clone.entityUid).trim().slice(0, 256);
    const d = clone.dpos as Record<string, unknown> | undefined;
    if (d && typeof d === "object") {
      const clamp = (n: number) => Math.max(-1e6, Math.min(1e6, n));
      for (const axis of ["x", "y", "z"] as const) {
        const v = d[axis];
        if (typeof v === "number" && Number.isFinite(v)) d[axis] = clamp(v);
      }
    }
  }
  if (action === "presence.avatar.bind") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.linkedEntityUid === "string") clone.linkedEntityUid = String(clone.linkedEntityUid).trim().slice(0, 256);
    if (typeof clone.soulUid === "string") clone.soulUid = String(clone.soulUid).trim().slice(0, 256);
  }
  if (action === "presence.avatar.emote") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.emoteId === "string") clone.emoteId = String(clone.emoteId).trim().slice(0, 128);
  }
  if (action === "presence.avatar.spawn") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.zoneId === "string") clone.zoneId = String(clone.zoneId).trim().slice(0, 64);
    if (typeof clone.zoneId === "string" && !isPresenceZoneId(clone.zoneId)) clone.zoneId = "audience";
    if (typeof clone.role === "string") clone.role = String(clone.role).trim().slice(0, 32);
    if (typeof clone.role === "string" && !isPresenceRole(clone.role)) clone.role = "guest";
    const clamp = (n: number) => Math.max(-1e6, Math.min(1e6, n));
    for (const axis of ["x", "y", "z", "rotY"] as const) {
      const v = clone[axis];
      if (typeof v === "number" && Number.isFinite(v)) clone[axis] = clamp(v);
    }
    const allowed = new Set(["quiet", "talking", "broadcasting", "watching", "away"]);
    if (typeof clone.status === "string" && !allowed.has(clone.status)) clone.status = "watching";
  }
  if (action === "presence.avatar.move") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    const pos = clone.pos as Record<string, unknown> | undefined;
    if (pos && typeof pos === "object") {
      const clamp = (n: number) => Math.max(-1e6, Math.min(1e6, n));
      for (const axis of ["x", "y", "z"] as const) {
        const v = pos[axis];
        if (typeof v === "number" && Number.isFinite(v)) pos[axis] = clamp(v);
      }
    }
    if (typeof clone.rotY === "number" && Number.isFinite(clone.rotY)) {
      clone.rotY = Math.max(-1e6, Math.min(1e6, clone.rotY));
    }
    const allowed = new Set(["quiet", "talking", "broadcasting", "watching", "away"]);
    if (typeof clone.status === "string" && !allowed.has(clone.status)) delete clone.status;
  }
  if (action === "presence.avatar.zone.enter" || action === "presence.avatar.zone.leave") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.zoneId === "string") clone.zoneId = String(clone.zoneId).trim().slice(0, 64);
    if (typeof clone.zoneId === "string" && !isPresenceZoneId(clone.zoneId)) clone.zoneId = "audience";
  }
  if (action === "presence.avatar.zone.transition") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    for (const k of ["fromZoneId", "toZoneId"] as const) {
      if (typeof clone[k] === "string") clone[k] = String(clone[k]).trim().slice(0, 64);
    }
  }
  if (action === "presence.room.create") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.title === "string") clone.title = String(clone.title).trim().slice(0, 256);
    if (typeof clone.topic === "string") clone.topic = String(clone.topic).trim().slice(0, 512);
    if (typeof clone.ownerSoulUid === "string") clone.ownerSoulUid = String(clone.ownerSoulUid).trim().slice(0, 256);
  }
  if (action === "presence.room.join" || action === "presence.room.leave") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
  }
  if (action === "presence.broadcast.create") {
    if (typeof clone.channelUid === "string") clone.channelUid = String(clone.channelUid).trim().slice(0, 256);
    if (typeof clone.title === "string") clone.title = String(clone.title).trim().slice(0, 256);
    if (typeof clone.topic === "string") clone.topic = String(clone.topic).trim().slice(0, 512);
    if (typeof clone.ownerSoulUid === "string") clone.ownerSoulUid = String(clone.ownerSoulUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
  }
  if (action === "presence.broadcast.join") {
    if (typeof clone.channelUid === "string") clone.channelUid = String(clone.channelUid).trim().slice(0, 256);
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (clone.role !== "speaker" && clone.role !== "audience") clone.role = "audience";
  }
  if (action === "presence.broadcast.leave") {
    if (typeof clone.channelUid === "string") clone.channelUid = String(clone.channelUid).trim().slice(0, 256);
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
  }
  if (typeof clone.broadcastUid === "string") clone.broadcastUid = String(clone.broadcastUid).trim().slice(0, 256);
  if (typeof clone.segmentId === "string") clone.segmentId = String(clone.segmentId).trim().slice(0, 256);
  if (typeof clone.targetAvatarUid === "string") clone.targetAvatarUid = String(clone.targetAvatarUid).trim().slice(0, 256);
  if (typeof clone.targetUid === "string") clone.targetUid = String(clone.targetUid).trim().slice(0, 256);
  if (typeof clone.overlayId === "string") clone.overlayId = String(clone.overlayId).trim().slice(0, 256);
  if (typeof clone.overlayKind === "string") clone.overlayKind = String(clone.overlayKind).trim().slice(0, 128);
  if (typeof clone.hostAvatarUid === "string") clone.hostAvatarUid = String(clone.hostAvatarUid).trim().slice(0, 256);
  if (typeof clone.sceneMode === "string") clone.sceneMode = String(clone.sceneMode).trim().slice(0, 64);
  if (action === "presence.role.assign") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.targetAvatarUid === "string") clone.targetAvatarUid = String(clone.targetAvatarUid).trim().slice(0, 256);
    if (typeof clone.role === "string") clone.role = String(clone.role).trim().slice(0, 32);
    if (typeof clone.role === "string" && !isPresenceRole(clone.role)) clone.role = "guest";
    if (typeof clone.assignedByAvatarUid === "string") {
      clone.assignedByAvatarUid = String(clone.assignedByAvatarUid).trim().slice(0, 256);
    }
  }
  if (action === "presence.role.revoke") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.targetAvatarUid === "string") clone.targetAvatarUid = String(clone.targetAvatarUid).trim().slice(0, 256);
    if (typeof clone.actorAvatarUid === "string") clone.actorAvatarUid = String(clone.actorAvatarUid).trim().slice(0, 256);
  }
  if (action === "presence.moderate.kick" || action === "presence.moderate.mute") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.targetAvatarUid === "string") clone.targetAvatarUid = String(clone.targetAvatarUid).trim().slice(0, 256);
    if (typeof clone.actorAvatarUid === "string") clone.actorAvatarUid = String(clone.actorAvatarUid).trim().slice(0, 256);
  }
  if (action === "presence.stage.pin") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.actorAvatarUid === "string") clone.actorAvatarUid = String(clone.actorAvatarUid).trim().slice(0, 256);
    if (typeof clone.summary === "string") clone.summary = String(clone.summary).trim().slice(0, 512);
  }
  if (action === "presence.stage.invite") {
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.fromAvatarUid === "string") clone.fromAvatarUid = String(clone.fromAvatarUid).trim().slice(0, 256);
    if (typeof clone.toAvatarUid === "string") clone.toAvatarUid = String(clone.toAvatarUid).trim().slice(0, 256);
  }
  if (action === "presence.avatar.speak.start" || action === "presence.avatar.speak.stop") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
  }
  if (action === "presence.avatar.react") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.kind === "string") clone.kind = String(clone.kind).trim().slice(0, 64);
  }
  if (action === "presence.avatar.raise_hand") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
  }
  if (action === "presence.avatar.pet.summon") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.petUid === "string") clone.petUid = String(clone.petUid).trim().slice(0, 256);
  }
  if (action === "presence.avatar.agent.invoke") {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.agentUid === "string") clone.agentUid = String(clone.agentUid).trim().slice(0, 256);
    if (typeof clone.intent === "string") clone.intent = String(clone.intent).trim().slice(0, 512);
  }
  if (action === "presence.agent.spawn" || action === "presence.agent.listen" || action === "presence.agent.respond") {
    if (typeof clone.agentUid === "string") clone.agentUid = String(clone.agentUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.ownerAvatarUid === "string") clone.ownerAvatarUid = String(clone.ownerAvatarUid).trim().slice(0, 256);
    if (typeof clone.summary === "string") clone.summary = String(clone.summary).trim().slice(0, 512);
    if (typeof clone.attentionTargetUid === "string") {
      clone.attentionTargetUid = String(clone.attentionTargetUid).trim().slice(0, 256);
    }
  }
  if (action === "presence.agent.follow" || action === "presence.agent.observe" || action === "presence.agent.depart") {
    if (typeof clone.agentUid === "string") clone.agentUid = String(clone.agentUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.ownerAvatarUid === "string") clone.ownerAvatarUid = String(clone.ownerAvatarUid).trim().slice(0, 256);
    if (typeof clone.subjectAvatarUid === "string") clone.subjectAvatarUid = String(clone.subjectAvatarUid).trim().slice(0, 256);
  }
  if (
    action === "presence.pet.spawn" ||
    action === "presence.pet.follow" ||
    action === "presence.pet.observe" ||
    action === "presence.pet.react" ||
    action === "presence.pet.depart"
  ) {
    if (typeof clone.petSlotUid === "string") clone.petSlotUid = String(clone.petSlotUid).trim().slice(0, 256);
    if (typeof clone.petUid === "string") clone.petUid = String(clone.petUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.ownerAvatarUid === "string") clone.ownerAvatarUid = String(clone.ownerAvatarUid).trim().slice(0, 256);
    if (typeof clone.echoKind === "string") clone.echoKind = String(clone.echoKind).trim().slice(0, 64);
    if (typeof clone.rhizohAgentUid === "string") clone.rhizohAgentUid = String(clone.rhizohAgentUid).trim().slice(0, 256);
  }
  if (action.startsWith("world.")) {
    if (typeof clone.avatarUid === "string") clone.avatarUid = String(clone.avatarUid).trim().slice(0, 256);
    if (typeof clone.roomUid === "string") clone.roomUid = String(clone.roomUid).trim().slice(0, 256);
    if (typeof clone.regionUid === "string") clone.regionUid = String(clone.regionUid).trim().slice(0, 256);
    if (typeof clone.fromRegionUid === "string") clone.fromRegionUid = String(clone.fromRegionUid).trim().slice(0, 256);
    if (typeof clone.toRegionUid === "string") clone.toRegionUid = String(clone.toRegionUid).trim().slice(0, 256);
    if (typeof clone.portalEdgeUid === "string") clone.portalEdgeUid = String(clone.portalEdgeUid).trim().slice(0, 256);
    const clampWorldAxis = (n: number) => Math.max(-1e9, Math.min(1e9, n));
    if (typeof clone.x === "number" && Number.isFinite(clone.x)) clone.x = clampWorldAxis(clone.x);
    if (typeof clone.z === "number" && Number.isFinite(clone.z)) clone.z = clampWorldAxis(clone.z);
  }
  return clone;
}

function pushAudit(
  auditId: string,
  action: string,
  allowed: boolean,
  identity: IdentityState
): void {
  auditTrail.unshift({
    auditId,
    action,
    allowed,
    ownerId: identity.ownerId,
    actorKind: identity.actor?.kind ?? null,
    ts: Date.now()
  });
  if (auditTrail.length > AUDIT_CAP) auditTrail.length = AUDIT_CAP;
}

export function getKernelAuditTail(limit = 80): typeof auditTrail {
  return auditTrail.slice(0, limit);
}

export function clearKernelAuditTrail(): void {
  auditTrail.length = 0;
}

/**
 * authorize → validate → sanitize → audit → commit (commit = return sanitized; store applies).
 */
export function KernelGuardRun(input: KernelGuardRunInput): KernelGuardRunResult {
  const silent = Boolean(input.dryRun);
  if (input.skipGuard) {
    const auditId = newAuditId();
    if (!silent) pushAudit(auditId, String(input.action), true, input.identity);
    return { allowed: true, sanitizedPayload: input.payload, auditId };
  }

  const action = String(input.action) as KernelActionId;
  const auditId = newAuditId();

  const auth = authorize(input.identity, action);
  if (!auth.ok) {
    if (!silent) pushAudit(auditId, action, false, input.identity);
    return { allowed: false, error: auth.error, auditId, stage: "authorize" };
  }

  const val = validate(action, input.payload);
  if (!val.ok) {
    if (!silent) pushAudit(auditId, action, false, input.identity);
    return { allowed: false, error: val.error, auditId, stage: "validate" };
  }

  let sanitized: unknown;
  try {
    sanitized = sanitize(action, input.payload);
  } catch {
    if (!silent) pushAudit(auditId, action, false, input.identity);
    return { allowed: false, error: "sanitize_failed", auditId, stage: "sanitize" };
  }

  if (!silent) pushAudit(auditId, action, true, input.identity);
  return { allowed: true, sanitizedPayload: sanitized, auditId, stage: "commit" };
}

/** Back-compat shorter name */
export const KernelGuard = {
  run: KernelGuardRun,
  /** Authorize-only probe (no payload validation). */
  can(identity: IdentityState, action: string): boolean {
    return authorize(identity, action).ok;
  }
};
