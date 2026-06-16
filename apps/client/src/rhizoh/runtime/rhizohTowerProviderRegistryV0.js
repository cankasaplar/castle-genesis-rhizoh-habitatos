/**
 * LLM tower → gateway provider mapping (V11 workspaces).
 */

export const RHIZOH_TOWER_PROVIDER_REGISTRY_V0 = Object.freeze({
  gemini_tower: Object.freeze({
    provider: "gemini",
    model: "gemini-2.0-flash",
    labelEn: "Gemini Tower",
    labelTr: "Gemini Kulesi",
    capabilities: Object.freeze(["vision", "voice", "image_gen", "tower_voice"])
  }),
  claude_tower: Object.freeze({
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    labelEn: "Claude Tower",
    labelTr: "Claude Kulesi",
    capabilities: Object.freeze(["voice", "analysis"])
  }),
  chatgpt_tower: Object.freeze({
    provider: "openai",
    model: "gpt-4o-mini",
    labelEn: "ChatGPT Tower",
    labelTr: "ChatGPT Kulesi",
    capabilities: Object.freeze(["voice", "tools"])
  }),
  deepmind_tower: Object.freeze({
    provider: "gemini",
    model: "gemini-2.0-flash",
    labelEn: "DeepMind Tower",
    labelTr: "DeepMind Kulesi",
    capabilities: Object.freeze(["voice", "research"])
  }),
  mistral_tower: Object.freeze({
    provider: "mistral",
    model: "mistral-small-latest",
    labelEn: "Mistral Tower",
    labelTr: "Mistral Kulesi",
    capabilities: Object.freeze(["voice"])
  }),
  kyoto_tower: Object.freeze({
    provider: "openai",
    model: "gpt-4o-mini",
    labelEn: "Kyoto Robotics Tower",
    labelTr: "Kyoto Robotik Kulesi",
    capabilities: Object.freeze(["voice", "robotics"])
  }),
  sora_tower: Object.freeze({
    provider: "openai",
    model: "gpt-4o-mini",
    labelEn: "Sora Tower",
    labelTr: "Sora Kulesi",
    capabilities: Object.freeze(["voice", "media"])
  })
});

/**
 * @param {string} towerId
 */
export function resolveRhizohTowerProviderV0(towerId) {
  const id = String(towerId || "").trim();
  return (
    RHIZOH_TOWER_PROVIDER_REGISTRY_V0[id] ||
    Object.freeze({
      provider: "openai",
      model: "gpt-4o-mini",
      labelEn: "Tower",
      labelTr: "Kule",
      capabilities: Object.freeze(["voice"])
    })
  );
}

/**
 * @param {string} towerId
 * @param {boolean} [tr]
 */
export function resolveRhizohTowerLabelV0(towerId, tr = false) {
  const row = resolveRhizohTowerProviderV0(towerId);
  return tr ? row.labelTr : row.labelEn;
}
