import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
  resetChessLearningWeightsForTestV0
} from "../chessLearningWeightsV0.js";
import { CHESS_LIFETIME_STATS_LS_KEY_V0 } from "../rhizohChessLifetimeStatsV0.js";
import { CHESS_MEMORY_STORE_LS_KEY_V0 } from "../chessMemoryStoreV0.js";
import { RHIZOH_OPENING_BOOK_LS_KEY_V0 } from "../rhizohOpeningBookV0.js";
import {
  __resetRhizohChessLearningCheckpointForTestV0,
  captureChessLearningCheckpointV0,
  ensureRhizohChessLearningCheckpointV0,
  exportChessLearningCheckpointJsonV0,
  freezeChessLearningCheckpointV0,
  handleChessLearningDeployCheckpointV0,
  resumeChessLearningFromCheckpointV0,
  RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0,
  RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0,
  RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0,
  RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0
} from "../rhizohChessLearningCheckpointV0.js";

describe("rhizohChessLearningCheckpointV0", () => {
  beforeEach(() => {
    __resetRhizohChessLearningCheckpointForTestV0();
    resetChessLearningWeightsForTestV0();
    window.__rhizoh = {};
    localStorage.clear();
  });

  it("captures learning_snapshot shape with weights, corpus, opening book", () => {
    localStorage.setItem(
      CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
      JSON.stringify({
        learningMode: true,
        matchesLearned: 7,
        riskPenaltyWeight: 0.5,
        winForcingWeight: 1.1,
        aggressionBias: 0.05,
        forcedWinCorrections: 2
      })
    );
    localStorage.setItem(
      CHESS_LIFETIME_STATS_LS_KEY_V0,
      JSON.stringify({
        movesSeen: 120,
        gamesCompleted: 3,
        gamesObserved: 5,
        driftEvents: 1,
        backfilledAt: new Date().toISOString()
      })
    );
    localStorage.setItem(
      RHIZOH_OPENING_BOOK_LS_KEY_V0,
      JSON.stringify({
        entries: [{ name: "Sicilian", games: 4, wins: 2, losses: 2, key: "sicilian" }]
      })
    );
    localStorage.setItem(
      CHESS_MEMORY_STORE_LS_KEY_V0,
      JSON.stringify({
        graphVersion: 1,
        games: [{ id: "gm_1", qualityTier: "gm_classical" }],
        stats: { totalGamesImported: 1, corpusBundlesLoaded: ["gm_classics_v0"] }
      })
    );

    const snap = captureChessLearningCheckpointV0({ reason: "test" });
    expect(snap.schema).toBe(RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0);
    expect(snap.filename).toMatch(/^learning_snapshot_v1_/);
    expect(snap.weights.matchesLearned).toBe(7);
    expect(snap.lifetime.movesSeen).toBe(120);
    expect(snap.openingBook.totalGames).toBe(4);
    expect(snap.corpus.gameCount).toBe(1);
    expect(snap.trainingResume.weightFingerprint).toContain("7.000");
  });

  it("resume never decreases matchesLearned or lifetime moves", () => {
    const base = captureChessLearningCheckpointV0({ reason: "frozen" });
    const frozen = {
      ...base,
      weights: { ...base.weights, matchesLearned: 12 },
      lifetime: { ...base.lifetime, movesSeen: 4307 },
      corpus: {
        ...base.corpus,
        games: [{ id: "gm_1" }, { id: "gm_2" }, { id: "gm_3" }, { id: "gm_4" }],
        gameCount: 4,
        totalGamesImported: 4
      }
    };

    localStorage.setItem(
      CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
      JSON.stringify({ matchesLearned: 2, riskPenaltyWeight: 0.55, winForcingWeight: 1 })
    );
    localStorage.setItem(
      CHESS_LIFETIME_STATS_LS_KEY_V0,
      JSON.stringify({ movesSeen: 100, backfilledAt: new Date().toISOString() })
    );
    localStorage.setItem(
      CHESS_MEMORY_STORE_LS_KEY_V0,
      JSON.stringify({ graphVersion: 1, games: [], stats: { totalGamesImported: 0 } })
    );

    const result = resumeChessLearningFromCheckpointV0({ checkpoint: frozen, force: true });
    expect(result.regressionsFixed).toContain("weights.matchesLearned");
    expect(result.regressionsFixed).toContain("lifetime.movesSeen");
    expect(result.regressionsFixed).toContain("corpus.gameCount");

    const weights = JSON.parse(localStorage.getItem(CHESS_LEARNING_WEIGHTS_LS_KEY_V0));
    const lifetime = JSON.parse(localStorage.getItem(CHESS_LIFETIME_STATS_LS_KEY_V0));
    const memory = JSON.parse(localStorage.getItem(CHESS_MEMORY_STORE_LS_KEY_V0));
    expect(weights.matchesLearned).toBe(12);
    expect(lifetime.movesSeen).toBe(4307);
    expect(memory.games.length).toBe(4);
  });

  it("freeze pushes previous active snapshot to history ring", () => {
    freezeChessLearningCheckpointV0({ force: true, reason: "first" });
    localStorage.setItem(
      CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
      JSON.stringify({ matchesLearned: 5, riskPenaltyWeight: 0.5, winForcingWeight: 1 })
    );
    freezeChessLearningCheckpointV0({ force: true, reason: "second" });

    const history = JSON.parse(localStorage.getItem(RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0));
    expect(history.length).toBe(1);
    expect(history[0].reason).toBe("first");

    const active = JSON.parse(localStorage.getItem(RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0));
    expect(active.reason).toBe("second");
    expect(active.weights.matchesLearned).toBe(5);
  });

  it("detects deploy tag change and resumes from checkpoint", () => {
    freezeChessLearningCheckpointV0({ force: true, reason: "pre_deploy", deployTag: "rhizoh-shell-v3" });
    localStorage.setItem(
      RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0,
      JSON.stringify({ lastDeployTag: "rhizoh-shell-v3" })
    );
    localStorage.setItem(
      CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
      JSON.stringify({ matchesLearned: 1, riskPenaltyWeight: 0.55, winForcingWeight: 1 })
    );

    vi.stubGlobal("import", { meta: { env: { DEV: false } } });
    const out = handleChessLearningDeployCheckpointV0();
    expect(out.deployChanged).toBe(true);
    expect(out.previousDeployTag).toBe("rhizoh-shell-v3");
    vi.unstubAllGlobals();
  });

  it("installs window APIs and exports JSON", () => {
    ensureRhizohChessLearningCheckpointV0();
    expect(typeof window.__rhizoh.chessLearningCheckpoint).toBe("function");
    expect(typeof window.__rhizoh.freezeChessLearningCheckpoint).toBe("function");
    expect(typeof window.__rhizoh.exportChessLearningCheckpointJson).toBe("function");

    const json = exportChessLearningCheckpointJsonV0();
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe(RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0);
  });
});
