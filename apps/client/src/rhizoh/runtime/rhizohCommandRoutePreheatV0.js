/**
 * Pre-warm command routing — registry index + state hydrate (latency < 25ms target).
 */

import { buildCommandExecutionGraphCatalogV0 } from "./rhizohCommandExecutionGraphV0.js";
import { hydrateCommandStateMachineV0 } from "./rhizohCommandStateMachineV0.js";
import {
  buildLocalCommandAliasIndexV0,
  RHIZOH_LOCAL_COMMAND_REGISTRY_V0
} from "./rhizohLocalCommandRegistryV0.js";
import { normalizeVoiceCommandTokenV0 } from "./rhizohVoiceCommandRouterV0.js";

let preheated = false;
/** @type {Map<string, string> | null} */
let cachedAliasIndex = null;

export const RHIZOH_COMMAND_ROUTE_PREHEAT_SCHEMA_V0 = "castle.command_route_preheat.v0";

export function prewarmCommandRoutingV0() {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  hydrateCommandStateMachineV0();
  cachedAliasIndex = buildLocalCommandAliasIndexV0(normalizeVoiceCommandTokenV0);
  const registrySize = Object.keys(RHIZOH_LOCAL_COMMAND_REGISTRY_V0).length;
  const aliasSize = cachedAliasIndex.size;
  preheated = true;
  const latencyMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  const graphCatalog = buildCommandExecutionGraphCatalogV0();
  const snap = Object.freeze({
    schema: RHIZOH_COMMAND_ROUTE_PREHEAT_SCHEMA_V0,
    preheated: true,
    registrySize,
    aliasSize,
    graphCatalogSize: graphCatalog.length,
    latencyMs,
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_COMMAND_ROUTE_PREHEAT__ = snap;
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.commandRoutePreheated = true;
  }
  return snap;
}

export function isCommandRoutingPreheatedV0() {
  return preheated;
}

export function readPreheatedAliasIndexV0() {
  if (!cachedAliasIndex) {
    prewarmCommandRoutingV0();
  }
  return cachedAliasIndex;
}

/** @internal vitest */
export function __resetCommandRoutePreheatForTestV0() {
  preheated = false;
  cachedAliasIndex = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_COMMAND_ROUTE_PREHEAT__;
    } catch {
      /* noop */
    }
  }
}
