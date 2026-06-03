/**
 * Perceptual Continuity Smoothing v0 — "always was there" overlay (non-authoritative).
 * @see docs/RHIZOH_ORGANISM_STABILIZATION_V0.md
 */

export const PERCEPTUAL_CONTINUITY_SMOOTH_SCHEMA_V0 =
  "castle.rhizoh.perceptual_continuity_smooth.v0";

export const RHIZOH_PERCEPTUAL_CONTINUITY_SMOOTH_EVENT_V0 =
  "rhizoh:perceptual-continuity-smooth-v0";

const SMOOTH_ALPHA_V0 = 0.38;

/** @type {{ breathe01: number, intensity01: number, samples: number }} */
let smoothState = { breathe01: 0.5, intensity01: 0.65, samples: 0 };

/**
 * @param {{
 *   frame?: { breathe01?: number, masterNowMs?: number } | null,
 *   pet?: { breathe01?: number, intensity01?: number } | null
 * }} [ctx]
 */
export function tickPerceptualContinuitySmoothingV0(ctx = {}) {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const frame = ctx.frame ?? rh.presenceFrame ?? null;
  const pet = ctx.pet ?? rh.petCitizen ?? null;

  const targetBreathe = Number(frame?.breathe01 ?? pet?.breathe01 ?? 0.5);
  const targetIntensity = Number(pet?.intensity01 ?? 0.65);

  if (smoothState.samples === 0) {
    smoothState = {
      breathe01: targetBreathe,
      intensity01: targetIntensity,
      samples: 1
    };
  } else {
    smoothState = {
      breathe01:
        smoothState.breathe01 * (1 - SMOOTH_ALPHA_V0) + targetBreathe * SMOOTH_ALPHA_V0,
      intensity01:
        smoothState.intensity01 * (1 - SMOOTH_ALPHA_V0) + targetIntensity * SMOOTH_ALPHA_V0,
      samples: smoothState.samples + 1
    };
  }

  const snap = Object.freeze({
    schema: PERCEPTUAL_CONTINUITY_SMOOTH_SCHEMA_V0,
    atMs: Number(frame?.masterNowMs) || Date.now(),
    breathe01_smooth: smoothState.breathe01,
    intensity01_smooth: smoothState.intensity01,
    samples: smoothState.samples,
    alpha: SMOOTH_ALPHA_V0,
    authoritative: false
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.perceptualContinuitySmooth = snap;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_PERCEPTUAL_CONTINUITY_SMOOTH_EVENT_V0, {
          detail: Object.freeze({ snap })
        })
      );
    } catch {
      /* noop */
    }
  }
  return snap;
}

export function resetRhizohPerceptualContinuitySmoothingForTestV0() {
  smoothState = { breathe01: 0.5, intensity01: 0.65, samples: 0 };
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.perceptualContinuitySmooth;
  }
}
