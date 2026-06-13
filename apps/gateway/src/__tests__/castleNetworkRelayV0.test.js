import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CASTLE_NETWORK_SIGNAL_V0,
  CASTLE_PRESENCE_STATE_V0,
  handleCastleNetworkSignalV0,
  listCastleNetworkPresenceV0,
  removeCastleNetworkClientV0,
  resetCastleNetworkRelayForTestV0,
  validateCastleNetworkSignalPayloadV0
} from "../castleNetworkRelayV0.js";

function makeSocket(clientId, uid = clientId) {
  return {
    clientId,
    auth: { user: { uid } },
    readyState: 1
  };
}

function makeWss(clients = []) {
  return { clients };
}

describe("castleNetworkRelayV0", () => {
  it("registers PEER_JOIN and returns roster on PEER_DISCOVER", () => {
    resetCastleNetworkRelayForTestV0();
    const sent = [];
    const socketA = makeSocket("client_a", "castle_a");
    const socketB = makeSocket("client_b", "castle_b");
    const wss = makeWss([
      { clientId: "client_a", readyState: 1, send: (msg) => sent.push({ to: "client_a", msg }) },
      { clientId: "client_b", readyState: 1, send: (msg) => sent.push({ to: "client_b", msg }) }
    ]);

    const joinPayload = {
      signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN,
      castleId: "castle_a",
      userId: "castle_a",
      presence: {
        castleId: "castle_a",
        state: CASTLE_PRESENCE_STATE_V0.ONLINE,
        region: "TR",
        viewers: 0,
        lat: 41.01,
        lon: 28.99
      }
    };
    assert.equal(validateCastleNetworkSignalPayloadV0(socketA, joinPayload), null);
    handleCastleNetworkSignalV0(socketA, joinPayload, wss);

    const roster = listCastleNetworkPresenceV0("world_space_c2c_v0");
    assert.equal(roster.length, 1);
    assert.equal(roster[0].castleId, "castle_a");
    assert.equal(roster[0].state, CASTLE_PRESENCE_STATE_V0.ONLINE);

    handleCastleNetworkSignalV0(
      socketB,
      {
        signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER,
        castleId: "castle_b",
        userId: "castle_b"
      },
      wss
    );
    const discoverMsg = sent.find((row) => row.to === "client_b");
    assert.ok(discoverMsg);
    const parsed = JSON.parse(discoverMsg.msg);
    assert.equal(parsed.payload.signalType, CASTLE_NETWORK_SIGNAL_V0.PEER_DISCOVER);
    assert.ok(Array.isArray(parsed.payload.roster));
    assert.equal(parsed.payload.roster.length, 1);
  });

  it("relays REALTIME unicast and removes client on disconnect", () => {
    resetCastleNetworkRelayForTestV0();
    const sent = [];
    const socketA = makeSocket("client_a", "castle_a");
    const socketB = makeSocket("client_b", "castle_b");
    const wss = makeWss([
      { clientId: "client_a", readyState: 1, send: (msg) => sent.push({ to: "client_a", msg }) },
      { clientId: "client_b", readyState: 1, send: (msg) => sent.push({ to: "client_b", msg }) }
    ]);

    handleCastleNetworkSignalV0(socketA, {
      signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN,
      castleId: "castle_a",
      userId: "castle_a",
      presence: { castleId: "castle_a", state: CASTLE_PRESENCE_STATE_V0.ONLINE }
    }, wss);
    handleCastleNetworkSignalV0(socketB, {
      signalType: CASTLE_NETWORK_SIGNAL_V0.PEER_JOIN,
      castleId: "castle_b",
      userId: "castle_b",
      presence: { castleId: "castle_b", state: CASTLE_PRESENCE_STATE_V0.THINKING }
    }, wss);

    handleCastleNetworkSignalV0(socketA, {
      signalType: CASTLE_NETWORK_SIGNAL_V0.REALTIME,
      to: "client_b",
      realtime: { type: "SYNC_PING", payload: { ok: true }, peerUid: "castle_b" }
    }, wss);

    const rtMsg = sent.find((row) => row.to === "client_b");
    assert.ok(rtMsg);
    const parsed = JSON.parse(rtMsg.msg);
    assert.equal(parsed.payload.signalType, CASTLE_NETWORK_SIGNAL_V0.REALTIME);
    assert.equal(parsed.payload.realtime.type, "SYNC_PING");

    removeCastleNetworkClientV0("client_a", wss);
    assert.equal(listCastleNetworkPresenceV0("world_space_c2c_v0").length, 1);
  });
});
