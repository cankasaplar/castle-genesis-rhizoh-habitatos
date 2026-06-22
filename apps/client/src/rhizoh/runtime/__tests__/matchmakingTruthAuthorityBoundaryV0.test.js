import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  runMatchmakingAuthorityBoundaryVerifyV0,
  runMatchmakingDriftInjectionVerifyV0
} from "../matchmakingTruthAuthorityBoundaryV0.js";
import { clearMatchCommitLogForTestV0 } from "../matchAuthorityKernelV0.js";
import { clearMatchmakingTruthForTestV0 } from "../matchmakingTruthKernelV0.js";
import { MATCH_TRUTH_CHAIN_PHASE_V0 } from "../matchmakingTruthAuthorityObservabilityV0.js";

describe("matchmakingTruthAuthorityBoundaryV0", () => {
  beforeEach(() => {
    clearMatchmakingTruthForTestV0();
    clearMatchCommitLogForTestV0();
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("verifyAuthorityBoundary reports SERVER_BOUND with simulated gateway", () => {
    const out = runMatchmakingAuthorityBoundaryVerifyV0({ reset: true });
    expect(out.ok).toBe(true);
    expect(out.stage).toBe("SERVER_BOUND");
    expect(out.proposalAuthority).toBe("client_shadow");
    expect(out.commitAuthority).toBe("server_primary");
    expect(out.serverAuthoritative).toBe(true);
    expect(out.previewChainOk).toBe(true);
    expect(out.authoritativeChainOk).toBe(true);
  });

  it("verifyDriftInjection detects drift and reconciles", () => {
    const out = runMatchmakingDriftInjectionVerifyV0({ reset: true });
    expect(out.ok).toBe(true);
    expect(out.driftDetected).toBe(true);
    expect(out.reconciliationApplied).toBe(true);
    expect(out.divergedBeforeReconcile).toBe(true);
  });
});
