/**
 * SPECFLOW: RESEARCH-ONLY — Live **interval** driver for global social coherence (slices → bridge → kernel).
 *
 * Intended wiring: `getCastleSlices()` from WS handlers + optional presence (`buildCastleCoherenceSlicesFromRemotePresenceV0`);
 * `getKernelInput()` returns kernel fields (omit `lastFrame` / `wsRoom` — owned by bridge). Return `null` to skip a tick.
 */

import { runGlobalSocialCoherenceKernelTickV0 } from "./globalCoherenceKernelBridgeV0.js";

/**
 * @param {unknown[]} remoteCastles — rows from `useCastleActiveCastles` (id, displayName, nexusEnergy, bridgePeers, …)
 * @returns {Array<{ castleId: string, priority: number, sliceKind: "full", wsRoom: { castleRoomKey: string, seq: number, roster: unknown[] } }>}
 */
export function buildCastleCoherenceSlicesFromRemotePresenceV0(remoteCastles) {
  const list = Array.isArray(remoteCastles) ? remoteCastles : [];
  const now = Date.now();
  /** @type {Array<{ castleId: string, priority: number, sliceKind: "full", wsRoom: { castleRoomKey: string, seq: number, roster: unknown[] } }>} */
  const out = [];
  for (const c of list.slice(0, 14)) {
    const id = c && typeof c === "object" ? String(c.id || "").trim() : "";
    if (!id) continue;
    const n = Number(c.nexusEnergy);
    const pri = Number.isFinite(n) ? Math.round(n * 100) : 0;
    const bridged = Array.isArray(c.bridgePeers) && c.bridgePeers.length > 0;
    out.push({
      castleId: id,
      priority: pri,
      sliceKind: "full",
      wsRoom: {
        castleRoomKey: `presence:${id}`,
        seq: Math.floor(now / 1000) % 1_000_000_000,
        roster: [
          {
            userId: id,
            lastMs: now,
            label: String(c.displayName || id).slice(0, 48),
            ...(Number.isFinite(n) ? { energyHint01: n } : {}),
            bridged
          }
        ]
      }
    });
  }
  return out;
}

/**
 * Overlay wins per `castleId` (WS / gateway truth over presence scaffold).
 *
 * @param {unknown[]} primary
 * @param {unknown[]} overlay
 */
export function mergeCastleCoherenceSlicesByCastleIdV0(primary, overlay) {
  const map = new Map();
  for (const s of Array.isArray(primary) ? primary : []) {
    const id = s && typeof s === "object" ? String(s.castleId || "").trim() : "";
    if (id) map.set(id, s);
  }
  for (const s of Array.isArray(overlay) ? overlay : []) {
    const id = s && typeof s === "object" ? String(s.castleId || "").trim() : "";
    if (!id) continue;
    const prev = map.get(id);
    map.set(id, prev && typeof prev === "object" ? { ...prev, ...s } : s);
  }
  return [...map.values()];
}

/**
 * @param {{
 *   tickMs?: number,
 *   getCastleSlices: () => unknown[],
 *   getKernelInput: () => (Record<string, unknown> | null | undefined),
 *   onTick?: (out: Record<string, unknown>) => void
 * }} opts
 */
export function createGlobalSocialCoherenceLiveTickerV0(opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const tickMs = Math.max(200, Math.floor(Number(o.tickMs) || 2000));
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let disposed = false;
  let lastFrame = 0;
  let deltaFramesSinceFull = 0;

  const tick = () => {
    if (disposed) return;
    const base = o.getKernelInput?.();
    if (base === null) return;

    const slices = o.getCastleSlices?.() || [];
    const hadFull = Array.isArray(slices) && slices.some((s) => s && typeof s === "object" && s.sliceKind === "full");

    let out;
    try {
      out = runGlobalSocialCoherenceKernelTickV0({
        castleSlices: slices,
        reducerOpts: { deltaFramesSinceFull },
        kernelInput: { ...(base && typeof base === "object" ? base : {}), lastFrame }
      });
    } catch {
      return;
    }

    lastFrame = out.kernel.frame;
    if (hadFull) deltaFramesSinceFull = 0;
    else deltaFramesSinceFull += 1;

    try {
      o.onTick?.(out);
    } catch {
      /* noop */
    }
  };

  return {
    start() {
      if (typeof window === "undefined" || timer || disposed) return;
      timer = window.setInterval(tick, tickMs);
    },
    stop() {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    dispose() {
      disposed = true;
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    flush: tick,
    getLastFrame: () => lastFrame,
    getDeltaFramesSinceFull: () => deltaFramesSinceFull,
    resetDriftBudget: () => {
      deltaFramesSinceFull = 0;
    }
  };
}
