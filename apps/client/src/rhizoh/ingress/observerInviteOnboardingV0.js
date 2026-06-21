/**
 * Observer invite onboarding — local Rhizoh guidance by perception mode.
 * Interpretation only; opens castle gate only when user explicitly asks.
 */

import { readObserverInviteContextV0 } from "./observerInviteLandingV0.js";
import {
  INVITE_PERCEPTION_MODE_V0,
  resolveInvitePerceptionLensV0
} from "./observerInvitePerceptionLensV0.js";
import { hasPersistedWorldSpaceCastleV0 } from "../runtime/castleWorldSpaceContinuityV0.js";
import { readCastleNexusGeoV0 } from "../runtime/worldMapBootstrapGeoV0.js";
import { resolveOutputLanguageCodeV0 } from "../runtime/rhizohOutputLanguagePolicyV0.js";
import { openCastleInitGateFromLocalCommandV0 } from "../runtime/rhizohLocalCommandHandlersV0.js";
import { detectCastleIntentWithoutCoords } from "../../kernel/rhizohCommandParser.js";

export const OBSERVER_INVITE_ONBOARDING_SCHEMA_V0 = "castle.rhizoh.observer_invite_onboarding.v0";

function textIncludesAnyV0(text, needles) {
  const t = String(text || "").toLowerCase();
  return needles.some((n) => t.includes(String(n).toLowerCase()));
}

/**
 * @param {string} message
 */
export function isObserverInviteOnboardingQuestionV0(message) {
  const t = String(message || "").trim().toLowerCase();
  if (!t) return false;
  return textIncludesAnyV0(t, [
    "ne yapabiliriz",
    "ne yapabilirim",
    "ne yapalım",
    "ne yapmam lazım",
    "ne yapmalıyım",
    "what can we do",
    "what can i do",
    "what should we do",
    "what should i do",
    "tanıştık",
    "tanışalım",
    "merhaba rhizoh",
    "hello rhizoh",
    "hi rhizoh",
    "nereden başla",
    "nasıl başlarım",
    "how do i start",
    "where do i start",
    "yardım et",
    "help me get started",
    "sonraki adım",
    "next step",
    "neler yapabilirim",
    "what is next"
  ]);
}

/**
 * @returns {{ invite: object, perceptionMode: string, hasCastle: boolean, hasUserGeo: boolean } | null}
 */
export function readObserverInviteOnboardingContextV0() {
  const invite = readObserverInviteContextV0();
  if (!invite?.inviteToken) return null;

  const role = invite.role || "observer";
  const locale = resolveOutputLanguageCodeV0() === "tr" ? "tr" : "en";
  const lens = resolveInvitePerceptionLensV0(role, locale);
  const perceptionMode =
    invite.perceptionMode || lens.mode || INVITE_PERCEPTION_MODE_V0.EXPLORER;
  const nexus = readCastleNexusGeoV0();
  const hasUserGeo = Boolean(nexus && nexus.source !== "origin_seed_serencebey");

  return Object.freeze({
    invite,
    perceptionMode,
    hasCastle: hasPersistedWorldSpaceCastleV0(),
    hasUserGeo
  });
}

function buildGeoLineV0(tr, hasUserGeo) {
  if (hasUserGeo) {
    return tr
      ? "Konumun alındı — harita senin koordinatlarına yaklaşır; İstanbul Serencebey referans pini yine görünür."
      : "Your location is set — the map moves near your coordinates; the Istanbul Serencebey reference pin stays visible.";
  }
  return tr
    ? "Konum paylaşmadıysan harita İstanbul Serencebey'den başlar; istediğin zaman konum veya harita seçimiyle değiştirebilirsin."
    : "Without location, the map starts at Istanbul Serencebey; you can change it anytime via GPS or a map pick.";
}

function buildCastleLineV0(tr, hasCastle) {
  if (hasCastle) {
    return tr
      ? "Kalen zaten kurulu — haritada 'My Castle' pinini görebilirsin."
      : "Your castle is already anchored — look for the My Castle pin on the map.";
  }
  return tr
    ? "Kendi kaleni kurmak için 'kale kur' de — kapı açılır; GPS, harita seçimi veya soyut düğüm seçeneklerin var."
    : "To build your castle, say 'kale kur' — the gate opens with GPS, map pick, or abstract node options.";
}

function buildModeBodyV0(mode, tr, hasCastle, hasUserGeo) {
  const geo = buildGeoLineV0(tr, hasUserGeo);
  const castle = buildCastleLineV0(tr, hasCastle);

  if (mode === INVITE_PERCEPTION_MODE_V0.RESEARCH) {
    return tr
      ? `Araştırma modundasın. Dünya sekmesinden haritaya geç; nedensel zaman çizelgesi ve epistemik özne salt okunur panellerde. ${geo} ${castle} Sorularını buradan yazmaya devam edebilirsin.`
      : `You are in research mode. Open the World tab for the map; causal timeline and epistemic subject sit in read-only panels. ${geo} ${castle} Keep asking questions here.`;
  }

  if (mode === INVITE_PERCEPTION_MODE_V0.SIGNAL) {
    return tr
      ? `Sinyal modundasın — altyapı gözlemi: olay düğümleri, hat stabilitesi, mimari netlik. Dünya sekmesinden haritayı aç; kuleler ve portal pinleri mesh üzerinde. ${geo} ${castle}`
      : `You are in signal mode — infrastructure observation: event nodes, pipeline stability, architecture clarity. Open the World tab for towers and portal pins on the mesh. ${geo} ${castle}`;
  }

  return tr
    ? `Keşif modundasın. Sohbet burada; harita için Dünya sekmesine geç — kuleler, radyo, satranç ve etkinlik pinlerini görebilirsin. Kale şart değil. ${geo} ${castle}`
    : `You are in explorer mode. Chat stays here; switch to the World tab for towers, radio, chess, and event pins. A castle is optional. ${geo} ${castle}`;
}

/**
 * @param {string} message
 * @param {{ source?: string, traceId?: string }} [opts]
 */
export function tryResolveObserverInviteOnboardingV0(message, opts = {}) {
  if (!isObserverInviteOnboardingQuestionV0(message)) return null;

  const ctx = readObserverInviteOnboardingContextV0();
  if (!ctx) return null;

  const tr = resolveOutputLanguageCodeV0() === "tr";
  const openCastle = detectCastleIntentWithoutCoords(message);

  if (openCastle) {
    openCastleInitGateFromLocalCommandV0(opts.source || "invite_onboarding");
  }

  const intro = tr ? "Tanıştık." : "Good to meet you.";
  const meaningHint = tr
    ? "Üç epistemik koordinat: harita = mekânsal nedensellik; satranç = zamansal akıl yürütme; kale = anlatı tutarlılığı çıpası (isteğe bağlı)."
    : "Three epistemic coordinates: map = spatial causality; chess = temporal reasoning; castle = narrative coherence anchor (optional).";
  const body = buildModeBodyV0(ctx.perceptionMode, tr, ctx.hasCastle, ctx.hasUserGeo);

  return Object.freeze({
    schema: OBSERVER_INVITE_ONBOARDING_SCHEMA_V0,
    reply: `${intro} ${meaningHint} ${body}`,
    source: "observer_invite_onboarding",
    llmBypass: true,
    perceptionMode: ctx.perceptionMode,
    traceId: opts.traceId || null
  });
}

/**
 * Compact patch for remote LLM context when invite session is active.
 */
export function buildObserverInviteLlmContextPatchV0() {
  const ctx = readObserverInviteOnboardingContextV0();
  if (!ctx) return null;

  const locale = resolveOutputLanguageCodeV0() === "tr" ? "tr" : "en";
  const lens = resolveInvitePerceptionLensV0(ctx.invite.role || "observer", locale);

  return Object.freeze({
    schema: OBSERVER_INVITE_ONBOARDING_SCHEMA_V0,
    perceptionMode: ctx.perceptionMode,
    perceptionModeLabel: lens.copy.perceptionModeName,
    hasCastle: ctx.hasCastle,
    hasUserGeo: ctx.hasUserGeo,
    inviteRole: ctx.invite.role || "observer",
    interpretationOnly: true,
    onboardingHint:
      locale === "tr"
        ? "Kullanıcı davetli gözlemci. Algı moduna göre yönlendir: Dünya sekmesi, harita pinleri, isteğe bağlı kale kur ritüeli. Konum yoksa Serencebey bootstrap."
        : "User is an invited observer. Guide by perception mode: World tab, map pins, optional castle ritual. Without GPS, Serencebey bootstrap."
  });
}
