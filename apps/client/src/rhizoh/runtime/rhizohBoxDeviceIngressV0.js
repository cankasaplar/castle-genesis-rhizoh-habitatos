/**
 * Layer 1 only — toggle Rhizoh Box physical ingress.
 * Does not change reality mode, world obs, or companion (see rhizohObserveFusionV0).
 */

import {
  bindRhizohBoxCameraStreamV0,
  closeRhizohBoxCameraStreamV0,
  openRhizohBoxCameraStreamV0,
  readRhizohBoxCameraStreamV0
} from "./rhizohBoxMediaDeviceV0.js";
import { OBSERVATION_FEED_COPY_TR_V0 } from "./rhizohObservationFeedV0.js";

/**
 * @param {boolean} wantActive
 * @returns {Promise<{ ok: boolean, active: boolean, stream?: MediaStream | null, label?: string, message?: string }>}
 */
export async function setRhizohBoxDeviceIngressV0(wantActive) {
  const currently = Boolean(readRhizohBoxCameraStreamV0());
  if (wantActive === currently) {
    return Object.freeze({ ok: true, active: currently, stream: readRhizohBoxCameraStreamV0() });
  }

  if (!wantActive) {
    closeRhizohBoxCameraStreamV0();
    return Object.freeze({
      ok: true,
      active: false,
      message: OBSERVATION_FEED_COPY_TR_V0.pulseOff
    });
  }

  try {
    const stream = await openRhizohBoxCameraStreamV0({ audio: true, video: true });
    bindRhizohBoxCameraStreamV0(stream);
    const label = stream.getVideoTracks?.()?.[0]?.label || "Rhizoh Box";
    return Object.freeze({
      ok: true,
      active: true,
      stream,
      label,
      message: `${OBSERVATION_FEED_COPY_TR_V0.pulseOn} (${label})`
    });
  } catch {
    return Object.freeze({
      ok: false,
      active: false,
      message: OBSERVATION_FEED_COPY_TR_V0.errorDetail
    });
  }
}

/**
 * @returns {Promise<{ ok: boolean, active: boolean, stream?: MediaStream | null, label?: string, message?: string }>}
 */
export async function toggleRhizohBoxDeviceIngressV0() {
  return setRhizohBoxDeviceIngressV0(!readRhizohBoxCameraStreamV0());
}
