/**
 * Sovereign World Map v11 — node SSOT (archive Rhizoh v11-Sovereign / v10.1-Unity).
 * Map renderer reads this; orchestrator maps types → workspace / media / info.
 */

import { resolveInitialWorldSpaceMediaChannelIdV0, resolveWorldSpaceMediaChannelForMapNodeV0 } from "./worldSpaceMediaChannelsV0.js";
import { presenceColorForStateV0 } from "./castlePresenceRegistryV0.js";
import {
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTERACTION_V0
} from "./symbyoMapIntentBridgeV0.js";

function presenceLabelForStateV0(state) {
  const s = String(state || "ONLINE").toUpperCase();
  if (s === "BROADCASTING") return "LIVE";
  if (s === "THINKING") return "THINK";
  if (s === "SYNCING") return "SYNC";
  if (s === "OFFLINE") return "OFF";
  return "ON";
}

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
    description: "Çok modlu yaratıcı kule — Imagine Atelier, Vision Lens, sesli Voice Link. Gateway Gemini API gerekir."
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
    description: "Analiz ve uzun bağlam kulesi — Claude API, kamera+ses workspace."
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
    description: "Araç ve yaratıcı swarm — OpenAI API, sesli komut workspace."
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
    description: "Araştırma sentezi — DeepMind/Gemini gateway, mantıksal akıl."
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
    description: "Hafif Avrupa LLM uç noktası — Mistral API, düşük gecikme sohbet."
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
    description: "Robotik laboratuvar — donanım arayüzü, sesli komut (OpenAI surface)."
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
    description: "Video/sinematik üretim yuvası — Sora API bağlantısı planlı."
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
  istanbul: Object.freeze({
    lat: SOVEREIGN_MAP_DEFAULT_HOME_V0.lat,
    lon: SOVEREIGN_MAP_DEFAULT_HOME_V0.lon,
    name: "Castle Home Hub"
  }),
  kale: Object.freeze({
    lat: SOVEREIGN_MAP_DEFAULT_HOME_V0.lat,
    lon: SOVEREIGN_MAP_DEFAULT_HOME_V0.lon,
    name: "Castle Home Hub"
  }),
  castle: Object.freeze({
    lat: SOVEREIGN_MAP_DEFAULT_HOME_V0.lat,
    lon: SOVEREIGN_MAP_DEFAULT_HOME_V0.lon,
    name: "Castle Home Hub"
  }),
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
  castle: '<circle cx="12" cy="12" r="10"/>',
  remote_castle:
    '<path d="M3 21h18"/><path d="M5 21V9l7-4 7 4v12"/><path d="M9 21v-6h6v6"/><circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none"/>'
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
 * Map-visible nodes — no demo castle hub until user anchors; optional user castle pin.
 * @param {{ userCastle?: { lat: number, lon: number, label?: string } | null }} [opts]
 */
/**
 * Portal stays on the map after castle anchor — pinned near the user's castle.
 * @param {{ lat: number, lon: number, label?: string } | null | undefined} userCastle
 */
export function resolveSovereignPortalNodeForViewV0(userCastle) {
  const hasUserCastle =
    userCastle && Number.isFinite(userCastle.lat) && Number.isFinite(userCastle.lon);
  if (!hasUserCastle) return SOVEREIGN_RHIZOH_PORTAL_V0;
  return Object.freeze({
    ...SOVEREIGN_RHIZOH_PORTAL_V0,
    lat: Number(userCastle.lat) + 0.0012,
    lon: Number(userCastle.lon) + 0.0018,
    name: "Rhizoh Castle Portal",
    description:
      "Kale yakınında sabit portal — keşfet, bağlan, çevir, düşün, yansıt."
  });
}

export function listSovereignWorldMapNodesForViewV0(opts = {}) {
  const core = SOVEREIGN_CORE_NODES_V0.filter((n) => n.id !== "castle");
  /** @type {object[]} */
  const userCastle = opts.userCastle;
  const hasUserCastle =
    userCastle && Number.isFinite(userCastle.lat) && Number.isFinite(userCastle.lon);
  const portalNode = resolveSovereignPortalNodeForViewV0(userCastle);
  const rows = [...core, ...SOVEREIGN_TOWERS_V0, portalNode];
  if (hasUserCastle) {
    rows.unshift(
      Object.freeze({
        id: "my_castle",
        name: String(userCastle.label || "My Castle"),
        label: "MY CASTLE",
        type: "castle",
        lat: Number(userCastle.lat),
        lon: Number(userCastle.lon),
        color: "#22c55e",
        owner: "You",
        description: "Senin castle anchor noktan — kale kur ritüeli ile oluşturuldu."
      })
    );
  }
  return Object.freeze(rows);
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
export const RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1 = "RHIZOH_SOVEREIGN_VOICE_WARP";
export const RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1 = "RHIZOH_REMOTE_CASTLE_CLICK";

/**
 * Grey peer castle pins from Firestore `active_castles` + gateway network presence.
 * @param {ReadonlyArray<{ id: string, lat?: number, lon?: number, displayName?: string, nexusEnergy?: number, presenceState?: string, presenceViewers?: number, presenceRegion?: string }>} remoteCastles
 */
export function buildRemoteCastleMapNodesV0(remoteCastles = []) {
  /** @type {object[]} */
  const rows = [];
  for (const row of remoteCastles || []) {
    const uid = String(row?.id || "").trim();
    const lat = Number(row?.lat);
    const lon = Number(row?.lon);
    if (!uid || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const label = String(row.displayName || "").trim();
    const presenceState = String(row.presenceState || "ONLINE").toUpperCase();
    const color = presenceColorForStateV0(presenceState);
    const viewers = Math.max(0, Number(row.presenceViewers) || 0);
    const region = String(row.presenceRegion || "GLOBAL").slice(0, 16);
    rows.push(
      Object.freeze({
        id: `remote_castle_${uid}`,
        uid,
        name: label || `Peer Castle · ${uid.slice(0, 6)}`,
        label: presenceLabelForStateV0(presenceState),
        type: "remote_castle",
        lat,
        lon,
        color,
        owner: "Peer",
        description:
          presenceState === "BROADCASTING"
            ? `Castle broadcasting · ${viewers} viewer${viewers === 1 ? "" : "s"} · ${region}`
            : `Castle ${presenceState.toLowerCase()} · ${region} — C2C bridge on click.`,
        nexusEnergy: Number(row.nexusEnergy) || null,
        gatewayClientId: String(row.gatewayClientId || "").trim() || null,
        presenceState,
        presenceViewers: viewers,
        presenceRegion: region
      })
    );
  }
  return Object.freeze(rows);
}

/**
 * @param {object} node
 */
export function dispatchRemoteCastleClickV0(node) {
  if (typeof window === "undefined" || !node?.uid) return false;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, {
      detail: Object.freeze({
        uid: String(node.uid),
        lat: Number(node.lat),
        lon: Number(node.lon),
        displayName: String(node.name || node.label || ""),
        gatewayClientId: node.gatewayClientId ? String(node.gatewayClientId) : null
      })
    })
  );
  return true;
}

const MEDIA_OPEN_TEXT_RE_V0 = /\b(yayın|yayin|medya|media|player|kuantum\s*yayın|kuantum\s*yayin)\b/i;
const MEDIA_OPEN_VERB_RE_V0 = /\b(aç|ac|open|başlat|baslat|start|göster|goster|show|oynat)\b/i;

function normalizeSovereignCommandTextV0(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/**
 * @returns {{ lat: number, lon: number } | null}
 */
export function readSovereignPortalCoordsV0() {
  if (typeof window === "undefined") return null;
  try {
    const row = window.__rhizoh?.sovereignPortalCoords;
    if (row && Number.isFinite(row.lat) && Number.isFinite(row.lon)) {
      return Object.freeze({ lat: row.lat, lon: row.lon });
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * @param {number} lat
 * @param {number} lon
 */
export function writeSovereignPortalCoordsV0(lat, lon) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.sovereignPortalCoords = Object.freeze({ lat, lon });
}

/**
 * @param {{ lat: number, lon: number, name?: string }} target
 * @param {string} [source]
 */
export function dispatchSovereignVoiceWarpV0(target, source = "voice_warp") {
  if (typeof window === "undefined" || !target) return false;
  if (!Number.isFinite(target.lat) || !Number.isFinite(target.lon)) return false;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, {
      detail: Object.freeze({
        lat: target.lat,
        lon: target.lon,
        name: String(target.name || "Target"),
        zoom: 14,
        source: String(source || "voice_warp")
      })
    })
  );
  return true;
}

/**
 * @param {string} text
 * @param {{ source?: string, tr?: boolean }} [opts]
 */
/** Turkish spoken labels for map pins (TTS + chat; avoid English tower names in TR UI). */
export const SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0 = Object.freeze({
  chess_arena: "Satranç Arenası",
  library: "Codex Kasası",
  event: "Etkinlik Alanı",
  ghost: "Rhizoh Yapay Zekâ",
  radio: "Kuantum Radyo",
  ai_prime: "Otonom AI Prime",
  castle: "Kale Merkezi",
  my_castle: "Kalem",
  rhizoh_portal: "Rhizoh Portal",
  gemini_tower: "Gemini Kulesi",
  claude_tower: "Claude Kulesi",
  chatgpt_tower: "ChatGPT Kulesi",
  deepmind_tower: "DeepMind Kulesi",
  mistral_tower: "Mistral Kulesi",
  kyoto_tower: "Kyoto Robotik Demiri",
  sora_tower: "Sora Görsel Kulesi"
});

const SOVEREIGN_MAP_VOICE_NAV_ALIASES_V0 = Object.freeze([
  Object.freeze({
    nodeId: "chess_arena",
    aliases: ["chess arena", "chess", "satranc arenasi", "satranç arenası", "satranç", "satranc"]
  }),
  Object.freeze({
    nodeId: "library",
    aliases: ["library", "kutuphane", "kütüphane", "codex", "vault", "arsiv", "arşiv"]
  }),
  Object.freeze({
    nodeId: "rhizoh_portal",
    aliases: ["rhizoh portal", "portal", "portala", "rhizoh portali"]
  }),
  Object.freeze({
    nodeId: "event",
    aliases: ["event zone", "event", "etkinlik", "yayin alani", "yayın alanı"]
  }),
  Object.freeze({
    nodeId: "ghost",
    aliases: ["ghost", "rhizoh ai", "hayalet", "yapay zeka"]
  }),
  Object.freeze({
    nodeId: "radio",
    aliases: ["radio", "radyo", "kuantum radyo"]
  }),
  Object.freeze({
    nodeId: "ai_prime",
    aliases: ["ai prime", "auto ai", "otonom"]
  }),
  Object.freeze({
    nodeId: "gemini_tower",
    aliases: ["gemini tower", "gemini kulesi", "gemini"]
  }),
  Object.freeze({
    nodeId: "claude_tower",
    aliases: ["claude tower", "claude kulesi", "claude"]
  }),
  Object.freeze({
    nodeId: "chatgpt_tower",
    aliases: ["chatgpt tower", "chatgpt", "openai tower", "openai"]
  }),
  Object.freeze({
    nodeId: "deepmind_tower",
    aliases: ["deepmind", "deep mind", "londra kulesi"]
  }),
  Object.freeze({
    nodeId: "mistral_tower",
    aliases: ["mistral", "paris kulesi", "paris"]
  }),
  Object.freeze({
    nodeId: "kyoto_tower",
    aliases: ["kyoto", "robotik", "robotics anchor", "tokyo kulesi"]
  }),
  Object.freeze({
    nodeId: "sora_tower",
    aliases: ["sora", "hollywood", "los angeles kulesi"]
  })
]);

const MAP_VOICE_NAV_VERB_RE_V0 =
  /\b(git|isinla|ışınla|ucur|uçur|gec|geç|hedefle|ac|aç|open|goster|göster|show|basla|başla|start)\b/;

/**
 * @param {object} node
 * @param {boolean} [tr]
 */
export function resolveSovereignMapNodeVoiceLabelV0(node, tr = true) {
  const id = String(node?.id || "");
  if (tr && SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0[id]) {
    return SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0[id];
  }
  return String(node?.name || node?.label || id || "hedef");
}

/**
 * @param {string} text
 */
export function parseSovereignMapNodeVoiceCommandV0(text = "") {
  const normalized = normalizeSovereignCommandTextV0(text);
  if (!MAP_VOICE_NAV_VERB_RE_V0.test(normalized)) return null;
  let query = normalized;
  for (const kw of [
    "git",
    "isinla",
    "ışınla",
    "ucur",
    "uçur",
    "gec",
    "geç",
    "hedefle",
    "ac",
    "aç",
    "open",
    "goster",
    "göster",
    "show",
    "basla",
    "başla",
    "start"
  ]) {
    query = query.replace(new RegExp(`\\b${kw}\\b`, "g"), " ");
  }
  query = query
    .replace(/\b(ya|ye|yi|a|e|i|na|ne|ni|nın|nin|nun|nün)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!query) return null;
  const ranked = SOVEREIGN_MAP_VOICE_NAV_ALIASES_V0.map((row) => {
    let score = 0;
    for (const alias of row.aliases) {
      if (query === alias || normalized.includes(alias)) score = Math.max(score, alias.length);
    }
    return Object.freeze({ nodeId: row.nodeId, score });
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.nodeId || null;
}

/**
 * @param {string} nodeId
 * @param {{ userCastle?: { lat: number, lon: number, label?: string } | null }} [opts]
 */
export function findSovereignMapNodeByIdForViewV0(nodeId, opts = {}) {
  const id = String(nodeId || "").trim();
  if (!id) return null;
  const viewNodes = listSovereignWorldMapNodesForViewV0(opts);
  const fromView = viewNodes.find((n) => n.id === id);
  if (fromView) return fromView;
  if (id === "rhizoh_portal") return resolveSovereignPortalNodeForViewV0(opts.userCastle);
  return (
    SOVEREIGN_CORE_NODES_V0.find((n) => n.id === id) ||
    SOVEREIGN_TOWERS_V0.find((n) => n.id === id) ||
    null
  );
}

/**
 * Fly map + emit orchestrator intent (same path as pin click).
 * @param {object} node
 * @param {string} [source]
 */
export function dispatchSovereignMapNodeEnterV0(node, source = "voice_nav") {
  if (typeof window === "undefined" || !node) return false;
  if (!Number.isFinite(node.lat) || !Number.isFinite(node.lon)) return false;
  dispatchSovereignVoiceWarpV0(
    { lat: node.lat, lon: node.lon, name: String(node.name || node.label || node.id) },
    source
  );
  const routed = routeSymbyoMapInteractionToOrchestratorV0({
    node,
    interaction: SYMBYO_MAP_INTERACTION_V0.CLICK
  });
  const detail = Object.freeze({
    ...routed,
    source: String(source || "voice_nav"),
    nodeView: Object.freeze({
      id: node.id,
      label: node.label,
      name: node.name,
      type: node.type,
      color: node.color,
      lat: node.lat,
      lon: node.lon,
      description: node.description,
      provider: node.provider
    })
  });
  window.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, { detail }));
  document.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, { detail }));
  return true;
}

/**
 * @param {string} text
 * @param {{ source?: string, tr?: boolean, userCastle?: object | null }} [opts]
 */
export function tryOpenSovereignMapNodeFromTextV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const nodeId = parseSovereignMapNodeVoiceCommandV0(raw);
  if (!nodeId) return null;
  const node = findSovereignMapNodeByIdForViewV0(nodeId, opts);
  if (!node) return null;
  dispatchSovereignMapNodeEnterV0(node, opts.source || "voice_map_nav");
  const tr = opts.tr !== false;
  const label = resolveSovereignMapNodeVoiceLabelV0(node, tr);
  return Object.freeze({
    ok: true,
    kind: "MAP_NODE_OPEN",
    nodeId,
    node,
    reply: tr ? `${label} açılıyor.` : `Opening ${label}.`
  });
}

function resolveSovereignVoiceWarpLabelV0(target, tr) {
  if (!target) return tr ? "hedef" : "target";
  const WARP_KEY_TO_NODE_ID_V0 = Object.freeze({
    gemini: "gemini_tower",
    claude: "claude_tower",
    chatgpt: "chatgpt_tower",
    openai: "chatgpt_tower",
    deepmind: "deepmind_tower",
    londra: "deepmind_tower",
    mistral: "mistral_tower",
    paris: "mistral_tower",
    kyoto: "kyoto_tower",
    tokyo: "kyoto_tower",
    sora: "sora_tower",
    "los angeles": "sora_tower",
    istanbul: "castle",
    kale: "castle",
    castle: "castle"
  });
  const byName = Object.entries(SOVEREIGN_VOICE_WARP_DICT_V0).find(
    ([, coords]) =>
      Number(coords.lat) === Number(target.lat) && Number(coords.lon) === Number(target.lon)
  );
  if (byName && tr) {
    const nodeId = WARP_KEY_TO_NODE_ID_V0[byName[0]];
    if (nodeId && SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0[nodeId]) {
      return SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0[nodeId];
    }
  }
  if (tr && /portal/i.test(String(target.name || ""))) {
    return SOVEREIGN_MAP_NODE_VOICE_LABEL_TR_V0.rhizoh_portal;
  }
  return String(target.name || "hedef");
}

export function tryExecuteSovereignVoiceWarpFromTextV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const portal = readSovereignPortalCoordsV0();
  const target = parseSovereignVoiceWarpCommandV0(raw, portal);
  if (!target) return null;
  dispatchSovereignVoiceWarpV0(target, opts.source || "voice_command");
  const tr = opts.tr !== false;
  const label = resolveSovereignVoiceWarpLabelV0(target, tr);
  return Object.freeze({
    ok: true,
    kind: "VOICE_WARP",
    target,
    reply: tr ? `${label} noktasına geçiyorum.` : `Heading to ${label}.`
  });
}

/**
 * @param {string} text
 * @param {{ source?: string, tr?: boolean, title?: string }} [opts]
 */
export function tryOpenSovereignMediaTubeFromTextV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const normalized = normalizeSovereignCommandTextV0(raw);
  const hasMediaNoun = MEDIA_OPEN_TEXT_RE_V0.test(normalized) || /yayin|medya|media|player|kuantum/.test(normalized);
  const hasVerb = MEDIA_OPEN_VERB_RE_V0.test(normalized) || /\b(ac|open|baslat|start|goster|show|oynat)\b/.test(normalized);
  const bare = /^(yayin|medya|media|player)\s*[!.?]*$/.test(normalized);
  if (!hasMediaNoun || (!hasVerb && !bare)) return null;

  const eventNode =
    SOVEREIGN_CORE_NODES_V0.find((n) => n.id === "event") ||
    Object.freeze({ id: "event", type: "broadcast", color: "#a855f7" });
  const tr = opts.tr !== false;
  dispatchOpenMediaTubeV0({
    node: eventNode,
    title: opts.title || (tr ? "Kuantum Yayını" : "Quantum Broadcast"),
    source: opts.source || "voice_command"
  });
  return Object.freeze({
    ok: true,
    kind: "MEDIA_OPEN",
    reply: tr ? "Medya oynatıcı açılıyor." : "Opening media player."
  });
}

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
  const source = String(payload.source || "map_orchestrator");
  window.dispatchEvent(
    new CustomEvent(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, {
      detail: Object.freeze({
        node,
        title: String(payload.title || node.name || node.label || "Kuantum Yayını"),
        source,
        initialChannelId:
          payload.initialChannelId ||
          resolveWorldSpaceMediaChannelForMapNodeV0(node) ||
          resolveInitialWorldSpaceMediaChannelIdV0(source)
      })
    })
  );
}
