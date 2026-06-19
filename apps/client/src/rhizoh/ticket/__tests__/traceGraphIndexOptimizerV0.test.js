import { describe, expect, it, beforeEach } from "vitest";
import { MUTATION_REASON_CODE_V1 } from "../mutationReasonCodeOntologyV1.js";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";
import { clearMutationRecordsForTestV0, emitMutationRecordV0 } from "../mutationRecordEmitterV0.js";
import { clearTicketTombstonesForTestV0 } from "../ticketTombstoneLayerV0.js";
import { buildTicketTransitionIntentV1, TICKET_TRANSITION_TYPE_V0 } from "../ticketTransitionIntentV1.js";
import { clearRecTombstoneQueueForTestV0, getPendingCompressionCountV0 } from "../recTombstoneQueueV0.js";
import {
  clearTraceGraphIndexForTestV0,
  DRIFT_SIGNAL_KIND_V0,
  extractDriftSignalsV0,
  getLiveIndexSnapshotV0,
  ingestMutationRecordForIndexV0,
  listCausalResiduesV0,
  optimizeTraceGraphIndexV0,
  runRecCycleCleanupV0
} from "../traceGraphIndexOptimizerV0.js";

function emitRejected(reasonSlug) {
  const intent = buildTicketTransitionIntentV1({
    transitionType: TICKET_TRANSITION_TYPE_V0.ARENA_ENTER,
    ticketId: `tkt_${reasonSlug}`,
    traceGraphLink: `edge_${reasonSlug}`
  });
  return emitMutationRecordV0({
    decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
    validation: { valid: false, reasons: [reasonSlug], executionClass: "mutate_l1" },
    intent,
    actor: { actorId: "castle:u1" },
    epochId: "rec_2026_06_19_0644"
  });
}

describe("traceGraphIndexOptimizerV0", () => {
  beforeEach(() => {
    clearTraceGraphIndexForTestV0();
    clearRecTombstoneQueueForTestV0();
    clearMutationRecordsForTestV0();
    clearTicketTombstonesForTestV0();
  });

  it("live index increments counters without compression", () => {
    const record = emitRejected("ticket_packet_direct_execution");
    ingestMutationRecordForIndexV0(record);
    const snap = getLiveIndexSnapshotV0();
    expect(snap.reasonCounts[MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT]).toBe(1);
    expect(snap.actorCounts["castle:u1"]).toBe(1);
    expect(snap.epochCounts["rec_2026_06_19_0644"]).toBe(1);
    expect(snap.causalResidueCount).toBe(0);
    expect(getPendingCompressionCountV0()).toBe(1);
  });

  it("defers compression until REC cycle (not on live ingest)", () => {
    const records = [
      emitRejected("orphan_edge"),
      emitRejected("orphan_edge"),
      emitRejected("quota_exceeded")
    ];
    const live = optimizeTraceGraphIndexV0({ records });
    expect(live.mode).toBe("live_only");
    expect(live.residueCount).toBe(0);
    expect(getPendingCompressionCountV0()).toBe(3);

    const rec = runRecCycleCleanupV0({ epochId: "rec_2026_06_19_0644" });
    expect(rec.residues.length).toBeGreaterThan(0);
    expect(listCausalResiduesV0().length).toBeGreaterThan(0);
    expect(getPendingCompressionCountV0()).toBe(0);
  });

  it("compresses via recCycle flag on optimizeTraceGraphIndexV0", () => {
    const records = [emitRejected("orphan_edge"), emitRejected("orphan_edge")];
    optimizeTraceGraphIndexV0({ records });
    const result = optimizeTraceGraphIndexV0({ records: [], recCycle: true, epochId: "rec_epoch_b" });
    expect(result.mode).toBe("live_plus_rec_cleanup");
    expect(result.residueCount).toBeGreaterThan(0);
  });

  it("detects permission drift when SC reasons dominate", () => {
    const records = [];
    for (let i = 0; i < 8; i++) {
      records.push(emitRejected("ticket_packet_direct_execution"));
    }
    for (let i = 0; i < 2; i++) {
      records.push(emitRejected("quota_exceeded"));
    }
    const drift = extractDriftSignalsV0({ records, windowSize: 10 });
    const kinds = drift.signals.map((s) => s.kind);
    expect(kinds).toContain(DRIFT_SIGNAL_KIND_V0.PERMISSION_DRIFT);
    expect(drift.signals[0].executionClass).toBe("suggest");
  });

  it("detects resource stress on QUOTA clustering", () => {
    const records = [];
    for (let i = 0; i < 4; i++) {
      records.push(emitRejected("quota_exceeded"));
    }
    const drift = extractDriftSignalsV0({ records, windowSize: 10 });
    expect(drift.signals.some((s) => s.kind === DRIFT_SIGNAL_KIND_V0.RESOURCE_STRESS)).toBe(true);
  });
});
