import test from "node:test";
import assert from "node:assert/strict";
import { GATEWAY_EVENT_SOURCE_V0 } from "@castle/protocol";
import {
  clearGatewayPresenceRegistryForTestV0,
  listUnifiedGatewayPresenceV0
} from "../rhizoh/gatewayPresenceRegistryV0.js";
import {
  clearVoiceGatewayCitizenshipForTestV0,
  enrichVoiceLivePayloadV0,
  getVoiceBroadcastHealthV0,
  handleVoiceStateAppliedV0,
  registerVoiceGatewayCitizenV0,
  resolveVoiceWorldContextV0
} from "../rhizoh/voiceGatewayCitizenshipV0.js";

test("voice world context binds match session and worldId", () => {
  const ctx = resolveVoiceWorldContextV0({
    sessionId: "live_abc",
    worldId: "match_room_1",
    boundMatchSessionId: "match_room_1"
  });
  assert.equal(ctx.boundMatchSessionId, "match_room_1");
  assert.equal(ctx.worldId, "match_room_1");
  assert.equal(ctx.source, GATEWAY_EVENT_SOURCE_V0.VOICE);
});

test("voice registers in unified presence registry", () => {
  clearGatewayPresenceRegistryForTestV0();
  clearVoiceGatewayCitizenshipForTestV0();
  const socket = { clientId: "voice_client_1" };
  const reg = registerVoiceGatewayCitizenV0(socket, {
    sessionId: "live_voice_1",
    worldId: "match_bind_1",
    boundMatchSessionId: "match_bind_1"
  });
  assert.equal(reg.ok, true);
  const snap = listUnifiedGatewayPresenceV0({ kind: "voice" });
  assert.ok(snap.services.some((s) => s.kind === "voice" && s.serviceId === "live_voice_1"));
});

test("voice live payload carries gatewayEvent envelope", () => {
  clearVoiceGatewayCitizenshipForTestV0();
  const session = {
    sessionId: "live_voice_2",
    worldId: "world_2",
    boundMatchSessionId: "match_2",
    eventSeq: 3,
    traceId: "trace_1"
  };
  const payload = enrichVoiceLivePayloadV0(session, "VOICE_CHUNK", { chunkIndex: 3 });
  assert.equal(payload.gatewayEvent.source, "voice");
  assert.equal(payload.gatewayEvent.sessionId, "live_voice_2");
  assert.equal(payload.gatewayEvent.worldId, "world_2");
  assert.equal(payload.boundMatchSessionId, "match_2");
});

test("voice state applied increments ack count", () => {
  clearVoiceGatewayCitizenshipForTestV0();
  const socket = { clientId: "v1", readyState: 1, send: () => {} };
  handleVoiceStateAppliedV0(socket, {
    type: "VOICE_STATE_APPLIED",
    sessionId: "live_ack",
    payload: { sessionId: "live_ack", voiceCommitSeq: 7, clientConnectionId: "tab1" }
  });
  const health = getVoiceBroadcastHealthV0("live_ack", 7);
  assert.equal(health.broadcast.ackCount, 1);
});
