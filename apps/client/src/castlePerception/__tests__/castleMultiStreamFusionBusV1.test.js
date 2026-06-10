import { describe, expect, it, beforeEach } from "vitest";
import {
  NORMALIZED_EVENT_SCHEMA_V1,
  NORMALIZED_EVENT_PROTOCOL_VERSION_V1_2,
  __resetFusionBusForTestV1,
  getImmutableEventLogV1,
  getFusionBusSnapshotV1,
  ingestFusionBusV1,
  initCastleRoomV1,
  normalizeExperienceSignalV1,
  publishNarrativeStreamTickV1,
  publishStreamEventV1
} from "../castleMultiStreamFusionBusV1.js";
import { __resetCastleAttentionFieldForTestV1 } from "../castleAttentionFieldV1.js";
import { __resetExperienceFabricForTestV1 } from "../../rhizoh/runtime/rhizohExperienceFabricV1.js";

describe("castleMultiStreamFusionBusV1", () => {
  beforeEach(() => {
    __resetFusionBusForTestV1();
    __resetCastleAttentionFieldForTestV1();
    __resetExperienceFabricForTestV1();
    initCastleRoomV1({ roomId: "test_room", participants: ["userA", "rhizohA"] });
  });

  it("freezes immutable NormalizedEventV1 schema", () => {
    const norm = normalizeExperienceSignalV1("youtube", {
      preview: "goal replay",
      mediaPositionMs: 763_000
    });
    expect(norm.schema).toBe(NORMALIZED_EVENT_SCHEMA_V1);
    expect(norm.protocolVersion).toBe(NORMALIZED_EVENT_PROTOCOL_VERSION_V1_2);
    expect(norm.ownerId).toBe("user_local");
    expect(norm.id).toMatch(/^evt_/);
    expect(norm.payload.vector).toBeTruthy();
    expect(norm.temporalSpan).toMatch(/instant|short|long/);
  });

  it("append-only log never mutates events", () => {
    ingestFusionBusV1("youtube", { preview: "live match", mediaPositionMs: 5000 });
    ingestFusionBusV1("mic", { text: "Rhizoh dinle", userInitiated: true });
    const log = getImmutableEventLogV1();
    expect(log.length).toBe(2);
    expect(Object.isFrozen(log[0])).toBe(true);
    expect(log[0].payload).toBeDefined();
    expect(log[1].source).toBe("mic");
  });

  it("narrative tick uses long temporal span", () => {
    publishNarrativeStreamTickV1({ source: "file", preview: "audiobook ch.3" });
    const snap = getFusionBusSnapshotV1();
    expect(snap.recentEvents[0].temporalSpan).toBe("long");
  });

  it("publishStreamEvent ticks attention field graph", () => {
    publishStreamEventV1({ source: "mic", text: "bunu not al", userAction: "pause" });
    const snap = getFusionBusSnapshotV1();
    expect(snap.attentionField.nodeCount).toBeGreaterThan(0);
  });
});
