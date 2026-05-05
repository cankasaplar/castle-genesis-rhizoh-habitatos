/**
 * B — `/greenroom/main` → canonical presence room + backstage (Green Room pocket).
 * Imports slices directly (avoid `studioStore` barrel ↔ this module circularity).
 */
import { assignPresenceRole } from "../store/presenceRoleSlice";
import { bindAvatarToEntity } from "../store/presenceSlice";
import { transitionPresenceZone } from "../store/presenceZoneSlice";
import { createPresenceRoom, joinPresenceRoom } from "../store/roomBroadcastSlice";
import { registerEntity } from "../store/registrySlice";
import { ensureEphemeralGuestKernelIdentity } from "./ephemeralGuestIdentity";
import { getStudioKernelState } from "../store/internalStore";
import { ensureCastleWorldTopology } from "./bootstrapWorldTopology";

export const GREENROOM_MAIN_HALL_ROOM_UID = "greenroom:main";

/**
 * Idempotent: ensures `greenroom:main` exists, dev/owner avatar joins, moves to `backstage`, role `guest`.
 * Firebase yoksa `guest:<uuid>` ephemeral owner ile kernel bind (ürün hissi).
 */
export function ensureGreenRoomMainHallBound(): { ok: true } | { ok: false; error: string } {
  ensureEphemeralGuestKernelIdentity();
  ensureCastleWorldTopology();
  const s = getStudioKernelState();
  const ownerId = s.identity?.ownerId;
  if (!ownerId) return { ok: false, error: "identity_required" };

  const avatarUid = `avatar:${ownerId}`;
  const entityUid = `ent:${ownerId}:greenroom-shell`;

  const av = s.presence?.avatars?.[avatarUid];
  const pr = av?.projection;
  if (pr?.roomUid === GREENROOM_MAIN_HALL_ROOM_UID && pr.zoneId === "backstage" && pr.role === "guest") {
    return { ok: true };
  }

  const re = registerEntity({ uid: entityUid, ownerId });
  if (!re.ok && re.error !== "entity_uid_collision") {
    return { ok: false, error: re.error ?? "entity_register_failed" };
  }

  const s1 = getStudioKernelState();
  const av1 = s1.presence?.avatars?.[avatarUid];
  if (!av1?.linkedEntityUid || av1.linkedEntityUid !== entityUid) {
    const be = bindAvatarToEntity({ avatarUid, linkedEntityUid: entityUid });
    if (!be.ok) return { ok: false, error: be.error ?? "avatar_bind_failed" };
  }

  const cr = createPresenceRoom({
    roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
    title: "Green Room · Main Hall",
    topic: "greenroom-main-hall"
  });
  if (!cr.ok && cr.error !== "room_uid_collision") {
    return { ok: false, error: cr.error ?? "room_create_failed" };
  }

  const jr = joinPresenceRoom({ roomUid: GREENROOM_MAIN_HALL_ROOM_UID, avatarUid });
  if (!jr.ok) return { ok: false, error: jr.error ?? "room_join_failed" };

  const tz = transitionPresenceZone({
    avatarUid,
    roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
    toZoneId: "backstage"
  });
  if (!tz.ok) return { ok: false, error: tz.error ?? "zone_transition_failed" };

  const s3 = getStudioKernelState();
  const room = s3.presence?.rooms?.[GREENROOM_MAIN_HALL_ROOM_UID];
  const roleNow = s3.presence?.avatars?.[avatarUid]?.projection?.role;
  if (roleNow !== "guest" || room?.ownerAvatarUid === avatarUid) {
    assignPresenceRole({
      roomUid: GREENROOM_MAIN_HALL_ROOM_UID,
      targetAvatarUid: avatarUid,
      role: "guest"
    });
  }

  return { ok: true };
}
