import { describe, expect, it } from "vitest";
import {
  ensureGreenRoomMainHallBound,
  GREENROOM_MAIN_HALL_ROOM_UID
} from "../lib/greenRoomRouteBinding.js";
import { getStudioKernelState, patchIdentity, resetRhizohStudioKernelStore } from "../store/studioStore";

function seedIdentity() {
  patchIdentity({
    ownerId: "gr-owner",
    actor: { id: "gr-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true, "world.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

describe("greenRoomRouteBinding (B)", () => {
  it("binds greenroom:main + backstage + guest + quiet + zone semantics", () => {
    resetRhizohStudioKernelStore();
    seedIdentity();
    const r = ensureGreenRoomMainHallBound();
    expect(r.ok).toBe(true);
    const s = getStudioKernelState();
    expect(s.presence.rooms[GREENROOM_MAIN_HALL_ROOM_UID]?.uid).toBe(GREENROOM_MAIN_HALL_ROOM_UID);
    const av = s.presence.avatars["avatar:gr-owner"];
    expect(av?.projection?.roomUid).toBe(GREENROOM_MAIN_HALL_ROOM_UID);
    expect(av?.projection?.zoneId).toBe("backstage");
    expect(av?.projection?.role).toBe("guest");
    expect(av?.projection?.status).toBe("quiet");
    const bs = s.presence.rooms[GREENROOM_MAIN_HALL_ROOM_UID]?.zones?.backstage?.semantics;
    expect(bs?.backstageHidden).toBe(true);
    expect(bs?.toolAccess).toBe(true);
    expect(bs?.defaultStatus).toBe("quiet");
    expect(bs?.agentAllowed).toBe(true);
    expect(bs?.petAllowed).toBe(true);
  });

  it("is idempotent when already bound", () => {
    resetRhizohStudioKernelStore();
    seedIdentity();
    expect(ensureGreenRoomMainHallBound().ok).toBe(true);
    expect(ensureGreenRoomMainHallBound().ok).toBe(true);
    const s = getStudioKernelState();
    expect(s.presence.avatars["avatar:gr-owner"]?.projection?.zoneId).toBe("backstage");
  });

  it("uses ephemeral guest identity when ownerId is missing (immersion path)", () => {
    resetRhizohStudioKernelStore();
    expect(getStudioKernelState().identity.ownerId).toBeFalsy();
    const r = ensureGreenRoomMainHallBound();
    expect(r.ok).toBe(true);
    const ownerId = getStudioKernelState().identity.ownerId;
    expect(ownerId?.startsWith("guest:")).toBe(true);
    const av = getStudioKernelState().presence.avatars[`avatar:${ownerId}`];
    expect(av?.projection?.roomUid).toBe(GREENROOM_MAIN_HALL_ROOM_UID);
  });
});
