import { describe, expect, it, beforeEach } from "vitest";
import {
  applyServerMatchCommitV0,
  attachAuthorityToSessionV0,
  buildMatchAuthorityContractV0,
  getMatchAuthorityStatusV0,
  proposeShadowMatchMoveV0,
  reconcileMatchAuthorityV0
} from "../matchAuthorityLayerV0.js";
import {
  applyMatchMoveV0,
  clearMatchSessionForTestV0,
  commitMatchMoveV0,
  createMatchSessionV0,
  MATCH_SESSION_STATE_V0
} from "../matchSessionLifecycleV0.js";

describe("matchAuthorityLayerV0", () => {
  beforeEach(() => {
    clearMatchSessionForTestV0();
  });

  it("declares SERVER_PRIMARY contract with honest SHADOW_CLIENT effective authority", () => {
    const contract = buildMatchAuthorityContractV0();
    expect(contract.mode).toBe("SERVER_PRIMARY");
    expect(contract.commitRequired).toBe(true);
    expect(contract.reconciliation).toBe("diff-merge");
    expect(contract.effectiveAuthority).toBe("SHADOW_CLIENT");
    expect(contract.serverAuthoritative).toBe(false);
  });

  it("proposes shadow moves without committing authoritative lane", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const out = applyMatchMoveV0({ san: "e4", playerId: "user_a" });

    expect(out.shadowOnly).toBe(true);
    expect(out.pendingCommit).toBe(true);
    expect(out.committed).toBe(false);
    expect(out.session.shadow.moveCount).toBe(1);
    expect(out.session.committed.moveCount).toBe(0);
    expect(out.authority.effectiveAuthority).toBe("PENDING_SERVER_ACK");
  });

  it("commits server lane and flips effective authority to SERVER", () => {
    createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const committed = commitMatchMoveV0({
      san: "e4",
      playerId: "user_a",
      serverSeq: 1,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      turn: "black"
    });

    expect(committed.ok).toBe(true);
    expect(committed.session.authority.effectiveAuthority).toBe("SERVER");
    expect(committed.session.serverAuthoritative).toBe(true);
    expect(committed.session.committed.moveCount).toBe(1);
  });

  it("reconciles shadow divergence toward server state", () => {
    const base = attachAuthorityToSessionV0(
      createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE })
    );
    const diverged = proposeShadowMatchMoveV0(base, { san: "e4", playerId: "user_a" }).session;
    const reconciled = reconcileMatchAuthorityV0(diverged, {
      serverState: {
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        turn: "black",
        moveCount: 1,
        serverSeq: 1
      }
    });

    expect(reconciled.ok).toBe(true);
    expect(reconciled.session.shadow.fen).toBe(reconciled.session.committed.fen);
    expect(getMatchAuthorityStatusV0(reconciled.session).diverged).toBe(false);
  });
});
