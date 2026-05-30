/**
 * SPECFLOW: RESEARCH-ONLY — **Emotional motion curves** (easing / ivme / jitter disiplini) — veri zarfı.
 * Renderer veya tween katmanı `easingId` + skalerleri tüketir; burada animasyon yok.
 */

export const GHOST_PET_MOTION_STYLE_ENVELOPE_SCHEMA_V0 = "castle.rhizoh.ghost_pet_motion_style_envelope.v0";

/**
 * @param {string} moodHint
 * @param {number} initiative01
 * @param {number} bleedRisk01
 * @param {number} attentionBlend01
 */
export function deriveGhostPetMotionStyleEnvelopeV0(moodHint, initiative01, bleedRisk01, attentionBlend01) {
  const mh = String(moodHint || "").toLowerCase();
  const init = Math.max(0, Math.min(1, Number(initiative01) || 0));
  const bleed = Math.max(0, Math.min(1, Number(bleedRisk01) || 0));
  const ab = Math.max(0, Math.min(1, Number(attentionBlend01) || 0));

  let easingId = "ease_out_quad";
  if (mh === "guarded" || bleed > 0.42) easingId = "soft_out_cubic";
  else if (mh === "rested") easingId = "ease_in_out_sine";
  else if (ab > 0.75) easingId = "ease_out_cubic";

  const jitterCap01 = Math.round(Math.max(0.08, Math.min(0.28, 0.24 - bleed * 0.22 + (1 - ab) * 0.06)) * 1000) / 1000;
  const maxAccel01 = Math.round(Math.max(0.22, Math.min(0.92, 0.32 + init * 0.48 + ab * 0.12)) * 1000) / 1000;
  const anticipationWindowMs = Math.round(70 + init * 160 + bleed * 40);
  const pauseSignatureMs = mh === "rested" ? 210 : mh === "guarded" ? 140 : 95;

  return {
    schema: GHOST_PET_MOTION_STYLE_ENVELOPE_SCHEMA_V0,
    easingId,
    maxAccel01,
    jitterCap01,
    anticipationWindowMs,
    pauseSignatureMs,
    curveNotes: "Deterministic envelope only — spline authoring deferred."
  };
}
