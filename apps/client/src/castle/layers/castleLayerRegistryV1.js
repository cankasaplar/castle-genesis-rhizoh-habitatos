/**
 * CASTLE layer registry v1 — SSOT for render + ownership (code mirror of docs/CASTLE_SYSTEM_TOPOLOGY_V1.md).
 * Deprecated layers stay in repo; `render: false` keeps them out of T0 shell.
 */

export const CASTLE_LAYER_REGISTRY_SCHEMA_V1 = "castle.layer_registry.v1";

/** @typedef {'active'|'deprecated'|'research'} CastleLayerStatusV1 */
/** @typedef {'t0_shell'|'spatial_shell'|'ingress'|'runtime_only'|'advanced_aux'} CastleLayerMountV1 */

/**
 * @type {Record<string, {
 *   status: CastleLayerStatusV1,
 *   owner: string,
 *   mount?: CastleLayerMountV1,
 *   render: boolean,
 *   renderInAdvanced?: boolean,
 *   replacedBy?: string,
 *   envGate?: string,
 *   note?: string
 * }>}
 */
export const CASTLE_LAYER_REGISTRY_V1 = Object.freeze({
  t0_core_shell: Object.freeze({
    status: "active",
    owner: "AppRhizoh528T0",
    mount: "t0_shell",
    render: true,
    note: "Three.js globe + swarm + product bar; canonical product"
  }),
  t0_slot_chat_surface: Object.freeze({
    status: "active",
    owner: "RhizohT0ShellChromeV1",
    mount: "t0_shell",
    render: true
  }),
  t0_slot_state_indicator: Object.freeze({
    status: "active",
    owner: "RhizohT0ShellChromeV1",
    mount: "t0_shell",
    render: true
  }),
  t0_slot_layer_toggle: Object.freeze({
    status: "active",
    owner: "RhizohT0ShellChromeV1",
    mount: "t0_shell",
    render: true,
    note: "Opens advanced_aux deprecated stack"
  }),

  voice_v1_loop_mic_ui: Object.freeze({
    status: "deprecated",
    owner: "AppRhizoh528T0",
    mount: "t0_shell",
    render: false,
    replacedBy: "voice_v3_dock_mic",
    note: "Legacy Mic + continuous STT loop chrome — do not mount in React tree"
  }),
  voice_v3_engine: Object.freeze({
    status: "active",
    owner: "voiceEngineV3",
    mount: "runtime_only",
    render: false,
    envGate: "VITE_RHIZOH_VOICE_ENGINE_V3=1",
    note: "Headless STT/TTS motor — UI mic is voice_v3_dock_mic"
  }),
  voice_v3_dock_mic: Object.freeze({
    status: "active",
    owner: "RhizohConversationDockV0",
    mount: "advanced_aux",
    render: false,
    renderInAdvanced: true,
    envGate: "VITE_RHIZOH_VOICE_ENGINE_V3=1",
    note: "Push-to-talk mic in conversation dock — Gelişmiş only"
  }),
  spatial_product_shell: Object.freeze({
    status: "deprecated",
    owner: "RhizohSpatialWorldShell",
    mount: "spatial_shell",
    render: false,
    envGate: "VITE_RHIZOH_SPATIAL_SHELL=1",
    note: "Full-page map-first track — not default product"
  }),
  gateway_banner_panel: Object.freeze({
    status: "deprecated",
    owner: "RhizohGatewayBanner",
    mount: "advanced_aux",
    render: false,
    renderInAdvanced: true
  }),
  first_interaction_chips: Object.freeze({
    status: "deprecated",
    owner: "livingWorldFirstInteractionV0",
    mount: "advanced_aux",
    render: false,
    renderInAdvanced: true
  }),
  trust_strip_expanded: Object.freeze({
    status: "deprecated",
    owner: "RhizohTrustUpdateStrip",
    mount: "advanced_aux",
    render: false,
    renderInAdvanced: true,
    replacedBy: "t0_slot_state_indicator"
  }),
  debug_overlay_panels: Object.freeze({
    status: "deprecated",
    owner: "AppRhizoh528T0",
    mount: "advanced_aux",
    render: false,
    renderInAdvanced: true
  }),
  metehan_observability: Object.freeze({
    status: "active",
    owner: "rhizohRuntimeStabilityLayerV0",
    mount: "runtime_only",
    render: false,
    note: "window.__CASTLE_RHIZOH_RUNTIME_STABILITY__ — reality check, not UI"
  }),
  t0_capability_wheel: Object.freeze({
    status: "active",
    owner: "RhizohCapabilityHaloV1",
    mount: "t0_perception_aux",
    render: true,
    note: "Cognition-only: layerFocus + seedIntent — no href/openRealMap"
  }),
  t0_capability_wheel_nav: Object.freeze({
    status: "deprecated",
    owner: "RhizohCapabilityHaloV1",
    mount: "t0_perception_aux",
    render: false,
    replacedBy: "t0_product_bar",
    note: "href/openRealMap removed from halo config v1.1"
  }),
  t0_layer_switcher: Object.freeze({
    status: "active",
    owner: "rhizohPerceptionModeV0",
    mount: "t0_perception_controller",
    render: false,
    note: "Placeholder SSOT — perceptionMode state only (UI later)"
  })
});

export const T0_SHELL_SLOT_IDS_V1 = Object.freeze([
  "t0_slot_chat_surface",
  "t0_slot_state_indicator",
  "t0_slot_layer_toggle"
]);
