/**
 * SSOT — rhizoh.com spatial-main production profile (Serencebey origin seed topology).
 * GitHub Actions secrets override these; absent secrets fall back to defaults here.
 * @see scripts/setup-rhizoh-t0-production.ps1 (local equivalent)
 * @see docs/RHIZOH_MEMORY_ANCHOR_SYSTEM_V0.md
 */

/** Voice + STT stack — cohort and all future users (baked at vite build). */
export const RHIZOH_SPATIAL_MAIN_VOICE_DEFAULTS_V0 = Object.freeze({
  VITE_RHIZOH_FAST_SPEECH_MODE: "1",
  VITE_RHIZOH_VOICE_ENGINE_V3: "1",
  VITE_RHIZOH_VOICE_WITNESS_SHADOW: "1",
  VITE_RHIZOH_VOICE_ENV_PROFILE: "1",
  VITE_RHIZOH_VOICE_ATTENTION_MODE: "moving_context",
  VITE_RHIZOH_SHARED_ATTENTION_TYPE: "co_presence",
  VITE_RHIZOH_STT_TEMPORAL_CALIBRATION: "1",
  VITE_RHIZOH_STT_TEMPORAL_ADAPTIVE: "1",
  VITE_RHIZOH_VOICE_INGEST_STRICT: "1",
  VITE_RHIZOH_VOICE_PRE_STT_GATE: "1",
  VITE_RHIZOH_VOICE_POST_STT_ORIGIN: "0",
  VITE_RHIZOH_VOICE_ORIGIN_RETRY: "0"
});

/** Serencebey semantic gravity seed — deploy label overrides only when secret set. */
export const RHIZOH_SPATIAL_MAIN_ANCHOR_DEFAULTS_V0 = Object.freeze({
  VITE_RHIZOH_ORIGIN_SEED_LABEL: "Serencebey Castle",
  VITE_RHIZOH_ORIGIN_SEED_PLACE: "Beşiktaş · shared seed topology"
});

/** Ingress + cohort gate — allowlist email list must come from GitHub secret. */
export const RHIZOH_SPATIAL_MAIN_INGRESS_DEFAULTS_V0 = Object.freeze({
  VITE_RHIZOH_LEGAL_PREAMBLE: "1",
  VITE_RHIZOH_CLOSED_ADMISSION: "1",
  VITE_RHIZOH_INVITE_ONLY_GOOGLE: "1",
  VITE_RHIZOH_COHORT_SERVER_GATE: "1",
  VITE_ONTOLOGICAL_BOOT_GATE: "0",
  VITE_RHIZOH_DEFAULT_LOCALE: "en",
  VITE_RHIZOH_OUTPUT_LANGUAGE_POLICY: "ui_locked_output",
  VITE_RHIZOH_REQUIRE_LANGUAGE_PICKER: "1"
});

/** World mesh from Serencebey seed — spatial-main default (not legacy layer-0 shell). */
export const RHIZOH_SPATIAL_MAIN_WORLD_DEFAULTS_V0 = Object.freeze({
  VITE_WORLD_LAYER: "1",
  VITE_WORLD_EXECUTION_MODE: "active",
  VITE_RHIZOH_SPATIAL_SHELL: "0",
  VITE_RHIZOH_T0_FIRST_MATCH: "1",
  /** T0 home — Apex procedural city + drones (not abstract GLOBE overlay). */
  VITE_RHIZOH_T0_AMBIENT_PROCEDURAL_CITY: "1",
  VITE_PRESENCE_MESH: "0",
  VITE_SATELLITE_NODE_REGISTRY_V0: "0",
  VITE_SOVEREIGN_NODE_ONBOARDING: "0",
  VITE_DEBUG: "0",
  VITE_RHIZOH_SURFACE_CREATIVE: "1",
  VITE_RHIZOH_CONVERSATION_ANCHOR_SPECIES: "fox_v1",
  VITE_RHIZOH_ENTITY_PROJECTION_MAP: "1",
  VITE_CESIUM_WORLD_PROJECTION_BIND: "1",
  VITE_CESIUM_OSM_BUILDINGS: "0",
  VITE_CESIUM_WORLD_TERRAIN: "0"
});

/** Canonical Render gateway — override via GitHub secret when host changes. */
export const RHIZOH_SPATIAL_MAIN_GATEWAY_BASE_V0 = "https://castle-genesis-rhizoh-habitatos.onrender.com";

/** Merged spatial-main defaults (secrets override per-key). */
export const RHIZOH_SPATIAL_MAIN_PROD_DEFAULTS_V0 = Object.freeze({
  ...RHIZOH_SPATIAL_MAIN_WORLD_DEFAULTS_V0,
  ...RHIZOH_SPATIAL_MAIN_VOICE_DEFAULTS_V0,
  ...RHIZOH_SPATIAL_MAIN_ANCHOR_DEFAULTS_V0,
  ...RHIZOH_SPATIAL_MAIN_INGRESS_DEFAULTS_V0,
  VITE_CASTLE_APP_ID: "castle-vnext-core",
  VITE_GENESIS_DEPLOY_MODE: "observability",
  VITE_GENESIS_PASSIVE_EPOCH_MAX: "100",
  VITE_ENV: "production",
  VITE_PREFER_LOCAL_GATEWAY: "0",
  VITE_CASTLE_AUTHORITY_PROFILE: "production",
  VITE_TELEMETRY_MAX_HZ: "30",
  VITE_SIM_DRONE_COUNT: "4",
  /** T0 parity — Castle Layers topology / schema drift panel (Serencebey metrics). */
  VITE_CASTLE_LAYERS_DEBUG: "1",
  VITE_GATEWAY_HTTP: `${RHIZOH_SPATIAL_MAIN_GATEWAY_BASE_V0}/rhizoh/llm`,
  VITE_LIVE_GATEWAY_BASE: RHIZOH_SPATIAL_MAIN_GATEWAY_BASE_V0,
  VITE_GATEWAY_WS: `wss://castle-genesis-rhizoh-habitatos.onrender.com`
});

/** Must be supplied via GitHub secret or local .env.production — no repo default. */
export const RHIZOH_PROD_SECRET_ONLY_KEYS_V0 = Object.freeze([
  "VITE_GATEWAY_TOKEN",
  "VITE_RHIZOH_LLM_HTTP",
  "VITE_GATEWAY_URL",
  "VITE_GATEWAY_WS_URL",
  "VITE_FIREBASE_CONFIG",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST"
]);

/** Optional overrides — written only when secret or env present. */
export const RHIZOH_PROD_OPTIONAL_KEYS_V0 = Object.freeze([
  "VITE_RHIZOH_STT_LANGUAGE",
  "VITE_RHIZOH_LLM_TOKEN",
  "VITE_RHIZOH_COHORT_OBSERVATION_LOG",
  "VITE_RHIZOH_COHORT_GATE_URL",
  "VITE_DRONE_TELEMETRY_WS",
  "VITE_FLIGHT_VIEWER_HTTP",
  "VITE_SATELLITE_TILE_TEMPLATE",
  "VITE_MAPBOX_TOKEN",
  "VITE_CESIUM_ION_TOKEN",
  "VITE_RHIZOH_VOICE_SHADOW_OBS_ACK",
  "VITE_RHIZOH_VOICE_TIMELINE_BUCKET_MS",
  "VITE_RHIZOH_STT_TEMPORAL_WINDOW"
]);

/** Ordered union for materialize script. */
export const RHIZOH_PROD_ENV_KEYS_V0 = Object.freeze([
  ...Object.keys(RHIZOH_SPATIAL_MAIN_PROD_DEFAULTS_V0),
  ...RHIZOH_PROD_SECRET_ONLY_KEYS_V0,
  ...RHIZOH_PROD_OPTIONAL_KEYS_V0
]);

/** Keys where explicit empty CI env omits the key (no profile fallback). */
export const RHIZOH_PROD_EMPTY_MEANS_OMIT_V0 = new Set(["VITE_WORLD_EXECUTION_MODE"]);

const INVALID_PROD_GATEWAY_URL_RE =
  /(?:^|\/)xxx\.onrender\.com|YOUR-RENDER-HOST|YOUR-STAGING-GATEWAY|your-render-host/i;

function sanitizeProdGatewayEnvValue(key, value) {
  if (value == null || !String(value).trim()) return value;
  if (!/^VITE_(GATEWAY|LIVE_GATEWAY|RHIZOH_LLM)/.test(key)) return value;
  if (!INVALID_PROD_GATEWAY_URL_RE.test(String(value))) return value;
  const fallback = RHIZOH_SPATIAL_MAIN_PROD_DEFAULTS_V0[key];
  return fallback != null ? String(fallback) : null;
}

/**
 * @param {string} key
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | null}
 */
export function resolveRhizohProdEnvValueV0(key, env = process.env) {
  if (Object.prototype.hasOwnProperty.call(env, key)) {
    const raw = env[key];
    if (raw != null && String(raw).trim()) {
      return sanitizeProdGatewayEnvValue(key, String(raw).trim());
    }
    // GitHub Actions sets unset secrets to "" — fall through to profile default
    // except keys where empty explicitly means "omit from .env.production".
    if (raw === "" && RHIZOH_PROD_EMPTY_MEANS_OMIT_V0.has(key)) return null;
  }
  const fallback = RHIZOH_SPATIAL_MAIN_PROD_DEFAULTS_V0[key];
  return fallback != null ? String(fallback) : null;
}
