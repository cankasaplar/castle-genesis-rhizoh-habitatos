import { describe, expect, it, beforeEach } from "vitest";
import {
  ROOM_ARBITRATION_DISPOSITION_V1_2,
  __resetRoomArbitrationForTestV1_2,
  arbitrateRoomRealityV1_2,
  collectRoomConflictCandidatesV1_2,
  resolveRoomConflictV1_2
} from "../castleRoomArbitrationV1_2.js";
import {
  __resetRoomRealityForTestV1_2,
  initRoomRealityV1_2,
  registerIdentityAttentionEventV1_2,
  buildIdentityAttentionEventV1_2
} from "../castleRoomRealityV1_2.js";
import {
  __resetConversationThreadsForTestV1_2,
  createConversationThreadV1_2
} from "../castleConversationThreadV1_2.js";
import { normalizeExperienceSignalV1 } from "../castleMultiStreamFusionBusV1.js";

describe("castleRoomArbitrationV1_2", () => {
  beforeEach(() => {
    __resetRoomArbitrationForTestV1_2();
    __resetRoomRealityForTestV1_2();
    __resetConversationThreadsForTestV1_2();
    initRoomRealityV1_2({
      roomId: "test_room",
      users: [
        { userId: "user_a", role: "guest" },
        { userId: "user_b", role: "guest" }
      ]
    });
  });

  function seedIdentityEvent(ownerId, preview, atMs, type = "intent") {
    const normalized = normalizeExperienceSignalV1("mic", {
      text: preview,
      ownerId,
      atMs
    });
    const raw = buildIdentityAttentionEventV1_2(normalized, { ownerId, salience: 0.7 });
    return registerIdentityAttentionEventV1_2({ ...raw, type });
  }

  it("resolveRoomConflict applies owner affinity on same priority tie", () => {
    const atMs = 10_000;
    initRoomRealityV1_2({
      roomId: "affinity_room",
      users: [
        { userId: "user_host", role: "host" },
        { userId: "user_guest", role: "guest" }
      ]
    });
    seedIdentityEvent("user_host", "maç pozisyonu?", atMs);
    seedIdentityEvent("user_guest", "teknik soru api", atMs + 100);

    const candidates = collectRoomConflictCandidatesV1_2({ atMs: atMs + 200 });
    expect(candidates.length).toBeGreaterThanOrEqual(2);

    const resolution = resolveRoomConflictV1_2(candidates, { localUserId: "user_host" });
    expect(resolution.winner?.ownerId).toBe("user_host");
    expect(resolution.reason).toBe("owner_affinity");
  });

  it("resolveRoomConflict prefers higher thread priority when affinity tied", () => {
    const atMs = 20_000;
    const sportsThread = createConversationThreadV1_2({
      ownerId: "user_b",
      topicLabel: "co_watch_sports",
      priority: 85,
      atMs
    });
    createConversationThreadV1_2({
      ownerId: "user_a",
      topicLabel: "general",
      priority: 50,
      atMs
    });

    const candidates = Object.freeze([
      Object.freeze({
        ownerId: "user_a",
        eventId: "e1",
        threadId: "thread_general",
        priority: 70,
        salience: 0.7,
        preview: "hello",
        type: "intent",
        atMs
      }),
      Object.freeze({
        ownerId: "user_b",
        eventId: "e2",
        threadId: sportsThread.threadId,
        priority: 70,
        salience: 0.7,
        preview: "goal replay",
        type: "intent",
        atMs: atMs + 50
      })
    ]);

    const resolution = resolveRoomConflictV1_2(candidates, { localUserId: "user_observer" });
    expect(resolution.reason).toBe("thread_priority");
    expect(resolution.winner?.ownerId).toBe("user_b");
  });

  it("arbitrateRoomReality defers speak for non-winning ingress owner", () => {
    initRoomRealityV1_2({
      roomId: "defer_room",
      users: [
        { userId: "user_host", role: "host" },
        { userId: "user_guest", role: "guest" }
      ]
    });
    const atMs = 30_000;
    seedIdentityEvent("user_host", "Rhizoh maçı anlat", atMs);

    const guestNormalized = normalizeExperienceSignalV1("mic", {
      text: "Rhizoh teknik soru",
      ownerId: "user_guest",
      atMs: atMs + 50
    });
    const guestIdentity = buildIdentityAttentionEventV1_2(guestNormalized, {
      ownerId: "user_guest",
      salience: 0.75
    });

    const result = arbitrateRoomRealityV1_2({
      actionPlan: { speak: true, priority: 70, mode: "co_presence", tickId: 1 },
      identityEvent: guestIdentity,
      ownerId: "user_guest",
      localUserId: "user_host",
      atMs: atMs + 100
    });

    expect(result.disposition).toBe(ROOM_ARBITRATION_DISPOSITION_V1_2.DEFER);
    expect(result.gatedActionPlan.speak).toBe(false);
    expect(result.activeRealityOwnerId).toBe("user_host");
  });

  it("arbitrateRoomReality grants when ingress owner wins conflict", () => {
    initRoomRealityV1_2({
      roomId: "grant_room",
      users: [{ userId: "user_host", role: "host" }]
    });
    const atMs = 40_000;
    const normalized = normalizeExperienceSignalV1("mic", {
      text: "Rhizoh acil yardım",
      ownerId: "user_host",
      atMs
    });
    const identity = buildIdentityAttentionEventV1_2(normalized, {
      ownerId: "user_host",
      salience: 0.95
    });
    registerIdentityAttentionEventV1_2({ ...identity, type: "emergency" });

    const result = arbitrateRoomRealityV1_2({
      actionPlan: { speak: true, priority: 100, mode: "emergency", tickId: 2 },
      identityEvent: identity,
      ownerId: "user_host",
      localUserId: "user_host",
      atMs
    });

    expect(result.disposition).toBe(ROOM_ARBITRATION_DISPOSITION_V1_2.GRANT);
    expect(result.gatedActionPlan.speak).toBe(true);
  });
});
