/**
 * Product Binding Layer v0 — intent / route / replay signals (Phase 1: log only).
 * @see docs/RHIZOH_PRODUCT_BINDING_LAYER_V0.md §5
 * @see docs/RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md
 */

export const PRODUCT_BINDING_SCHEMA_V0 = "castle.rhizoh.product_binding.v0";

export const RHIZOH_PRODUCT_BINDING_EVENT_V0 = "rhizoh:product-binding-v0";

const RING_MAX_V0 = 128;

/** @type {ReturnType<typeof buildProductBindingEventV0>[]} */
const ring = [];

/**
 * @param {object} input
 */
export function buildProductBindingEventV0(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  return Object.freeze({
    schema: PRODUCT_BINDING_SCHEMA_V0,
    source: String(input.source || "unknown"),
    mode: String(input.mode || "INTENT"),
    action: String(input.action || "unknown"),
    scrTickRequested: input.scrTickRequested === true,
    walEntryId: input.walEntryId ? String(input.walEntryId) : null,
    payload: Object.freeze(input.payload && typeof input.payload === "object" ? input.payload : {}),
    atMs
  });
}

/**
 * @param {object} [input]
 * @returns {ReturnType<typeof buildProductBindingEventV0>}
 */
export function emitProductBindingActionV0(input = {}) {
  const event = buildProductBindingEventV0(input);
  ring.push(event);
  while (ring.length > RING_MAX_V0) {
    ring.shift();
  }

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    if (event.source === "cap_wheel") {
      window.__rhizoh.capWheel = Object.freeze({
        intent: Object.freeze({
          node: event.payload?.node || event.action,
          timestamp: event.atMs,
          payload: event.payload
        })
      });
    }
    window.__rhizoh.productBinding = Object.freeze({
      schema: PRODUCT_BINDING_SCHEMA_V0,
      count: ring.length,
      last: event,
      events: listProductBindingEventsV0(48)
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_PRODUCT_BINDING_EVENT_V0, { detail: event })
      );
    } catch {
      /* noop */
    }
  }

  return event;
}

/** Spec alias */
export const emitProductBindingAction = emitProductBindingActionV0;

/**
 * @param {number} [limit]
 */
export function listProductBindingEventsV0(limit = 32) {
  const n = Math.max(1, Math.min(RING_MAX_V0, Number(limit) || 32));
  return Object.freeze(ring.slice(-n));
}

export function readLastProductBindingEventV0() {
  return ring.length ? ring[ring.length - 1] : null;
}

export function initRhizohProductBindingV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.productBinding) {
    window.__rhizoh.productBinding = Object.freeze({
      schema: PRODUCT_BINDING_SCHEMA_V0,
      count: 0,
      last: null,
      events: []
    });
  }
  return window.__rhizoh.productBinding;
}

export function resetRhizohProductBindingForTestV0() {
  ring.length = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    window.__rhizoh.productBinding = Object.freeze({
      schema: PRODUCT_BINDING_SCHEMA_V0,
      count: 0,
      last: null,
      events: []
    });
    delete window.__rhizoh.capWheel;
  }
}
