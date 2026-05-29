/**
 * Gateway Identity Store (v0)
 *
 * Minimal API surface:
 * - Single writer: setActiveConnectionId()
 * - Reads: getConnectionId(), getGatewayState()
 * - Subscriptions: subscribeGatewayIdentity(listener) (snapshot + diff)
 * - Internal reducer: applyGatewayIdentityEvent(event)
 *
 * Invariant:
 * - Gateway store is the sole writer of connectionId.
 * - All other layers are observers or intent emitters.
 *
 * Note:
 * - UI should never call setActiveConnectionId().
 * - UI should never write connectionId.
 */

import {
  IDENTITY_EVENT_TYPES,
  makeGatewayConnectionAttachedEvent,
  makeGatewayConnectionDetachedEvent,
  makeGatewayHealthChangedEvent
} from "./identityEventContractV0.js";

/** @type {{ connectionId: string|null, status: 'disconnected'|'connecting'|'connected', lastChangeAt: number }} */
let _state = {
  connectionId: null,
  status: "disconnected",
  lastChangeAt: 0
};

/** @type {Set<(snapshot: any, diff: any)=>void>} */
const _listeners = new Set();

function snapshot() {
  return { ..._state };
}

function notify(prev, next, diff) {
  if (!diff || Object.keys(diff).length === 0) return;
  const s = snapshot();
  for (const l of Array.from(_listeners)) {
    try {
      l(s, diff);
    } catch {
      /* noop */
    }
  }
}

/**
 * Single writer entrypoint.
 * @param {string|null|undefined} id
 * @param {{ status?: 'disconnected'|'connecting'|'connected', meta?: Record<string, unknown>, at?: number }} [meta]
 */
export function setActiveConnectionId(id, meta = {}) {
  const at = typeof meta?.at === "number" ? meta.at : Date.now();
  const nextIdRaw = id == null ? null : String(id).trim();
  const nextId = !nextIdRaw ? null : nextIdRaw;

  if (nextId === _state.connectionId) {
    // Connection id unchanged: do not notify.
    return false;
  }

  if (!nextId) {
    if (_state.connectionId == null || _state.connectionId === "") {
      return false;
    }
    // detach
    applyGatewayIdentityEvent(makeGatewayConnectionDetachedEvent({ at }));
    return true;
  }

  // attach (connection id changes here)
  applyGatewayIdentityEvent(
    makeGatewayConnectionAttachedEvent({ connectionId: nextId, at: at })
  );

  // Optional: initial status hint; final status can be updated by GATEWAY_HEALTH_CHANGED.
  const hint = meta?.status;
  if (hint && ["disconnected", "connecting", "connected"].includes(String(hint))) {
    applyGatewayIdentityEvent(makeGatewayHealthChangedEvent({ status: hint, at }));
  }
  return true;
}

/** @returns {string|null} */
export function getConnectionId() {
  return _state.connectionId;
}

/** @returns {{ connectionId: string|null, status: 'disconnected'|'connecting'|'connected', lastChangeAt: number }} */
export function getGatewayState() {
  return snapshot();
}

/**
 * @param {(snapshot: any, diff: any)=>void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeGatewayIdentity(listener) {
  if (typeof listener !== "function") return () => {};
  _listeners.add(listener);
  // Immediately publish snapshot with empty diff.
  try {
    listener(snapshot(), { init: true });
  } catch {
    /* noop */
  }
  return () => {
    _listeners.delete(listener);
  };
}

/**
 * Internal reducer.
 * Accepts only allowed events (no UI events).
 * @param {any} event
 */
export function applyGatewayIdentityEvent(event) {
  // Defensive: ignore non-object
  if (!event || typeof event !== "object") return;

  const prev = snapshot();
  const type = event?.type;
  const origin = event?.origin;
  const at = typeof event?.at === "number" ? event.at : Date.now();

  if (origin !== "gateway") return;

  if (
    type === IDENTITY_EVENT_TYPES.GATEWAY_CONNECTION_DETACHED &&
    prev.connectionId == null &&
    prev.status === "disconnected"
  ) {
    return;
  }

  /** @type {Partial<typeof _state>} */
  let patch = {};

  if (type === IDENTITY_EVENT_TYPES.GATEWAY_CONNECTION_ATTACHED) {
    const nextId = String(event?.connectionId || "").trim();
    if (!nextId) return;
    if (prev.connectionId === nextId) return;
    patch = {
      connectionId: nextId,
      status: prev.status === "disconnected" ? "connecting" : prev.status,
      lastChangeAt: at
    };
  } else if (type === IDENTITY_EVENT_TYPES.GATEWAY_CONNECTION_DETACHED) {
    patch = {
      connectionId: null,
      status: "disconnected",
      lastChangeAt: at
    };
  } else if (type === IDENTITY_EVENT_TYPES.GATEWAY_HEALTH_CHANGED) {
    const status = event?.payload?.status;
    const nextStatus = ["disconnected", "connecting", "connected"].includes(String(status))
      ? /** @type {'disconnected'|'connecting'|'connected'} */ (String(status))
      : null;
    if (!nextStatus) return;
    if (prev.status === nextStatus) return;
    patch = { status: nextStatus, lastChangeAt: at };
  } else {
    // Unknown or disallowed event types are ignored.
    return;
  }

  const next = { ..._state, ...patch };
  const diff = {};
  if (prev.connectionId !== next.connectionId) diff.connectionId = { from: prev.connectionId, to: next.connectionId };
  if (prev.status !== next.status) diff.status = { from: prev.status, to: next.status };
  if (prev.lastChangeAt !== next.lastChangeAt) diff.lastChangeAt = { from: prev.lastChangeAt, to: next.lastChangeAt };

  _state = next;
  notify(prev, next, diff);
}

/**
 * React / external store subscribe helper (no args; fires on any gateway identity change).
 * @param {() => void} cb
 * @returns {() => void}
 */
export function subscribeGatewayIdentitySimple(cb) {
  return subscribeGatewayIdentity(() => {
    try {
      cb();
    } catch {
      /* noop */
    }
  });
}

/**
 * Helper creator for the health event.
 * Kept here so gateway ownership layer doesn't need to import identityEventContract.
 */
export function setGatewayHealth(status, at = Date.now()) {
  applyGatewayIdentityEvent(
    makeGatewayHealthChangedEvent({ status, at })
  );
}

// Invariant (commit comment):
// Gateway store is the sole writer of connectionId. All other layers are observers or intent emitters.

