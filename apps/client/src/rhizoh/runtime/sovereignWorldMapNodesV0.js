/**
 * Sovereign World Map v11 — node SSOT (archive Rhizoh v11-Sovereign / v10.1-Unity).
 * Map renderer reads this; orchestrator maps types → workspace / media / info.
 */

export const SOVEREIGN_MAP_DEFAULT_HOME_V0 = Object.freeze({
  lat: 41.045,
  lon: 29.006,
  zoom: 16
});

/** @typedef {'hub'|'ghost'|'zone'|'vault'|'agent'|'broadcast'|'tower'|'portal'|'castle'} SovereignMapNodeTypeV0 */

export const SOVEREIGN_CORE_NODES_V0 = Object.freeze([
  Object.freeze({
    id: "castle",
    name: "Home Hub",
    label: "CASTLE",
    type: "hub",
    lat: 41.045,
    lon: 29.006,
    color: "#06b6d4",
    owner: "Mimar_01",
    description: "Sistem kalkanları aktif. Giriş yetkisi doğrulandı."
  }),
  Object.freeze({
    id: "ghost",
    name: "Rhizoh AI",
    label: "GHOST",
    type: "ghost",
    lat: 41.047,
    lon: 29.008,
    color: "#ef4444",
    owner: "System",
    description: "Hafıza taranıyor. Dinliyorum…"
  }),
  Object.freeze({
    id: "event",
    name: "Event Zone",
    label: "EVENT",
    type: "zone",
    lat: 41.042,
    lon: 29.007,
    color: "#a855f7",
    owner: "Public",
    description: "Kuantum yayın tüneli hazır. Akışa katılabilirsiniz."
  }),
  Object.freeze({
    id: "library",
    name: "Codex Vault",
    label: "LIBRARY",
    type: "vault",
    lat: 41.046,
    lon: 29.003,
    color: "#eab308",
    owner: "Council",
    description: "Kadim arşiv mühürlü. Kriptografik mühürleme açık."
  }),
  Object.freeze({
    id: "ai_prime",
    name: "Auto-AI Prime",
    label: "AI PRIME",
    type: "agent",
    lat: 41.038,
    lon: 28.998,
    color: "#10b981",
    owner: "Autonomous",
    description: "Otonom devriye aktif. Çevresel analiz yapılıyor."
  }),
  Object.freeze({
    id: "radio",
    name: "Quantum Radio",
    label: "RADIO",
    type: "broadcast",
    lat: 41.041,
    lon: 29.002,
    color: "#10b981",
    owner: "Public",
    description: "Özel frekanslar taranıyor."
  }),
  Object.freeze({
    id: "chess_arena",
    name: "Chess Arena",
    label: "CHESS",
    type: "zone",
    lat: 41.049,
    lon: 29.005,
    color: "#10b981",
    owner: "Mind_Core",
    description: "Nöral satranç motoru devrede."
  })
]);

export const SOVEREIGN_TOWERS_V0 = Object.freeze([
  Object.freeze({
    id: "gemini_tower",
    name: "Gemini Neural Tower",
    label: "GEMINI",
    type: "tower",
    provider: "GOOGLE_AI",
    lat: 37.422,
    lon: -122.0841,
    color: "#d946ef",
    capabilities: ["MULTIMODAL_VOICE", "IMAGE_SYNTHESIS"],
    description: "Sovereign Google AI Hub."
  }),
  Object.freeze({
    id: "claude_tower",
    name: "Claude Sentinel Tower",
    label: "CLAUDE",
    type: "tower",
    provider: "ANTHROPIC",
    lat: 37.7749,
    lon: -122.4194,
    color: "#3b82f6",
    capabilities: ["CONSTITUTIONAL_ALIGNMENT"],
    description: "Sovereign Anthropic Core."
  }),
  Object.freeze({
    id: "chatgpt_tower",
    name: "ChatGPT Sovereign Hub",
    label: "OPENAI",
    type: "tower",
    provider: "OPENAI",
    lat: 37.7624,
    lon: -122.4148,
    color: "#10b981",
    capabilities: ["CREATIVE_SWARM", "TOOL_AUTOMATION"],
    description: "Sovereign OpenAI Core."
  }),
  Object.freeze({
    id: "deepmind_tower",
    name: "DeepMind Synthesis Node",
    label: "DEEPMIND",
    type: "tower",
    provider: "DEEPMIND",
    lat: 51.5303,
    lon: -0.1245,
    color: "#06b6d4",
    capabilities: ["LOGICAL_REASONING"],
    description: "Sovereign DeepMind Research Hub."
  }),
  Object.freeze({
    id: "mistral_tower",
    name: "Mistral Sovereign Node",
    label: "MISTRAL",
    type: "tower",
    provider: "MISTRAL",
    lat: 48.8566,
    lon: 2.3522,
    color: "#f97316",
    capabilities: ["LOCAL_LIGHTWEIGHT_EXECUTION"],
    description: "Sovereign European Computing Core."
  }),
  Object.freeze({
    id: "kyoto_tower",
    name: "Kyoto Robotics Anchor",
    label: "KYOTO",
    type: "tower",
    provider: "SOCIETY_5_0",
    lat: 35.0116,
    lon: 135.7681,
    color: "#eab308",
    capabilities: ["HARDWARE_ROBOTICS_INTERFACE"],
    description: "Sovereign Hardware-in-the-Loop Node."
  }),
  Object.freeze({
    id: "sora_tower",
    name: "Sora Visual Projection",
    label: "SORA",
    type: "tower",
    provider: "HOLLYWOOD_AI",
    lat: 34.0522,
    lon: -118.2437,
    color: "#ec4899",
    capabilities: ["TEMPORAL_VIDEO_SYNTHESIS"],
    description: "Sovereign Cinematic Node."
  })
]);

export const SOVEREIGN_RHIZOH_PORTAL_V0 = Object.freeze({
  id: "rhizoh_portal",
  name: "Rhizoh Wandering Portal",
  label: "PORTAL",
  type: "portal",
  lat: SOVEREIGN_MAP_DEFAULT_HOME_V0.lat - 0.002,
  lon: SOVEREIGN_MAP_DEFAULT_HOME_V0.lon - 0.002,
  color: "#a855f7",
  description: "Dynamic ingress node — Observe · Connect · Translate · Reason · Reflect"
});

export const SOVEREIGN_VOICE_WARP_DICT_V0 = Object.freeze({
  gemini: Object.freeze({ lat: 37.422, lon: -122.0841, name: "Gemini Neural Tower" }),
  claude: Object.freeze({ lat: 37.7749, lon: -122.4194, name: "Claude Sentinel Tower" }),
  chatgpt: Object.freeze({ lat: 37.7624, lon: -122.4148, name: "ChatGPT Sovereign Hub" }),
  openai: Object.freeze({ lat: 37.7624, lon: -122.4148, name: "ChatGPT Sovereign Hub" }),
  deepmind: Object.freeze({ lat: 51.5303, lon: -0.1245, name: "DeepMind Synthesis Node" }),
  londra: Object.freeze({ lat: 51.5303, lon: -0.1245, name: "DeepMind Synthesis Node" }),
  mistral: Object.freeze({ lat: 48.8566, lon: 2.3522, name: "Mistral Sovereign Node" }),
  paris: Object.freeze({ lat: 48.8566, lon: 2.3522, name: "Mistral Sovereign Node" }),
  kyoto: Object.freeze({ lat: 35.0116, lon: 135.7681, name: "Kyoto Robotics Anchor" }),
  tokyo: Object.freeze({ lat: 35.0116, lon: 135.7681, name: "Kyoto Robotics Anchor" }),
  sora: Object.freeze({ lat: 34.0522, lon: -118.2437, name: "Sora Visual Projection" }),
  "los angeles": Object.freeze({ lat: 34.0522, lon: -118.2437, name: "Sora Visual Projection" })
});

const SVG_BY_TYPE_V0 = Object.freeze({
  hub: '<path d="M2 20h20"/><path d="M5 20v-9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v9"/><path d="M9 20v-4h6v4"/>',
  ghost:
    '<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>',
  zone: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  vault: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  tower: '<path d="M12 2L4.5 9h15L12 2z"/><path d="M12 9v13"/><path d="M9 15h6"/>',
  agent:
    '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>',
  broadcast:
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><circle cx="12" cy="12" r="2"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  portal:
    '<circle cx="12" cy="12" r="10" stroke-dasharray="2 4"/><path d="M12 8a4 4 0 1 0 4 4"/><circle cx="12" cy="12" r="2"/>',
  castle: '<circle cx="12" cy="12" r="10"/>'
});

/**
 * @returns {ReadonlyArray<object>}
 */
export function listSovereignWorldMapNodesV0() {
  return Object.freeze([
    ...SOVEREIGN_CORE_NODES_V0,
    ...SOVEREIGN_TOWERS_V0,
    SOVEREIGN_RHIZOH_PORTAL_V0
  ]);
}

/**
 * Tower graph edges for Leaflet polylines (archive SovereignGraph).
 * @returns {ReadonlyArray<{ source: string, target: string }>}
 */
export function buildSovereignTowerGraphEdgesV0() {
  const towers = listSovereignWorldMapNodesV0().filter(
    (n) => n.type === "tower" || n.type === "portal"
  );
  /** @type {Array<{ source: string, target: string }>} */
  const edges = [];
  for (let i = 0; i < towers.length; i++) {
    for (let j = i + 1; j < towers.length; j++) {
      const n1 = towers[i];
      const n2 = towers[j];
      const dx = n1.lat - n2.lat;
      const dy = n1.lon - n2.lon;
      if (dx * dx + dy * dy < 20000) {
        edges.push({ source: n1.id, target: n2.id });
      }
    }
  }
  return Object.freeze(edges);
}

/**
 * @param {object} node
 */
export function sovereignNodeIconHtmlV0(node) {
  const color = String(node.color || "#ffffff");
  const label = String(node.label || node.name || node.id || "NODE")
    .slice(0, 12)
    .toUpperCase();
  const type = String(node.type || "castle");
  const svg = SVG_BY_TYPE_V0[type] || SVG_BY_TYPE_V0.castle;
  const spin = type === "portal" ? "animation:spin 8s linear infinite;" : "";
  return `<div data-rhizoh-sovereign-node="${node.id}" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto">
    <div style="background:${color}22;border:1px solid ${color};border-radius:50%;padding:8px;box-shadow:0 0 15px ${color}">
      <svg style="${spin}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${svg}</svg>
    </div>
    <div style="color:${color};font-size:9px;font-weight:900;margin-top:4px;text-shadow:0 0 5px black;font-family:monospace">${label}</div>
  </div>`;
}

export const SOVEREIGN_WORLD_MAP_NODES_V0 = listSovereignWorldMapNodesV0();
export const SOVEREIGN_TOWER_GRAPH_EDGES_V0 = buildSovereignTowerGraphEdgesV0();

/**
 * @param {string} text
 * @param {{ lat?: number, lon?: number } | null} [portalCoords]
 */
export function parseSovereignVoiceWarpCommandV0(text = "", portalCoords = null) {
  const normalized = String(text || "")
    .toLowerCase()
    .trim();
  const keywords = ["git", "ışınla", "isinla", "uçur", "ucur", "geç", "gec", "hedefle"];
  let targetQuery = normalized;
  for (const kw of keywords) {
    if (normalized.includes(kw)) targetQuery = targetQuery.replace(kw, "").trim();
  }
  if (
    targetQuery.includes("rhizoh") ||
    targetQuery.includes("merkez") ||
    targetQuery.includes("benim")
  ) {
    if (portalCoords && Number.isFinite(portalCoords.lat) && Number.isFinite(portalCoords.lon)) {
      return Object.freeze({
        lat: portalCoords.lat,
        lon: portalCoords.lon,
        name: "Rhizoh Wandering Portal"
      });
    }
  }
  for (const [key, coords] of Object.entries(SOVEREIGN_VOICE_WARP_DICT_V0)) {
    if (targetQuery.includes(key)) {
      return Object.freeze({ lat: coords.lat, lon: coords.lon, name: coords.name });
    }
  }
  return null;
}

export const RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 = "RHIZOH_OPEN_MEDIA_TUBE";

/**
 * @param {{ node?: object, title?: string, source?: string }} [payload]
 */
export function dispatchOpenMediaTubeV0(payload = {}) {
  if (typeof window === "undefined") return;
  const node = payload.node || {
    id: "event",
    label: "CASTLE BROADCAST",
    type: "broadcast",
    color: "#a855f7"
  };
  window.dispatchEvent(
    new CustomEvent(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, {
      detail: Object.freeze({
        node,
        title: String(payload.title || node.name || node.label || "Kuantum Yayını"),
        source: String(payload.source || "map_orchestrator")
      })
    })
  );
}
