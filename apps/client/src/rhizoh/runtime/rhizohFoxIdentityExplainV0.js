/**
 * Fox identity explain — locked companion copy (LLM bypass) + deferred naming reserve.
 * Fox = attention co-presence anchor; Rhizoh owns speech (behavior-only policy).
 */

import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";
import {
  readRhizohContinuityDiskV0,
  writeRhizohContinuityPersonaV0
} from "./rhizohContinuityDiskMetaV0.js";

export const RHIZOH_FOX_IDENTITY_SCHEMA_V0 = "castle.rhizoh.fox_identity_explain.v0";

export const FOX_NAMING_STATUS_V0 = Object.freeze({
  DEFERRED: "deferred",
  RESERVED: "reserved",
  ACTIVE: "active"
});

const FOX_CONTEXT_RE_V0 =
  /\b(tilki|fox|tilkiye|tilkinin|tilkisi|tilkine|foxu|foxa|companion anchor|yoldas)\b/i;

const TILKI_WORD_RE_V0 = /\btilki\w*\b/i;
const FOX_WORD_RE_V0 = /\bfox\w*\b/i;

/** @type {{ kind: string, re: RegExp }[]} */
const FOX_IDENTITY_PATTERNS_V0 = [
  { kind: "explain", re: /\b(bu\s+tilki|su\s+tilki|o\s+tilki|tilki)\s+kim\b/i },
  { kind: "explain", re: /\b(bu\s+fox|the\s+fox|who\s+is\s+(the\s+)?fox)\b/i },
  { kind: "explain", re: /\b(tilki|fox)\s+(ne|nedir|kimdir|kisi|character)\b/i },
  { kind: "explain", re: /\b(tilki\s+ne\s+ise\s+yarar|fox\s+what\s+is)\b/i },
  { kind: "naming", re: /\b(tilki\w*|fox\w*)\b.{0,28}\b(isim|adi|adini|ismi|name)\b/i },
  { kind: "naming", re: /\b(isim\s+ver\w*|ad\s+koy|name\s+(the\s+)?fox|call\s+(the\s+)?fox)\b/i },
  { kind: "naming", re: /\b(sana\s+\w+\s+diy(e|ecegim)|seni\s+\w+\s+cagir|call\s+you\s+\w+)\b/i }
];

/**
 * @param {string} raw
 */
export function normalizeForFoxIdentityV0(raw) {
  return foldCanonicalSurfaceV1(String(raw || "").trim()).replace(/[?!.,;:]+$/g, "").trim();
}

/**
 * @param {string} raw
 */
export function probeFoxIdentityQueryV0(raw) {
  const n = normalizeForFoxIdentityV0(raw);
  if (!n) {
    return Object.freeze({ active: false, kind: null, reason: "empty" });
  }

  const hasFoxContext = FOX_CONTEXT_RE_V0.test(n) || TILKI_WORD_RE_V0.test(n) || FOX_WORD_RE_V0.test(n);
  let kind = null;
  for (const row of FOX_IDENTITY_PATTERNS_V0) {
    if (row.re.test(n)) {
      kind = row.kind;
      break;
    }
  }

  if (kind === "naming" && !hasFoxContext && !/\bfox\b/i.test(n)) {
    if (!/\b(sana|seni|call\s+you)\b/i.test(n)) {
      kind = null;
    }
  }

  if (kind === "explain" && /\b(rhizoh|rizo|rezo)\s+(kim|nedir)\b/i.test(n) && !hasFoxContext) {
    kind = null;
  }

  const wordCount = n.split(/\s+/).filter(Boolean).length;
  if (kind && wordCount > 22) {
    return Object.freeze({ active: false, kind: null, reason: "compound_defer" });
  }

  if (!kind) {
    return Object.freeze({ active: false, kind: null, reason: "none" });
  }

  return Object.freeze({
    active: true,
    kind,
    reason: `pattern_${kind}`,
    proposedName: kind === "naming" ? parseFoxNameProposalV0(raw) : null
  });
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function parseFoxNameProposalV0(raw) {
  const n = normalizeForFoxIdentityV0(raw);
  if (!n) return null;

  const patterns = [
    /\btilki\w*\s+(?:adini|adi|ismi|name)\s+([a-z]{2,24})\s+(?:yap|koy|olsun|ver)\b/i,
    /\bfox\w*\s+(?:adini|adi|ismi|name)\s+([a-z]{2,24})\s+(?:yap|koy|olsun|ver)\b/i,
    /\b(?:adini|adi|ismi)\s+([a-z]{2,24})\s+koy\b/i,
    /\b(?:tilki\w*|fox\w*)\b.{0,20}(?:adini|adi|ismi)\s+([a-z]{2,24})\b/i,
    /\b(?:sana|seni|fox(?:u|a)?)\s+([a-z]{2,24})\s+(?:diyecegim|de|cagir|call)\b/i,
    /\b(?:call\s+(?:the\s+)?fox|name\s+(?:the\s+)?fox)\s+([a-z]{2,24})\b/i,
    /\b([a-z]{2,24})\s+olsun\s+(?:senin\s+)?(?:adin|ismin)\b/i
  ];

  for (const re of patterns) {
    const m = n.match(re);
    const name = String(m?.[1] || "").trim();
    if (name.length >= 2 && !/^(bir|the|sen|ben|fox|tilki)$/i.test(name)) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
  return null;
}

/**
 * @param {string} [locale]
 */
export function formatFoxIdentityExplainReplyV0(locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  if (tr) {
    return (
      "Ekranda gördüğün tilki ayrı bir karakter değil — benim dikkat ve eş-varlık yoldaşım. " +
      "Ne zaman konuşacağımı, neye odaklanacağımı ve sürekliliği nasıl taşıyacağımı şekillendirir. " +
      "Seninle konuşan benim; tilki sessizce dinler ve dikkati yönlendirir."
    );
  }
  return (
    "The fox on screen isn't a separate character — it's my attention and co-presence companion. " +
    "It shapes when I speak, what I focus on, and how continuity is carried. " +
    "You talk with me; the fox listens quietly and steers attention."
  );
}

/**
 * @param {string} [locale]
 * @param {{ proposedName?: string | null, reserved?: boolean }} [ctx]
 */
export function formatFoxNamingDeferReplyV0(locale = "tr", ctx = {}) {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const name = String(ctx.proposedName || "").trim();
  const reserved = ctx.reserved === true && name.length >= 2;

  if (tr) {
    if (reserved) {
      return (
        `Tamam — ${name} önerisini not aldım. Henüz aktif bir isim değil; ileride birlikte onaylarız. ` +
        "Şimdilik yol arkadaşım olarak kalır."
      );
    }
    return (
      "Şimdilik isme gerek yok — yol arkadaşım olarak yeter. " +
      "İleride birlikte bir isim seçeriz; bir önerin varsa not alabilirim."
    );
  }
  if (reserved) {
    return (
      `Got it — I've noted ${name} as a suggestion. It's not active yet; we'll confirm together later. ` +
      "For now they stay my trail companion."
    );
  }
  return (
    "No name needed for now — companion is enough. " +
    "We'll pick a name together later; I can note a suggestion if you have one."
  );
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} [diskPersona]
 */
export function applyFoxNamingProposalV0(message, diskPersona = {}) {
  const proposedName = parseFoxNameProposalV0(message);
  if (!proposedName) return null;

  const prev = diskPersona && typeof diskPersona === "object" ? diskPersona : {};
  return Object.freeze({
    ...prev,
    foxPreferredName: proposedName,
    foxNamingStatus: FOX_NAMING_STATUS_V0.RESERVED,
    foxNamingUpdatedAt: Date.now(),
    foxNamingSource: "user_proposal"
  });
}

/**
 * @param {string} normalized
 * @param {string} raw
 * @param {string} [locale]
 */
export function resolveFoxIdentityPrecheckV0(normalized, raw, locale = "tr") {
  const probe = probeFoxIdentityQueryV0(raw || normalized);
  if (!probe.active) return null;

  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const disk = readRhizohContinuityDiskV0();

  if (probe.kind === "naming") {
    const patch = applyFoxNamingProposalV0(raw || normalized, disk.persona);
    if (patch) writeRhizohContinuityPersonaV0(patch);
    const reply = formatFoxNamingDeferReplyV0(loc, {
      proposedName: probe.proposedName || patch?.foxPreferredName || null,
      reserved: Boolean(patch?.foxPreferredName)
    });
    return Object.freeze({
      intent: patch?.foxPreferredName ? "fox_naming_reserved" : "fox_naming_defer",
      reply,
      foxNamingStatus: patch?.foxNamingStatus || FOX_NAMING_STATUS_V0.DEFERRED
    });
  }

  return Object.freeze({
    intent: "fox_identity_explain",
    reply: formatFoxIdentityExplainReplyV0(loc)
  });
}

/**
 * @param {Record<string, unknown>} [persona]
 */
export function readFoxNamingSnapshotV0(persona = {}) {
  const p = persona && typeof persona === "object" ? persona : {};
  return Object.freeze({
    foxPreferredName: String(p.foxPreferredName || "").trim() || null,
    foxNamingStatus: String(p.foxNamingStatus || FOX_NAMING_STATUS_V0.DEFERRED),
    foxNamingUpdatedAt: Number(p.foxNamingUpdatedAt) || null
  });
}
