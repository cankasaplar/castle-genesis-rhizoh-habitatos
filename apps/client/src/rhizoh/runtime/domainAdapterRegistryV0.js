/**
 * Domain adapter registry — bridge layer between isolated domain runtimes.
 * Missing adapters resolve to null (idle) adapters — no console warnings.
 */

import { routeCesiumCommandV0 } from "../../castleFlight/cesiumCommandRouterV0.js";
import { getCastleWorldDataStateV2 } from "../../castleFlight/castleWorldDataProviderV2.js";
import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";
import { RHIZOH_DOMAIN_ID_V0, setRhizohDomainAdaptersReadyV0 } from "./rhizohDomainCoreStoreV0.js";
import {
  RHIZOH_DOMAIN_CAPABILITY_V0,
  DOMAIN_ZONE_REQUIRED_CAPABILITIES_V0
} from "./rhizohDomainCapabilitySpecV0.js";
import { registerDomainZoneAdaptersV0 } from "./rhizohDomainZoneAdaptersV0.js";

export { RHIZOH_DOMAIN_CAPABILITY_V0 };

export const RHIZOH_DOMAIN_ADAPTER_SCHEMA_V0 = "rhizoh.domain.adapter.registry.v0";
export const RHIZOH_DOMAIN_ADAPTER_EVENT_V0 = "rhizoh:domain-adapter-v0";

/** @type {Map<string, Map<string, object>>} */
const registry = new Map();

/** @type {Set<(snap: ReturnType<typeof getDomainAdapterRegistrySnapshotV0>) => void>} */
const listeners = new Set();

const NULL_ADAPTER_V0 = Object.freeze({
  id: "null",
  domain: "*",
  capability: "*",
  ready: true,
  kind: "idle",
  invoke() {
    return Object.freeze({ ok: false, reason: "null_adapter", deferred: true });
  }
});

function emit(snap) {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.__RHIZOH_DOMAIN_ADAPTERS__ = snap;
    window.dispatchEvent(new CustomEvent(RHIZOH_DOMAIN_ADAPTER_EVENT_V0, { detail: snap }));
  }
}

/**
 * @returns {{ schema: string, domains: string[], hydrated: boolean }}
 */
export function getDomainAdapterRegistrySnapshotV0() {
  const domains = [...registry.keys()];
  return Object.freeze({
    schema: RHIZOH_DOMAIN_ADAPTER_SCHEMA_V0,
    domains,
    hydrated: domains.length > 0
  });
}

/**
 * @param {(snap: ReturnType<typeof getDomainAdapterRegistrySnapshotV0>) => void} listener
 * @returns {() => void}
 */
export function subscribeDomainAdapterRegistryV0(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * @param {string} domain
 * @param {string} capability
 * @param {object} adapter
 */
export function registerDomainAdapterV0(domain, capability, adapter) {
  const d = String(domain || "").trim();
  const c = String(capability || "").trim();
  if (!d || !c || !adapter) return NULL_ADAPTER_V0;
  if (!registry.has(d)) registry.set(d, new Map());
  const row = Object.freeze({
    id: String(adapter.id || `${d}:${c}`),
    domain: d,
    capability: c,
    ready: adapter.ready !== false,
    kind: adapter.kind || "live",
    invoke: typeof adapter.invoke === "function" ? adapter.invoke.bind(adapter) : NULL_ADAPTER_V0.invoke
  });
  registry.get(d).set(c, row);
  const snap = getDomainAdapterRegistrySnapshotV0();
  emit(snap);
  setRhizohDomainAdaptersReadyV0(true);
  return row;
}

/**
 * @param {string} domain
 * @param {string} capability
 * @returns {typeof NULL_ADAPTER_V0}
 */
export function resolveDomainAdapterV0(domain, capability) {
  const d = String(domain || "").trim();
  const c = String(capability || "").trim();
  const hit = registry.get(d)?.get(c);
  return hit || NULL_ADAPTER_V0;
}

function createSpatialAdapter(domain) {
  return Object.freeze({
    id: `${domain}:spatial`,
    ready: true,
    kind: "spatial_live",
    invoke(request = {}) {
      const op = String(request.op || "").trim();
      if (!op) {
        const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
        if (!cesium) {
          return Object.freeze({ ok: false, reason: "cesium_not_ready", deferred: true });
        }
        return Object.freeze({ ok: true, reason: "cesium_ready" });
      }
      const result = routeCesiumCommandV0({
        op,
        source: request.source || `domain:${domain}`,
        lat: request.lat,
        lon: request.lon,
        lng: request.lng,
        height: request.height,
        canonical: request.canonical
      });
      return Object.freeze({ ok: result.ok !== false, ...result });
    }
  });
}

function createVoiceAdapter(domain) {
  return Object.freeze({
    id: `${domain}:voice`,
    ready: true,
    kind: "voice_live",
    invoke() {
      const snap = getVoiceAdapterRegistrySnapshot();
      return Object.freeze({
        ok: snap.hydrated && !snap.fallbackMode,
        hydrated: snap.hydrated,
        fallbackMode: snap.fallbackMode,
        sttProvider: snap.sttProvider,
        sttStatus: snap.sttStatus
      });
    }
  });
}

function createSocialAdapter(domain) {
  return Object.freeze({
    id: `${domain}:social`,
    ready: true,
    kind: "social_live",
    invoke(request = {}) {
      const action = String(request.action || "noop");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rhizoh:social-action-v0", {
            detail: Object.freeze({ domain, action, ...request, atMs: Date.now() })
          })
        );
      }
      return Object.freeze({ ok: true, action, domain });
    }
  });
}

function createMapDataAdapter() {
  return Object.freeze({
    id: "world:map_data",
    ready: true,
    kind: "map_data_live",
    invoke() {
      const state = getCastleWorldDataStateV2();
      return Object.freeze({
        ok: true,
        feed: state.feed,
        poiCount: state.poiCount,
        buildingCount: state.buildingCount,
        lastRefreshMs: state.lastRefreshMs ?? null
      });
    }
  });
}

function createTensorAdapter(domain) {
  return Object.freeze({
    id: `${domain}:tensor`,
    ready: true,
    kind: "tensor_bound",
    invoke(request = {}) {
      return Object.freeze({
        ok: true,
        domain,
        intent: request.intent ?? null,
        action: request.action ?? null
      });
    }
  });
}

/** @type {Set<string>} */
const bootstrappedDomains = new Set();

/**
 * Lazy domain bootstrap — adapters register when domain opens, not at app boot.
 * @param {string} domainId
 */
export function bootstrapDomainAdaptersV0(domainId) {
  const domain = String(domainId || RHIZOH_DOMAIN_ID_V0.T0).trim();
  if (bootstrappedDomains.has(domain)) {
    return getDomainAdapterRegistrySnapshotV0();
  }
  bootstrappedDomains.add(domain);

  if (
    domain === RHIZOH_DOMAIN_ID_V0.CASTLE ||
    domain === RHIZOH_DOMAIN_ID_V0.STUDIO ||
    domain === RHIZOH_DOMAIN_ID_V0.OBSERVER
  ) {
    registerDomainZoneAdaptersV0(domain, registerDomainAdapterV0);
    registerDomainAdapterV0(domain, RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR, createTensorAdapter(domain));
    return getDomainAdapterRegistrySnapshotV0();
  }

  const caps = DOMAIN_ZONE_REQUIRED_CAPABILITIES_V0[domain] || [];
  for (const cap of caps) {
    if (cap === RHIZOH_DOMAIN_CAPABILITY_V0.SPATIAL) {
      registerDomainAdapterV0(domain, cap, createSpatialAdapter(domain));
    } else if (cap === RHIZOH_DOMAIN_CAPABILITY_V0.VOICE) {
      registerDomainAdapterV0(domain, cap, createVoiceAdapter(domain));
    } else if (cap === RHIZOH_DOMAIN_CAPABILITY_V0.SOCIAL) {
      registerDomainAdapterV0(domain, cap, createSocialAdapter(domain));
    } else if (cap === RHIZOH_DOMAIN_CAPABILITY_V0.MAP_DATA) {
      registerDomainAdapterV0(domain, cap, createMapDataAdapter());
    } else if (cap === RHIZOH_DOMAIN_CAPABILITY_V0.TENSOR) {
      registerDomainAdapterV0(domain, cap, createTensorAdapter(domain));
    }
  }

  return getDomainAdapterRegistrySnapshotV0();
}

/** @internal vitest */
export function __resetDomainAdapterRegistryForTestV0() {
  registry.clear();
  bootstrappedDomains.clear();
  listeners.clear();
}
