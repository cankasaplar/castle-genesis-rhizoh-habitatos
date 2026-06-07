/**
 * FOX anchor motion — maps conversation drive → fox1.glb clips.
 * Clips: Idle, Idle_2, Idle_2_HeadLow, Walk, Gallop, Eating, Jump_ToIdle, HitReact L/R, …
 */

import { resolveFoxSpatialMotionStateV1 } from "./foxCompanionSpatialV1.js";

/** @type {Readonly<Record<string, readonly string[]>>} */
export const FOX_MOTION_CLIP_HINTS_V1 = Object.freeze({
  idle: Object.freeze(["Idle_2", "Idle"]),
  waiting: Object.freeze(["Idle_2_HeadLow", "Idle_2", "Idle"]),
  listening: Object.freeze(["Idle_2_HeadLow", "Idle_2"]),
  thinking: Object.freeze(["Eating", "Idle_2", "Idle"]),
  speaking: Object.freeze(["Walk", "Idle_2"]),
  walk: Object.freeze(["Walk"]),
  trot: Object.freeze(["Gallop", "Walk"]),
  turn_left: Object.freeze(["Idle_HitReact_Left"]),
  turn_right: Object.freeze(["Idle_HitReact_Right"]),
  settle: Object.freeze(["Jump_ToIdle", "Idle_2", "Idle"])
});

/**
 * @param {ReturnType<typeof import("./octoConversationMotionV1.js").deriveOctoMotionDriveV1>} drive
 * @param {{ speed?: number, reachBias?: number, swimming?: boolean }} [spatial]
 */
export function resolveFoxMotionStateV1(drive, spatial = null) {
  if (spatial && (spatial.speed != null || spatial.reachBias != null)) {
    return resolveFoxSpatialMotionStateV1(drive, spatial);
  }
  const emotion = String(drive?.emotion || "neutral");
  const activation = Number(drive?.activation) || 0;

  if (emotion === "speaking") {
    return activation > 0.72 ? "trot" : "speaking";
  }
  if (emotion === "thinking") return "thinking";
  if (emotion === "listening") return "listening";
  if (emotion === "curious") return "waiting";
  if (drive?.live && activation > 0.58) return "walk";
  return "idle";
}

/**
 * @param {import("three").AnimationClip[]} clips
 * @param {string} motionState
 * @returns {import("three").AnimationClip | null}
 */
export function pickFoxAnimationClipV1(clips, motionState) {
  if (!clips?.length) return null;
  const hints = FOX_MOTION_CLIP_HINTS_V1[motionState] || FOX_MOTION_CLIP_HINTS_V1.idle;
  for (const hint of hints) {
    const found = clips.find((c) => String(c.name).toLowerCase() === hint.toLowerCase());
    if (found) return found;
  }
  for (const hint of hints) {
    const found = clips.find((c) => String(c.name).toLowerCase().includes(hint.toLowerCase()));
    if (found) return found;
  }
  return clips.find((c) => /idle/i.test(c.name)) || clips[0];
}

/**
 * @param {import("three").AnimationClip | null | undefined} clip
 */
export function isFoxLocomotionClipV1(clip) {
  const n = String(clip?.name || "").toLowerCase();
  return n.includes("walk") || n.includes("gallop");
}

/**
 * @param {import("three").AnimationClip | null | undefined} clip
 */
export function shouldLoopFoxClipV1(clip) {
  const n = String(clip?.name || "").toLowerCase();
  if (!n) return true;
  if (n.includes("jump") || n.includes("hitreact") || n.includes("death") || n.includes("attack")) {
    return false;
  }
  return true;
}

/**
 * @param {import("three").AnimationClip | null | undefined} clip
 */
export function foxClipTimeScaleV1(clip, drive) {
  const n = String(clip?.name || "").toLowerCase();
  const act = Math.max(0.28, Math.min(1.1, (Number(drive?.speed) || 1) * 0.72));
  if (n.includes("gallop")) return 0.62 + act * 0.22;
  if (n.includes("walk")) return 0.52 + act * 0.28;
  if (n.includes("eating") || n.includes("idle_2_headlow")) return 0.48 + act * 0.14;
  return 0.62 + act * 0.16;
}

/** @returns {readonly string[]} */
export function listFoxAnimationCatalogV1() {
  return Object.freeze([
    "Idle — bekleme",
    "Idle_2 — oturma / dinlenme",
    "Idle_2_HeadLow — eğilerek bekleme",
    "Walk — yürüme",
    "Gallop — koçma / trot",
    "Eating — düşünme / meşgul",
    "Jump_ToIdle — yerleşme",
    "Idle_HitReact L/R — yön değiştirme"
  ]);
}
