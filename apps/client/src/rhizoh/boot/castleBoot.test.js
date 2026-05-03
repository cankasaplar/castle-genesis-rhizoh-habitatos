import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueCastleRuntimeTransaction,
  peekCastleRuntimeTransactionQueueDepth,
  drainCastleRuntimeTransactionQueue,
  resolveCastleRuntimeTransactionBatch,
  buildRtqBatchLedgerEntryV0,
  clearCastleRuntimeTransactionQueueForTests
} from "./castleRuntimeTransactionQueueV0.js";
import { withRuntimeMergeCommit, getLastRuntimeMergeId } from "./castleRuntimeMergeLayerV0.js";

describe("RTQ v0", () => {
  beforeEach(() => {
    clearCastleRuntimeTransactionQueueForTests();
  });

  it("enqueue chat llm_turn increases depth", () => {
    enqueueCastleRuntimeTransaction({ kind: "llm_turn", source: "chat", payload: { intent: "CHAT" } });
    expect(peekCastleRuntimeTransactionQueueDepth()).toBe(1);
  });

  it("drain returns batch and clears depth", () => {
    enqueueCastleRuntimeTransaction({ kind: "llm_turn", source: "chat" });
    const batch = drainCastleRuntimeTransactionQueue(8);
    expect(batch.length).toBe(1);
    expect(batch[0].source).toBe("chat");
    expect(peekCastleRuntimeTransactionQueueDepth()).toBe(0);
  });

  it("resolve + ledger entry shape", () => {
    const batch = [{ kind: "llm_turn", source: "chat", id: "x", enqueuedAt: 1 }];
    const resolved = resolveCastleRuntimeTransactionBatch(batch, { tickIndex: 3 });
    expect(resolved.approved.length).toBe(1);
    const entry = buildRtqBatchLedgerEntryV0(resolved, 7);
    expect(entry.tickIndex).toBe(7);
    expect(entry.policyDecisionId).toBeTruthy();
  });
});

describe("runtime merge layer", () => {
  it("withRuntimeMergeCommit exposes merge id on window", () => {
    let seen = null;
    withRuntimeMergeCommit(() => {
      seen = getLastRuntimeMergeId();
    });
    expect(seen).toMatch(/^rm_/);
    expect(getLastRuntimeMergeId()).toBe(seen);
  });
});
