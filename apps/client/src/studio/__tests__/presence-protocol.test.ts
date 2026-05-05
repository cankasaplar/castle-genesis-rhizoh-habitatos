import { describe, expect, it } from "vitest";
import {
  bindAvatarToEntity,
  createPresenceRoom,
  getStudioKernelState,
  joinPresenceRoom,
  moderateMute,
  moveAvatarInRoom,
  patchIdentity,
  registerEntity,
  resetRhizohStudioKernelStore,
  presenceAvatarAgentInvoke,
  presenceAvatarPetSummon,
  presenceAvatarRaiseHand,
  presenceAvatarReact,
  presenceAvatarSpeakStart,
  presenceAvatarSpeakStop
} from "../store/studioStore.js";
import { ghostPetDepart, stablePetSlotUid } from "../store/ghostPetOrbitSlice";
import { rhizohCompanionDepart, stableRhizohCompanionUid } from "../store/rhizohCompanionSlice";

function seed() {
  patchIdentity({
    ownerId: "proto-owner",
    actor: { id: "proto-owner", kind: "human" },
    session: null,
    permissions: { "registry.*": true, "presence.*": true, "physics.*": true },
    delegates: [],
    sharedOwnerIds: []
  });
}

function deltaKinds(): string[] {
  const s = getStudioKernelState();
  return Object.values(s.registry.causalGraph.nodes).map((n) => {
    const d = n.payload?.delta as { kind?: string } | undefined;
    return d?.kind ?? "";
  });
}

describe("presence protocol layer", () => {
  it("speak start/stop append atoms and update status; stop restores zone default", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:1", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:1", linkedEntityUid: "ent:proto:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:1", title: "Lab" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:1", avatarUid: "avatar:proto:1" }).ok).toBe(true);

    expect(presenceAvatarSpeakStart({ avatarUid: "avatar:proto:1" }).ok).toBe(true);
    let s = getStudioKernelState();
    expect(s.presence.avatars["avatar:proto:1"]?.projection?.status).toBe("talking");
    expect(s.presence.avatars["avatar:proto:1"]?.projection?.rigAnimation).toBe("talk");
    expect(s.presence.avatars["avatar:proto:1"]?.projection?.lastRigEventAt).toBeDefined();
    expect(deltaKinds().filter((k) => k === "avatar.speak.start").length).toBe(1);

    expect(presenceAvatarSpeakStop({ avatarUid: "avatar:proto:1" }).ok).toBe(true);
    s = getStudioKernelState();
    expect(s.presence.avatars["avatar:proto:1"]?.projection?.status).toBe("watching");
    expect(s.presence.avatars["avatar:proto:1"]?.projection?.rigAnimation).toBe("idle");
    expect(deltaKinds().filter((k) => k === "avatar.speak.stop").length).toBe(1);
    const stub = s.presence.voiceStubByRoomUid?.["room:proto:1"]?.segments ?? [];
    expect(stub.length).toBe(1);
    expect(stub[0]?.avatarUid).toBe("avatar:proto:1");
    expect(stub[0]?.causalStartNodeId).toBeDefined();
    expect(stub[0]?.endMs).toBeDefined();
    expect(stub[0]?.causalStopNodeId).toBeDefined();
  });

  it("speak.start is blocked when avatar is muted", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:2", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:2", linkedEntityUid: "ent:proto:2" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:2", title: "Lab2" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:2", avatarUid: "avatar:proto:2" }).ok).toBe(true);
    expect(
      moderateMute({
        roomUid: "room:proto:2",
        targetAvatarUid: "avatar:proto:2",
        muted: true
      }).ok
    ).toBe(true);

    const r = presenceAvatarSpeakStart({ avatarUid: "avatar:proto:2" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("muted");
  });

  it("react, raise_hand, pet summon, agent invoke update projection and emit deltas", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:3", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:3", linkedEntityUid: "ent:proto:3" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:3", title: "Lab3" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:3", avatarUid: "avatar:proto:3" }).ok).toBe(true);

    expect(presenceAvatarReact({ avatarUid: "avatar:proto:3", kind: "applaud" }).ok).toBe(true);
    expect(getStudioKernelState().presence.avatars["avatar:proto:3"]?.projection?.rigAnimation).toBe("clap");
    expect(presenceAvatarRaiseHand({ avatarUid: "avatar:proto:3", raised: true }).ok).toBe(true);
    expect(getStudioKernelState().presence.avatars["avatar:proto:3"]?.projection?.rigAnimation).toBe("think");
    expect(getStudioKernelState().presence.avatars["avatar:proto:3"]?.projection?.rigGesture).toBe("hand_raise");
    expect(presenceAvatarPetSummon({ avatarUid: "avatar:proto:3", petUid: "ghost:1" }).ok).toBe(true);
    expect(
      presenceAvatarAgentInvoke({
        avatarUid: "avatar:proto:3",
        agentUid: "gpt:tool:1",
        intent: "ping"
      }).ok
    ).toBe(true);

    const s = getStudioKernelState();
    const pr = s.presence.avatars["avatar:proto:3"]?.projection;
    expect(pr?.lastReactionKind).toBe("applaud");
    expect(pr?.raisedHand).toBe(true);
    expect(pr?.summonedPetUid).toBe("ghost:1");
    expect(pr?.lastAgentInvokeUid).toBe("gpt:tool:1");
    expect(pr?.lastAgentInvokeIntent).toBe("ping");
    expect(typeof pr?.lastAgentInvokeAt).toBe("number");

    const kinds = deltaKinds();
    expect(kinds.includes("avatar.react")).toBe(true);
    expect(kinds.includes("avatar.raise_hand")).toBe(true);
    expect(kinds.includes("avatar.pet.summon")).toBe(true);
    expect(kinds.includes("pet.spawn")).toBe(true);
    expect(kinds.includes("pet.follow")).toBe(true);
    expect(kinds.includes("pet.observe")).toBe(true);
    expect(kinds.includes("pet.react")).toBe(true);
    const slot = stablePetSlotUid("avatar:proto:3");
    expect(s.presence.pets?.[slot]?.displayPetUid).toBe("ghost:1");
    expect(s.presence.avatars["avatar:proto:3"]?.ghostPetSlotUid).toBe(slot);
    expect(kinds.includes("avatar.agent.invoke")).toBe(true);
    expect(kinds.includes("agent.spawn")).toBe(false);

    expect(ghostPetDepart({ ownerAvatarUid: "avatar:proto:3" }).ok).toBe(true);
    expect(getStudioKernelState().presence.pets?.[slot]).toBeUndefined();
  });

  it("non-ghost pet summon does not emit pet.spawn chain", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:ng", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:ng", linkedEntityUid: "ent:proto:ng" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:ng", title: "Lab" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:ng", avatarUid: "avatar:proto:ng" }).ok).toBe(true);
    expect(presenceAvatarPetSummon({ avatarUid: "avatar:proto:ng", petUid: "robot:1" }).ok).toBe(true);
    const kinds = deltaKinds();
    expect(kinds.includes("avatar.pet.summon")).toBe(true);
    expect(kinds.includes("pet.spawn")).toBe(false);
  });

  it("Rhizoh companion spawns on @Rhizoh invoke (agent.spawn → listen → respond)", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:rz:1", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:rz:1", linkedEntityUid: "ent:rz:1" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:rz:1", title: "Hall" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:rz:1", avatarUid: "avatar:rz:1" }).ok).toBe(true);

    expect(
      presenceAvatarAgentInvoke({
        avatarUid: "avatar:rz:1",
        agentUid: "sidekick:1",
        intent: "@Rhizoh what is the hall mood?"
      }).ok
    ).toBe(true);

    const s = getStudioKernelState();
    const key = stableRhizohCompanionUid("avatar:rz:1");
    expect(s.presence.avatars["avatar:rz:1"]?.companionAgentUid).toBe(key);
    expect(s.presence.companionAgents?.[key]?.archetype).toBe("rhizoh");
    expect(s.presence.companionAgents?.[key]?.state).toBe("orbiting");
    expect(s.presence.companionAgents?.[key]?.lastResponseSummary).toContain("Rhizoh");

    const kinds = Object.values(s.registry.causalGraph.nodes).map(
      (n) => (n.payload.delta as { kind?: string })?.kind ?? ""
    );
    expect(kinds.includes("agent.spawn")).toBe(true);
    expect(kinds.includes("agent.listen")).toBe(true);
    expect(kinds.includes("agent.respond")).toBe(true);

    expect(rhizohCompanionDepart({ ownerAvatarUid: "avatar:rz:1" }).ok).toBe(true);
    const s2 = getStudioKernelState();
    expect(s2.presence.companionAgents?.[key]).toBeUndefined();
    expect(s2.presence.avatars["avatar:rz:1"]?.companionAgentUid).toBeUndefined();
  });

  it("double speak.start coalesces stub segment (previous closed without stop node id)", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:5", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:5", linkedEntityUid: "ent:proto:5" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:5", title: "Lab5" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:5", avatarUid: "avatar:proto:5" }).ok).toBe(true);
    expect(presenceAvatarSpeakStart({ avatarUid: "avatar:proto:5" }).ok).toBe(true);
    expect(presenceAvatarSpeakStart({ avatarUid: "avatar:proto:5" }).ok).toBe(true);
    const stub = getStudioKernelState().presence.voiceStubByRoomUid?.["room:proto:5"]?.segments ?? [];
    expect(stub.length).toBe(2);
    expect(stub[0]?.endMs).toBeDefined();
    expect(stub[1]?.endMs).toBeUndefined();
  });

  it("move preserves protocol projection fields", () => {
    resetRhizohStudioKernelStore();
    seed();
    expect(registerEntity({ uid: "ent:proto:4", ownerId: "proto-owner" }).ok).toBe(true);
    expect(bindAvatarToEntity({ avatarUid: "avatar:proto:4", linkedEntityUid: "ent:proto:4" }).ok).toBe(true);
    expect(createPresenceRoom({ roomUid: "room:proto:4", title: "Lab4" }).ok).toBe(true);
    expect(joinPresenceRoom({ roomUid: "room:proto:4", avatarUid: "avatar:proto:4" }).ok).toBe(true);
    expect(presenceAvatarPetSummon({ avatarUid: "avatar:proto:4", petUid: "ghost:orbit" }).ok).toBe(true);

    const before = getStudioKernelState().presence.avatars["avatar:proto:4"]?.projection;
    expect(moveAvatarInRoom({
      avatarUid: "avatar:proto:4",
      roomUid: "room:proto:4",
      pos: { x: (before?.transform.x ?? 0) + 0.4, y: before?.transform.y ?? 0, z: (before?.transform.z ?? 0) - 0.2 }
    }).ok).toBe(true);

    const after = getStudioKernelState().presence.avatars["avatar:proto:4"]?.projection;
    expect(after?.summonedPetUid).toBe("ghost:orbit");
  });
});
