import assert from "node:assert/strict";
import test from "node:test";

/**
 * Mirror of server.js resolveServerLlmProviderV0 for unit test (not exported from server bundle).
 */
function resolveServerLlmProviderV0(keyMode, conn, payload) {
  const envProvider = String(process.env.CASTLE_LLM_PROVIDER || "").trim() || undefined;
  const envModel = String(process.env.CASTLE_LLM_MODEL || "").trim() || undefined;

  if (keyMode === "user_connection") {
    return {
      resolvedProvider: conn?.provider || payload?.provider,
      resolvedModel: conn?.model || payload?.model,
      connApiKey: conn?.apiKey || ""
    };
  }

  if (keyMode === "env") {
    return {
      resolvedProvider: envProvider ?? payload?.provider,
      resolvedModel: envModel ?? payload?.model,
      connApiKey: ""
    };
  }

  if (conn?.provider && conn?.apiKey) {
    return {
      resolvedProvider: conn.provider,
      resolvedModel: conn.model,
      connApiKey: conn.apiKey
    };
  }

  return {
    resolvedProvider: envProvider ?? payload?.provider,
    resolvedModel: envModel ?? payload?.model,
    connApiKey: ""
  };
}

test("resolveServerLlmProviderV0 auto ignores client openai when env is gemini", () => {
  const prev = process.env.CASTLE_LLM_PROVIDER;
  const prevModel = process.env.CASTLE_LLM_MODEL;
  process.env.CASTLE_LLM_PROVIDER = "gemini";
  process.env.CASTLE_LLM_MODEL = "gemini-2.0-flash";
  try {
    const out = resolveServerLlmProviderV0("auto", null, { provider: "openai", model: "gpt-4o-mini" });
    assert.equal(out.resolvedProvider, "gemini");
    assert.equal(out.resolvedModel, "gemini-2.0-flash");
    assert.equal(out.connApiKey, "");
  } finally {
    if (prev == null) delete process.env.CASTLE_LLM_PROVIDER;
    else process.env.CASTLE_LLM_PROVIDER = prev;
    if (prevModel == null) delete process.env.CASTLE_LLM_MODEL;
    else process.env.CASTLE_LLM_MODEL = prevModel;
  }
});
