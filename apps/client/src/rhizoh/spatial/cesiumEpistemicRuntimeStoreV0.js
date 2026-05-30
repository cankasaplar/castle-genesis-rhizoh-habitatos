/**
 * Cesium epistemic runtime bridge store (v0).
 *
 * **Epistemik origin / mode** burada tutulur — snapshot SSOT veya Firestore truth değildir.
 * `window.__CASTLE_CESIUM__` üzerindeki `rhizohEpistemic*` alanları yalnızca
 * `VITE_RHIZOH_EPISTEMIC_RUNTIME_DEBUG=1` iken **ayna** (gözlem / konsol); üretim yükünde varsayılan kapalı.
 *
 * @see cesiumEpistemicBootstrapV0.js
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md
 */

import { isCastleDebugGranularFlagEnabled } from "../runtime/castleDebugGateV0.js";

/** @type {boolean} */
let _installed = false;
/** @type {{ anchorId: string, lon: number, lat: number, districtLabel: string } | null} */
let _origin = null;
/** @type {string | null} */
let _mode = null;

function epistemicRuntimeDebugMirrorEnabledV0() {
  return isCastleDebugGranularFlagEnabled("VITE_RHIZOH_EPISTEMIC_RUNTIME_DEBUG");
}

function syncWindowDebugMirrorV0() {
  if (!epistemicRuntimeDebugMirrorEnabledV0() || typeof window === "undefined") return;
  const c = window.__CASTLE_CESIUM__;
  if (!c || typeof c !== "object") return;
  if (_installed && _origin && _mode) {
    c.rhizohEpistemicOrigin = { ..._origin };
    c.rhizohEpistemicMode = _mode;
  } else {
    try {
      delete c.rhizohEpistemicOrigin;
      delete c.rhizohEpistemicMode;
    } catch {
      /* noop */
    }
  }
}

/** Testler ve teardown sıfırlama. */
export function resetCesiumEpistemicRuntimeStoreForTestsV0() {
  _installed = false;
  _origin = null;
  _mode = null;
  syncWindowDebugMirrorV0();
}

/**
 * @returns {{ installed: boolean, origin: { anchorId: string, lon: number, lat: number, districtLabel: string } | null, mode: string | null }}
 */
export function getCesiumEpistemicRuntimeSnapshotV0() {
  return {
    installed: _installed,
    origin: _origin ? { ..._origin } : null,
    mode: _mode
  };
}

/**
 * @param {{ anchorId: string, lon: number, lat: number, districtLabel: string }} origin
 * @param {string} mode
 */
export function setCesiumEpistemicRuntimeInstallV0(origin, mode) {
  _installed = true;
  _origin =
    origin && typeof origin === "object"
      ? {
          anchorId: String(origin.anchorId || ""),
          lon: Number(origin.lon),
          lat: Number(origin.lat),
          districtLabel: String(origin.districtLabel || "")
        }
      : null;
  _mode = mode != null ? String(mode) : null;
  syncWindowDebugMirrorV0();
}

export function clearCesiumEpistemicRuntimeInstallV0() {
  _installed = false;
  _origin = null;
  _mode = null;
  syncWindowDebugMirrorV0();
}

/** `window.__CASTLE_CESIUM__` oluşturulduktan sonra çağırın — debug aynası gecikmeli senkron. */
export function resyncCesiumEpistemicRuntimeWindowMirrorV0() {
  syncWindowDebugMirrorV0();
}
