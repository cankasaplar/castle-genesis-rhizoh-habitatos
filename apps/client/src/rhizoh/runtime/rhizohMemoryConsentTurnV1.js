/**
 * Memory consent turn resolver — intercept yes/no before LLM when invitation pending.
 * RESEARCH-ONLY
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  MEMORY_CONSENT_STATUS_V1,
  parseMemoryConsentReplyV1
} from "./rhizohMemoryInvitationGateV1.js";
import {
  readPendingSpatialMemoryInvitationV1,
  resolvePendingSpatialConsentV1
} from "./rhizohSpatialMemoryAnchorV1.js";

export const RHIZOH_MEMORY_CONSENT_TURN_SCHEMA_V1 = "castle.rhizoh.memory_consent_turn.v1";

/**
 * @returns {object | null}
 */
export function readPendingMemoryInvitationV1() {
  const pending = readPendingSpatialMemoryInvitationV1();
  if (!pending || pending.consent !== MEMORY_CONSENT_STATUS_V1.PENDING) return null;
  return Object.freeze({
    schema: RHIZOH_MEMORY_CONSENT_TURN_SCHEMA_V1,
    tier: "spatial_anchor",
    pending,
    stagedAt: pending.stagedAt ?? null,
    excerpt: String(pending.messageExcerpt || "").slice(0, 120)
  });
}

/**
 * @param {string} [locale]
 * @param {"granted" | "declined"} status
 * @param {{ label?: string } | null} [anchor]
 */
export function formatMemoryConsentAckReplyV1(locale, status, anchor = null) {
  const tr = String(locale || resolveOutputLanguageCodeV0() || "tr")
    .toLowerCase()
    .startsWith("tr");
  if (status === MEMORY_CONSENT_STATUS_V1.GRANTED) {
    const label = String(anchor?.label || "").trim();
    if (tr) {
      return label
        ? `Tamam — "${label}" not aldım. Dünyanda yumuşak bir gelecek işareti bıraktım.`
        : "Tamam — not aldım. Dünyanda yumuşak bir gelecek işareti bıraktım.";
    }
    return label
      ? `Got it — I've noted "${label}" and placed a soft future marker in your world.`
      : "Got it — noted, with a soft future marker in your world.";
  }
  if (tr) {
    return "Tamam — kaydetmiyorum. İstersen sonra tekrar söyleyebilirsin.";
  }
  return "Okay — I won't save it. You can tell me again anytime.";
}

/**
 * @param {string} message
 * @param {{ locale?: string, traceId?: string }} [opts]
 */
export function tryResolveMemoryConsentTurnV1(message, opts = {}) {
  const pending = readPendingMemoryInvitationV1();
  if (!pending) return null;

  const raw = String(message || "").trim();
  if (!raw) return null;

  const parsed = parseMemoryConsentReplyV1(raw);
  if (parsed.status === MEMORY_CONSENT_STATUS_V1.NONE) return null;

  const loc = String(opts.locale || resolveOutputLanguageCodeV0() || "tr").slice(0, 2);
  const traceId = String(opts.traceId || "").trim() || null;

  if (parsed.status === MEMORY_CONSENT_STATUS_V1.DECLINED) {
    resolvePendingSpatialConsentV1(raw);
    const reply = formatMemoryConsentAckReplyV1(loc, MEMORY_CONSENT_STATUS_V1.DECLINED);
    return Object.freeze({
      schema: RHIZOH_MEMORY_CONSENT_TURN_SCHEMA_V1,
      reply,
      source: "memory_consent_declined",
      llmBypass: true,
      traceId,
      consentStatus: MEMORY_CONSENT_STATUS_V1.DECLINED
    });
  }

  const committed = resolvePendingSpatialConsentV1(raw);
  if (!committed.ok || !committed.anchor) {
    return null;
  }

  const reply = formatMemoryConsentAckReplyV1(loc, MEMORY_CONSENT_STATUS_V1.GRANTED, committed.anchor);

  return Object.freeze({
    schema: RHIZOH_MEMORY_CONSENT_TURN_SCHEMA_V1,
    reply,
    source: "memory_consent_spatial_committed",
    llmBypass: true,
    traceId,
    consentStatus: MEMORY_CONSENT_STATUS_V1.GRANTED,
    spatialAnchor: committed.anchor
  });
}

/**
 * Publish pending invitation for UI/debug surfaces.
 */
export function publishPendingMemoryInvitationV1() {
  const pending = readPendingMemoryInvitationV1();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.pendingMemoryInvitation = pending;
  }
  return pending;
}
