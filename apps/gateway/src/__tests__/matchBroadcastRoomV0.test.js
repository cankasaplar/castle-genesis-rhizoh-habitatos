import test from "node:test";
import assert from "node:assert/strict";
import { WS_MESSAGE } from "@castle/protocol";
import {
  clearMatchBroadcastRoomsForTestV0,
  fanOutMatchSessionV0,
  getMatchSessionPresenceV0,
  handleMatchSessionJoinV0,
  joinMatchBroadcastRoomV0
} from "../rhizoh/matchBroadcastRoomV0.js";
import {
  clearMatchMoveAuthoritySessionsForTestV0,
  handleMatchMoveAuthorityV0
} from "../rhizoh/matchMoveAuthorityV0.js";

test("session join builds presence roster", () => {
  clearMatchBroadcastRoomsForTestV0();
  const sent = [];
  const socket = { clientId: "c1", readyState: 1, send: (r) => sent.push(JSON.parse(r)) };
  const wss = { clients: new Set([socket]) };

  const out = handleMatchSessionJoinV0(
    socket,
    {
      type: WS_MESSAGE.MATCH_SESSION_JOIN,
      sessionId: "match_room_1",
      payload: { role: "player", playerId: "p1" }
    },
    wss
  );

  assert.equal(out.ok, true);
  assert.equal(getMatchSessionPresenceV0("match_room_1").count, 1);
  assert.equal(sent[0]?.type, WS_MESSAGE.MATCH_SESSION_PRESENCE);
});

test("fan-out delivers only to session members", () => {
  clearMatchBroadcastRoomsForTestV0();
  const peerA = { clientId: "a", readyState: 1, send: () => {} };
  const peerB = { clientId: "b", readyState: 1, send: () => {} };
  let bGot = 0;
  peerB.send = () => {
    bGot += 1;
  };
  const outsider = { clientId: "x", readyState: 1, send: () => {} };

  joinMatchBroadcastRoomV0(peerA, { sessionId: "s1", role: "player", playerId: "p1" });
  joinMatchBroadcastRoomV0(peerB, { sessionId: "s1", role: "observer" });
  joinMatchBroadcastRoomV0(outsider, { sessionId: "s2", role: "observer" });

  const delivered = fanOutMatchSessionV0("s1", {
    type: WS_MESSAGE.MATCH_STATE,
    sessionId: "s1",
    payload: { fen: "x" }
  });

  assert.equal(delivered.delivered, 2);
  assert.equal(bGot, 1);
});

test("commit broadcasts ack and state to session room", () => {
  clearMatchBroadcastRoomsForTestV0();
  clearMatchMoveAuthoritySessionsForTestV0();

  const sentA = [];
  const sentB = [];
  const socketA = { clientId: "a", readyState: 1, send: (r) => sentA.push(JSON.parse(r)) };
  const socketB = { clientId: "b", readyState: 1, send: (r) => sentB.push(JSON.parse(r)) };
  const wss = { clients: new Set([socketA, socketB]) };

  joinMatchBroadcastRoomV0(socketA, { sessionId: "m1", role: "player", playerId: "p1" });
  joinMatchBroadcastRoomV0(socketB, { sessionId: "m1", role: "observer" });

  const out = handleMatchMoveAuthorityV0(
    socketA,
    {
      type: WS_MESSAGE.MATCH_MOVE,
      sessionId: "m1",
      payload: { san: "e4", playerId: "p1" }
    },
    wss
  );

  assert.equal(out.ok, true);
  assert.ok(sentA.some((m) => m.type === WS_MESSAGE.MATCH_MOVE_ACK));
  assert.ok(sentA.some((m) => m.type === WS_MESSAGE.MATCH_STATE));
  assert.ok(sentB.some((m) => m.type === WS_MESSAGE.MATCH_MOVE_ACK));
  assert.ok(sentB.some((m) => m.type === WS_MESSAGE.MATCH_STATE));
  assert.equal(out.broadcast?.ack?.delivered, 1);
  assert.equal(out.broadcast?.state?.delivered, 1);
});
