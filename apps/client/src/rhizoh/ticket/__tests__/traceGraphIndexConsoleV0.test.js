import { describe, expect, it, beforeEach } from "vitest";
import { emitMutationRecordV0, clearMutationRecordsForTestV0 } from "../mutationRecordEmitterV0.js";
import {
  clearTraceGraphIndexForTestV0,
  getLiveIndexSnapshotV0
} from "../traceGraphIndexOptimizerV0.js";
import {
  isTraceGraphIndexConsoleMountedV0,
  mountTraceGraphIndexConsoleV0,
  resetTraceGraphIndexConsoleForTestV0
} from "../traceGraphIndexConsoleV0.js";
import { TICKET_VALIDATION_DECISION_V0 } from "../ticketSecurityConstantsV0.js";

describe("traceGraphIndexConsoleV0", () => {
  beforeEach(() => {
    clearMutationRecordsForTestV0();
    clearTraceGraphIndexForTestV0();
    resetTraceGraphIndexConsoleForTestV0();
    globalThis.window = /** @type {any} */ ({ __rhizoh: {} });
  });

  it("mounts window.__rhizoh.traceGraphIndex with snapshot API", () => {
    const snap = mountTraceGraphIndexConsoleV0();
    expect(snap.ok).toBe(true);
    expect(isTraceGraphIndexConsoleMountedV0()).toBe(true);
    expect(typeof globalThis.window.__rhizoh.traceGraphIndex.snapshot).toBe("function");
    expect(globalThis.window.__rhizoh.traceGraphIndex.interpretationOnly).toBe(true);
  });

  it("bootstraps existing mutation ledger on first mount", () => {
    emitMutationRecordV0({
      decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
      validation: { valid: false, reasons: ["epoch_closed"] },
      intent: { transitionType: "read", ticketId: "t1" },
      ticket: { ticketId: "t1" },
      actor: { actorId: "test_actor" }
    });

    mountTraceGraphIndexConsoleV0();
    const index = getLiveIndexSnapshotV0();
    expect(index.liveIngestCount).toBeGreaterThanOrEqual(1);
    expect(globalThis.window.__rhizoh.traceGraphIndex.getSnapshot().liveIngestCount).toBeGreaterThanOrEqual(
      1
    );
  });

  it("survives idempotent remount", () => {
    mountTraceGraphIndexConsoleV0();
    expect(() => mountTraceGraphIndexConsoleV0()).not.toThrow();
    expect(Object.isFrozen(globalThis.window.__rhizoh.traceGraphIndex)).toBe(true);
  });
});
