import { describe, it, expect, beforeEach } from "vitest";
import {
  buildContinuityReconciliationSuggestions,
  formatContinuityProbeReportMarkdown,
  CONTINUITY_BAND_NOT_ONTOLOGY
} from "./continuityAssessmentExportV1.js";
import { runOperationalContinuityProbeV1 } from "./operationalContinuityProbeV1.js";
import { ingestRcilEvent, drainRcilQueueOnce, __resetRcilLiveWiringForTests } from "./rcilLiveWiringV1.js";
import { __resetRrhpMinimalProjectionForTests } from "./rcilRrhpMinimalBridgeV1.js";

describe("continuityAssessmentExportV1", () => {
  beforeEach(() => {
    __resetRcilLiveWiringForTests();
    __resetRrhpMinimalProjectionForTests();
  });

  it("buildContinuityReconciliationSuggestions is readOnly and includes disclaimer", () => {
    const probe = runOperationalContinuityProbeV1({});
    const s = buildContinuityReconciliationSuggestions(probe);
    expect(s.readOnly).toBe(true);
    expect(s.disclaimer).toBe(CONTINUITY_BAND_NOT_ONTOLOGY);
    expect(s.suggestions.length).toBeGreaterThan(0);
  });

  it("projection_regressed yields critical suggestion", () => {
    ingestRcilEvent({ type: "z", source: "client" });
    drainRcilQueueOnce();
    const probe = runOperationalContinuityProbeV1({
      restoredSlice: { operationalReconcileTotal: 9, appliedMetaTail: [{ seq: 1, type: "z", at: 1 }] }
    });
    const s = buildContinuityReconciliationSuggestions(probe);
    expect(s.suggestions.some((x) => x.id === "rrhp_projection_regressed" && x.severity === "critical")).toBe(true);
  });

  it("formatContinuityProbeReportMarkdown includes boundary and contributions table", () => {
    const probe = runOperationalContinuityProbeV1({
      restoredSlice: { operationalReconcileTotal: 0, appliedMetaTail: [] }
    });
    const md = formatContinuityProbeReportMarkdown(probe);
    expect(md).toContain(CONTINUITY_BAND_NOT_ONTOLOGY);
    expect(md).toContain("## Confidence");
    expect(md).toContain("### contributions");
    expect(md).toContain("Reconciliation suggestions");
  });
});
