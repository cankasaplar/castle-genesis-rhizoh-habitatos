import { describe, expect, it, beforeEach } from "vitest";
import {
  BOUNDARY_STATE_V0,
  collectClientBoundarySnapshotV0,
  evaluateExternalBoundaryValidationV0,
  observeExternalBoundaryBreachV0,
  runExternalBoundaryValidationV0
} from "../externalBoundaryValidationV0.js";
import {
  clearBreachObservationTraceForTestV0,
  getBreachObservationTraceV0
} from "../violationObservationLogV0.js";

describe("externalBoundaryValidationV0 (A11)", () => {
  beforeEach(() => {
    clearBreachObservationTraceForTestV0();
  });

  it("ALIGNED when client seq within gateway tolerance", () => {
    const r = evaluateExternalBoundaryValidationV0(
      collectClientBoundarySnapshotV0({
        clientSeqHead: 12,
        eventSeqTail: [10, 11, 12]
      }),
      {
        gatewayLive: true,
        lastAcceptedSeq: 10,
        healthStatus: 200,
        fetchPhase: "runtime_ok",
        collectedAtMs: Date.now()
      }
    );
    expect(r.boundary_state).toBe(BOUNDARY_STATE_V0.ALIGNED);
    expect(r.checks.seqAlignment.ok).toBe(true);
  });

  it("DIVERGED when client seq far ahead of gateway", () => {
    const r = evaluateExternalBoundaryValidationV0(
      collectClientBoundarySnapshotV0({ clientSeqHead: 100, eventSeqTail: [98, 99, 100] }),
      {
        gatewayLive: true,
        lastAcceptedSeq: 10,
        healthStatus: 200,
        fetchPhase: "runtime_ok",
        collectedAtMs: Date.now()
      }
    );
    expect(r.boundary_state).toBe(BOUNDARY_STATE_V0.DIVERGED);
    expect(r.checks.seqAlignment.detail).toBe("client_seq_ahead_of_gateway");
  });

  it("SKIPPED when gateway unreachable and not required", () => {
    const r = evaluateExternalBoundaryValidationV0(
      collectClientBoundarySnapshotV0({ clientSeqHead: 5 }),
      {
        gatewayLive: false,
        lastAcceptedSeq: null,
        healthStatus: null,
        fetchPhase: "network",
        collectedAtMs: Date.now()
      }
    );
    expect(r.boundary_state).toBe(BOUNDARY_STATE_V0.SKIPPED);
  });

  it("observeExternalBoundaryBreach records factual trace on DIVERGED", () => {
    const r = evaluateExternalBoundaryValidationV0(
      collectClientBoundarySnapshotV0({ clientSeqHead: 50 }),
      {
        gatewayLive: true,
        lastAcceptedSeq: 1,
        healthStatus: 200,
        fetchPhase: "runtime_ok",
        collectedAtMs: Date.now()
      }
    );
    observeExternalBoundaryBreachV0(r);
    expect(getBreachObservationTraceV0().total).toBe(1);
    expect(getBreachObservationTraceV0().entries[0].source).toBe("externalBoundaryValidationV0");
  });

  it("runExternalBoundaryValidationV0 without fetch stays SKIPPED", async () => {
    const r = await runExternalBoundaryValidationV0({
      fetchExternal: false,
      client: collectClientBoundarySnapshotV0({ clientSeqHead: 3 }),
      observe: false
    });
    expect(r.boundary_state).toBe(BOUNDARY_STATE_V0.SKIPPED);
  });
});
