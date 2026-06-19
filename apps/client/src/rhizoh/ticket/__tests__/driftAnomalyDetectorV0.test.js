import { describe, expect, it, beforeEach } from "vitest";
import {
  ANOMALY_SEVERITY_V0,
  buildAlertPacketV0,
  clearAnomalyDetectorStateForTestV0,
  detectDriftAnomaliesV0,
  DRIFT_ANOMALY_TYPE_V0,
  evaluateAnomalyLayersV0
} from "../driftAnomalyDetectorV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "../mutationReasonCodeOntologyV1.js";

describe("driftAnomalyDetectorV0", () => {
  beforeEach(() => {
    clearAnomalyDetectorStateForTestV0();
  });

  it("builds suggest-only AlertPacket", () => {
    const packet = buildAlertPacketV0({
      category: MUTATION_REASON_CATEGORY_V1.SC,
      severity: ANOMALY_SEVERITY_V0.MEDIUM,
      suggestion: "review_admission_policy",
      confidence: 0.73
    });
    expect(packet.type).toBe(DRIFT_ANOMALY_TYPE_V0);
    expect(packet.executionClass).toBe("suggest");
    expect(packet.confidence).toBeCloseTo(0.73, 2);
  });

  it("requires all 3 layers for alert eligibility", () => {
    const layer1 = evaluateAnomalyLayersV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_a",
      baselineShares: { SC: 0.1 }
    });
    const scEval = layer1.evaluations.find((e) => e.category === "SC");
    expect(scEval.layers.absoluteSpike).toBe(true);
    expect(scEval.layers.relativeDrift).toBe(true);
    expect(scEval.layers.persistence).toBe(false);
    expect(scEval.alertEligible).toBe(false);

    evaluateAnomalyLayersV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_b",
      baselineShares: { SC: 0.1 }
    });

    const layer3 = evaluateAnomalyLayersV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_c",
      baselineShares: { SC: 0.1 }
    });
    const scFinal = layer3.evaluations.find((e) => e.category === "SC");
    expect(scFinal.layers.persistence).toBe(true);
    expect(scFinal.alertEligible).toBe(true);
  });

  it("detectDriftAnomaliesV0 emits AlertPackets only when all layers pass", () => {
    evaluateAnomalyLayersV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_a",
      baselineShares: { SC: 0.05 }
    });
    evaluateAnomalyLayersV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_b",
      baselineShares: { SC: 0.05 }
    });
    const out = detectDriftAnomaliesV0({
      categoryCounts: { SC: 6 },
      total: 10,
      epochId: "rec_epoch_c",
      baselineShares: { SC: 0.05 }
    });
    expect(out.alerts.length).toBeGreaterThan(0);
    expect(out.alerts[0].executionClass).toBe("suggest");
    expect(out.dr01Enforced).toBe(true);
  });
});
