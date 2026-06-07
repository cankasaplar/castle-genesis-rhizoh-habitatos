/**
 * Layer 1 — Rhizoh Box physical USB mic + camera.
 * Resolution: exact deviceId → groupId → label regex → LKG label → system default.
 * Layer 2 feed state: rhizohObservationFeedV0.js (not Companion PWE).
 */

import {
  isVirtualOrLoopbackMicLabelV0,
  listAudioInputDevicesV0,
  pinVoiceMicDeviceV0
} from "./rhizohVoiceMicDeviceLockV0.js";
import {
  OBSERVATION_FEED_STATE_V0,
  publishRhizohObservationFeedV0
} from "./rhizohObservationFeedV0.js";

export const RHIZOH_BOX_MEDIA_SCHEMA_V0 = "castle.rhizoh_box_media.v0";

/** Logged on resolve result — hierarchy step that won. */
export const RHIZOH_BOX_RESOLVE_STEP_V0 = Object.freeze({
  EXACT_DEVICE_ID_PIN: "exact_device_id_pin",
  EXACT_DEVICE_ID_LKG: "exact_device_id_lkg",
  GROUP_ID_PIN: "group_id_pin",
  GROUP_ID_LKG: "group_id_lkg",
  LABEL_REGEX: "label_regex",
  LKG_LABEL: "lkg_label",
  SYSTEM_DEFAULT: "system_default",
  NONE: "none"
});

const PIN_STORAGE_KEY_V0 = "castle.rhizohBoxMediaPin.v0";
const LKG_STORAGE_KEY_V0 = "castle.rhizohBoxMediaLkg.v0";

const DEFAULT_BOX_LABEL_PATTERNS_V0 = Object.freeze([
  /rhizoh/i,
  /\bbox\b/i,
  /habitat/i,
  /observation/i,
  /elgato/i,
  /logitech\s*c920/i,
  /logitech\s*c922/i,
  /hd\s*pro\s*webcam/i,
  /usb\s*camera/i,
  /external\s*camera/i
]);

let activeCameraStream = null;

function readEnvLabelPatternsV0(kind) {
  const key =
    kind === "video"
      ? import.meta.env?.VITE_RHIZOH_BOX_CAM_LABEL_PATTERN
      : import.meta.env?.VITE_RHIZOH_BOX_MIC_LABEL_PATTERN;
  const raw = String(key || "").trim();
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try {
        return new RegExp(s, "i");
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function normalizeLabelV0(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function readStoredSlotV0(kind, store) {
  const empty = { deviceId: "", groupId: "", label: "" };
  try {
    const raw = store === "lkg" ? window.localStorage.getItem(LKG_STORAGE_KEY_V0) : window.sessionStorage.getItem(PIN_STORAGE_KEY_V0);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    const slot = parsed?.[kind] || parsed;
    return {
      deviceId: String(slot?.deviceId || parsed?.[`${kind}DeviceId`] || "").trim(),
      groupId: String(slot?.groupId || parsed?.[`${kind}GroupId`] || "").trim(),
      label: String(slot?.label || parsed?.[`${kind}Label`] || "").trim()
    };
  } catch {
    return empty;
  }
}

function readPinV0() {
  return {
    cam: readStoredSlotV0("cam", "pin"),
    mic: readStoredSlotV0("mic", "pin")
  };
}

function readLkgV0() {
  return {
    cam: readStoredSlotV0("cam", "lkg"),
    mic: readStoredSlotV0("mic", "lkg")
  };
}

function writePinV0(cam, mic) {
  try {
    window.sessionStorage.setItem(
      PIN_STORAGE_KEY_V0,
      JSON.stringify({
        cam: cam ? { deviceId: cam.deviceId, groupId: cam.groupId || "", label: cam.label || "" } : undefined,
        mic: mic ? { deviceId: mic.deviceId, groupId: mic.groupId || "", label: mic.label || "" } : undefined,
        atMs: Date.now()
      })
    );
  } catch {
    /* noop */
  }
}

function writeLkgV0(cam, mic) {
  try {
    window.localStorage.setItem(
      LKG_STORAGE_KEY_V0,
      JSON.stringify({
        cam: cam ? { deviceId: cam.deviceId, groupId: cam.groupId || "", label: cam.label || "" } : undefined,
        mic: mic ? { deviceId: mic.deviceId, groupId: mic.groupId || "", label: mic.label || "" } : undefined,
        atMs: Date.now()
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {string} label
 * @param {"video"|"audio"} kind
 */
export function isRhizohBoxMediaLabelV0(label, kind = "video") {
  const t = String(label || "").trim();
  if (!t) return false;
  if (kind === "audio" && isVirtualOrLoopbackMicLabelV0(t)) return false;
  const envPatterns = readEnvLabelPatternsV0(kind);
  const patterns = envPatterns.length ? envPatterns : DEFAULT_BOX_LABEL_PATTERNS_V0;
  return patterns.some((re) => re.test(t));
}

/**
 * @returns {Promise<ReadonlyArray<{ deviceId: string, groupId: string, label: string, virtual?: boolean }>>}
 */
export async function enumerateRhizohBoxMediaDevicesV0() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return Object.freeze([]);
  }
  const raw = await navigator.mediaDevices.enumerateDevices();
  return Object.freeze(
    raw.map((d) =>
      Object.freeze({
        kind: d.kind,
        deviceId: String(d.deviceId || ""),
        groupId: String(d.groupId || ""),
        label: String(d.label || "").trim() || (d.kind === "videoinput" ? "Camera" : "Microphone"),
        virtual: d.kind === "audioinput" ? isVirtualOrLoopbackMicLabelV0(d.label) : false
      })
    )
  );
}

/**
 * @returns {Promise<{ deviceId: string, label: string, groupId: string }[]>}
 */
export async function listVideoInputDevicesV0() {
  const all = await enumerateRhizohBoxMediaDevicesV0();
  return Object.freeze(
    all
      .filter((d) => d.kind === "videoinput" && d.deviceId)
      .map((d) => Object.freeze({ deviceId: d.deviceId, label: d.label, groupId: d.groupId }))
  );
}

/**
 * @param {ReadonlyArray<{ deviceId: string, groupId: string, label: string, virtual?: boolean }>} candidates
 * @param {"video"|"audio"} kind
 * @param {{ pin: ReturnType<typeof readPinV0>, lkg: ReturnType<typeof readLkgV0> }} stores
 */
export function resolveRhizohBoxDeviceWithHierarchyV0(candidates, kind, stores) {
  const slotKey = kind === "video" ? "cam" : "mic";
  const pin = stores.pin[slotKey];
  const lkg = stores.lkg[slotKey];
  const safe =
    kind === "audio"
      ? candidates.filter((d) => d.deviceId && !d.virtual)
      : candidates.filter((d) => d.deviceId);

  const findById = (id) => (id ? safe.find((d) => d.deviceId === id) : null);
  const findByGroup = (gid) => (gid ? safe.find((d) => d.groupId && d.groupId === gid) : null);
  const findByLabelRegex = () => safe.find((d) => isRhizohBoxMediaLabelV0(d.label, kind === "video" ? "video" : "audio"));
  const findByLkgLabel = () => {
    const want = normalizeLabelV0(lkg.label);
    if (!want) return null;
    return safe.find((d) => normalizeLabelV0(d.label) === want);
  };
  const systemDefault = () => safe[0] || null;

  const attempts = [
    [RHIZOH_BOX_RESOLVE_STEP_V0.EXACT_DEVICE_ID_PIN, () => findById(pin.deviceId)],
    [RHIZOH_BOX_RESOLVE_STEP_V0.EXACT_DEVICE_ID_LKG, () => findById(lkg.deviceId)],
    [RHIZOH_BOX_RESOLVE_STEP_V0.GROUP_ID_PIN, () => findByGroup(pin.groupId)],
    [RHIZOH_BOX_RESOLVE_STEP_V0.GROUP_ID_LKG, () => findByGroup(lkg.groupId)],
    [RHIZOH_BOX_RESOLVE_STEP_V0.LABEL_REGEX, findByLabelRegex],
    [RHIZOH_BOX_RESOLVE_STEP_V0.LKG_LABEL, findByLkgLabel],
    [RHIZOH_BOX_RESOLVE_STEP_V0.SYSTEM_DEFAULT, systemDefault]
  ];

  for (const [step, pick] of attempts) {
    const device = pick();
    if (device) {
      return Object.freeze({
        device,
        resolveStep: step,
        kind
      });
    }
  }

  return Object.freeze({
    device: null,
    resolveStep: RHIZOH_BOX_RESOLVE_STEP_V0.NONE,
    kind
  });
}

/**
 * @param {{ preferredCamId?: string, preferredMicId?: string }} [opts]
 */
export async function resolveRhizohBoxMediaDevicesV0(opts = {}) {
  const all = await enumerateRhizohBoxMediaDevicesV0();
  const videoCandidates = all.filter((d) => d.kind === "videoinput");
  const audioCandidates = all.filter((d) => d.kind === "audioinput");

  const pin = readPinV0();
  const lkg = readLkgV0();

  if (opts.preferredCamId) {
    pin.cam = { ...pin.cam, deviceId: String(opts.preferredCamId) };
  }
  if (opts.preferredMicId) {
    pin.mic = { ...pin.mic, deviceId: String(opts.preferredMicId) };
  }

  const camPick = resolveRhizohBoxDeviceWithHierarchyV0(videoCandidates, "video", { pin, lkg });
  const micPick = resolveRhizohBoxDeviceWithHierarchyV0(audioCandidates, "audio", { pin, lkg });

  const cam = camPick.device;
  const mic = micPick.device;

  if (cam) {
    pin.cam = { deviceId: cam.deviceId, groupId: cam.groupId, label: cam.label };
  }
  if (mic) {
    pin.mic = { deviceId: mic.deviceId, groupId: mic.groupId, label: mic.label };
    pinVoiceMicDeviceV0(mic.deviceId);
  }
  if (cam || mic) {
    writePinV0(cam, mic);
    writeLkgV0(cam, mic);
  }

  const boxCamRegexCount = videoCandidates.filter((d) =>
    isRhizohBoxMediaLabelV0(d.label, "video")
  ).length;
  const boxMicRegexCount = audioCandidates.filter(
    (d) => d.deviceId && !d.virtual && isRhizohBoxMediaLabelV0(d.label, "audio")
  ).length;

  const result = Object.freeze({
    ok: Boolean(cam?.deviceId || mic?.deviceId),
    layer: "device",
    reason:
      cam?.deviceId && mic?.deviceId
        ? "box_pair"
        : cam?.deviceId
          ? "box_cam_only"
          : mic?.deviceId
            ? "box_mic_only"
            : "no_media_devices",
    camDeviceId: cam?.deviceId || null,
    camGroupId: cam?.groupId || null,
    camLabel: cam?.label || null,
    camResolveStep: camPick.resolveStep,
    micDeviceId: mic?.deviceId || null,
    micGroupId: mic?.groupId || null,
    micLabel: mic?.label || null,
    micResolveStep: micPick.resolveStep,
    boxCamRegexMatchCount: boxCamRegexCount,
    boxMicRegexMatchCount: boxMicRegexCount,
    candidateVideoCount: videoCandidates.length,
    candidateMicCount: audioCandidates.filter((d) => !d.virtual).length
  });
  publishRhizohBoxMediaDebugV0(result);
  return result;
}

/**
 * @param {{ audio?: boolean, video?: boolean }} [opts]
 */
export async function openRhizohBoxCameraStreamV0(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia_unavailable");
  }
  const box = await resolveRhizohBoxMediaDevicesV0();
  const wantAudio = opts.audio !== false;
  const wantVideo = opts.video !== false;

  const tryExact = async () => {
    const constraints = {
      audio: wantAudio
        ? box.micDeviceId
          ? { deviceId: { exact: box.micDeviceId } }
          : true
        : false,
      video: wantVideo
        ? box.camDeviceId
          ? { deviceId: { exact: box.camDeviceId } }
          : { facingMode: "user" }
        : false
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  };

  const tryGroup = async () => {
    const constraints = {
      audio:
        wantAudio && box.micGroupId
          ? { groupId: { exact: box.micGroupId } }
          : wantAudio,
      video:
        wantVideo && box.camGroupId
          ? { groupId: { exact: box.camGroupId } }
          : wantVideo
            ? { facingMode: "user" }
            : false
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  };

  try {
    return await tryExact();
  } catch {
    try {
      return await tryGroup();
    } catch {
      return navigator.mediaDevices.getUserMedia({
        audio: wantAudio,
        video: wantVideo ? { facingMode: "user" } : false
      });
    }
  }
}

export function readRhizohBoxCameraStreamV0() {
  return activeCameraStream;
}

export function closeRhizohBoxCameraStreamV0() {
  if (activeCameraStream) {
    try {
      activeCameraStream.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
  }
  activeCameraStream = null;
  const pin = readPinV0();
  publishRhizohBoxMediaDebugV0({
    streamActive: false,
    camDeviceId: pin.cam.deviceId || null,
    micDeviceId: pin.mic.deviceId || null
  });
  publishRhizohObservationFeedV0({
    state: OBSERVATION_FEED_STATE_V0.IDLE,
    boxStreamActive: false,
    source: "box_stream_close"
  });
}

/**
 * @param {MediaStream} stream
 */
export function bindRhizohBoxCameraStreamV0(stream) {
  closeRhizohBoxCameraStreamV0();
  activeCameraStream = stream;
  const videoTrack = stream?.getVideoTracks?.()?.[0];
  const audioTrack = stream?.getAudioTracks?.()?.[0];
  const pin = readPinV0();
  publishRhizohBoxMediaDebugV0({
    streamActive: true,
    videoTrackLabel: videoTrack?.label || null,
    audioTrackLabel: audioTrack?.label || null,
    camDeviceId: pin.cam.deviceId || null,
    micDeviceId: pin.mic.deviceId || null
  });
  publishRhizohObservationFeedV0({
    state: OBSERVATION_FEED_STATE_V0.ACTIVE,
    boxStreamActive: true,
    source: "box_stream_open"
  });
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("rhizoh:box-media-stream", {
          detail: Object.freeze({ active: true, atMs: Date.now() })
        })
      );
    } catch {
      /* noop */
    }
  }
}

/**
 * @param {object} snapshot
 */
export function publishRhizohBoxMediaDebugV0(snapshot) {
  if (typeof window === "undefined" || !snapshot) return;
  try {
    window.__CASTLE_RHIZOH_BOX_MEDIA__ = Object.freeze({
      schema: RHIZOH_BOX_MEDIA_SCHEMA_V0,
      layer: "device",
      streamActive: Boolean(activeCameraStream),
      ...snapshot,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}

/**
 * @param {{ preferredDeviceId?: string }} [opts]
 */
export async function resolveRhizohBoxVoiceMicV0(opts = {}) {
  const box = await resolveRhizohBoxMediaDevicesV0({
    preferredMicId: opts.preferredDeviceId
  });
  const preferred = String(opts.preferredDeviceId || box.micDeviceId || "").trim();
  if (preferred) {
    return Object.freeze({
      ok: true,
      reason: box.micResolveStep || "rhizoh_box_mic",
      deviceId: preferred,
      label: box.micLabel,
      resolveStep: box.micResolveStep,
      box
    });
  }
  return Object.freeze({
    ok: false,
    reason: "no_box_mic",
    deviceId: null,
    label: null,
    resolveStep: RHIZOH_BOX_RESOLVE_STEP_V0.NONE,
    box
  });
}

/**
 * @returns {() => void}
 */
export function installRhizohBoxMediaCommandBridgeV0(handlers = {}) {
  if (typeof window === "undefined") return () => {};

  const onCameraCmd = (ev) => {
    const action = String(ev?.detail?.action || "");
    if (action === "open" || action === "on" || action === "camera_on") {
      void handlers.openCamera?.();
    } else if (action === "close" || action === "off" || action === "camera_off") {
      handlers.closeCamera?.();
    }
  };

  const onBinding = (ev) => {
    const cam = ev?.detail?.camera;
    if (!cam) return;
    if (cam.op === "open" || cam.op === "on") void handlers.openCamera?.();
    if (cam.op === "close" || cam.op === "off") handlers.closeCamera?.();
  };

  window.addEventListener("rhizoh:camera-command", onCameraCmd);
  window.addEventListener("rhizoh:local-command-binding", onBinding);

  void resolveRhizohBoxMediaDevicesV0();
  publishRhizohObservationFeedV0({ state: OBSERVATION_FEED_STATE_V0.IDLE, source: "boot" });

  return () => {
    window.removeEventListener("rhizoh:camera-command", onCameraCmd);
    window.removeEventListener("rhizoh:local-command-binding", onBinding);
  };
}

export function __resetRhizohBoxMediaPinForTestV0() {
  try {
    window.sessionStorage.removeItem(PIN_STORAGE_KEY_V0);
    window.localStorage.removeItem(LKG_STORAGE_KEY_V0);
  } catch {
    /* noop */
  }
  closeRhizohBoxCameraStreamV0();
}
