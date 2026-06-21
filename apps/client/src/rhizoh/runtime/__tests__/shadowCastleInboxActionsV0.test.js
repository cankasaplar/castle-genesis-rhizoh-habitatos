import { describe, expect, it, beforeEach } from "vitest";
import { CHESS_GAME_MODE_V0 } from "../chessArenaEngineV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "../symbyoMapIntentBridgeV0.js";
import {
  resolveShadowInboxItemActionV0,
  runShadowInboxItemActionV0,
  SHADOW_INBOX_ACTION_V0
} from "../shadowCastleInboxActionsV0.js";
import { __resetShadowCastlePeerRegistryForTestV0 } from "../shadowCastlePeerRegistryV0.js";

describe("shadowCastleInboxActionsV0", () => {
  beforeEach(() => {
    __resetShadowCastlePeerRegistryForTestV0();
  });

  it("resolveShadowInboxItemActionV0 routes chess items to arena", () => {
    expect(resolveShadowInboxItemActionV0({ kind: "chess" })).toBe(
      SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA
    );
    expect(resolveShadowInboxItemActionV0({ eventType: "chess.move.v0" })).toBe(
      SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA
    );
    expect(resolveShadowInboxItemActionV0({ kind: "visit" })).toBe(
      SHADOW_INBOX_ACTION_V0.FLY_TO_PIN
    );
  });

  it("runShadowInboxItemActionV0 dispatches chess arena open", () => {
    const events = [];
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, (ev) => events.push(ev.detail));
    const out = runShadowInboxItemActionV0(
      { kind: "chess", bodyTr: "e4", san: "e4" },
      { uiLocale: "tr" }
    );
    expect(out.action).toBe(SHADOW_INBOX_ACTION_V0.OPEN_CHESS_ARENA);
    expect(events[0]?.initialMode).toBe(CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH);
    expect(events[0]?.autoPlay).toBe(true);
    expect(events[0]?.node?.id).toBe("chess_arena");
  });
});
