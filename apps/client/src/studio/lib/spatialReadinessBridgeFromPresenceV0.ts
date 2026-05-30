/**
 * SPECFLOW: RESEARCH-ONLY — **Spatial readiness bridge**: `PresenceLayer` → world transforms / room bounds
 * → `resolveRealWorldSpatialBindingReadinessV0` → ghost pet **world** look delta (tek tick, tek oda).
 *
 * LLM yok; sosyal kararlar (focus / locomotion hint) zaten `baseEmbodimentDrive` içinde.
 */

import type { AvatarEntity, PresenceLayerState } from "../types/rskOntology";
import { ensureRoomZones } from "./presenceRoomZones";
import { petGhostOrbitTransform, PET_GHOST_ORBIT_PHASE_DEFAULT } from "./petGhostOrbit";
import { resolveRealWorldSpatialBindingReadinessV0 } from "../../rhizoh/spatial/realWorldSpatialBindingReadinessV0.js";
import { GHOST_PET_LOCOMOTION_HINT_V0 } from "../../rhizoh/spatial/ghostPetLocomotionIntentV0.js";

export const SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0 =
  "castle.rhizoh.spatial_readiness_bridge_from_presence.v0";

export type SpatialReadinessBridgeFromPresenceV0 = {
  schema: typeof SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0;
  ts: number;
  roomUid: string | null;
  spatialReadiness: ReturnType<typeof resolveRealWorldSpatialBindingReadinessV0>;
  embodimentAugmentation: {
    worldAttentionYawOffsetRad: number | null;
    worldRadialScale01: number | null;
    worldSpatialBlend01: number;
  };
  debug: {
    ownerAvatarUid: string | null;
    focusAvatarUid: string | null;
    secondaryAvatarUid: string | null;
  };
};

function pickPrimaryRoomUid(presence: PresenceLayerState): string | null {
  const rooms = presence.rooms && typeof presence.rooms === "object" ? presence.rooms : {};
  const keys = Object.keys(rooms);
  if (keys.length === 1) return keys[0];
  if (keys.length > 1) {
    let best: string | null = null;
    let bestN = -1;
    for (const k of keys) {
      const r = rooms[k];
      const n = Array.isArray(r?.memberAvatarUids) ? r.memberAvatarUids.length : 0;
      if (n > bestN) {
        bestN = n;
        best = k;
      }
    }
    if (best) return best;
  }
  for (const av of Object.values(presence.avatars || {})) {
    const ru = av?.projection?.roomUid;
    if (ru && typeof ru === "string") return ru;
  }
  return null;
}

function extractAvatarTransformsByUid(
  presence: PresenceLayerState,
  roomUid: string
): Record<string, { x: number; y: number; z: number; rotY: number }> {
  const out: Record<string, { x: number; y: number; z: number; rotY: number }> = {};
  for (const [uid, raw] of Object.entries(presence.avatars || {})) {
    const av = raw as AvatarEntity;
    const p = av?.projection;
    if (!p || p.roomUid !== roomUid) continue;
    const t = p.transform;
    if (!t || ![t.x, t.y, t.z, t.rotY].every((n) => typeof n === "number" && Number.isFinite(n))) continue;
    out[uid] = { x: t.x, y: t.y, z: t.z, rotY: t.rotY };
  }
  return out;
}

function unionRoomBoundsFromPresence(room: import("../types/rskOntology").PresenceRoom | undefined): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} | null {
  if (!room) return null;
  const zones = ensureRoomZones(room);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const z of Object.values(zones)) {
    const b = z.bounds;
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minZ = Math.min(minZ, b.minZ);
    maxZ = Math.max(maxZ, b.maxZ);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return null;
  return { minX, maxX, minZ, maxZ };
}

function findAvatarUidForUserOrUid(
  presence: PresenceLayerState,
  roomUid: string,
  needle: string | null | undefined
): string | null {
  const id = String(needle || "").trim();
  if (!id) return null;
  for (const [uid, raw] of Object.entries(presence.avatars || {})) {
    const av = raw as AvatarEntity;
    const p = av?.projection;
    if (!p || p.roomUid !== roomUid) continue;
    if (uid === id) return uid;
    if (String(av.ownerId || "").trim() === id) return uid;
    if (String(av.soulUid || "").trim() === id) return uid;
  }
  return null;
}

function resolveOwnerAvatarUid(
  presence: PresenceLayerState,
  roomUid: string,
  room: import("../types/rskOntology").PresenceRoom | undefined
): string | null {
  const own = room?.ownerAvatarUid && String(room.ownerAvatarUid).trim() ? String(room.ownerAvatarUid).trim() : null;
  if (own && presence.avatars?.[own]?.projection?.roomUid === roomUid) return own;
  const mem = Array.isArray(room?.memberAvatarUids) ? room.memberAvatarUids : [];
  for (const uid of mem) {
    if (uid && presence.avatars?.[uid]?.projection?.roomUid === roomUid) return uid;
  }
  const transforms = extractAvatarTransformsByUid(presence, roomUid);
  const first = Object.keys(transforms)[0];
  return first || null;
}

function blendFromReadiness(readiness01: number): number {
  const r = Math.max(0, Math.min(1, readiness01));
  return Math.max(0, Math.min(1, (r - 0.32) / 0.58));
}

function lookDeltaFromPetToward(
  ownerT: { x: number; y: number; z: number; rotY: number },
  targetX: number,
  targetZ: number,
  phase: number,
  radiusScale01?: number,
  verticalBobScale01?: number
): number {
  const pet = petGhostOrbitTransform(ownerT, phase, {
    radiusScale01,
    verticalBobScale01
  });
  const baseR = pet.rotY;
  const targetR = Math.atan2(targetX - pet.x, targetZ - pet.z);
  let delta = targetR - baseR;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return Math.round(delta * 1000) / 1000;
}

/**
 * @param input.baseEmbodimentDrive — `computeGhostPetSocialEmbodimentDriveV0` çıktısı (phase / radius / locomotion).
 */
export function buildSpatialReadinessBridgeFromPresenceV0(input: {
  presence: PresenceLayerState;
  roomUid?: string | null;
  focusUserId?: string | null;
  operatorUserId?: string | null;
  interpreterSecondaryUid?: string | null;
  attentionMode?: string | null;
  locomotionHint?: string | null;
  baseEmbodimentDrive?: Record<string, unknown> | null;
  symbolicEmbodimentActive?: boolean;
}): SpatialReadinessBridgeFromPresenceV0 {
  const pres = input.presence && typeof input.presence === "object" ? input.presence : { avatars: {}, rooms: {} };
  const roomUid =
    input.roomUid && typeof input.roomUid === "string" && pres.rooms?.[input.roomUid]
      ? input.roomUid
      : pickPrimaryRoomUid(pres as PresenceLayerState);

  if (!roomUid) {
    const spatialReadiness = resolveRealWorldSpatialBindingReadinessV0({
      symbolicEmbodimentActive: input.symbolicEmbodimentActive !== false
    });
    return {
      schema: SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0,
      ts: Date.now(),
      roomUid: null,
      spatialReadiness,
      embodimentAugmentation: {
        worldAttentionYawOffsetRad: null,
        worldRadialScale01: null,
        worldSpatialBlend01: 0
      },
      debug: {
        ownerAvatarUid: null,
        focusAvatarUid: null,
        secondaryAvatarUid: null
      }
    };
  }

  const room = pres.rooms?.[roomUid];
  const transforms = roomUid ? extractAvatarTransformsByUid(pres as PresenceLayerState, roomUid) : {};
  const roomBounds = unionRoomBoundsFromPresence(room);

  const spatialReadiness = resolveRealWorldSpatialBindingReadinessV0({
    avatarTransformsByUid: transforms,
    roomBounds,
    obstacles: [],
    symbolicEmbodimentActive: input.symbolicEmbodimentActive !== false
  });

  const ownerAvatarUid =
    roomUid != null ? resolveOwnerAvatarUid(pres as PresenceLayerState, roomUid, room) : null;
  const focusAvatarUid =
    roomUid != null
      ? findAvatarUidForUserOrUid(pres as PresenceLayerState, roomUid, input.focusUserId)
      : null;
  const secondaryAvatarUid =
    roomUid != null
      ? findAvatarUidForUserOrUid(pres as PresenceLayerState, roomUid, input.interpreterSecondaryUid)
      : null;

  const drive = input.baseEmbodimentDrive && typeof input.baseEmbodimentDrive === "object" ? input.baseEmbodimentDrive : {};
  const phase = Number.isFinite(Number(drive.orbitPhaseRad)) ? Number(drive.orbitPhaseRad) : PET_GHOST_ORBIT_PHASE_DEFAULT;
  const rs = Number.isFinite(Number(drive.radiusScale01)) ? Number(drive.radiusScale01) : undefined;
  const vs = Number.isFinite(Number(drive.verticalBobScale01)) ? Number(drive.verticalBobScale01) : undefined;

  const ownerT = ownerAvatarUid ? transforms[ownerAvatarUid] : null;
  const focusT = focusAvatarUid ? transforms[focusAvatarUid] : null;
  const secT = secondaryAvatarUid ? transforms[secondaryAvatarUid] : null;

  const blend01 = blendFromReadiness(Number(spatialReadiness.readiness01) || 0);

  let worldAttentionYawOffsetRad: number | null = null;
  let worldRadialScale01: number | null = null;

  const loc = String(input.locomotionHint || "");
  const att = String(input.attentionMode || "");

  if (ownerT && focusT && ownerAvatarUid && focusAvatarUid && ownerAvatarUid !== focusAvatarUid) {
    if (loc === GHOST_PET_LOCOMOTION_HINT_V0.RETREAT) {
      const vx = ownerT.x - focusT.x;
      const vz = ownerT.z - focusT.z;
      const len = Math.hypot(vx, vz) || 1;
      const tx = ownerT.x + (vx / len) * 1.25;
      const tz = ownerT.z + (vz / len) * 1.25;
      worldAttentionYawOffsetRad = lookDeltaFromPetToward(ownerT, tx, tz, phase, rs, vs);
      worldRadialScale01 = 1.12;
    } else if (loc === GHOST_PET_LOCOMOTION_HINT_V0.GUARD) {
      worldAttentionYawOffsetRad = lookDeltaFromPetToward(ownerT, focusT.x, focusT.z, phase, rs, vs);
      worldRadialScale01 = 0.9;
    } else if (att === "INTERPRETER_SPLIT" && secT) {
      const mx = (ownerT.x + secT.x) / 2;
      const mz = (ownerT.z + secT.z) / 2;
      worldAttentionYawOffsetRad = lookDeltaFromPetToward(ownerT, mx, mz, phase, rs, vs);
    } else {
      worldAttentionYawOffsetRad = lookDeltaFromPetToward(ownerT, focusT.x, focusT.z, phase, rs, vs);
    }
  } else if (ownerT && loc === GHOST_PET_LOCOMOTION_HINT_V0.GUARD) {
    worldRadialScale01 = 0.92;
  }

  return {
    schema: SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0,
    ts: Date.now(),
    roomUid,
    spatialReadiness,
    embodimentAugmentation: {
      worldAttentionYawOffsetRad,
      worldRadialScale01,
      worldSpatialBlend01: Math.round(blend01 * 1000) / 1000
    },
    debug: {
      ownerAvatarUid,
      focusAvatarUid,
      secondaryAvatarUid
    }
  };
}

/**
 * `baseEmbodimentDrive` + Presence köprüsü → pet mesh’in okuyacağı embodiment alanları.
 */
export function mergeGhostPetEmbodimentDriveWithSpatialPresenceBridgeV0(
  drive: Record<string, unknown> | null | undefined,
  bridge: SpatialReadinessBridgeFromPresenceV0 | null | undefined
): Record<string, unknown> {
  const d = drive && typeof drive === "object" ? { ...drive } : {};
  if (!bridge?.embodimentAugmentation) return d;
  const aug = bridge.embodimentAugmentation;
  const b = typeof aug.worldSpatialBlend01 === "number" ? Math.max(0, Math.min(1, aug.worldSpatialBlend01)) : 0;
  if (aug.worldAttentionYawOffsetRad != null && Number.isFinite(aug.worldAttentionYawOffsetRad) && b > 0.02) {
    d.worldAttentionYawOffsetRad = aug.worldAttentionYawOffsetRad;
    d.worldSpatialBlend01 = b;
    d.worldSpatialBindingActive = b >= 0.12;
  }
  if (aug.worldRadialScale01 != null && Number.isFinite(aug.worldRadialScale01) && Number.isFinite(Number(d.radiusScale01))) {
    d.radiusScale01 = Math.round(
      Math.max(0.76, Math.min(1.38, Number(d.radiusScale01) * Number(aug.worldRadialScale01))) * 1000
    ) / 1000;
  }
  if (bridge.spatialReadiness && typeof bridge.spatialReadiness === "object") {
    const r01 = Number(bridge.spatialReadiness.readiness01);
    if (Number.isFinite(r01)) d.spatialReadiness01 = Math.round(r01 * 1000) / 1000;
  }
  return d;
}
