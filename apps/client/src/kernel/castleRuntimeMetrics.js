/**
 * Apex render döngüsünden örneklenen hafif runtime metrikleri — L9 gate politikası için.
 */

let _fpsEma = 58;
let _frameMsEma = 16.7;

/**
 * @param {number} dtSec — frame delta saniye
 */
export function recordCastleRuntimeFrame(dtSec) {
  const dt = Math.max(0.0001, Math.min(0.25, Number(dtSec) || 0.016));
  const instFps = 1 / dt;
  _fpsEma = _fpsEma * 0.92 + instFps * 0.08;
  _frameMsEma = _frameMsEma * 0.92 + dt * 1000 * 0.08;
}

export function getCastleRuntimeMetrics() {
  return {
    fpsEma: _fpsEma,
    frameMsEma: _frameMsEma,
    at: Date.now()
  };
}

export function resetCastleRuntimeMetrics() {
  _fpsEma = 58;
  _frameMsEma = 16.7;
}
