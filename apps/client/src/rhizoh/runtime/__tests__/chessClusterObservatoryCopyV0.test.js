import { describe, expect, it } from "vitest";
import {
  CHESS_CLUSTER_SLOT_ROLE_COPY_V0,
  formatClusterEndReasonLabelV0,
  formatEngineDisplayLabelV0,
  getChessObservatoryHeroCopyV0,
  resolveClusterSlotRoleCopyV0
} from "../chessClusterObservatoryCopyV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "../chessLearningMonitorV0.js";

describe("chessClusterObservatoryCopyV0", () => {
  it("defines 8 slot role copy rows", () => {
    expect(CHESS_CLUSTER_SLOT_ROLE_COPY_V0).toHaveLength(8);
    expect(CHESS_CLUSTER_SLOT_ROLE_COPY_V0[0].slotId).toBe(0);
  });

  it("formats timeout end reason for humans", () => {
    expect(formatClusterEndReasonLabelV0("timeout", 22, true)).toBe("Süre doldu · 22 hamle");
    expect(formatClusterEndReasonLabelV0("timeout", 22, false)).toBe("Time flag · 22 moves");
  });

  it("resolves featured slot copy", () => {
    const copy = resolveClusterSlotRoleCopyV0(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0, true);
    expect(copy.featured).toBe(true);
    expect(copy.tag).toBe("CANLI YAYIN");
    expect(copy.role).toContain("Stockfish");
  });

  it("exposes hero lobby CTA", () => {
    const hero = getChessObservatoryHeroCopyV0(true);
    expect(hero.title).toBe("rhizohchess");
    expect(hero.lobbyCta).toContain("Canlı yayın");
  });

  it("simplifies engine telemetry labels", () => {
    expect(formatEngineDisplayLabelV0("stockfish_wasm", true)).toBe("Stockfish");
    expect(formatEngineDisplayLabelV0("broadcast_grid_heuristic", true)).toBe("B-roll iz");
    expect(formatEngineDisplayLabelV0("rhizoh_learned_stockfish", false)).toBe("Rhizoh (learned)");
  });
});
