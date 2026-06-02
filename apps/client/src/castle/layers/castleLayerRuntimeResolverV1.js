/**
 * Castle Layer Registry + Runtime Resolver v1 — voice/UI domain binding contract.
 * Code = interpreter; CASTLE_LAYERS behavior graph = runtime truth.
 */

import {
  CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
  CASTLE_LAYER_SCOPE_UNKNOWN_POLICY_V1,
  mapCastleVoiceEventTagToLayerV1
} from "./castleLayerBehaviorGraphV1.js";
import { CASTLE_LAYER_REGISTRY_SCHEMA_V1 } from "./castleLayerRegistryV1.js";
import {
  isVoiceUiDomainScopeMatchV0,
  resolveRhizohVoiceUiDomainV0,
  VOICE_UI_DOMAIN_V0
} from "../../rhizoh/runtime/rhizohVoiceUiDomainV0.js";

export const CASTLE_LAYER_RUNTIME_RESOLVER_SCHEMA_V1 = "castle.layer_runtime_resolver.v1";

/**
 * @param {{
 *   eventTag?: string,
 *   uiDomain?: string,
 *   scope?: string,
 *   intentClass?: string,
 *   executionAccepted?: boolean,
 *   activeUiDomain?: string
 * }} [input]
 */
export function resolveCastleLayerVoiceContextV1(input = {}) {
  const activeUiDomain = String(input.activeUiDomain || resolveRhizohVoiceUiDomainV0()).trim();
  const eventDomain = String(
    input.uiDomain || input.scope || activeUiDomain || VOICE_UI_DOMAIN_V0.RUNTIME_ONLY
  ).trim();
  const layer = mapCastleVoiceEventTagToLayerV1(input.eventTag || "");
  const scopeMatch = isVoiceUiDomainScopeMatchV0(eventDomain, activeUiDomain);
  const intentClass = String(input.intentClass || "unknown").trim();
  const executionAccepted = input.executionAccepted !== false;
  const executionEligible = scopeMatch && executionAccepted;
  const shadowOnly = !scopeMatch || CASTLE_LAYER_SCOPE_UNKNOWN_POLICY_V1 === "shadow_only" && !scopeMatch;

  const ctx = Object.freeze({
    schema: CASTLE_LAYER_RUNTIME_RESOLVER_SCHEMA_V1,
    registrySchema: CASTLE_LAYER_REGISTRY_SCHEMA_V1,
    graphVersion: CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
    layer,
    uiDomain: eventDomain,
    activeUiDomain,
    scopeMatch,
    intentClass,
    executionEligible,
    shadowOnly,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_LAYERS_RUNTIME__ = Object.freeze({
      graphVersion: CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1,
      activeUiDomain,
      lastVoiceContext: ctx
    });
  }

  return ctx;
}

/**
 * UI / dispatch gate — unknown or cross-domain events must not mutate active shell state.
 * @param {ReturnType<typeof resolveCastleLayerVoiceContextV1>} ctx
 */
export function shouldDropVoiceExecutionForScopeV1(ctx) {
  return ctx?.shadowOnly === true || ctx?.executionEligible !== true;
}
