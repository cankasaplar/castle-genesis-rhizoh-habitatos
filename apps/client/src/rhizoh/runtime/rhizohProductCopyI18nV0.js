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
  world: Object.freeze({ shell: "World", short: "World", pathHint: "Main stage · agents · chat" }),
  hall: Object.freeze({ shell: "Hall", short: "Hall", pathHint: "Records and observation" }),
  greenroom: Object.freeze({ shell: "Green room", short: "Prep", pathHint: "Pre-broadcast prep" }),
  broadcast: Object.freeze({ shell: "Broadcast", short: "Live", pathHint: "Live stream" }),
  studio: Object.freeze({ shell: "Studio", short: "Studio", pathHint: "Production sessions" }),
  profile: Object.freeze({ shell: "Profile", short: "Profile", pathHint: "Account and settings" })
});

export const RHIZOH_SHELL_HINT_EN_V0 = Object.freeze({
  world: "Main stage · Globe / City 3D / Satellite / Streets / Terrain / Anchor",
  hall: "Hall panel (toggle)",
  greenroom: "Prep panel (toggle)",
  broadcast: "Broadcast panel (toggle)",
  studio: "Studio panel (toggle)",
  profile: "Profile panel (toggle)"
});

export const RHIZOH_HALO_HEADLINE_EN_V0 = "What would you like to do?";
export const RHIZOH_HALO_INTRO_EN_V0 =
  "Tap or hover the nodes — Rhizoh will whisper what it can do.";

/** @type {typeof RHIZOH_CAPABILITY_HALO_NODES_TR_V0} */
export const RHIZOH_CAPABILITY_HALO_NODES_EN_V0 = Object.freeze([
  Object.freeze({ id: "create", label: "Create", whisper: "Open a new session in Studio or prep.", seedIntent: "open a new session in studio" }),
  Object.freeze({ id: "explore", label: "Explore", whisper: "Main stage or map layer — say: open map.", seedIntent: "open map" }),
  Object.freeze({ id: "learn", label: "Learn", whisper: "Academy and observation layer.", seedIntent: "open profile and academy", layerFocus: 11 }),
  Object.freeze({ id: "broadcast", label: "Broadcast", whisper: "Live stream or green room.", seedIntent: "go to broadcast" }),
  Object.freeze({ id: "build", label: "Build", whisper: "Castle, pin, or task — local commands.", seedIntent: "I want to place a castle here", layerFocus: 10 }),
  Object.freeze({ id: "companion", label: "Companion", whisper: "Octo character and dialogue.", seedIntent: "design a new companion with octo" }),
  Object.freeze({ id: "robotics", label: "Devices", whisper: "Camera, sensor, or robot bridge.", isRoboticsHub: true, layerFocus: 13 }),
  Object.freeze({ id: "swarm", label: "Swarm", whisper: "Agent swarm coordination.", seedIntent: "show agent swarm", layerFocus: 6 }),
  Object.freeze({ id: "world", label: "World", whisper: "Return to main stage — globe and continuity.", seedIntent: "go to world" })
]);

export const RHIZOH_WORLD_CENTER_SUBTITLE_EN_V0 = "Rhizoh field · Agent swarm and core";

export const RHIZOH_PRODUCT_DRAWER_COPY_EN_V0 = Object.freeze({
  hall: Object.freeze({ title: "Hall", blurb: "Records, observation, and session history." }),
  greenroom: Object.freeze({ title: "Green room", blurb: "Prep and audio check before going live." }),
  broadcast: Object.freeze({ title: "Broadcast", blurb: "Live stream and audience connection." }),
  studio: Object.freeze({ title: "Studio", blurb: "Production, agents, and creative sessions." }),
  profile: Object.freeze({ title: "Profile", blurb: "Account, identity, and settings." }),
  close: "Close",
  broadcastNote: "Live broadcast opens through the mesh gateway. The connection badge should be green."
});

export const RHIZOH_PRODUCT_DRAWER_COPY_TR_V0 = Object.freeze({
  hall: Object.freeze({ title: "Salon", blurb: "Kayıt, gözlem ve oturum geçmişi." }),
  greenroom: Object.freeze({ title: "Hazırlık odası", blurb: "Yayına geçmeden önce hazırlık ve ses kontrolü." }),
  broadcast: Object.freeze({ title: "Yayın", blurb: "Canlı yayın ve izleyici bağlantısı." }),
  studio: Object.freeze({ title: "Stüdyo", blurb: "Üretim, ajanlar ve yaratım oturumu." }),
  profile: Object.freeze({ title: "Profil", blurb: "Hesap, kimlik ve ayarlar." }),
  close: "Kapat",
  broadcastNote: "Canlı yayın mesh gateway üzerinden açılır. Bağlantı rozeti yeşil olmalı."
});

export const RHIZOH_PRODUCT_DETAIL_CHROME_EN_V0 = Object.freeze({
  open: "Details",
  close: "Close panel",
  closeDrawer: "Close details"
});

export const RHIZOH_PRODUCT_DETAIL_CHROME_TR_V0 = Object.freeze({
  open: "Ayrıntılar",
  close: "Paneli kapat",
  closeDrawer: "Ayrıntıları kapat"
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
    world: "Main stage open — agents and core are here.",
    studio: "Studio open — production sessions.",
    hall: "Hall open — records and observation.",
    greenroom: "Green room open — prep for broadcast.",
    broadcast: "Broadcast surface open.",
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
  if (surface === "world") return "Main stage · talk, type, or use the wheel";
  if (surface === "studio") return "Studio · production";
  if (surface === "broadcast") return "Broadcast · live";
  if (surface === "greenroom") return "Green room · prep";
  if (surface === "hall") return "Hall · observation";
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
    if (p === "world" || p === "wheel") return "Dünya açıldı — yetenek tekerleği.";
    if (p === "hall") return "Salon paneli açıldı.";
    if (p === "studio") return "Stüdyo paneli açıldı.";
    if (p === "broadcast") return "Yayın paneli açıldı.";
    if (p === "greenroom") return "Hazırlık paneli açıldı.";
    if (p === "profile") return "Profil paneli açıldı.";
    return "Bölüm açıldı.";
  }
  if (p === "world" || p === "wheel") return "World open — capability wheel.";
  if (p === "hall") return "Hall panel open.";
  if (p === "studio") return "Studio panel open.";
  if (p === "broadcast") return "Broadcast panel open.";
  if (p === "greenroom") return "Prep panel open.";
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
