import test from "node:test";
import assert from "node:assert/strict";
import { WS_MESSAGE } from "@castle/protocol";
import {
  clearMatchBroadcastRoomsForTestV0,
  joinMatchBroadcastRoomV0
} from "../rhizoh/matchBroadcastRoomV0.js";
import {
  clearMatchMoveAuthoritySessionsForTestV0,
  handleMatchMoveAuthorityV0
} from "../rhizoh/matchMoveAuthorityV0.js";

test("gateway rejects illegal move", () => {
  clearMatchBroadcastRoomsForTestV0();
  clearMatchMoveAuthoritySessionsForTestV0();
  const sent = [];
  const socket = { clientId: "c1", readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) };
  const wss = { clients: new Set([socket]) };
  joinMatchBroadcastRoomV0(socket, { sessionId: "match_test", role: "player", playerId: "p1" });

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

test("gateway commits legal move and broadcasts to session room", () => {
  clearMatchBroadcastRoomsForTestV0();
  clearMatchMoveAuthoritySessionsForTestV0();
  const sent = [];
  const socket = { clientId: "c1", readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) };
  const peer = { clientId: "c2", readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) };
  const wss = { clients: new Set([socket, peer]) };

  joinMatchBroadcastRoomV0(socket, { sessionId: "match_test", role: "player", playerId: "p1" });
  joinMatchBroadcastRoomV0(peer, { sessionId: "match_test", role: "observer" });

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
  assert.ok(sent.filter((m) => m.type === WS_MESSAGE.MATCH_MOVE_ACK).length >= 2);
  assert.ok(sent.filter((m) => m.type === WS_MESSAGE.MATCH_STATE).length >= 2);
  assert.equal(out.ack.commitAuthority, "server");
});
