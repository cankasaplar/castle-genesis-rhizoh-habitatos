import test from "node:test";
import assert from "node:assert/strict";
import { trimRhizohLlmGatewayPayloadV1 } from "../rhizohLlmPayloadTrimV1.js";

test("gateway trim reduces oversized context", () => {
  const payload = {
    message: "hi",
    context: {
      languagePropagation: { uiLang: "tr" },
      continuity: {
        sessionId: "s",
        identity: { blob: "x".repeat(120_000) },
        rhizohMemoryEpisodes: Array.from({ length: 80 }, (_, i) => ({ id: i, summary: "a".repeat(1200) }))
      },
      life_continuity: { x: 1 },
      rhizohRouter: { deep: true }
    }
  };
  const { payload: out, meta } = trimRhizohLlmGatewayPayloadV1(payload);
  assert.equal(meta.trimmed, true);
  assert.ok(meta.bytesAfter < meta.bytesBefore);
  assert.equal(out.context.languagePropagation, undefined);
  assert.equal(out.context.life_continuity, undefined);
});
