import { getFirebasePersistence } from "./firebasePersistence.js";

function llmEnvConfigured() {
  const p = String(process.env.CASTLE_LLM_PROVIDER || "openai").toLowerCase();
  const key =
    p === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : p === "gemini"
        ? process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
        : p === "xai"
          ? process.env.XAI_API_KEY
          : p === "deepseek"
            ? process.env.DEEPSEEK_API_KEY
            : p === "mistral"
              ? process.env.MISTRAL_API_KEY
              : p === "openrouter"
                ? process.env.OPENROUTER_API_KEY
                : process.env.OPENAI_API_KEY;
  return !!String(key || "").trim();
}

/** Network-observable gateway capability slice (not client GPU/Cesium). */
export function buildGenesisGatewayCapabilitiesV0() {
  const persistence = getFirebasePersistence();
  return {
    schema: "castle.genesis.gateway_capabilities.v0",
    serverTime: Date.now(),
    nodeRole: "gateway",
    persistence: persistence.mode,
    llmConfigured: llmEnvConfigured(),
    workerInfraConfigured: Boolean(String(process.env.WORKER_INFRA_URL || "").trim()),
    prometheusEnabled: String(process.env.CASTLE_PROMETHEUS_METRICS || "").trim() === "1",
    observerStreamPublic: true
  };
}
