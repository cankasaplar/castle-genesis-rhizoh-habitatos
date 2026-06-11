/**
 * Product UI copy resolver — en · tr · launch locales (fallback en).
 */

import {
  RHIZOH_CAPABILITY_HALO_NODES_TR_V0,
  RHIZOH_HALO_HEADLINE_TR_V0,
  RHIZOH_HALO_INTRO_TR_V0,
  RHIZOH_SHELL_HINT_TR_V0,
  RHIZOH_WORLD_CENTER_SUBTITLE_TR_V0,
  RHIZOH_VOICE_AVAILABLE_HINT_TR_V0,
  RHIZOH_VOICE_AVAILABLE_HINT_EN_V0,
  formatPlainIntentChosenTrV0,
  formatPlainSurfaceOpenTrV0,
  resolveChatStatusLineTrV0,
  resolveProductStatusHeadlineTrV0
} from "./rhizohProductPlainCopyV0.js";
import {
  isQuietDialoguePresenceV0,
  resolveQuietBusyStatusLineV0,
  resolveQuietReadyStatusLineV0
} from "./rhizohDialoguePresencePolicyV0.js";
import { RHIZOH_PRODUCT_SURFACE_COPY_TR_V0 } from "./rhizohProductCopyV0.js";
import { normalizeUiLocaleV0, readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

/** @type {typeof RHIZOH_PRODUCT_SURFACE_COPY_TR_V0} */
export const RHIZOH_PRODUCT_SURFACE_COPY_EN_V0 = Object.freeze({
  world: Object.freeze({ shell: "World", short: "World", pathHint: "Map, location, and chat" }),
  hall: Object.freeze({ shell: "Hall", short: "Hall", pathHint: "Observation summary and records" }),
  greenroom: Object.freeze({ shell: "Prep", short: "Prep", pathHint: "Invite-link flow (beta)" }),
  broadcast: Object.freeze({ shell: "Broadcast", short: "Live", pathHint: "Broadcast prep (beta)" }),
  studio: Object.freeze({ shell: "Studio", short: "Studio", pathHint: "Production status (beta)" }),
  profile: Object.freeze({ shell: "Profile", short: "Profile", pathHint: "Account and settings" })
});

export const RHIZOH_SHELL_HINT_EN_V0 = Object.freeze({
  world: "World · map, location, and chat",
  hall: "Hall · observation summary and records",
  greenroom: "Prep · invite-link flow (beta)",
  broadcast: "Broadcast · broadcast prep (beta)",
  studio: "Studio · production status (beta)",
  profile: "Profile panel (toggle)"
});

export const RHIZOH_HALO_HEADLINE_EN_V0 = "What would you like to do?";
export const RHIZOH_HALO_INTRO_EN_V0 =
  "Hover a symbol — I'll interpret. Tap to run.";

/** @type {typeof RHIZOH_CAPABILITY_HALO_NODES_TR_V0} */
export const RHIZOH_CAPABILITY_HALO_NODES_EN_V0 = Object.freeze([
  Object.freeze({ id: "create", label: "Create", geometryKind: "cube", whisper: "Open a new session in Studio or prep.", seedIntent: "open a new session in studio" }),
  Object.freeze({ id: "invite", label: "Invite", geometryKind: "spiral", whisper: "Share your active experience — or create one first.", seedIntent: "share invite link for this experience" }),
  Object.freeze({ id: "explore", label: "Explore", geometryKind: "spiral", whisper: "Main stage or map layer — say: open map.", seedIntent: "open map" }),
  Object.freeze({ id: "learn", label: "Learn", geometryKind: "cube", whisper: "Academy and observation layer.", seedIntent: "open profile and academy", layerFocus: 11 }),
  Object.freeze({ id: "broadcast", label: "Broadcast", geometryKind: "spiral", whisper: "Live stream or green room.", seedIntent: "go to broadcast" }),
  Object.freeze({ id: "build", label: "Build", geometryKind: "cube", whisper: "Castle, pin, or task — local commands.", seedIntent: "I want to place a castle here", layerFocus: 10 }),
  Object.freeze({ id: "companion", label: "Companion", geometryKind: "spiral", whisper: "Closed in this build; no live character is promised here.", seedIntent: "show companion status" }),
  Object.freeze({ id: "robotics", label: "Devices", geometryKind: "ring", whisper: "Camera, sensor, or robot bridge.", isRoboticsHub: true, layerFocus: 13 }),
  Object.freeze({ id: "swarm", label: "Swarm", geometryKind: "spiral", whisper: "Agent swarm coordination.", seedIntent: "show agent swarm", layerFocus: 6 }),
  Object.freeze({ id: "world", label: "World", geometryKind: "cube", whisper: "Return to main stage — globe and continuity.", seedIntent: "go to world" })
]);

export const RHIZOH_WORLD_CENTER_SUBTITLE_EN_V0 = "Rhizoh field · Agent swarm and core";

export const RHIZOH_PRODUCT_DRAWER_COPY_EN_V0 = Object.freeze({
  hall: Object.freeze({ title: "Hall", blurb: "Observation summary, records, and where to inspect next." }),
  greenroom: Object.freeze({ title: "Prep · Beta", blurb: "Create an invite-only experience link; no new room opens yet." }),
  broadcast: Object.freeze({ title: "Broadcast · Beta", blurb: "Prepare an invite and verify status before any live claim." }),
  studio: Object.freeze({ title: "Studio · Beta", blurb: "Production status only; heavy consoles are hidden from the user surface." }),
  profile: Object.freeze({ title: "Profile", blurb: "Account, identity, and settings." }),
  close: "Close",
  broadcastNote: "This beta creates a shareable invite record. It does not claim a live stream has started."
});

export const RHIZOH_PRODUCT_DRAWER_COPY_TR_V0 = Object.freeze({
  hall: Object.freeze({ title: "Salon", blurb: "Gözlem özeti, kayıtlar ve sıradaki inceleme bağlantıları." }),
  greenroom: Object.freeze({ title: "Hazırlık · Beta", blurb: "Davetli deneyim linki oluşturur; yeni oda henüz açılmaz." }),
  broadcast: Object.freeze({ title: "Yayın · Beta", blurb: "Canlı iddiası kurmadan önce davet ve durum hazırlığı." }),
  studio: Object.freeze({ title: "Stüdyo · Beta", blurb: "Üretim durumu; ağır konsollar kullanıcı yüzeyinden gizlendi." }),
  profile: Object.freeze({ title: "Profil", blurb: "Hesap, kimlik ve ayarlar." }),
  close: "Kapat",
  broadcastNote: "Bu beta paylaşılabilir davet kaydı üretir. Canlı yayın başladı iddiası kurmaz."
});

export const RHIZOH_PRODUCT_DETAIL_CHROME_TR_V0 = Object.freeze({
  open: "Ayrıntılar",
  close: "Paneli kapat",
  closeDrawer: "Ayrıntıları kapat",
  closeGlyph: "✕",
  header: "AYRINTILAR",
  moreButton: "Daha fazla · ajanlar · olaylar · paylaş",
  observatoryClosed:
    "Gelişmiş gözlem bu sürümde kapalı. Salon ve Dünya açık sonuç yüzeyleri olarak kalır.",
  kernelLocked:
    "Analiz yüzeyi bu sürümde kullanıcıya kapalı. Çalışmayan konsol göstermek yerine sonuç üreten alanlar açık tutulur.",
  kernelLockedTabHint: "Bu sürümde kapalı",
  epistemicOrbLocked: "Epistemik küre bu sürümde kapalı.",
  noAgentsYet: "Bu sürümde görünür ajan yok.",
  bootStarting:
    "Oturum ve sahne başlatılıyor… Ağ geçidi kontrolü ana ekranda devam eder.",
  bootSr: "Başlatılıyor",
  tabs: Object.freeze({
    chat: "SOHBET",
    explore: "KEŞFET",
    build: "KUR",
    analyze: "ANALİZ",
    sovereign: "EGEMEN"
  })
});

export const RHIZOH_PRODUCT_DETAIL_CHROME_EN_V0 = Object.freeze({
  open: "Details",
  close: "Close panel",
  closeDrawer: "Close details",
  closeGlyph: "✕",
  header: "DETAILS",
  moreButton: "More · agents · events · share",
  observatoryClosed:
    "Advanced observation is closed in this build. Hall and World remain the result-producing surfaces.",
  kernelLocked:
    "Analyze is closed in this build. Instead of showing a non-actionable console, only result-producing surfaces stay visible.",
  kernelLockedTabHint: "Closed in this build",
  epistemicOrbLocked: "Epistemic orb is closed in this build.",
  noAgentsYet: "No visible agents in this build.",
  bootStarting: "Starting session and stage… Gateway check continues on the main screen.",
  bootSr: "Starting",
  tabs: Object.freeze({
    chat: "CHAT",
    explore: "EXPLORE",
    build: "BUILD",
    analyze: "ANALYZE",
    sovereign: "SOVEREIGN"
  })
});

export function resolveUiCopyLocaleV0(locale) {
  return normalizeUiLocaleV0(locale ?? readUiLocaleV0());
}

export function resolveProductSurfaceCopyV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_PRODUCT_SURFACE_COPY_TR_V0
    : RHIZOH_PRODUCT_SURFACE_COPY_EN_V0;
}

export function resolveProductSurfaceLabelV0(surfaceId, locale) {
  const row = resolveProductSurfaceCopyV0(locale)[surfaceId];
  return row?.shell || (resolveUiCopyLocaleV0(locale) === "tr" ? "Dünya" : "World");
}

export function resolveShellHintsV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr" ? RHIZOH_SHELL_HINT_TR_V0 : RHIZOH_SHELL_HINT_EN_V0;
}

export function resolveHaloHeadlineV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr" ? RHIZOH_HALO_HEADLINE_TR_V0 : RHIZOH_HALO_HEADLINE_EN_V0;
}

export function resolveHaloIntroV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr" ? RHIZOH_HALO_INTRO_TR_V0 : RHIZOH_HALO_INTRO_EN_V0;
}

export function resolveHaloNodesV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_CAPABILITY_HALO_NODES_TR_V0
    : RHIZOH_CAPABILITY_HALO_NODES_EN_V0;
}

export function resolveWorldCenterSubtitleV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_WORLD_CENTER_SUBTITLE_TR_V0
    : RHIZOH_WORLD_CENTER_SUBTITLE_EN_V0;
}

export function resolveProductDrawerSurfaceCopyV0(surfaceId, locale) {
  const pack =
    resolveUiCopyLocaleV0(locale) === "tr"
      ? RHIZOH_PRODUCT_DRAWER_COPY_TR_V0
      : RHIZOH_PRODUCT_DRAWER_COPY_EN_V0;
  return pack[surfaceId] || Object.freeze({ title: String(surfaceId || ""), blurb: "" });
}

export function resolveProductDrawerChromeCopyV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_PRODUCT_DRAWER_COPY_TR_V0
    : RHIZOH_PRODUCT_DRAWER_COPY_EN_V0;
}

export function resolveProductDetailChromeCopyV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_PRODUCT_DETAIL_CHROME_TR_V0
    : RHIZOH_PRODUCT_DETAIL_CHROME_EN_V0;
}

/** @deprecated use resolveProductDetailChromeCopyV0 */
export const resolveRhizohDetailDrawerCopyV0 = resolveProductDetailChromeCopyV0;

export function resolveChatStatusLineV0(input = {}, locale) {
  const tr = resolveUiCopyLocaleV0(locale) === "tr";
  if (tr) return resolveChatStatusLineTrV0(input);
  const busy = Boolean(input.busy);
  const connected = input.connected !== false;
  if (isQuietDialoguePresenceV0()) {
    if (busy) return resolveQuietBusyStatusLineV0();
    if (input.fieldState === "SPEAKING") return "Rhizoh is speaking…";
    if (input.fieldState === "LISTENING") return resolveQuietReadyStatusLineV0(false);
    if (!connected) return "Connecting… · you can still type";
    return resolveQuietReadyStatusLineV0(false);
  }
  if (busy) return "Rhizoh is thinking…";
  if (input.fieldState === "SPEAKING") return "Rhizoh is speaking…";
  if (input.fieldState === "LISTENING") return "Listening…";
  if (!connected) return "Connecting… · you can still type";
  return "Ready · type or tap mic";
}

export function resolveChatPlaceholderV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr" ? "Rhizoh'a yaz…" : "Message Rhizoh…";
}

export function formatPlainSurfaceOpenV0(surfaceId, locale) {
  if (resolveUiCopyLocaleV0(locale) === "tr") return formatPlainSurfaceOpenTrV0(surfaceId);
  const map = Object.freeze({
    world: "World open — map, location, and chat.",
    studio: "Studio beta open — status only.",
    hall: "Hall open — observation summary and records.",
    greenroom: "Prep beta open — create an invite link.",
    broadcast: "Broadcast beta open — create an invite and verify status.",
    profile: "Profile and settings open."
  });
  return map[String(surfaceId || "world")] || `${surfaceId} opened.`;
}

export function formatLocalSurfaceEnterReplyV0(surfaceId, locale) {
  return formatPlainSurfaceOpenV0(surfaceId, locale);
}

export function formatPlainIntentChosenV0(intentId, locale) {
  if (resolveUiCopyLocaleV0(locale) === "tr") return formatPlainIntentChosenTrV0(intentId);
  const map = Object.freeze({
    explore: ["Explore", "main stage, chat, wheel"],
    produce: ["Produce", "studio sessions"],
    observe: ["Observe", "hall and records"],
    connect: ["Connect", "live broadcast"]
  });
  const row = map[String(intentId)] || map.explore;
  return `${row[0]} selected — ${row[1]}`;
}

export function resolveProductStatusHeadlineV0(input = {}, locale) {
  if (resolveUiCopyLocaleV0(locale) === "tr") return resolveProductStatusHeadlineTrV0(input);
  const surface = String(input.activeSurface || "world");
  if (surface === "world") return "World · open the map, choose a place, or type";
  if (surface === "studio") return "Studio · beta status";
  if (surface === "broadcast") return "Broadcast · beta prep";
  if (surface === "greenroom") return "Prep · beta invite flow";
  if (surface === "hall") return "Hall · observation summary";
  if (surface === "profile") return "Profile · account";
  return "Rhizoh";
}

export function resolveWorldMapToolLabelV0(toolId, locale) {
  const tr = resolveUiCopyLocaleV0(locale) === "tr";
  const id = String(toolId || "globe");
  if (tr) {
    if (id === "globe") return "Küre";
    if (id === "city_map") return "3D şehir";
    if (id === "satellite") return "Uydu";
    if (id === "streets") return "Sokak";
    if (id === "terrain") return "Arazi";
    return "Bağlantı";
  }
  if (id === "globe") return "Globe";
  if (id === "city_map") return "City 3D";
  if (id === "satellite") return "Satellite";
  if (id === "streets") return "Streets";
  if (id === "terrain") return "Terrain";
  return "Anchor";
}

export function resolveLocalPanelOpenLineV0(panel, locale) {
  const tr = resolveUiCopyLocaleV0(locale) === "tr";
  const p = String(panel || "");
  if (tr) {
    if (p === "world" || p === "wheel") return "Dünya açıldı — harita ve sohbet.";
    if (p === "hall") return "Salon açıldı — gözlem özeti.";
    if (p === "studio") return "Stüdyo beta açıldı — durum özeti.";
    if (p === "broadcast") return "Yayın beta açıldı — davet hazırlığı.";
    if (p === "greenroom") return "Hazırlık beta açıldı — davet linki.";
    if (p === "profile") return "Profil paneli açıldı.";
    return "Bölüm açıldı.";
  }
  if (p === "world" || p === "wheel") return "World open — map and chat.";
  if (p === "hall") return "Hall open — observation summary.";
  if (p === "studio") return "Studio beta open — status summary.";
  if (p === "broadcast") return "Broadcast beta open — invite prep.";
  if (p === "greenroom") return "Prep beta open — invite link.";
  if (p === "profile") return "Profile panel open.";
  return "Section open.";
}

export function resolveLocalMapToolLineV0(mapTool, locale) {
  const label = resolveWorldMapToolLabelV0(mapTool, locale);
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? `Harita katmanı: ${label}.`
    : `Map layer: ${label}.`;
}

export function resolveVoiceAvailableHintV0(locale) {
  return resolveUiCopyLocaleV0(locale) === "tr"
    ? RHIZOH_VOICE_AVAILABLE_HINT_TR_V0
    : RHIZOH_VOICE_AVAILABLE_HINT_EN_V0;
}
