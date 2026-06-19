import { describe, expect, it, beforeEach } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../mutationReasonCodeOntologyV1.js";
import {
  buildDensityFieldV0,
  buildRecTimeLayerV0,
  bindCognitiveVisualizationV0,
  clearCognitiveVizPushRateLimitForTestV0,
  pullAuthorityContextV0,
  pushPerceptionStreamV0
} from "../cognitiveVisualizationBindingV0.js";
import { buildAlertPacketV0, clearAnomalyDetectorStateForTestV0 } from "../driftAnomalyDetectorV0.js";

describe("cognitiveVisualizationBindingV0", () => {
  beforeEach(() => {
    clearCognitiveVizPushRateLimitForTestV0();
    clearAnomalyDetectorStateForTestV0();
  });

  it("PUSH emits suggest-only epistemic UI events (DR-01)", () => {
    const alert = buildAlertPacketV0({
      category: MUTATION_REASON_CATEGORY_V1.SC,
      suggestion: "sc_frequency_increased",
      confidence: 0.7,
      deltaHint: { category: "SC", shareDelta01: 0.2, countDelta: 5 }
    });
    const out = pushPerceptionStreamV0({ anomalies: { alerts: [alert] } });
    expect(out.flow).toBe("push");
    expect(out.uiEvents[0].executionClass).toBe("suggest");
    expect(out.uiEvents[0].eventKind).toBe("epistemic:drift-anomaly");
    expect(out.uiEvents[0].visual.hueDeg).toBe(15);
  });

  it("PULL returns authority context without CubeState commit", () => {
    const pull = pullAuthorityContextV0({
      reconcile: { proposedCubeDelta: { epochId: "rec_epoch_a" } },
      commit: { ok: false, code: "admission_not_admit" }
    });
    expect(pull.flow).toBe("pull");
    expect(pull.cubeStateCommit).toBe(false);
    expect(pull.executionClass).toBe("read_only");
  });

  it("buildDensityFieldV0 maps SC/QUOTA categories to spatial layers", () => {
    const field = buildDensityFieldV0({
      drift: { categoryCounts: { SC: 6, QUOTA: 4 } }
    });
    expect(field.layers.length).toBe(2);
    expect(field.layers.find((l) => l.category === "SC")?.visual.geometry).toBe("angular_spikes");
  });

  it("buildRecTimeLayerV0 exposes waveform envelope from pending queue", () => {
    const layer = buildRecTimeLayerV0({
      epochId: "rec_core_morning",
      pendingQueue: [{}, {}, {}],
      recHistory: []
    });
    expect(layer.waveform.peak).toBe("A");
    expect(layer.waveform.localTimeAnchor).toBe("06:44");
    expect(layer.waveform.pendingCompressionCount).toBe(3);
  });

  it("bindCognitiveVisualizationV0 integrates push pull density and rec layer", () => {
    const alert = buildAlertPacketV0({
      category: MUTATION_REASON_CATEGORY_V1.QUOTA,
      suggestion: "quota_stress_detected",
      confidence: 0.6
    });
    const bound = bindCognitiveVisualizationV0({
      pipeline: {
        index: { indexSnapshot: {}, drift: { categoryCounts: { QUOTA: 3 } } },
        analytics: {},
        anomalies: { alerts: [alert] },
        reconcile: null,
        commit: null,
        admission: null
      }
    });
    expect(bound.push.flow).toBe("push");
    expect(bound.pull.flow).toBe("pull");
    expect(bound.densityField.kind).toBe("spatial_density_field");
    expect(bound.recTimeLayer.kind).toBe("rec_time_layer");
  });
});
