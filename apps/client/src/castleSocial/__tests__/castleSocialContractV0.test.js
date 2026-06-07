import { describe, expect, it } from "vitest";
import {
  buildEventAxisV0,
  digestEventAxisV0,
  EVENT_MODALITY_AXIS_V0,
  EVENT_TEMPORAL_AXIS_V0
} from "../castleEventAxisV0.js";
import {
  isSpatialBindingAllowedV0,
  SESSION_LIFECYCLE_V0
} from "../castleSessionLifecycleV0.js";
import { buildPresenceNodeV0 } from "../castlePresenceNodeV0.js";
import { buildSessionV0 } from "../castleSessionV0.js";
import {
  buildOctoPerformanceFeedV0,
  OCTO_PERFORMANCE_SIGNAL_KIND_V0,
  findOctoPerformanceFeedViolationsV0
} from "../octoPerformanceFeedV0.js";
import { buildSpatialSessionBindingV0 } from "../spatialSessionBindingV0.js";
import { buildEventInstanceV0 } from "../castleEventInstanceV0.js";

describe("castleSocialContractV0", () => {
  it("buildEventAxisV0 is deterministic and frozen", () => {
    const a = buildEventAxisV0({
      participation: "EP_MULTI",
      temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
      modality: EVENT_MODALITY_AXIS_V0.CONCERT
    });
    const b = buildEventAxisV0({
      participation: "EP_MULTI",
      temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
      modality: EVENT_MODALITY_AXIS_V0.CONCERT
    });
    expect(a).toEqual(b);
    expect(digestEventAxisV0(a)).toBe("EP_MULTI|EL_MONO|ET_LIVE|EM_CONCERT|ES_HOME");
    expect(a.readOnly).toBe(true);
  });

  it("LIVE allows spatial binding placeholder only — not execution", () => {
    expect(isSpatialBindingAllowedV0(SESSION_LIFECYCLE_V0.LIVE)).toBe(true);
    expect(isSpatialBindingAllowedV0(SESSION_LIFECYCLE_V0.DRAFT)).toBe(false);
    expect(isSpatialBindingAllowedV0(SESSION_LIFECYCLE_V0.SCHEDULED)).toBe(false);

    const bind = buildSpatialSessionBindingV0({
      sessionId: "sess_1",
      lifecycle: SESSION_LIFECYCLE_V0.LIVE,
      cesiumSessionId: "cesium_placeholder_1",
      octoSessionId: "octo_placeholder_1",
      presentationLensId: "habitat_lens_1"
    });
    expect(bind.bindingAllowed).toBe(true);
    expect(bind.cesiumSessionId).toBe("cesium_placeholder_1");
    expect(bind.active).toBe(false);
  });

  it("non-LIVE spatial binding strips placeholder ids", () => {
    const bind = buildSpatialSessionBindingV0({
      sessionId: "sess_2",
      lifecycle: SESSION_LIFECYCLE_V0.SCHEDULED,
      cesiumSessionId: "should_not_attach"
    });
    expect(bind.bindingAllowed).toBe(false);
    expect(bind.cesiumSessionId).toBe(null);
  });

  it("PresenceNodeV0 carries identity and state labels only", () => {
    const node = buildPresenceNodeV0({
      userId: "uid_a",
      castleId: "castle_a",
      sessionId: "sess_1",
      role: "guest",
      presenceState: "in_session"
    });
    expect(node.ok).toBe(true);
    expect(node.userId).toBe("uid_a");
    expect(node.role).toBe("guest");
    expect(node).not.toHaveProperty("behavior");
    expect(node).not.toHaveProperty("inputGraph");
  });

  it("OctoPerformanceFeedV0 accepts intensity abstraction only", () => {
    const feed = buildOctoPerformanceFeedV0({
      sessionId: "sess_live",
      signalKind: OCTO_PERFORMANCE_SIGNAL_KIND_V0.BEAT,
      intensity: 0.72,
      beatPhase: 0.33,
      crowdDensity: 0.5,
      engagementProxy: 0.61,
      atMs: 1_700_000_000_000
    });
    expect(feed.ok).toBe(true);
    expect(feed.causalClaim).toBe(false);
    expect(feed.intensity).toBe(0.72);
    expect(feed).not.toHaveProperty("audio");
    expect(feed).not.toHaveProperty("motion");
  });

  it("OctoPerformanceFeedV0 rejects forbidden execution/audio keys", () => {
    const violations = findOctoPerformanceFeedViolationsV0({
      intensity: 0.5,
      mediaStream: {},
      routeCesium: true
    });
    expect(violations).toContain("mediaStream");
    expect(violations).toContain("routeCesium");

    const feed = buildOctoPerformanceFeedV0({
      sessionId: "sess_x",
      intensity: 0.5,
      audioBuffer: new ArrayBuffer(8)
    });
    expect(feed.ok).toBe(false);
    expect(feed.reason).toBe("forbidden_feed_keys");
  });

  it("buildEventInstanceV0 composes session + spatial binding contract", () => {
    const event = buildEventInstanceV0({
      eventId: "evt_concert_1",
      hostCastleId: "castle_host",
      lifecycle: SESSION_LIFECYCLE_V0.LIVE,
      axis: {
        temporal: EVENT_TEMPORAL_AXIS_V0.LIVE,
        modality: EVENT_MODALITY_AXIS_V0.CONCERT,
        space: "ES_SHARED"
      },
      spatialBinding: {
        cesiumSessionId: "cesium_stage",
        octoSessionId: "octo_field"
      }
    });
    expect(event.ok).toBe(true);
    expect(event.session.ok).toBe(true);
    expect(event.session.bindingAllowed).toBe(true);
    expect(event.spatialBinding.octoSessionId).toBe("octo_field");
    expect(JSON.stringify(event)).not.toMatch(/webrtc|WebRTC|getUserMedia/i);
  });

  it("buildSessionV0 does not expose execution graph fields", () => {
    const session = buildSessionV0({
      sessionId: "sess_3",
      hostCastleId: "castle_x",
      lifecycle: SESSION_LIFECYCLE_V0.DRAFT
    });
    expect(session.bindingAllowed).toBe(false);
    expect(session).not.toHaveProperty("executionGraph");
    expect(session).not.toHaveProperty("router");
  });
});
