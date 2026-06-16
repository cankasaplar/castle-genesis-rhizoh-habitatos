/**
 * CodexBus — in-memory simulation event dispatch (interpretation layer, not authority).
 */

export const RHIZOH_CODEX_BUS_SCHEMA_V0 = "castle.rhizoh.codex_bus.v0";
export const RHIZOH_CODEX_BUS_EVENT_V0 = "rhizoh:codex-bus-v0";

/** @type {Map<string, Set<Function>>} */
const listenersV0 = new Map();

/**
 * @param {string} type
 * @param {(payload: object, meta?: object) => void} fn
 */
export function onCodexBusV0(type, fn) {
  const key = String(type || "").trim();
  if (!key || typeof fn !== "function") return () => {};
  if (!listenersV0.has(key)) listenersV0.set(key, new Set());
  listenersV0.get(key).add(fn);
  return () => listenersV0.get(key)?.delete(fn);
}

/**
 * @param {string} type
 * @param {object} [payload]
 * @param {object} [meta]
 */
export function emitCodexBusV0(type, payload = {}, meta = {}) {
  const key = String(type || "").trim();
  if (!key) return Object.freeze({ ok: false, reason: "empty_type" });

  const detail = Object.freeze({
    schema: RHIZOH_CODEX_BUS_SCHEMA_V0,
    type: key,
    payload: payload && typeof payload === "object" ? Object.freeze({ ...payload }) : null,
    meta: meta && typeof meta === "object" ? Object.freeze({ ...meta }) : null,
    atMs: Date.now()
  });

  const set = listenersV0.get(key);
  if (set) {
    for (const fn of set) {
      try {
        fn(detail.payload, detail.meta);
      } catch {
        /* noop */
      }
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_CODEX_BUS_EVENT_V0, { detail }));
  }

  return Object.freeze({ ok: true, detail });
}

/** @internal vitest */
export function __resetCodexBusForTestV0() {
  listenersV0.clear();
}
