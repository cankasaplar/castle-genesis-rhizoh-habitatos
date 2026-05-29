/**
 * Sovereign Node Onboarding Wizard V0 — epistemic anchor creation (NO EXECUTION WRITE).
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §18
 */

import { isCastleDebugGranularFlagEnabled } from "../castleDebugGateV0.js";
import {
  setEpistemicEventBusEnabledV0,
  clearEpistemicEventBusV0
} from "../epistemicEventBusV0.js";
import { startEpistemicSimResearchWireV0 } from "../epistemicSimResearchWireV0.js";
import { isEpistemicSimResearchEnabledV0 } from "../epistemicSimResearchWireV0.js";
import {
  SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0,
  SOVEREIGN_EPISTEMIC_ROLE_V0,
  SOVEREIGN_NODE_ONBOARDING_SCHEMA_V0,
  SOVEREIGN_NODE_STATE_V0,
  SOVEREIGN_ONBOARDING_STEP_V0
} from "./sovereignNodeOnboardingContractV0.js";
import { initializeShadowContinuityBufferV0 } from "./shadowContinuityBufferV0.js";
import {
  deriveDynamicSatelliteNodeIdV0,
  enrichGeographicAnchorFromWgs84V0
} from "./dynamicSatelliteNodeSlugV0.js";

/**
 * @returns {boolean}
 */
export function isSovereignNodeOnboardingEnabledV0() {
  return isCastleDebugGranularFlagEnabled("VITE_SOVEREIGN_NODE_ONBOARDING");
}

/**
 * @typedef {Object} GeographicAnchorV0
 * @property {number} lat
 * @property {number} lon
 * @property {number} [zoom]
 * @property {string} [label]
 */

/**
 * @typedef {Object} SovereignNodePreviewV0
 * @property {string} schema
 * @property {string} nodeId
 * @property {GeographicAnchorV0} anchor
 * @property {string} continuity
 * @property {string} epistemicRole
 * @property {string} state
 * @property {string|null} epistemicFingerprintId
 * @property {boolean} bootValidityTokenCreated
 */

/** @type {GeographicAnchorV0 | null} */
let ephemeralAnchorV0 = null;

/** @type {SovereignNodePreviewV0 | null} */
let nodePreviewV0 = null;

let currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.WORLD_ENTRY;

/** @type {(() => void) | null} */
let stopSimWireV0 = null;

/**
 * @param {{ lat: number, lon: number, zoom?: number, label?: string }} coords
 */
export function setEphemeralGeographicAnchorV0(coords) {
  const enriched = enrichGeographicAnchorFromWgs84V0(coords);
  ephemeralAnchorV0 = {
    lat: enriched.lat,
    lon: enriched.lon,
    zoom: enriched.zoom,
    label: enriched.label,
    placeSlug: enriched.placeSlug
  };
  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.GEOGRAPHIC_ANCHOR;
}

export function getEphemeralGeographicAnchorV0() {
  return ephemeralAnchorV0;
}

export function getSovereignOnboardingStepV0() {
  return currentStepV0;
}

/**
 * @param {{ lat: number, lon: number }} anchor
 * @param {import('../continuity/__research__/epistemicIdentityContinuityV0.js').EpistemicFingerprintV0} fingerprint
 */
export function deriveSovereignNodeIdV0(anchor, fingerprint) {
  return deriveDynamicSatelliteNodeIdV0(anchor, fingerprint);
}

/**
 * Soft compute — dynamic import research module.
 * @param {GeographicAnchorV0} anchor
 */
export async function deriveSovereignNodePreviewV0(anchor) {
  const { deriveEpistemicFingerprintV0 } = await import(
    "../continuity/__research__/epistemicIdentityContinuityV0.js"
  );

  const fingerprint = deriveEpistemicFingerprintV0({
    livingWorldId: `world:anchor:${anchor.lat.toFixed(4)},${anchor.lon.toFixed(4)}`,
    issuancePath: "sovereign_onboarding_v0",
    lineageRoot: `geo:${anchor.label || "custom"}`,
    witnessAnchor: { weight: 4, class: "satellite_observer", decayRate: 0.04 },
    nowMs: Date.now()
  });

  const nodeId = deriveSovereignNodeIdV0(anchor, fingerprint);
  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.EPISTEMIC_DERIVATION;

  nodePreviewV0 = Object.freeze({
    schema: SOVEREIGN_NODE_ONBOARDING_SCHEMA_V0,
    nodeId,
    anchor: { ...anchor },
    continuity: "pending",
    epistemicRole: SOVEREIGN_EPISTEMIC_ROLE_V0.SATELLITE_OBSERVER,
    state: SOVEREIGN_NODE_STATE_V0.OBSERVATION_ONLY,
    epistemicFingerprintId: fingerprint.epistemicFingerprintId,
    bootValidityTokenCreated: false
  });

  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.SEAL_PREVIEW;
  return nodePreviewV0;
}

export function getSovereignNodeSealPreviewV0() {
  return nodePreviewV0;
}

/**
 * Cesium adapter hook (observation-only).
 * @param {{ setInteractionMode?: (mode: string) => void, on?: (event: string, fn: Function) => void }} [cesiumInstance]
 */
export function enterSovereignObservationGateV0(cesiumInstance) {
  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.WORLD_ENTRY;
  clearEpistemicEventBusV0();
  setEpistemicEventBusEnabledV0(false);
  cesiumInstance?.setInteractionMode?.(SOVEREIGN_NODE_STATE_V0.OBSERVATION_ONLY);
}

/**
 * @param {{ setInteractionMode?: (mode: string) => void, on?: (event: string, fn: (ev: { latlng?: { lat: number, lng: number } }) => void) => void }} [cesiumInstance]
 */
export function wireCesiumGeographicPickV0(cesiumInstance) {
  if (!cesiumInstance?.on) return () => {};
  const handler = (event) => {
    const ll = event?.latlng;
    if (ll) {
      setEphemeralGeographicAnchorV0({
        lat: ll.lat,
        lon: ll.lng ?? ll.lon,
        zoom: 14,
        label: event?.label
      });
      return;
    }
    if (typeof event?.lat === "number" && typeof event?.lon === "number") {
      setEphemeralGeographicAnchorV0({
        lat: event.lat,
        lon: event.lon,
        zoom: 14,
        label: event.label
      });
    }
  };
  cesiumInstance.on("click", handler);
  return () => {};
}

/**
 * STEP 6 — read-only event plane exposure (no execution token).
 * @param {string} nodeId
 */
export function enableEventBusReadOnlyMirrorV0(nodeId) {
  setEpistemicEventBusEnabledV0(true);
  if (typeof window !== "undefined") {
    window.__rhizoh_event_bus_readonly_mirror = Object.freeze({
      enabled: true,
      nodeId: String(nodeId),
      witnessWrite: false,
      executionWrite: false
    });
  }
  if (isEpistemicSimResearchEnabledV0()) {
    stopSimWireV0 = startEpistemicSimResearchWireV0();
  }
  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.EVENT_PLANE_ENTRY;
}

/**
 * @param {{ setInteractionMode?: (mode: string) => void, on?: Function }} [cesiumInstance]
 * @param {unknown} [_eventBus] — reserved; bus accessed via module API
 */
export async function startSovereignNodeWizardV0(cesiumInstance, _eventBus) {
  resetSovereignNodeWizardStateV0();
  enterSovereignObservationGateV0(cesiumInstance);
  const unwired = wireCesiumGeographicPickV0(cesiumInstance);

  return {
    getStep: () => currentStepV0,
    getAnchor: () => ephemeralAnchorV0,
    getPreview: () => nodePreviewV0,
    useDefaultKadikoyAnchor: () => {
      setEphemeralGeographicAnchorV0({ ...SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0 });
    },
    confirmNode: async () => {
      const coords = ephemeralAnchorV0;
      if (!coords) return null;

      const preview = await deriveSovereignNodePreviewV0(coords);
      currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.SOFT_ACTIVATION;

      const shadow = await initializeShadowContinuityBufferV0({
        nodeId: preview.nodeId,
        anchor: preview.anchor,
        epistemicRole: preview.epistemicRole,
        fingerprintId: preview.epistemicFingerprintId
      });

      if (typeof window !== "undefined") {
        window.__rhizoh_node_id = preview.nodeId;
      }

      const node = Object.freeze({
        ...preview,
        state: SOVEREIGN_NODE_STATE_V0.SOFT_INIT,
        shadowContinuity: shadow
      });

      enableEventBusReadOnlyMirrorV0(node.nodeId);
      cesiumInstance?.setInteractionMode?.(SOVEREIGN_NODE_STATE_V0.EVENT_PLANE_READONLY);

      try {
        const { registerSatelliteNodeFromOnboardingV0 } = await import(
          "./satelliteNodeRegistryV0.js"
        );
        const { buildNonExecutiveTopologyMapV0 } = await import(
          "./nonExecutiveTopologyMapV0.js"
        );
        registerSatelliteNodeFromOnboardingV0(node);
        buildNonExecutiveTopologyMapV0();
      } catch {
        /* registry is observation-only; must not block onboarding */
      }

      return node;
    },
    teardown: () => {
      unwired();
      stopSimWireV0?.();
      stopSimWireV0 = null;
    }
  };
}

export function resetSovereignNodeWizardStateV0() {
  ephemeralAnchorV0 = null;
  nodePreviewV0 = null;
  currentStepV0 = SOVEREIGN_ONBOARDING_STEP_V0.WORLD_ENTRY;
  stopSimWireV0?.();
  stopSimWireV0 = null;
}
