/**
 * Domain zone capability spec — Castle / Studio / Observer runtime zones.
 * Each domain declares required adapters + tensor intents (contract SSOT).
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";

/** Shared base capabilities (T0 / World). */
export const RHIZOH_DOMAIN_CAPABILITY_V0 = Object.freeze({
  SPATIAL: "spatial",
  VOICE: "voice",
  SOCIAL: "social",
  PRESENCE: "presence",
  TENSOR: "tensor",
  MAP_DATA: "map_data"
});

/** Castle zone — social real-time. */
export const CASTLE_ZONE_CAPABILITY_V0 = Object.freeze({
  WEBRTC: "webrtc",
  PRESENCE: "presence",
  SESSION: "session",
  IDENTITY_SYNC: "identity_sync",
  VOICE: "voice",
  SOCIAL: "social",
  TENSOR: "tensor"
});

/** Studio zone — creation / editing. */
export const STUDIO_ZONE_CAPABILITY_V0 = Object.freeze({
  FILESYSTEM: "filesystem",
  ASSET_PIPELINE: "asset_pipeline",
  MAP_BUILDER: "map_builder",
  AI_GENERATION: "ai_generation",
  VOICE: "voice",
  TENSOR: "tensor"
});

/** Observer zone — read-only system view. */
export const OBSERVER_ZONE_CAPABILITY_V0 = Object.freeze({
  TELEMETRY: "telemetry",
  LOG_STREAM: "log_stream",
  STATE_INSPECTOR: "state_inspector",
  TENSOR: "tensor"
});

/** Required capabilities per domain zone (health contract). */
export const DOMAIN_ZONE_REQUIRED_CAPABILITIES_V0 = Object.freeze({
  [RHIZOH_DOMAIN_ID_V0.T0]: [
    RHIZOH_DOMAIN_CAPABILITY_V0.VOICE,
    RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR
  ],
  [RHIZOH_DOMAIN_ID_V0.WORLD]: [
    RHIZOH_DOMAIN_CAPABILITY_V0.SPATIAL,
    RHIZOH_DOMAIN_CAPABILITY_V0.MAP_DATA,
    RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR
  ],
  [RHIZOH_DOMAIN_ID_V0.CASTLE]: [
    CASTLE_ZONE_CAPABILITY_V0.WEBRTC,
    CASTLE_ZONE_CAPABILITY_V0.PRESENCE,
    CASTLE_ZONE_CAPABILITY_V0.SESSION,
    CASTLE_ZONE_CAPABILITY_V0.IDENTITY_SYNC,
    CASTLE_ZONE_CAPABILITY_V0.TENSOR
  ],
  [RHIZOH_DOMAIN_ID_V0.STUDIO]: [
    STUDIO_ZONE_CAPABILITY_V0.FILESYSTEM,
    STUDIO_ZONE_CAPABILITY_V0.ASSET_PIPELINE,
    STUDIO_ZONE_CAPABILITY_V0.MAP_BUILDER,
    STUDIO_ZONE_CAPABILITY_V0.TENSOR
  ],
  [RHIZOH_DOMAIN_ID_V0.OBSERVER]: [
    OBSERVER_ZONE_CAPABILITY_V0.TELEMETRY,
    OBSERVER_ZONE_CAPABILITY_V0.LOG_STREAM,
    OBSERVER_ZONE_CAPABILITY_V0.STATE_INSPECTOR,
    OBSERVER_ZONE_CAPABILITY_V0.TENSOR
  ],
  [RHIZOH_DOMAIN_ID_V0.ROBOTICS]: [RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR]
});

/** Domains that must never mutate external runtime state. */
export const DOMAIN_READ_ONLY_ZONES_V0 = new Set([RHIZOH_DOMAIN_ID_V0.OBSERVER]);

/** Domains that must not touch WORLD render or T0 override. */
export const DOMAIN_RENDER_ISOLATION_ZONES_V0 = Object.freeze({
  [RHIZOH_DOMAIN_ID_V0.CASTLE]: Object.freeze({
    mayTouchWorldRender: false,
    mayOverrideT0: false
  }),
  [RHIZOH_DOMAIN_ID_V0.STUDIO]: Object.freeze({
    mayTouchWorldRender: false,
    mayOverrideT0: false,
    sandbox: true
  }),
  [RHIZOH_DOMAIN_ID_V0.OBSERVER]: Object.freeze({
    mayTouchWorldRender: false,
    mayOverrideT0: false,
    readOnly: true
  })
});
