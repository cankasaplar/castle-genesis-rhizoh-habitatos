import test from "node:test";
import assert from "node:assert/strict";
import { GATEWAY_EVENT_SOURCE_V0, WS_MESSAGE } from "@castle/protocol";

// Mock match snapshots before import
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

test("wrapVoiceGatewayEnvelope attaches gatewayEvent and world bind", async () => {
  const mod = await import("../voiceGatewayCitizenshipV0.js");
  const wrapped = mod.wrapVoiceGatewayEnvelopeV0(
    WS_MESSAGE.RHIZOH_VOICE_LIVE_START,
    { traceId: "t1", languageCode: "tr-TR" },
    {
      sessionId: "live_x",
      worldId: "match_y",
      boundMatchSessionId: "match_y",
      eventType: "VOICE_SESSION_START",
      seq: 0
    }
  );
  assert.equal(wrapped.gatewayEvent.source, GATEWAY_EVENT_SOURCE_V0.VOICE);
  assert.equal(wrapped.envelope.payload.worldId, "match_y");
  assert.equal(wrapped.envelope.payload.boundMatchSessionId, "match_y");
  assert.ok(wrapped.envelope.payload.gatewayEvent);
});
