import { describe, expect, it, beforeEach } from "vitest";
import { runStudioObservationDemoSeedV0 } from "../rhizohStudioDemoSeedV0.js";
import { resetCalendarEventAdapterForTestV0 } from "../calendarEventAdapterV0.js";
import { resetMediaEventAdapterForTestV0 } from "../mediaEventAdapterV0.js";
import { resetUserActivityAdapterForTestV0 } from "../userActivityEventAdapterV0.js";
import { resetWorldBridgeMemoryGraphForTestV0 } from "../worldBridgeMemoryGraphV0.js";

describe("rhizohStudioDemoSeedV0", () => {
  beforeEach(() => {
    resetCalendarEventAdapterForTestV0();
    resetMediaEventAdapterForTestV0();
    resetUserActivityAdapterForTestV0();
    resetWorldBridgeMemoryGraphForTestV0();
  });

  it("seeds calendar media activity and returns ACHIEVED visibility", () => {
    const out = runStudioObservationDemoSeedV0({ locale: "en" });
    expect(out.ok).toBe(true);
    expect(out.interpretationOnly).toBe(true);
    expect(out.feedbackToExecution).toBe(false);
    expect(out.calendarOk).toBe(true);
    expect(out.mediaOk).toBe(true);
    expect(out.activityOk).toBe(true);
    expect(out.lifeOsStatus).toBe("ACHIEVED");
    expect(out.visibility.worldBridge.memoryNodeCount).toBeGreaterThan(0);
  });
});
