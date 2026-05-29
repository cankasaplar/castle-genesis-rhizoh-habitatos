import { describe, it, expect } from "vitest";
import { deriveExecutionSequenceIdV0 } from "../executionSequenceIdV0.js";
import { createActuatorExecutionClockV0 } from "../actuatorExecutionClockV0.js";
import { rejectIfStaleOrOutOfOrderAckV0 } from "../staleAckRejectorV0.js";
import { createDuplicateExecutionBarrierV0 } from "../duplicateExecutionBarrierV0.js";
import {
  EXECUTION_TEMPORAL_CODE,
  PHYSICAL_TEMPORAL_CODE,
  temporalDriftScopeV0
} from "../physicalDriftNamespaceV0.js";
import { buildPhysicalAckEnvelopeV0 } from "../physicalAckEnvelopeV0.js";
import { DRIFT_SCOPE } from "../driftNamespaceV0.js";

describe("executionSequenceIdV0", () => {
  it("is deterministic for same inputs", () => {
    const a = deriveExecutionSequenceIdV0({
      lane: "active",
      logicalTick: 3,
      actuator: "HUE",
      executionId: "ex-1"
    });
    const b = deriveExecutionSequenceIdV0({
      lane: "active",
      logicalTick: 3,
      actuator: "HUE",
      executionId: "ex-1"
    });
    expect(a).toBe(b);
    expect(a.startsWith("esq_")).toBe(true);
  });

  it("differs when logicalTick differs", () => {
    const a = deriveExecutionSequenceIdV0({ lane: "a", logicalTick: 1, actuator: "HUE", executionId: "x" });
    const b = deriveExecutionSequenceIdV0({ lane: "a", logicalTick: 2, actuator: "HUE", executionId: "x" });
    expect(a).not.toBe(b);
  });
});

describe("actuatorExecutionClockV0", () => {
  it("orders COMMAND_SENT before ACK and exposes last command", () => {
    const clk = createActuatorExecutionClockV0();
    const cmd = clk.recordCommandSent({
      atMs: 100,
      lane: "observer",
      executionId: "e1",
      commandHash: "hash-a",
      actuator: "HUE"
    });
    expect(cmd.kind).toBe("COMMAND_SENT");
    expect(cmd.sequenceId.length).toBeGreaterThan(4);
    clk.recordAckReceived({
      atMs: 150,
      executionId: "e1",
      commandHash: "hash-a",
      actuator: "HUE",
      sequenceId: cmd.sequenceId
    });
    const last = clk.lastCommandSentFor("e1");
    expect(last?.commandHash).toBe("hash-a");
    expect(clk.snapshot().length).toBe(2);
    clk.reset();
    expect(clk.snapshot().length).toBe(0);
  });
});

describe("staleAckRejectorV0", () => {
  it("rejects ACK received long before command dispatch (stale)", () => {
    const ack = buildPhysicalAckEnvelopeV0({
      executionId: "e1",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 100,
      deviceState: {},
      commandHash: "h1"
    });
    const r = rejectIfStaleOrOutOfOrderAckV0(ack, {
      lastCommandDispatchedAtMs: 10_000,
      clockSkewToleranceMs: 500
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(PHYSICAL_TEMPORAL_CODE.STALE_ACK);
    expect(r.scope).toBe(DRIFT_SCOPE.PHYSICAL);
  });

  it("rejects out-of-order sequenceId when expected is set", () => {
    const ack = buildPhysicalAckEnvelopeV0({
      executionId: "e1",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 20_000,
      deviceState: {},
      commandHash: "h1",
      sequenceId: "wrong-seq"
    });
    const r = rejectIfStaleOrOutOfOrderAckV0(ack, {
      expectedSequenceId: "expected-seq",
      lastCommandDispatchedAtMs: 1000
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe(PHYSICAL_TEMPORAL_CODE.OUT_OF_ORDER_ACK);
  });

  it("accepts aligned ACK", () => {
    const ack = buildPhysicalAckEnvelopeV0({
      executionId: "e1",
      actuator: "HUE",
      acknowledged: true,
      receivedAt: 5000,
      deviceState: {},
      commandHash: "h1",
      sequenceId: "seq-x"
    });
    const r = rejectIfStaleOrOutOfOrderAckV0(ack, {
      expectedExecutionId: "e1",
      expectedCommandHash: "h1",
      expectedSequenceId: "seq-x",
      lastCommandDispatchedAtMs: 4000
    });
    expect(r.ok).toBe(true);
  });
});

describe("duplicateExecutionBarrierV0", () => {
  it("rejects second commit with same commandHash", () => {
    const b = createDuplicateExecutionBarrierV0(32);
    expect(b.tryCommit("h1", 1).ok).toBe(true);
    const r = b.tryCommit("h1", 2);
    expect(r.ok).toBe(false);
    expect(/** @type {{ code?: string }} */ (r).code).toBe(EXECUTION_TEMPORAL_CODE.DUPLICATE_EXECUTION);
  });
});

describe("physicalDriftNamespaceV0", () => {
  it("maps temporal codes to execution vs physical scope", () => {
    expect(temporalDriftScopeV0(EXECUTION_TEMPORAL_CODE.DUPLICATE_EXECUTION)).toBe(DRIFT_SCOPE.EXECUTION);
    expect(temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.STALE_ACK)).toBe(DRIFT_SCOPE.PHYSICAL);
    expect(temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.OUT_OF_ORDER_ACK)).toBe(DRIFT_SCOPE.PHYSICAL);
  });
});
