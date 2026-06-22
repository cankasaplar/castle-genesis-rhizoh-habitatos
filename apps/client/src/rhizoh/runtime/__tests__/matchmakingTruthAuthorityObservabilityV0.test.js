import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  emitMatchTruthAuthorityBootObservabilityV0,
  emitMatchTruthDispatchChainForEventV0,
  emitMatchTruthPreviewChainForEventV0,
  getMatchTruthAuthoritySnapshotV0,
  MATCH_CLIENT_AUTHORITY_V0,
  MATCH_EFFECTIVE_COMMIT_WRITER_V0,
  MATCH_TRUTH_CHAIN_PHASE_V0,
  resetMatchTruthAuthorityObservabilityForTestV0
} from "../matchmakingTruthAuthorityObservabilityV0.js";
import { MATCH_TRUTH_EVENT_V0 } from "../matchmakingTruthKernelV0.js";

describe("matchmakingTruthAuthorityObservabilityV0", () => {
  beforeEach(() => {
    resetMatchTruthAuthorityObservabilityForTestV0();
    window.__CASTLE_BOOT_LOG__ = {
      ok: vi.fn()
    };
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("client never presents as commit authority — effectiveCommitWriter is SSOT", () => {
    const snap = getMatchTruthAuthoritySnapshotV0();
    expect(snap.clientIsCommitAuthority).toBe(false);
    expect(snap.commitAuthority).toBeNull();
    expect(snap.effectiveCommitWriter).toBe(MATCH_EFFECTIVE_COMMIT_WRITER_V0.PENDING_SERVER);
    expect(snap.proposalAuthority).toBe(MATCH_CLIENT_AUTHORITY_V0.PROPOSAL);
    expect(snap.previewAuthority).toBe(MATCH_CLIENT_AUTHORITY_V0.PREVIEW);
    expect(snap.simulationAuthority).toBe(MATCH_CLIENT_AUTHORITY_V0.SIMULATION);
  });

  it("derives commitAuthority only after gateway finalization", () => {
    const snap = getMatchTruthAuthoritySnapshotV0({ gatewayReady: true });
    expect(snap.commitAuthority).toBe("server");
    expect(snap.effectiveCommitWriter).toBe(MATCH_EFFECTIVE_COMMIT_WRITER_V0.SERVER);
    expect(snap.serverAuthoritative).toBe(true);
  });

  it("emits boot with effectiveCommitWriter not client commitAuthority", () => {
    emitMatchTruthAuthorityBootObservabilityV0();
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.truth_commit_bridge",
      expect.stringContaining("effectiveCommitWriter=pending_server")
    );
    expect(window.__CASTLE_BOOT_LOG__.ok).toHaveBeenCalledWith(
      "boot.truth_commit_bridge",
      expect.stringContaining("clientRole=reality_simulator")
    );
  });

  it("preview chain omits commitAuthority", () => {
    const chain = emitMatchTruthPreviewChainForEventV0({
      logEntry: { seq: 1, type: MATCH_TRUTH_EVENT_V0.PROPOSE_MOVE, sessionId: "m1" },
      effect: { ok: true, validated: true, validationSource: "chess.js_local" },
      nextState: { activeSession: { sessionId: "m1" } },
      prevState: {}
    });
    expect(chain.chain.map((c) => c.phase)).toContain(MATCH_TRUTH_CHAIN_PHASE_V0.TRUTH_LOG_PREVIEW);
    expect(chain.chain.every((c) => c.commitAuthority == null)).toBe(true);
  });

  it("authoritative chain includes derived commitAuthority after server ack", () => {
    const chain = emitMatchTruthDispatchChainForEventV0({
      logEntry: { seq: 1, type: MATCH_TRUTH_EVENT_V0.COMMIT_MOVE, sessionId: "m1" },
      effect: { ok: true, committed: true, validationSource: "authority_gateway" },
      nextState: { activeSession: { sessionId: "m1" } },
      prevState: {},
      gatewayReady: true
    });
    expect(chain.chain.map((c) => c.phase)).toContain(MATCH_TRUTH_CHAIN_PHASE_V0.MATCH_EVENT_COMMITTED);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("commitAuthority=server")
    );
  });
});
