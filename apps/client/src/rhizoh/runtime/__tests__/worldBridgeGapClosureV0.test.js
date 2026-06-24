import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateExecutionPermissionV0,
  EXECUTION_ACTION_CLASS_V0
} from "../executionPermissionLayerV0.js";
import { buildCalendarActionTriggerV0 } from "../calendarActionTriggerV0.js";
import {
  runMediaFeedbackObservationCycleV0,
  resetMediaFeedbackObservationLoopForTestV0
} from "../mediaFeedbackObservationLoopV0.js";
import {
  projectWorldBridgeShadowToLedgerV0,
  resetWorldBridgeShadowTraceBridgeForTestV0
} from "../worldBridgeShadowTraceBridgeV0.js";
import { buildHabitatClimateSnapshotV0 } from "../habitatClimatePatternEngineV0.js";
import { resetCalendarEventAdapterForTestV0 } from "../calendarEventAdapterV0.js";
import { resetMediaEventAdapterForTestV0 } from "../mediaEventAdapterV0.js";

describe("executionPermissionLayerV0", () => {
  it("permits observation always", () => {
    const perm = evaluateExecutionPermissionV0({ actionClass: EXECUTION_ACTION_CLASS_V0.OBSERVE });
    expect(perm.observationPermitted).toBe(true);
    expect(perm.mutationPermitted).toBe(false);
  });

  it("blocks mutation in shadow", () => {
    const perm = evaluateExecutionPermissionV0({ actionClass: EXECUTION_ACTION_CLASS_V0.MUTATE });
    expect(perm.mutationPermitted).toBe(false);
  });
});

describe("calendarActionTriggerV0", () => {
  it("emits suggest-only trigger", () => {
    const trigger = buildCalendarActionTriggerV0({ title: "Focus", eventType: "scheduled" });
    expect(trigger.executionClass).toBe("suggest");
    expect(trigger.feedbackToExecution).toBe(false);
    expect(trigger.triggered).toBe(true);
  });
});

describe("mediaFeedbackObservationLoopV0", () => {
  beforeEach(() => {
    resetMediaFeedbackObservationLoopForTestV0();
    resetMediaEventAdapterForTestV0();
  });

  it("runs observation cycle without execution feedback", () => {
    const cycle = runMediaFeedbackObservationCycleV0(
      { eventType: "playhead", positionSec: 12 },
      { dispatchEvent: false, fuse: false }
    );
    expect(cycle.feedbackToExecution).toBe(false);
    expect(cycle.controlsPlayer).toBe(false);
    expect(cycle.cycleSeq).toBe(1);
  });
});

describe("worldBridgeShadowTraceBridgeV0", () => {
  beforeEach(() => {
    resetWorldBridgeShadowTraceBridgeForTestV0();
  });

  it("projects shadow entry when shadow mode active", () => {
    const out = projectWorldBridgeShadowToLedgerV0(
      {
        eventId: "cal_1",
        shadow: { branchId: "day_a", narrative: "focus", outcomeScore01: 0.7 }
      },
      "calendar"
    );
    expect(out.interpretationOnly).toBe(true);
    expect(typeof out.projected).toBe("boolean");
  });
});

describe("habitatClimatePatternEngineV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
  });

  it("builds three-lane climate snapshot", () => {
    const snap = buildHabitatClimateSnapshotV0();
    expect(snap.schema).toContain("habitat_climate");
    expect(snap.pattern).toBeDefined();
    expect(snap.evolution).toBeDefined();
    expect(snap.identity).toBeDefined();
    expect(snap.horizon).toBe("session_v0");
  });
});
