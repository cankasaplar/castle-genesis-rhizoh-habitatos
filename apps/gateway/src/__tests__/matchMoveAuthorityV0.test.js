import test from "node:test";
import assert from "node:assert/strict";
import { WS_MESSAGE } from "@castle/protocol";
import {
  clearMatchMoveAuthoritySessionsForTestV0,
  getMatchMoveAuthoritySessionForTestV0,
  handleMatchMoveAuthorityV0
} from "../rhizoh/matchMoveAuthorityV0.js";

test("gateway rejects illegal move", () => {
  clearMatchMoveAuthoritySessionsForTestV0();
  const sent = [];
  const socket = {
    send: (raw) => sent.push(JSON.parse(raw))
  };
  const wss = { clients: new Set([socket]) };

  const out = handleMatchMoveAuthorityV0(
    socket,
    {
      type: WS_MESSAGE.MATCH_MOVE,
      sessionId: "match_test",
      payload: { san: "Qxd9", playerId: "p1" }
    },
    wss
  );

  assert.equal(out.ok, false);
  assert.equal(sent[0]?.type, WS_MESSAGE.MATCH_ERROR);
});

test("gateway commits legal move and broadcasts ack", () => {
  clearMatchMoveAuthoritySessionsForTestV0();
  const sent = [];
  const socket = { send: (raw) => sent.push(JSON.parse(raw)) };
  const peer = { readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) };
  const wss = { clients: new Set([socket, peer]) };

  const out = handleMatchMoveAuthorityV0(
    socket,
    {
      type: WS_MESSAGE.MATCH_MOVE,
      sessionId: "match_test",
      payload: { san: "e4", playerId: "p1" }
    },
    wss
  );

  assert.equal(out.ok, true);
  assert.equal(sent.filter((m) => m.type === WS_MESSAGE.MATCH_MOVE_ACK).length, 2);
  const server = getMatchMoveAuthoritySessionForTestV0("match_test");
  assert.equal(server.moveCount, 1);
  assert.equal(out.ack.commitAuthority, "server");
});
