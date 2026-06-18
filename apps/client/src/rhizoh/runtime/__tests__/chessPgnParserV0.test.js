import { beforeEach, describe, expect, it } from "vitest";
import { parseChessPgnGameV0, parseChessPgnBundleV0 } from "../chessPgnParserV0.js";

const MINI_PGN = `[Event "Test"]
[White "Alpha"]
[Black "Beta"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`;

describe("chessPgnParserV0", () => {
  it("parseChessPgnGameV0 extracts headers and SAN moves", () => {
    const parsed = parseChessPgnGameV0(MINI_PGN);
    expect(parsed?.headers.White).toBe("Alpha");
    expect(parsed?.moves[0]).toBe("e4");
    expect(parsed?.moves.length).toBeGreaterThanOrEqual(5);
  });

  it("parseChessPgnBundleV0 handles multi-game text", () => {
    const bundle = `${MINI_PGN}\n\n${MINI_PGN}`;
    const games = parseChessPgnBundleV0(bundle);
    expect(games.length).toBe(2);
  });
});
