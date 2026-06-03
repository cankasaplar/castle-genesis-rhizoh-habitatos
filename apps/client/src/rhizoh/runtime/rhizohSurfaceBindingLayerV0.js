/**
 * RSBL v0 — Rhizoh Surface Binding Layer.
 * T0 presenceFrame = temporal truth; all surfaces = projection only.
 * @see docs/RHIZOH_SURFACE_BINDING_LAYER_V0.md
 */

import { readLastT0PresenceFrameV0, sampleT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readLastReslPresentationV0 } from "./rhizohReslPresentationPolicyV0.js";

export const RSBL_SCHEMA_V0 = "castle.rhizoh.surface_binding_layer.v0";

export const RHIZOH_SURFACE_BINDING_EVENT_V0 = "rhizoh:surface-binding-v0";

export const RSBL_SURFACE_ROLE_V0 = Object.freeze({
  TRUTH: "truth",
  PROJECTION: "projection",
  TOOL_LENS: "tool_lens"
});

export const RSBL_SURFACE_ID_V0 = Object.freeze({
  T0_STRIP: "t0_strip",
  UI_2D: "ui_2d",
  CESIUM: "cesium",
  GLOBE_THREE: "globe_three",
  CAP_WHEEL: "cap_wheel",
  PRESENCE_FIELD: "presence_field",
  SWARM: "swarm",
  STUDIO_PANEL: "studio_panel"
});

/** @type {ReturnType<typeof syncRhizohSurfaceBindingsV0> | null} */
let lastBindings = null;

/**
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0> | null} resl
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0> | null} ecc
 */
export function buildSurfaceBindingsV0(frame, resl = null, ecc = null) {
  const f =
    frame || sampleT0PresenceFrameV0(Date.now()) || readLastT0PresenceFrameV0();
  const r = resl || readLastReslPresentationV0();
  const coherenceId = f?.coherenceId || ecc?.stream_coherence_id || "none";
  const experientialNowId =
    typeof window !== "undefined"
      ? window.__rhizoh?.cognitiveAttention?.attention_inertia?.ccf?.experiential_now_id
      : null;

  const orb = f?.surfaces?.orb || r?.orbModulation || {};
  const strip = f?.surfaces?.strip || {};
  const field = f?.surfaces?.field || {};

  const projection = Object.freeze({
    breathe01: Number(f?.breathe01 ?? orb.breathe01 ?? 0),
    intensity01: Number(orb.intensity01 ?? 0.65),
    pulse01: Number(field.pulse01 ?? 0),
    stripOpacity01: Number(strip.opacity01 ?? 1),
    transitionProgress01: Number(f?.transitionProgress01 ?? 0),
    temporalPhase: String(f?.temporalPhase || "hold"),
    phase_coherence_ok: ecc?.temporal_guard?.phase_coherence_ok !== false,
    continuity_line: ecc?.continuity_line || r?.continuityLine || null
  });

  return Object.freeze({
    schema: RSBL_SCHEMA_V0,
    atMs: Number(f?.masterNowMs) || Date.now(),
    temporal_authority: "t0_presence_frame",
    coherence_id: coherenceId,
    experiential_now_id: experientialNowId || null,
    projection,
    surfaces: Object.freeze({
      [RSBL_SURFACE_ID_V0.T0_STRIP]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.TRUTH,
        bound: true,
        ...projection
      }),
      [RSBL_SURFACE_ID_V0.UI_2D]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        stripOpacity01: projection.stripOpacity01,
        continuity_line: projection.continuity_line
      }),
      [RSBL_SURFACE_ID_V0.CESIUM]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        breathe01: projection.breathe01,
        intensity01: projection.intensity01,
        pulse01: projection.pulse01,
        atmosphere_from_t0: true
      }),
      [RSBL_SURFACE_ID_V0.GLOBE_THREE]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        breathe01: projection.breathe01,
        intensity01: projection.intensity01,
        rotationScale: Number(orb.rotationScale) || 1
      }),
      [RSBL_SURFACE_ID_V0.CAP_WHEEL]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.TOOL_LENS,
        bound: true,
        coherence_id: coherenceId,
        breathe01: projection.breathe01
      }),
      [RSBL_SURFACE_ID_V0.PRESENCE_FIELD]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        fieldBreathe01: projection.breathe01,
        fieldPulse01: projection.pulse01
      }),
      [RSBL_SURFACE_ID_V0.SWARM]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        breathe01: projection.breathe01,
        intensity01: projection.intensity01,
        pulse01: projection.pulse01,
        collective_density: Math.min(
          1,
          Math.max(0, projection.breathe01 * 0.45 + projection.intensity01 * 0.45 + projection.pulse01 * 0.1)
        ),
        temporalPhase: projection.temporalPhase,
        coherence_id: coherenceId,
        masterNowMs: Number(f?.masterNowMs) || Date.now()
      }),
      [RSBL_SURFACE_ID_V0.STUDIO_PANEL]: Object.freeze({
        role: RSBL_SURFACE_ROLE_V0.PROJECTION,
        bound: true,
        coherence_id: coherenceId,
        experiential_now_id: experientialNowId,
        continuity_line: projection.continuity_line,
        episode_seq:
          typeof window !== "undefined" ? window.__rhizoh?.worldEpisode?.current_seq ?? null : null,
        masterNowMs: Number(f?.masterNowMs) || Date.now()
      })
    })
  });
}

/**
 * Publish RSBL — does not render; surfaces read bindings.
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} [frame]
 * @param {ReturnType<import("./rhizohReslPresentationPolicyV0.js").resolveReslPresentationV0> | null} [resl]
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0> | null} [ecc]
 */
export function syncRhizohSurfaceBindingsV0(frame = null, resl = null, ecc = null) {
  const bindings = buildSurfaceBindingsV0(frame, resl, ecc);
  lastBindings = bindings;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.surfaceBindings = bindings;
    window.__rhizoh.surfaceBindingAuthority = Object.freeze({
      truth: "t0_presence_frame",
      coherence_id: bindings.coherence_id
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SURFACE_BINDING_EVENT_V0, {
          detail: Object.freeze({ bindings })
        })
      );
    } catch {
      /* noop */
    }
  }
  return bindings;
}

/**
 * Cesium / globe consumers — SCR citizen projection (reverse ownership).
 */
export function readCesiumSurfaceProjectionV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.surfaceCitizenship) {
    const cesium = window.__rhizoh.surfaceCitizenship.citizens?.[RSBL_SURFACE_ID_V0.CESIUM]?.projection;
    if (cesium) return cesium;
    const globe = window.__rhizoh.surfaceCitizenship.citizens?.[RSBL_SURFACE_ID_V0.GLOBE_THREE]?.projection;
    if (globe) return globe;
  }
  const b = lastBindings || (typeof window !== "undefined" ? window.__rhizoh?.surfaceBindings : null);
  return b?.surfaces?.[RSBL_SURFACE_ID_V0.CESIUM] || b?.surfaces?.[RSBL_SURFACE_ID_V0.GLOBE_THREE] || null;
}

export function readLastSurfaceBindingsV0() {
  return lastBindings;
}

export function resetRhizohSurfaceBindingsForTestV0() {
  lastBindings = null;
}
