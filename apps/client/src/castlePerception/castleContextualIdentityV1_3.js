/**
 * Castle Contextual Identity v1.3 — dynamic identity beyond static ownerId.
 * Identity ≠ ownership: same owner, different mood / device / context / intent weight.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_3.md
 */

export const CASTLE_CONTEXTUAL_IDENTITY_SCHEMA_V1_3 = "castle.contextual_identity.v1.3";

export const CONTEXT_LENS_V1_3 = Object.freeze({
  CO_WATCH: "co_watch",
  TECHNICAL: "technical",
  SOCIAL: "social",
  AMBIENT: "ambient",
  AUDIOBOOK: "audiobook",
  GENERAL: "general"
});

/** @type {Map<string, object>} contextualId → latest state */
const identityStateByContextualIdV1_3 = new Map();
const STATE_MAX_V1_3 = 64;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function inferContextLensV1_3(input = {}) {
  if (input.contextLens && Object.values(CONTEXT_LENS_V1_3).includes(input.contextLens)) {
    return input.contextLens;
  }
  const preview = String(input.preview || input.text || "").toLowerCase();
  const source = String(input.source || "");
  if (/pozisyon|maç|match|goal|gol/.test(preview) || source === "youtube" || source === "tv") {
    return CONTEXT_LENS_V1_3.CO_WATCH;
  }
  if (/audiobook|chapter|bölüm|kitap/.test(preview)) return CONTEXT_LENS_V1_3.AUDIOBOOK;
  if (/teknik|api|kod|bug|error/.test(preview)) return CONTEXT_LENS_V1_3.TECHNICAL;
  if (/rhizoh|merhaba|nasılsın/.test(preview)) return CONTEXT_LENS_V1_3.SOCIAL;
  if (source === "file" || source === "web") return CONTEXT_LENS_V1_3.AMBIENT;
  return CONTEXT_LENS_V1_3.GENERAL;
}

function inferMoodVectorV1_3(input = {}) {
  const type = input.type || input.intent || "reference";
  const urgency = type === "emergency" ? 0.95 : type === "intent" ? 0.55 : 0.2;
  const focus =
    input.focusWeight != null
      ? clamp01(input.focusWeight)
      : input.contextLens === CONTEXT_LENS_V1_3.TECHNICAL
        ? 0.85
        : input.contextLens === CONTEXT_LENS_V1_3.CO_WATCH
          ? 0.7
          : 0.45;
  const social =
    input.socialWeight != null
      ? clamp01(input.socialWeight)
      : type === "intent" && /\brhizoh\b/i.test(String(input.preview || ""))
        ? 0.8
        : 0.35;

  return Object.freeze({ focus, social, urgency });
}

function computeIntentWeightV1_3(input = {}) {
  let w = clamp01(input.salience ?? input.confidence ?? 0.5);
  if (input.type === "emergency") w = Math.max(w, 0.95);
  if (input.type === "intent") w = Math.max(w, 0.55);
  if (input.userInitiated) w = Math.min(1, w * 1.15);
  return Number(w.toFixed(4));
}

/**
 * Build contextual identity state — dynamic, not flat ownerId.
 * @param {object} input
 */
export function buildContextualIdentityV1_3(input = {}) {
  const ownerId = String(input.ownerId || input.userId || "user_local");
  const deviceId = String(input.deviceId || input.source || "default_device");
  const contextLens = inferContextLensV1_3(input);
  const moodVector = inferMoodVectorV1_3({ ...input, contextLens });
  const intentWeight = computeIntentWeightV1_3(input);
  const contextualId = `${ownerId}::${deviceId}::${contextLens}`;
  const atMs = Number(input.atMs || input.timestamp) || Date.now();

  const prev = identityStateByContextualIdV1_3.get(contextualId);
  const momentum = prev
    ? Number(clamp01(prev.intentWeight * 0.35 + intentWeight * 0.65).toFixed(4))
    : intentWeight;

  const state = Object.freeze({
    schema: CASTLE_CONTEXTUAL_IDENTITY_SCHEMA_V1_3,
    ownerId,
    contextualId,
    deviceId,
    contextLens,
    moodVector,
    intentWeight,
    momentum,
    threadId: input.threadId ? String(input.threadId) : null,
    atMs
  });

  identityStateByContextualIdV1_3.set(contextualId, state);
  if (identityStateByContextualIdV1_3.size > STATE_MAX_V1_3) {
    const oldest = [...identityStateByContextualIdV1_3.entries()].sort(
      (a, b) => a[1].atMs - b[1].atMs
    )[0];
    if (oldest) identityStateByContextualIdV1_3.delete(oldest[0]);
  }

  publishContextualIdentityV1_3();
  return state;
}

/**
 * Resolve identity from static owner + ingress event.
 * @param {object} identityEvent
 * @param {object} [payload]
 */
export function resolveContextualIdentityV1_3(identityEvent, payload = {}) {
  if (!identityEvent) {
    return buildContextualIdentityV1_3(payload);
  }
  return buildContextualIdentityV1_3({
    ...payload,
    ownerId: identityEvent.ownerId,
    threadId: identityEvent.threadId,
    source: identityEvent.source,
    preview: identityEvent.preview,
    type: identityEvent.type,
    salience: identityEvent.salience,
    timestamp: identityEvent.timestamp,
    atMs: identityEvent.timestamp
  });
}

export function getContextualIdentityV1_3(contextualId) {
  return identityStateByContextualIdV1_3.get(contextualId) || null;
}

export function getActiveContextualIdentitiesV1_3(ownerId) {
  return Object.freeze(
    [...identityStateByContextualIdV1_3.values()]
      .filter((s) => !ownerId || s.ownerId === ownerId)
      .sort((a, b) => b.atMs - a.atMs)
  );
}

function publishContextualIdentityV1_3() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.contextualIdentity = Object.freeze({
    states: Object.freeze([...identityStateByContextualIdV1_3.values()])
  });
}

/** @internal vitest */
export function __resetContextualIdentityForTestV1_3() {
  identityStateByContextualIdV1_3.clear();
}
