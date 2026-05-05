import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  emitAvatarEmote,
  getStudioKernelState,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";

describe("Phase P1 presence / avatar shell", () => {
  it("bindAvatarToEntity appends presence.join and stores AvatarEntity", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "p1-owner",
      actor: { id: "p1-owner", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "presence.*": true },
      delegates: [],
      sharedOwnerIds: []
    });
    const ent = registerEntity({ uid: "ent:p1:1", ownerId: "p1-owner" });
    expect(ent.ok).toBe(true);

    const r = bindAvatarToEntity({ avatarUid: "avatar:p1:a", linkedEntityUid: "ent:p1:1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const s = getStudioKernelState();
    expect(s.presence.avatars["avatar:p1:a"]?.linkedEntityUid).toBe("ent:p1:1");
    const join = Object.values(s.registry.causalGraph.nodes).find(
      (n) => (n.payload.delta as { kind?: string })?.kind === "presence.join"
    );
    expect(join?.payload.economy).toBeDefined();
  });

  it("emitAvatarEmote requires bound avatar", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "p1-owner",
      actor: { id: "p1-owner", kind: "human" },
      session: null,
      permissions: { "presence.*": true },
      delegates: [],
      sharedOwnerIds: []
    });
    const r = emitAvatarEmote({ avatarUid: "avatar:ghost", emoteId: "wave" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("avatar_not_bound");
  });
});
