import type { AvatarProjection, PresenceLayerState } from "../types/rskOntology";

/** Merge projection into a probe presence and compute `lookAtTargetUid` (spectator → active speaker). */
export function avatarProjectionWithLookAt(
  pres: PresenceLayerState,
  roomUid: string,
  avatarUid: string,
  projection: AvatarProjection
): AvatarProjection {
  const av = pres.avatars[avatarUid];
  if (!av) return projection;
  const probe: PresenceLayerState = {
    ...pres,
    avatars: {
      ...pres.avatars,
      [avatarUid]: { ...av, projection }
    }
  };
  return {
    ...projection,
    lookAtTargetUid: lookAtTargetForAvatar(probe, roomUid, avatarUid)
  };
}

/** Who this avatar should face in-room (spectator → active speaker). */
export function lookAtTargetForAvatar(
  pres: PresenceLayerState,
  roomUid: string,
  avatarUid: string
): string | undefined {
  const self = pres.avatars[avatarUid]?.projection;
  if (!self || self.roomUid !== roomUid) return undefined;
  if (self.status === "talking" || self.status === "broadcasting") return undefined;
  for (const uid of pres.rooms[roomUid]?.memberAvatarUids ?? []) {
    if (uid === avatarUid) continue;
    const st = pres.avatars[uid]?.projection?.status;
    if (st === "talking" || st === "broadcasting") return uid;
  }
  return undefined;
}
