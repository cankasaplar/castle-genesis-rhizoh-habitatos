/**
 * Human-friendly degrade copy — world keeps living when a feature fails.
 */

export const RHIZOH_DEGRADE_KIND_V1 = Object.freeze({
  MIC_DENIED: "mic_denied",
  CAM_DENIED: "cam_denied",
  MAP_FAILED: "map_failed",
  INVITE_BROKEN: "invite_broken",
  EVENT_NOT_FOUND: "event_not_found"
});

export const RHIZOH_DEGRADE_MOMENT_EVENT_V1 = "rhizoh:experience-degrade-v1";

/**
 * @param {string} kind
 * @param {boolean} tr
 */
export function resolveRhizohDegradeCopyV1(kind, tr = false) {
  const k = String(kind || "").toLowerCase();
  if (k === RHIZOH_DEGRADE_KIND_V1.MIC_DENIED) {
    return tr
      ? "Mikrofon kullanılamıyor. Yazışarak devam edebilirsin."
      : "Microphone unavailable. You can keep going by typing.";
  }
  if (k === RHIZOH_DEGRADE_KIND_V1.CAM_DENIED) {
    return tr
      ? "Kamera açılamadı. Diğer özellikler kullanılabilir."
      : "Camera could not open. Everything else still works.";
  }
  if (k === RHIZOH_DEGRADE_KIND_V1.MAP_FAILED) {
    return tr
      ? "Harita şu anda yüklenemiyor. Castle içinde devam edebilirsin."
      : "The map cannot load right now. You can stay inside Castle.";
  }
  if (k === RHIZOH_DEGRADE_KIND_V1.INVITE_BROKEN) {
    return tr
      ? "Davet linki tanınmadı. Yine de buradasın — konuşabilir veya yeni bir deneyim başlatabilirsin."
      : "Invite link was not recognized. You're still here — talk or start a new experience.";
  }
  if (k === RHIZOH_DEGRADE_KIND_V1.EVENT_NOT_FOUND) {
    return tr
      ? "Bu etkinlik kaydı bulunamadı. Cap Wheel'den yeni bir deneyim oluşturabilirsin."
      : "This event was not found. You can create a new one from the Cap Wheel.";
  }
  return tr ? "Bir özellik çalışmıyor; dünya devam ediyor." : "One feature paused; the world continues.";
}

/**
 * @param {string} kind
 * @param {{ tr?: boolean, meta?: Record<string, unknown> }} [opts]
 */
export function emitRhizohDegradeMomentV1(kind, opts = {}) {
  const copy = resolveRhizohDegradeCopyV1(kind, opts.tr === true);
  const detail = Object.freeze({
    kind: String(kind || ""),
    copy,
    meta: opts.meta && typeof opts.meta === "object" ? opts.meta : {},
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__RHIZOH_EXPERIENCE_DEGRADE__ = Object.freeze({
      schema: "castle.rhizoh_experience_degrade.v1",
      readOnly: true,
      last: detail
    });
    window.dispatchEvent(new CustomEvent(RHIZOH_DEGRADE_MOMENT_EVENT_V1, { detail }));
  }
  return detail;
}

/** @internal vitest */
export function __resetRhizohDegradeForTestV1() {
  try {
    if (typeof window !== "undefined") delete window.__RHIZOH_EXPERIENCE_DEGRADE__;
  } catch {
    /* noop */
  }
}
