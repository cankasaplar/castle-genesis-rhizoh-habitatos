/**
 * L9 Execution Gate — runtime governance: motor + RealityDirector senkronu,
 * Cesium/map yüzeyi gereksinimi; yetkisiz yürütmeyi UI/engine/broadcast’tan ayırır.
 *
 * Arbitration (cooldown/dedupe) işlendikten sonra emit aşamasında devreye girer.
 * Koşullar sağlanmıyorsa taslak kuyrukta kalır; flush ile tek doğrultuda yayınlanır.
 */

import { emitL9ExecutionFeedback } from "./castleL9ExecutionFeedback.js";

/** @type {{ getEngine?: () => unknown, getState?: () => object, getGatewaySnapshot?: () => object } | null} */
let _infra = null;

const _hold = [];
export const L9_EXECUTION_HOLD_MAX = 32;
const MAX_HOLD = L9_EXECUTION_HOLD_MAX;

export function configureL9ExecutionGate(next) {
  _infra = next && typeof next === "object" ? next : null;
}

export function clearL9ExecutionDeferredQueue() {
  _hold.length = 0;
}

/**
 * swarm_nexus: istemci tarafında canlı harita + Cesium flyTo ile bağlı; yüzey yoksa ghost flyTo önlenir.
 * Diğer tetikleyiciler: Apex sahnesi yeterli (GLOBE/REAL_MAP senkronu şart).
 */
export function l9TriggerRequiresMapSurface(trigger) {
  return String(trigger || "") === "swarm_nexus";
}

/**
 * @returns {{ ok: boolean, reason?: string }}
 */
export function evaluateL9ExecutionGate(detail) {
  const eng = _infra?.getEngine?.();
  const st = _infra?.getState?.();

  if (!eng) return { ok: false, reason: "no_engine" };
  if (eng.active === false) return { ok: false, reason: "engine_inactive" };
  if (!st || typeof st !== "object") return { ok: false, reason: "no_ui_store" };

  if (eng.internalRealityMode !== st.realityMode) {
    return { ok: false, reason: "reality_desync" };
  }

  const trigger = String(detail?.trigger || "");
  if (l9TriggerRequiresMapSurface(trigger) && !st.mapSurfaceActive) {
    return { ok: false, reason: "map_surface_inactive" };
  }

  return { ok: true };
}

export function enqueueL9ExecutionDeferred(detail) {
  const overflow = _hold.length >= MAX_HOLD;
  _hold.push({ detail, at: Date.now() });
  while (_hold.length > MAX_HOLD) {
    _hold.shift();
  }
  if (overflow) {
    emitL9ExecutionFeedback({
      kind: "hold_overflow",
      holdSize: _hold.length,
      trigger: String(detail?.trigger || ""),
      message: "L9 execution hold dolu; en eski taslak düşürüldü (narrative loss riski)"
    });
  }
}

/**
 * @param {(detail: object) => void} emitToWorld — sadece UI event + memory (arbitration zaten uygulanmış)
 * @returns {number} kaç öğe yayınlandı
 */
export function flushDeferredL9Emits(emitToWorld) {
  if (typeof emitToWorld !== "function" || !_hold.length) return 0;
  let released = 0;
  const kept = [];
  for (const item of _hold) {
    const ex = evaluateL9ExecutionGate(item.detail);
    if (ex.ok) {
      emitToWorld(item.detail);
      released++;
    } else {
      kept.push(item);
    }
  }
  _hold.length = 0;
  for (const k of kept) _hold.push(k);
  return released;
}

export function getL9ExecutionHoldSize() {
  return _hold.length;
}
