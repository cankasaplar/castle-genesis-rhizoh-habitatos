/**
 * Plain Turkish product copy — kullanıcıya görünen cümleler (jargon yok).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

import { readUserAnchorV0, resolveDisplayAnchorV0 } from "./memoryAnchorSystemV0.js";
import { T0_INTENT_ANCHORS_V0, T0_INTENT_CONNECT_V0, T0_INTENT_EXPLORE_V0, T0_INTENT_OBSERVE_V0, T0_INTENT_PRODUCE_V0 } from "./t0ContextStripV0.js";

/** Capability wheel — başlık ve giriş cümlesi */
export const RHIZOH_HALO_HEADLINE_TR_V0 = "Ne yapmak istersin?";
export const RHIZOH_HALO_INTRO_TR_V0 =
  "Ortadaki düğümlere dokun veya üzerine gel — Rhizoh ne yapabileceğini söylesin.";

/** @type {readonly { id: string, label: string, whisper: string, seedIntent: string, layerFocus?: number, isRoboticsHub?: boolean }[]} */
export const RHIZOH_CAPABILITY_HALO_NODES_TR_V0 = Object.freeze([
  Object.freeze({
    id: "create",
    label: "Üret",
    whisper: "Stüdyo veya hazırlık odasında yeni oturum açarız.",
    seedIntent: "stüdyoda yeni bir oturum aç"
  }),
  Object.freeze({
    id: "explore",
    label: "Keşfet",
    whisper: "Ana sahneyi veya harita katmanını gezebilirsin — komut: haritaya geç.",
    seedIntent: "haritaya geç"
  }),
  Object.freeze({
    id: "learn",
    label: "Öğren",
    whisper: "Akademi ve gözlem katmanına gidebilirsin.",
    seedIntent: "profil ve academy alanını aç",
    layerFocus: 11
  }),
  Object.freeze({
    id: "broadcast",
    label: "Yayın",
    whisper: "Canlı yayın veya hazırlık odasına geçebilirsin.",
    seedIntent: "yayına geç"
  }),
  Object.freeze({
    id: "build",
    label: "Kur",
    whisper: "Kale, pin veya görev — yerel komutlarla kurulum.",
    seedIntent: "burada kale kurmak istiyorum",
    layerFocus: 10
  }),
  Object.freeze({
    id: "companion",
    label: "Eşlik",
    whisper: "Octo ve karakter / diyalog yüzeyi.",
    seedIntent: "octo ile yeni bir karakter tasarla"
  }),
  Object.freeze({
    id: "robotics",
    label: "Cihaz",
    whisper: "Kamera, sensör veya robot köprüsü (ileri).",
    isRoboticsHub: true,
    layerFocus: 13
  }),
  Object.freeze({
    id: "swarm",
    label: "Sürü",
    whisper: "Ajan sürüsünü ve koordinasyonu güçlendirir.",
    seedIntent: "ajan sürüsünü göster",
    layerFocus: 6
  }),
  Object.freeze({
    id: "world",
    label: "Dünya",
    whisper: "Ana sahneye dön — küre, çekirdek ve süreklilik.",
    seedIntent: "dünyaya geç"
  })
]);

/** Alt çubuk — kısa açıklama (title) */
export const RHIZOH_SHELL_HINT_TR_V0 = Object.freeze({
  world: "Ana sahne · Küre / Şehir / Bağlantı (aç-kapat · dokun = harita değiştir)",
  hall: "Salon paneli (aç/kapat)",
  greenroom: "Hazırlık paneli (aç/kapat)",
  broadcast: "Yayın paneli (aç/kapat)",
  studio: "Stüdyo paneli (aç/kapat)",
  profile: "Profil paneli (aç/kapat)"
});

/** Niyet düğmeleri — etiket + ipucu */
export const RHIZOH_INTENT_PLAIN_TR_V0 = Object.freeze({
  explore: Object.freeze({ label: "Keşfet", hint: "Ana sahne — konuş, gez, tekerlek" }),
  produce: Object.freeze({ label: "Üret", hint: "Stüdyo — içerik ve oturum" }),
  observe: Object.freeze({ label: "İzle", hint: "Salon — kayıt ve gözlem" }),
  connect: Object.freeze({ label: "Bağlan", hint: "Yayın — canlı ve paylaşım" })
});

/**
 * Tek satır durum — üst şerit (anlaşılır).
 * @param {{ activeSurface?: string, intent?: string }} input
 */
export function resolveProductStatusHeadlineTrV0(input = {}) {
  const surface = String(input.activeSurface || "world");
  const intent = String(input.intent || T0_INTENT_EXPLORE_V0);
  const anchor = resolveDisplayAnchorV0();
  const anchorLabel = String(anchor?.primary_label || anchor?.label || "").trim();
  const hasAnchor = Boolean(readUserAnchorV0()?.label || anchorLabel);

  if (surface === "world") {
    if (hasAnchor && anchorLabel) {
      return `Ana sahne · Kaldığın yer: ${anchorLabel.slice(0, 40)}`;
    }
    return "Ana sahne · Konuş, yaz veya ortadaki tekerlekten seç";
  }
  if (surface === "studio") return "Stüdyo · Üretim ve oturumlar";
  if (surface === "broadcast") return "Yayın · Canlı ve paylaşım";
  if (surface === "greenroom") return "Hazırlık odası · Yayına hazırlık";
  if (surface === "hall") return "Salon · Gözlem ve kayıtlar";
  if (surface === "profile") return "Profil · Hesap ve kimlik";

  const intentRow = RHIZOH_INTENT_PLAIN_TR_V0[intent] || RHIZOH_INTENT_PLAIN_TR_V0.explore;
  return `${intentRow.label} · ${RHIZOH_SHELL_HINT_TR_V0[surface] || "Rhizoh"}`;
}

/**
 * Sohbet kutusu üst satırı.
 * @param {{ connected?: boolean, busy?: boolean, fieldState?: string }} input
 */
export function resolveChatStatusLineTrV0(input = {}) {
  const busy = Boolean(input.busy);
  const connected = input.connected !== false;
  if (busy) return "Rhizoh düşünüyor…";
  if (input.fieldState === "SPEAKING") return "Rhizoh konuşuyor…";
  if (input.fieldState === "LISTENING") return "Seni dinliyorum…";
  if (!connected) return "Bağlanıyor… · yine de yazabilirsin";
  return "Hazır · yaz veya mikrofona bas";
}

/**
 * @param {string} surfaceId
 */
export function formatPlainSurfaceOpenTrV0(surfaceId) {
  const id = String(surfaceId || "world");
  const map = Object.freeze({
    world: "Ana sahne açıldı — ajanlar ve çekirdek burada.",
    studio: "Stüdyo açıldı — üretim ve oturumlar burada.",
    hall: "Salon açıldı — kayıt ve gözlem.",
    greenroom: "Hazırlık odası açıldı — yayına hazırlık.",
    broadcast: "Yayın yüzeyi açıldı.",
    profile: "Profil ve ayarlar açıldı."
  });
  return map[id] || `${id} açıldı.`;
}

/**
 * @param {string} intentId
 */
export function formatPlainIntentChosenTrV0(intentId) {
  const row = RHIZOH_INTENT_PLAIN_TR_V0[String(intentId)] || RHIZOH_INTENT_PLAIN_TR_V0.explore;
  return `${row.label} seçildi — ${row.hint}`;
}

/** Mikrofon hazır göstergesi (T0 dock — ses motoru kayıtlı). */
export const RHIZOH_VOICE_AVAILABLE_HINT_TR_V0 = "Ses hazır — mikrofona dokun";

export const RHIZOH_VOICE_AVAILABLE_HINT_EN_V0 = "Voice ready — tap the mic";

/** Merkez orb alt yazısı (WORLD). */
export const RHIZOH_WORLD_CENTER_SUBTITLE_TR_V0 =
  "Rhizoh alanı · Ajan sürüsü ve çekirdek";
