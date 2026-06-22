import test from "node:test";
import assert from "node:assert/strict";
import {
  GATEWAY_EVENT_SOURCE_V0,
  createGatewayBroadcastMetaV0,
  createGatewayEventEnvelopeV0
} from "@castle/protocol";
import {
  clearGatewayPresenceRegistryForTestV0,
  listUnifiedGatewayPresenceV0,
  registerGatewayServiceNodeV0
} from "../rhizoh/gatewayPresenceRegistryV0.js";
import {
  clearMatchAckAggregatorForTestV0,
  getMatchBroadcastHealthV0,
  handleMatchStateAppliedV0,
  recordMatchBroadcastStatsV0
} from "../rhizoh/matchAckAggregatorV0.js";

test("gateway event envelope carries session world source seq", () => {
  const env = createGatewayEventEnvelopeV0({
    sessionId: "s1",
    worldId: "w1",
    source: GATEWAY_EVENT_SOURCE_V0.CHESS,
    type: "MOVE_COMMITTED",
    seq: 7,
    payload: { san: "e4" }
  });
  assert.equal(env.sessionId, "s1");
  assert.equal(env.worldId, "w1");
  assert.equal(env.source, "chess");
  assert.equal(env.seq, 7);
  assert.ok(env.eventId.startsWith("gev_"));
});

test("broadcast meta tracks sent delivered acknowledged", () => {
  const partial = createGatewayBroadcastMetaV0({
    commitSeq: 10,
    recipientCount: 4,
    delivered: 4,
    ackCount: 2
  });
  assert.equal(partial.delivered, 4);
  assert.equal(partial.ackCount, 2);

  const full = createGatewayBroadcastMetaV0({
    commitSeq: 10,
    recipientCount: 2,
    delivered: 2,
    ackCount: 2
  });
  assert.equal(full.deliveryState, "acknowledged");
});

test("unified presence merges castle match and service nodes", () => {
  clearGatewayPresenceRegistryForTestV0();
  registerGatewayServiceNodeV0({
    kind: "tower",
    serviceId: "tower_a",
    gatewayClientId: "gw1",
    state: "ONLINE"
  });
  registerGatewayServiceNodeV0({
    kind: "media",
    serviceId: "player_1",
    gatewayClientId: "gw2",
    state: "PLAYING"
  });

  const snap = listUnifiedGatewayPresenceV0({ roomKey: "world_space_c2c_v0" });
  assert.equal(snap.services.length, 2);
  assert.ok(snap.services.some((s) => s.kind === "tower" && s.serviceId === "tower_a"));
  assert.ok(snap.services.some((s) => s.kind === "media" && s.serviceId === "player_1"));
});

test("match state applied aggregates ack count per commit", () => {
  clearMatchAckAggregatorForTestV0();
  recordMatchBroadcastStatsV0("m_ack", { commitSeq: 5, recipientCount: 2, delivered: 2 });

  const socketA = { clientId: "a", readyState: 1, send: () => {} };
  const socketB = { clientId: "b", readyState: 1, send: () => {} };
  const wss = { clients: new Set([socketA, socketB]) };

  const r1 = handleMatchStateAppliedV0(
    socketA,
    {
      type: "MATCH_STATE_APPLIED",
      sessionId: "m_ack",
      payload: { sessionId: "m_ack", commitSeq: 5, clientConnectionId: "tab_a" }
    },
    wss
  );
  const r2 = handleMatchStateAppliedV0(
    socketB,
    {
      type: "MATCH_STATE_APPLIED",
      sessionId: "m_ack",
      payload: { sessionId: "m_ack", commitSeq: 5, clientConnectionId: "tab_b" }
    },
    wss
  );

  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  const health = getMatchBroadcastHealthV0("m_ack", 5);
  assert.equal(health.broadcast.ackCount, 2);
  assert.equal(health.broadcast.recipientCount, 2);
});
