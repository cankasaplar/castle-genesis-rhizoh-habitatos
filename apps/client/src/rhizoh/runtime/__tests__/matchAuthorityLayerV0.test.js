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
  createMatchSessionV0,
  MATCH_SESSION_STATE_V0
} from "../matchSessionLifecycleV0.js";
import { simulateGatewayMatchMoveAckV0 } from "../matchmakingGatewayCommitBridgeV0.js";
import { validateMatchMoveV0 } from "../matchStockfishValidatorBridgeV0.js";
import { MATCH_KERNEL_STATE_V0 } from "../matchAuthorityKernelV0.js";

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
    const out = applyMatchMoveV0({ san: "e4", playerId: "user_a", autoCommitShadow: false });

    expect(out.pending).toBe(true);
    expect(out.shadowOnly).toBe(true);
    expect(out.session.shadow.moveCount).toBe(1);
    expect(out.session.committed.moveCount).toBe(0);
    expect(out.kernelState).toBe(MATCH_KERNEL_STATE_V0.PENDING_MOVE);
  });

  it("commits only through gateway ack after client proposal", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const proposed = applyMatchMoveV0({ san: "e4", playerId: "user_a" });

    expect(proposed.pending).toBe(true);
    expect(proposed.preview).toBe(true);
    expect(proposed.session.committed.moveCount).toBe(0);

    const validation = validateMatchMoveV0({
      fen: proposed.session.committed.fen,
      san: "e4",
      expectedTurn: "white"
    });
    const committed = simulateGatewayMatchMoveAckV0({
      sessionId: session.sessionId,
      san: "e4",
      playerId: "user_a",
      fen: validation.fen,
      turn: validation.turn
    });

    expect(committed.ok).toBe(true);
    expect(committed.session.authority.effectiveAuthority).toBe("SERVER");
    expect(committed.session.committed.moveCount).toBe(1);
    expect(committed.authority.serverAuthoritative).toBe(true);
  });

  it("commits server lane via gateway provenance helper", () => {
    const session = createMatchSessionV0({ initialState: MATCH_SESSION_STATE_V0.SESSION_ACTIVE });
    const committed = simulateGatewayMatchMoveAckV0({
      sessionId: session.sessionId,
      san: "e4",
      playerId: "user_a",
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
