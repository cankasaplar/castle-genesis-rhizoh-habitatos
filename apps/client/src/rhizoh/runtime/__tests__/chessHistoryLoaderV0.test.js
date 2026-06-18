import { beforeEach, describe, expect, it } from "vitest";
import { __resetChessMemoryStoreForTestV0, readChessMemoryStoreV0 } from "../chessMemoryStoreV0.js";
import {
  importChessHistoryPgnV0,
  loadChessHistorySeedCorpusV0
} from "../chessHistoryLoaderV0.js";
import { __resetChessHistoryBrainForTestV0 } from "../chessHistoryBrainReportV0.js";

const MINI_PGN = `[Event "Loader Test"]
[White "Kasparov, G."]
[Black "Karpov, A."]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1-0`;

describe("chessHistoryLoaderV0", () => {
  beforeEach(() => {
    __resetChessMemoryStoreForTestV0();
    __resetChessHistoryBrainForTestV0();
    localStorage.clear();
  });

  it("importChessHistoryPgnV0 persists game with quality tier", () => {
    const result = importChessHistoryPgnV0(MINI_PGN, {
      qualityTier: "gm_classical",
      source: "test"
    });
    expect(result.ok).toBe(true);
    expect(result.imported).toBe(1);
    const store = readChessMemoryStoreV0();
    expect(store.games.length).toBe(1);
    expect(store.games[0].qualityTier).toBe("gm_classical");
    expect(store.games[0].whiteStyleId).toBe("kasparov");
  });

  it("loadChessHistorySeedCorpusV0 is idempotent", () => {
    const first = loadChessHistorySeedCorpusV0();
    expect(first.ok).toBe(true);
    expect(first.imported).toBeGreaterThanOrEqual(2);
    const second = loadChessHistorySeedCorpusV0();
    expect(second.skipped).toBe(true);
    expect(second.imported).toBe(0);
  });
});
