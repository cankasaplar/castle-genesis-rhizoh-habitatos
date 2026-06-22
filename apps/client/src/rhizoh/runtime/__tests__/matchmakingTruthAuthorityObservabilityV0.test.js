import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  emitMatchTruthAuthorityBootObservabilityV0,
  emitMatchTruthDispatchChainForEventV0,
  getMatchTruthAuthoritySnapshotV0,
  MATCH_PROPOSAL_AUTHORITY_V0,
  MATCH_TRUTH_CHAIN_PHASE_V0,
  resetMatchTruthAuthorityObservabilityForTestV0
} from "../matchmakingTruthAuthorityObservabilityV0.js";
import { MATCH_COMMIT_AUTHORITY_POLICY_V0 } from "../matchmakingSingleWriterPolicyV0.js";
import { MATCH_TRUTH_EVENT_V0 } from "../matchmakingTruthKernelV0.js";

describe("matchmakingTruthAuthorityObservabilityV0", () => {
  beforeEach(() => {
    resetMatchTruthAuthorityObservabilityForTestV0();
    window.__CASTLE_BOOT_LOG__ = {
      ok: vi.fn()
    };
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("declares honest shadow authority until gateway ready", () => {
    const snap = getMatchTruthAuthoritySnapshotV0();
    expect(snap.authorityMode).toBe("SERVER_PRIMARY");
    expect(snap.serverAuthoritative).toBe(false);
    expect(snap.commitAuthority).toBe(MATCH_COMMIT_AUTHORITY_POLICY_V0.SERVER_PRIMARY);
    expect(snap.effectiveCommitWriter).toBe("client_shadow");
    expect(snap.proposalAuthority).toBe(MATCH_PROPOSAL_AUTHORITY_V0.CLIENT_SHADOW);
    expect(snap.effectiveAuthority).toBe("SHADOW_CLIENT");
  });

  it("emits boot authority observability once", () => {
    const a = emitMatchTruthAuthorityBootObservabilityV0();
    const b = emitMatchTruthAuthorityBootObservabilityV0();
    expect(a.ok).toBe(true);
    expect(b.skipped).toBe(true);
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.match_authority",
      "authority=server_primary"
    );
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.truth_commit_bridge",
      expect.stringContaining("mode=append_only")
    );
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.reconciliation",
      "shadow_vs_truth enabled · strategy=diff-merge"
    );
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.drift_detector",
      expect.stringContaining("noise=0.1")
    );
  });

  it("emits dispatch chain on commit move", () => {
    const chain = emitMatchTruthDispatchChainForEventV0({
      logEntry: { seq: 1, type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE, sessionId: "m1" },
      effect: { ok: true, committed: true, validated: true, validationSource: "chess.js_local" },
      nextState: { activeSession: { sessionId: "m1" } },
      prevState: {}
    });
    expect(chain.chain.map((c) => c.phase)).toEqual([
      MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_APPEND,
      MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_APPENDED,
      MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_VALIDATED,
      MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_COMMITTED,
      MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_STATE_REDUCED
    ]);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[MATCH_TRUTH_CHAIN] MATCH_EVENT_COMMITTED seq=1")
    );
  });

  it("emits rejected phase on failed validation", () => {
    const chain = emitMatchTruthDispatchChainForEventV0({
      logEntry: { seq: 2, type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE, sessionId: "m1" },
      effect: { ok: false, rejected: true, validated: false },
      nextState: { activeSession: { sessionId: "m1" } },
      prevState: {}
    });
    expect(chain.chain.map((c) => c.phase)).toContain(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_REJECTED);
  });
});
