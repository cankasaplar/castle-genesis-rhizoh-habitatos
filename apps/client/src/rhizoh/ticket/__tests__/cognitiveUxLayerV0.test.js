import { describe, expect, it, beforeEach } from "vitest";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { clearMutationRecordsForTestV0, emitMutationRecordV0 } from "../mutationRecordEmitterV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import { clearRecTombstoneQueueForTestV0 } from "../recTombstoneQueueV0.js";
import { clearAnomalyDetectorStateForTestV0 } from "../driftAnomalyDetectorV0.js";
import { clearTraceGraphIndexForTestV0 } from "../traceGraphIndexOptimizerV0.js";
import { resetDriftSuggestionSequenceForTestV0 } from "../driftAnalyticsEngineV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "../mutationReasonCodeOntologyV1.js";
import {
  buildEpistemicViewportV0,
  projectDriftFieldViewportV0,
  projectRecWaveformViewportV0
} from "../cognitiveUxSpatialProjectionV0.js";
import {
  bindCognitiveUxV0,
  buildCognitiveUxSnapshotV0,
  onUserTraverseV0,
  COGNITIVE_UX_TRAVERSAL_EVENT_V0
} from "../cognitiveUxLayerV0.js";
import { runTicketMemoryPipelineV0 } from "../ticketMemoryPipelineV0.js";
import { buildDensityFieldV0 } from "../cognitiveVisualizationBindingV0.js";
import { CAL_INTERACTION_TYPE_V0 } from "../cognitiveActionLayerV0.js";

function emitRejected(reasonSlug, ticketId) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId,
    traceGraphLink: `edge_${ticketId}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: [reasonSlug], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: "rec_epoch_a"
  });
}

describe("cognitiveUxSpatialProjectionV0", () => {
  it("projects density field layers to SVG paths", () => {
    const density = buildDensityFieldV0({
      indexSnapshot: { categoryCounts: { SC: 3, QUOTA: 1 } }
    });
    const viewport = projectDriftFieldViewportV0(density);
    expect(viewport.layers.length).toBe(2);
    expect(viewport.layers[0].paths.length).toBeGreaterThan(0);
  });

  it("builds epistemic viewport with drift rec and sc layers", () => {
    const density = buildDensityFieldV0({
      indexSnapshot: { categoryCounts: { SC: 2, REC: 1 } }
    });
    const binding = {
      densityField: density,
      recTimeLayer: {
        epochId: "rec_soft",
        waveform: { envelopeThickness01: 0.4, peak: "trough" }
      }
    };
    const vp = buildEpistemicViewportV0(binding);
    expect(vp.driftField.layers.length).toBeGreaterThan(0);
    expect(vp.recWaveform.waveform.paths.length).toBeGreaterThan(0);
    expect(vp.scSpike.layer?.geometry).toBe("angular_spikes");
  });
});

describe("cognitiveUxLayerV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearTraceGraphIndexForTestV0();
    clearRecTombstoneQueueForTestV0();
    clearAnomalyDetectorStateForTestV0();
    resetDriftSuggestionSequenceForTestV0();
  });

  it("onUserTraverseV0 returns read_only exploration from nodeId", () => {
    emitRejected("ticket_packet_direct_execution", "tkt_cux_1");
    const packet = onUserTraverseV0({
      nodeId: `category:${MUTATION_REASON_CATEGORY_V1.SC}`,
      dispatchEvent: false
    });
    expect(packet.executionClass).toBe("read_only");
    expect(packet.exploration.causallyInert).toBe(true);
    expect(packet.exploration.ticketLineage.length).toBeGreaterThan(0);
  });

  it("dispatches traversal event on traverse", () => {
    emitRejected("quota_exceeded", "tkt_cux_2");
    let received = null;
    const handler = (ev) => {
      received = ev.detail;
    };
    globalThis.addEventListener(COGNITIVE_UX_TRAVERSAL_EVENT_V0, handler);
    onUserTraverseV0({ nodeId: "category:QUOTA", dispatchEvent: true });
    globalThis.removeEventListener(COGNITIVE_UX_TRAVERSAL_EVENT_V0, handler);
    expect(received?.nodeId).toBe("category:QUOTA");
  });

  it("bindCognitiveUxV0 composes binding action viewport with CNR guard", () => {
    const records = [emitRejected("ticket_packet_direct_execution", "tkt_bind")];
    const pipeline = runTicketMemoryPipelineV0({
      records,
      bindCux: true,
      wireSignals: false
    });
    const cux = bindCognitiveUxV0({
      pipeline,
      interaction: {
        interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
        targetCategory: MUTATION_REASON_CATEGORY_V1.SC
      }
    });
    expect(cux.cnrGuard.ok).toBe(true);
    expect(cux.viewport.chess).toBeDefined();
    expect(cux.viewport.sports).toBeDefined();
    expect(cux.cognitiveAction?.exploration).toBeDefined();
    expect(cux.cubeStateCommit).toBe(false);
  });

  it("buildCognitiveUxSnapshotV0 returns full snapshot", () => {
    emitRejected("orphan_edge", "tkt_snap");
    const snap = buildCognitiveUxSnapshotV0();
    expect(snap.cux.binding).toBeDefined();
    expect(snap.eventChannels.traversal).toBe(COGNITIVE_UX_TRAVERSAL_EVENT_V0);
  });
});

describe("ticketMemoryPipelineV0 cognitiveAction", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearTraceGraphIndexForTestV0();
    clearRecTombstoneQueueForTestV0();
    clearAnomalyDetectorStateForTestV0();
    resetDriftSuggestionSequenceForTestV0();
  });

  it("wires cognitiveAction when bindCux is true", () => {
    const records = [emitRejected("quota_exceeded", "tkt_cal")];
    const pipeline = runTicketMemoryPipelineV0({ records, bindCux: true, wireSignals: false });
    expect(pipeline.cognitiveBinding).toBeDefined();
    expect(pipeline.cognitiveAction?.exploration.causallyInert).toBe(true);
  });
});
