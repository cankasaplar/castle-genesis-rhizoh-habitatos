/**
 * Voice mic device lock — explicit deviceId pin; block stereo mix / virtual loopback inputs.
 * FILTER 1 — capture path must not use system/tab audio devices.
 */

export const RHIZOH_VOICE_MIC_DEVICE_LOCK_SCHEMA_V0 = "castle.rhizoh.voice_mic_device_lock.v0";
const PIN_STORAGE_KEY_V0 = "castle.rhizohVoiceMicDevicePin.v0";

/** Labels that indicate OS/tab loopback, not a physical microphone. */
const VIRTUAL_MIC_LABEL_PATTERNS_V0 = [
  /stereo\s*mix/i,
  /what\s*u\s*hear/i,
  /loopback/i,
  /\bvirtual\b/i,
  /vb-?audio/i,
  /cable\s*output/i,
  /monitor\s*of/i,
  /mix\s*minus/i,
  /system\s*audio/i,
  /wasapi\s*loopback/i,
  /speakers\s*\(/i
];

/**
 * @param {string} [label]
 */
export function isVirtualOrLoopbackMicLabelV0(label) {
  const t = String(label || "").trim();
  if (!t) return false;
  return VIRTUAL_MIC_LABEL_PATTERNS_V0.some((re) => re.test(t));
}

/**
 * @returns {Promise<{ deviceId: string, label: string, virtual: boolean }[]>}
 */
export async function listAudioInputDevicesV0() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return Object.freeze([]);
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return Object.freeze(
    devices
      .filter((d) => d.kind === "audioinput")
      .map((d) =>
        Object.freeze({
          deviceId: String(d.deviceId || ""),
          label: String(d.label || "").trim() || "Microphone",
          virtual: isVirtualOrLoopbackMicLabelV0(d.label)
        })
      )
  );
}

function readPinnedMicDeviceIdV0() {
  try {
    return String(window.sessionStorage.getItem(PIN_STORAGE_KEY_V0) || "").trim();
  } catch {
    return "";
  }
}

/**
 * @param {string} [deviceId]
 */
export function pinVoiceMicDeviceV0(deviceId) {
  const id = String(deviceId || "").trim();
  try {
    if (id) window.sessionStorage.setItem(PIN_STORAGE_KEY_V0, id);
    else window.sessionStorage.removeItem(PIN_STORAGE_KEY_V0);
  } catch {
    /* noop */
  }
}

/**
 * @param {{ preferredDeviceId?: string, pinnedDeviceId?: string }} [opts]
 */
export async function resolveVoiceMicCaptureDeviceV0(opts = {}) {
  const devices = await listAudioInputDevicesV0();
  const blocked = devices.filter((d) => d.virtual);
  const safe = devices.filter((d) => d.deviceId && !d.virtual);
  const opaqueDefault = devices.filter((d) => !d.virtual && !d.deviceId);

  // Before mic permission, browsers expose audioinput rows with empty deviceId — still capturable via default getUserMedia.
  if (!safe.length && opaqueDefault.length) {
    return Object.freeze({
      ok: true,
      reason: "default_mic_pre_permission",
      deviceId: null,
      label: opaqueDefault[0]?.label || "Default microphone",
      virtual: false,
      blockedCount: blocked.length,
      blockedLabels: Object.freeze(blocked.map((d) => d.label)),
      candidateCount: opaqueDefault.length
    });
  }

  if (!safe.length) {
    return Object.freeze({
      ok: false,
      reason: blocked.length ? "virtual_mic_only" : "no_audio_input",
      deviceId: null,
      label: null,
      blockedLabels: Object.freeze(blocked.map((d) => d.label))
    });
  }

  const preferred = String(opts.preferredDeviceId || opts.pinnedDeviceId || readPinnedMicDeviceIdV0() || "").trim();
  let chosen = preferred ? safe.find((d) => d.deviceId === preferred) : null;
  if (!chosen) chosen = safe[0];

  pinVoiceMicDeviceV0(chosen.deviceId);

  const result = Object.freeze({
    ok: true,
    reason: preferred && chosen.deviceId === preferred ? "pinned_mic" : "default_safe_mic",
    deviceId: chosen.deviceId,
    label: chosen.label,
    virtual: false,
    blockedCount: blocked.length,
    blockedLabels: Object.freeze(blocked.map((d) => d.label)),
    candidateCount: safe.length
  });
  publishVoiceMicDeviceDebugV0(result);
  return result;
}

/**
 * @param {object} snapshot
 */
export function publishVoiceMicDeviceDebugV0(snapshot) {
  if (typeof window === "undefined" || !snapshot) return;
  try {
    window.__CASTLE_RHIZOH_VOICE_MIC__ = Object.freeze({
      schema: RHIZOH_VOICE_MIC_DEVICE_LOCK_SCHEMA_V0,
      ...snapshot,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}

/**
 * @param {"virtual_mic_only" | "no_audio_input" | string} reason
 * @param {string} [locale]
 */
export function resolveVoiceMicBlockedSpeakTextV0(reason, locale = "tr") {
  const tr = String(locale || "tr").toLowerCase().startsWith("tr");
  if (reason === "virtual_mic_only") {
    return tr
      ? "Sanal veya sistem sesi algılandı. Gerçek mikrofon seçin veya Stereo Mix'i kapatın."
      : "Virtual or system audio input detected. Choose a real microphone or disable Stereo Mix.";
  }
  return tr
    ? "Güvenli mikrofon bulunamadı. Tarayıcıda mikrofon iznini verip tekrar dene."
    : "No safe microphone found. Grant microphone permission in the browser and try again.";
}

export function __resetVoiceMicPinForTestV0() {
  try {
    window.sessionStorage.removeItem(PIN_STORAGE_KEY_V0);
  } catch {
    /* noop */
  }
}
