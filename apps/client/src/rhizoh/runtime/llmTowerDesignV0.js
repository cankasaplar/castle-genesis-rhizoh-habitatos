/**
 * Per-tower visual identity + provider binding (non-Gemini LLM towers).
 * Gemini uses geminiTowerDesignV0.js.
 */

import { resolveRhizohTowerProviderV0 } from "./rhizohTowerProviderRegistryV0.js";

/** @typedef {{ name: string, nameTr: string, tagline: string, taglineTr: string, icon: string, personality: string[], colors: { background: string, primary: string, secondary: string, accent: string, gradient: string, text: string }, rooms: { id: string, name: string, icon: string, description: string }[] }} LlmTowerDesignV0 */

/** @type {Record<string, LlmTowerDesignV0>} */
const DESIGNS_V0 = Object.freeze({
  claude_tower: Object.freeze({
    name: "Claude Sentinel Tower",
    nameTr: "Claude Sentinel Kulesi",
    tagline: "Constitutional alignment · deep analysis",
    taglineTr: "Anayasal hizalama · derin analiz",
    icon: "🛡️",
    personality: Object.freeze(["careful", "structured", "ethical"]),
    colors: Object.freeze({
      background: "#0c1222",
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
      text: "#f8fafc"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "analysis", name: "Analysis Deck", icon: "📋", description: "Long-context reasoning and critique." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Live voice + optional camera context." })
    ])
  }),
  chatgpt_tower: Object.freeze({
    name: "ChatGPT Sovereign Hub",
    nameTr: "ChatGPT Sovereign Hub",
    tagline: "Tools · creative swarm",
    taglineTr: "Araçlar · yaratıcı swarm",
    icon: "⚡",
    personality: Object.freeze(["versatile", "tooling", "fast"]),
    colors: Object.freeze({
      background: "#061410",
      primary: "#10b981",
      secondary: "#059669",
      accent: "#34d399",
      gradient: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
      text: "#ecfdf5"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "tools", name: "Tool Deck", icon: "🔧", description: "Automation and structured tasks." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice + vision via gateway." })
    ])
  }),
  deepmind_tower: Object.freeze({
    name: "DeepMind Synthesis Node",
    nameTr: "DeepMind Sentez Düğümü",
    tagline: "Research synthesis · logic",
    taglineTr: "Araştırma sentezi · mantık",
    icon: "🧠",
    personality: Object.freeze(["research", "logical", "synthetic"]),
    colors: Object.freeze({
      background: "#071318",
      primary: "#06b6d4",
      secondary: "#0891b2",
      accent: "#22d3ee",
      gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)",
      text: "#ecfeff"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "research", name: "Research Lab", icon: "🔬", description: "Hypothesis and synthesis passes." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice queries with research context." })
    ])
  }),
  mistral_tower: Object.freeze({
    name: "Mistral Sovereign Node",
    nameTr: "Mistral Sovereign Düğümü",
    tagline: "European lightweight edge",
    taglineTr: "Avrupa hafif uç nokta",
    icon: "🌬️",
    personality: Object.freeze(["efficient", "european", "direct"]),
    colors: Object.freeze({
      background: "#140a04",
      primary: "#f97316",
      secondary: "#ea580c",
      accent: "#fb923c",
      gradient: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)",
      text: "#fff7ed"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "chat", name: "Mistral Chat", icon: "💬", description: "Low-latency dialogue." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice STT + Mistral on gateway." })
    ])
  }),
  kyoto_tower: Object.freeze({
    name: "Kyoto Robotics Anchor",
    nameTr: "Kyoto Robotik Çapası",
    tagline: "Hardware-in-the-loop lab",
    taglineTr: "Donanım içi döngü laboratuvarı",
    icon: "🤖",
    personality: Object.freeze(["robotics", "precision", "hardware"]),
    colors: Object.freeze({
      background: "#12100a",
      primary: "#eab308",
      secondary: "#ca8a04",
      accent: "#facc15",
      gradient: "linear-gradient(135deg, #a16207 0%, #eab308 100%)",
      text: "#fefce8"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "robotics", name: "Robotics Bay", icon: "🦾", description: "Motion and control scaffolding." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice commands for lab surfaces." })
    ])
  }),
  sora_tower: Object.freeze({
    name: "Sora Visual Projection",
    nameTr: "Sora Görsel Projeksiyon",
    tagline: "Cinematic temporal synthesis",
    taglineTr: "Sinematik zamansal sentez",
    icon: "🎬",
    personality: Object.freeze(["cinematic", "temporal", "visual"]),
    colors: Object.freeze({
      background: "#140818",
      primary: "#ec4899",
      secondary: "#db2777",
      accent: "#f472b6",
      gradient: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
      text: "#fdf2f8"
    }),
    rooms: Object.freeze([
      Object.freeze({ id: "motion", name: "Motion Deck", icon: "🎞️", description: "Video briefs — API wire-up pending." }),
      Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice-directed scene prompts." })
    ])
  })
});

const DEFAULT_DESIGN_V0 = Object.freeze({
  name: "LLM Tower",
  nameTr: "LLM Kulesi",
  tagline: "Gateway-connected assistant",
  taglineTr: "Gateway bağlantılı asistan",
  icon: "🗼",
  personality: Object.freeze(["assistant"]),
  colors: Object.freeze({
    background: "#0f172a",
    primary: "#22d3ee",
    secondary: "#0891b2",
    accent: "#67e8f9",
    gradient: "linear-gradient(135deg, #0e7490 0%, #22d3ee 100%)",
    text: "#f8fafc"
  }),
  rooms: Object.freeze([
    Object.freeze({ id: "voice", name: "Voice Link", icon: "🎙️", description: "Voice + chat via gateway." })
  ])
});

/**
 * @param {string} towerId
 */
export function resolveLlmTowerDesignV0(towerId) {
  const id = String(towerId || "").trim();
  return DESIGNS_V0[id] || DEFAULT_DESIGN_V0;
}

/**
 * @param {string} towerId
 * @param {boolean} [tr]
 */
export function resolveLlmTowerDisplayNameV0(towerId, tr = false) {
  const design = resolveLlmTowerDesignV0(towerId);
  return tr ? design.nameTr : design.name;
}

/**
 * @param {string} towerId
 */
export function resolveLlmTowerProviderRowV0(towerId) {
  return resolveRhizohTowerProviderV0(towerId);
}
