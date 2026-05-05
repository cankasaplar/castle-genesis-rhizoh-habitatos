import { describe, expect, it } from "vitest";
import { routeIdentityInfluence, validateInfluenceReplayDeterminism } from "../runtime/identityInfluenceRouter";
import { getInfluenceTrace, resetInfluenceTrace } from "../runtime/influenceTraceRegistry";
import { createInitialStudioKernelState } from "../store/initialState";
import type { IdentityCausalEventV0 } from "../types/rskOntology";

function seedState() {
  const s = createInitialStudioKernelState();
  s.presence.avatars["avatar:guest"] = {
    uid: "avatar:guest",
    ownerId: "guest",
    currentRoomUid: "greenroom:main",
    projection: {
      roomUid: "greenroom:main",
      zoneId: "audience",
      role: "guest",
      transform: { x: 0, y: 0, z: 0, rotY: 0 },
      status: "quiet"
    }
  };
  s.presence.broadcastProjections = s.presence.broadcastProjections || {};
  s.presence.broadcastProjections["broadcast:main"] = {
    uid: "broadcast:main",
    roomUid: "greenroom:main",
    state: "live",
    stageAvatarUids: [],
    audienceCount: 12,
    cameraMode: "auto",
    overlayStack: []
  };
  s.presence.directorByRoomUid = s.presence.directorByRoomUid || {};
  s.presence.directorByRoomUid["greenroom:main"] = {
    sceneMode: "show",
    clipMarkers: []
  };
  return s;
}

describe("identity influence router (P2-F)", () => {
  it("records event -> rule -> handler chain trace", () => {
    resetInfluenceTrace();
    const base = seedState();
    const event: IdentityCausalEventV0 = {
      type: "identity.signature.update",
      actorUid: "guest",
      targetUid: "signature:guest",
      patch: { colorSystem: "violet-gold" },
      timestamp: 1714900000000
    };
    routeIdentityInfluence(base, event);
    const trace = getInfluenceTrace();
    expect(trace.length).toBeGreaterThanOrEqual(1);
    expect(trace[trace.length - 1]).toMatchObject({
      eventType: "identity.signature.update",
      rule: "identity.signature.update.broadcast",
      handler: "broadcast"
    });
  });

  it("snapshot harness remains deterministic across replay", () => {
    resetInfluenceTrace();
    const base = seedState();
    const events: IdentityCausalEventV0[] = [
      {
        type: "identity.avatar.update",
        actorUid: "guest",
        targetUid: "avatar:guest",
        patch: { motionStyle: "drift-soft", aura: "social" },
        timestamp: 1714900000100
      },
      {
        type: "identity.journal.append",
        actorUid: "guest",
        targetUid: "journal:guest",
        patch: { clip: "First memory clip" },
        timestamp: 1714900000200
      }
    ];
    const result = validateInfluenceReplayDeterminism(base, events);
    expect(result.ok).toBe(true);
    expect(result.fingerprintA).toEqual(result.fingerprintB);
    resetInfluenceTrace();
    const finalState = events.reduce((acc, ev) => routeIdentityInfluence(acc, ev), base);
    const trace = getInfluenceTrace().map((t) => ({ rule: t.rule, handler: t.handler }));
    expect({
      focus: finalState.agentRuntime.lastAttentionFocus,
      rationaleCount: finalState.agentRuntime.rationaleLog?.length ?? 0,
      avatarRig: finalState.presence.avatars["avatar:guest"]?.projection?.rigGesture,
      journalOverlayKind: finalState.presence.broadcastProjections?.["broadcast:main"]?.overlayStack?.[0]?.kind,
      trace
    }).toMatchInlineSnapshot(`
      {
        "avatarRig": "think",
        "focus": "memory",
        "journalOverlayKind": "identity.journal",
        "rationaleCount": 1,
        "trace": [
          {
            "handler": "presence",
            "rule": "identity.avatar.update.presence",
          },
          {
            "handler": "rhizoh",
            "rule": "identity.avatar.update.rhizoh",
          },
          {
            "handler": "broadcast",
            "rule": "identity.journal.append.broadcast",
          },
          {
            "handler": "rhizoh",
            "rule": "identity.journal.append.rhizoh",
          },
        ],
      }
    `);
  });
});
