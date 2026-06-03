/**
 * T0 first-frame bootstrap — continuity first paint (release checklist A).
 * Rhizoh is already present on first paint; no empty silent shell.
 * @see docs/RHIZOH_RELEASE_CONTROL_ROOM_V0.md
 */

import {
  deriveRhizohPresenceStateV0,
  publishRhizohPresenceStateV0,
  readLastRhizohPresenceStateV0
} from "./rhizohPresenceStateEngineV0.js";
import {
  publishReslPresentationV0,
  resolveReslPresentationV0
} from "./rhizohReslPresentationPolicyV0.js";
import { startT0PresenceFrameSamplerV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

export const RHIZOH_CONTINUITY_FIRST_PAINT_EVENT_V0 = "rhizoh:continuity-first-paint-v0";

/**
 * @param {{
 *   fieldState?: string,
 *   returningUser?: boolean,
 *   hasAnchor?: boolean,
 *   lastUserActivityMs?: number,
 *   nowMs?: number
 * }} [ctx]
 */
export async function bootstrapRhizohContinuityFirstPaintV0(ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const lastUser =
    Number(ctx.lastUserActivityMs) || nowMs - 45_000;

  const state = deriveRhizohPresenceStateV0({
    shellMounted: true,
    quarantine: false,
    fieldState: ctx.fieldState || "IDLE",
    voiceListening: false,
    returningUser: ctx.returningUser === true,
    hasAnchor: ctx.hasAnchor === true,
    lastUserActivityMs: lastUser,
    lastRhizohActivityMs: nowMs,
    nowMs
  });
  publishRhizohPresenceStateV0(state);
  const resl = resolveReslPresentationV0(state, { nowMs });
  publishReslPresentationV0(state, { nowMs });

  const eccMod = await import("./rhizohExperienceContinuityCompilerV0.js").catch(() => null);
  if (eccMod) {
    await eccMod.syncExperienceContinuityV0({
      presence: state,
      resl,
      cognitive: null,
      trf: null,
      nowMs
    });
  }

  startT0PresenceFrameSamplerV0();

  const paint = Object.freeze({
    atMs: nowMs,
    ok: state?.rhizoh_is_present === true && Boolean(resl?.continuityLine),
    continuity_line: resl?.continuityLine || null,
    silence_form: state?.silence_form || null,
    product_line: "Rhizoh is already present"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.continuityFirstPaint = paint;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CONTINUITY_FIRST_PAINT_EVENT_V0, {
          detail: Object.freeze({ paint })
        })
      );
    } catch {
      /* noop */
    }
  }

  return Object.freeze({
    state: readLastRhizohPresenceStateV0() || state,
    resl,
    paint
  });
}
