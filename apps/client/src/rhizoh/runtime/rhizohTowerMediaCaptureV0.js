/**
 * Tower workspace camera / frame capture — local stream (does not mutate Rhizoh Box global).
 */

export const RHIZOH_TOWER_MEDIA_CAPTURE_SCHEMA_V0 = "castle.rhizoh.tower_media_capture.v0";

/**
 * @param {{ audio?: boolean, video?: boolean }} [opts]
 * @returns {Promise<MediaStream>}
 */
export async function openTowerMediaStreamV0(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia_unavailable");
  }
  const wantVideo = opts.video !== false;
  const wantAudio = opts.audio !== false;
  return navigator.mediaDevices.getUserMedia({
    audio: wantAudio,
    video: wantVideo
      ? {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      : false
  });
}

/**
 * @param {MediaStream | null | undefined} stream
 */
export function stopTowerMediaStreamV0(stream) {
  try {
    stream?.getTracks?.().forEach((track) => track.stop());
  } catch {
    /* noop */
  }
}

/**
 * @param {string} dataUrl
 */
export function parseTowerImageDataUrlV0(dataUrl) {
  const raw = String(dataUrl || "").trim();
  const match = /^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i.exec(raw);
  if (!match) return null;
  return Object.freeze({
    mimeType: match[1].toLowerCase(),
    base64: match[2]
  });
}

/**
 * @param {HTMLVideoElement} videoEl
 * @param {{ maxWidth?: number, quality?: number, mimeType?: string }} [opts]
 */
export function captureTowerVideoFrameV0(videoEl, opts = {}) {
  if (!videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return null;
  const maxW = Math.max(240, Number(opts.maxWidth) || 768);
  const scale = Math.min(1, maxW / videoEl.videoWidth);
  const w = Math.round(videoEl.videoWidth * scale);
  const h = Math.round(videoEl.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(videoEl, 0, 0, w, h);
  const mime = String(opts.mimeType || "image/jpeg");
  const quality = opts.quality != null ? opts.quality : 0.82;
  return canvas.toDataURL(mime, quality);
}
