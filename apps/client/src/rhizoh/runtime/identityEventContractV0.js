/**
 * Identity Event Contract (v0)
 *
 * Amaç:
 * - Identity merge layer / store API ve snapshot compiler için "tek event sözleşmesi" sağlar.
 * - `connectionId` için tek write authority kuralını standardize eder.
 *
 * Product invariant:
 * - `connectionId` is never written by UI/local state.
 * - `connectionId` only changes via events with `origin: "gateway"`.
 * - `sessionId` only changes via events with `origin: "session"`.
 * - `frameId` only changes via events with `origin: "frame"`.
 */

export const IDENTITY_EVENT_CONTRACT_VERSION = 0;

/**
 * @typedef {'gateway'|'session'|'frame'|'client'} IdentityEventOrigin
 */

/**
 * @typedef {{
 *   version: number,
 *   at: number,
 *   type: string,
 *   origin: IdentityEventOrigin,
 *   /**
 *    * Optional correlation fields.
 *    * Reducer deterministic mergeId türetir (event'e bağlı değildir).
 *    *\/
 *   frameId?: string,
 *   sessionId?: string,
 *   connectionId?: string,
 *   /**
 *    * Free-form payload; reducer yalnızca izinli alanları okur.
 *    *\/
 *   payload?: Record<string, unknown>
 * }} IdentityEvent
 */

export const IDENTITY_EVENT_TYPES = Object.freeze({
  // Frame (temporal anchor) init.
  FRAME_BOOT: "FRAME_BOOT",
  // Session (continuity anchor) init.
  SESSION_BOOTSTRAP: "SESSION_BOOTSTRAP",
  // Session advance: turn / phase değişimi.
  SESSION_ADVANCE: "SESSION_ADVANCE",
  // Gateway connection attach: single writer for connectionId.
  GATEWAY_CONNECTION_ATTACHED: "GATEWAY_CONNECTION_ATTACHED",
  // Gateway connection detach: connectionId becomes "".
  GATEWAY_CONNECTION_DETACHED: "GATEWAY_CONNECTION_DETACHED",

  // Gateway health/state update (transport status, no connectionId changes).
  // - origin: "gateway"
  // - payload.status ∈ {"disconnected"|"connecting"|"connected"}
  GATEWAY_HEALTH_CHANGED: "GATEWAY_HEALTH_CHANGED"
});

/**
 * Minimal runtime validator — sadece contract enforcement için.
 * (Production policy: reducer yine de defensive çalışmalı.)
 *
 * @param {unknown} e
 * @returns {boolean}
 */
export function isIdentityEventLike(e) {
  try {
    if (!e || typeof e !== "object") return false;
    const ev = /** @type {IdentityEvent} */ (e);
    if (typeof ev.version !== "number") return false;
    if (typeof ev.at !== "number") return false;
    if (typeof ev.type !== "string" || !Object.values(IDENTITY_EVENT_TYPES).includes(ev.type)) return false;
    if (!ev.origin || typeof ev.origin !== "string") return false;
    if (!["gateway", "session", "frame", "client"].includes(String(ev.origin))) return false;
    return true;
  } catch {
    return false;
  }
}

// Helper creators — UI / gateway / store aynı şekli kullanır.
export function makeFrameBootEvent({ frameId, at = Date.now() }) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.FRAME_BOOT,
    origin: "frame",
    frameId: String(frameId || "")
  };
}

export function makeSessionBootstrapEvent({
  sessionId,
  conversationPhase = "",
  userTurnCount = 0,
  at = Date.now()
}) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.SESSION_BOOTSTRAP,
    origin: "session",
    sessionId: String(sessionId || ""),
    payload: { conversationPhase, userTurnCount }
  };
}

export function makeSessionAdvanceEvent({ sessionId, deltaTurn = 1, at = Date.now() }) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.SESSION_ADVANCE,
    origin: "session",
    sessionId: String(sessionId || ""),
    payload: { deltaTurn }
  };
}

export function makeGatewayConnectionAttachedEvent({ connectionId, at = Date.now() }) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.GATEWAY_CONNECTION_ATTACHED,
    origin: "gateway",
    connectionId: String(connectionId || "")
  };
}

export function makeGatewayConnectionDetachedEvent({ at = Date.now() }) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.GATEWAY_CONNECTION_DETACHED,
    origin: "gateway",
    connectionId: ""
  };
}

export function makeGatewayHealthChangedEvent({ status, at = Date.now() }) {
  return {
    version: IDENTITY_EVENT_CONTRACT_VERSION,
    at,
    type: IDENTITY_EVENT_TYPES.GATEWAY_HEALTH_CHANGED,
    origin: "gateway",
    payload: {
      status: String(status || "")
    }
  };
}

