/**
 * Rhizoh Arena Router v0 — UGL event → domain resolve → adapter selection.
 * RESEARCH-ONLY — cross-domain routing (not chessGameRouterV0 cluster router).
 * @see docs/RHIZOH_ARENA_ROUTER_V0.md
 */

import {
  DOMAIN_COVERAGE_V0,
  getDomainFabricSnapshotV0,
  resolveDomainDescriptorV0
} from "./rhizohDomainFabricV0.js";
import { getChessUglAdapterV0 } from "./rhizohUglChessAdapterV0.js";
import { getSportsUglAdapterV0 } from "./rhizohUglSportsAdapterV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_ARENA_ROUTER_SCHEMA_V0 = "castle.rhizoh.arena_router.v0";

/** @type {object[]} */
const routeLogV0 = [];

/**
 * @param {string} adapterId
 */
function selectAdapterByIdV0(adapterId) {
  switch (adapterId) {
    case "rhizohUglChessAdapterV0":
      return getChessUglAdapterV0();
    case "rhizohUglSportsAdapterV0":
      return getSportsUglAdapterV0();
    default:
      return null;
  }
}

/**
 * @param {object} uglEvent
 */
export function routeUglEventV0(uglEvent) {
  const gameType =
    uglEvent?.meta?.gameType || uglEvent?.s?.meta?.gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS;
  const descriptor = resolveDomainDescriptorV0(gameType);
  const routable = descriptor.coverage === DOMAIN_COVERAGE_V0.FULL_ACTIVE;
  const adapter = routable && descriptor.adapterId ? selectAdapterByIdV0(descriptor.adapterId) : null;

  const route = Object.freeze({
    schema: RHIZOH_ARENA_ROUTER_SCHEMA_V0,
    gameType: descriptor.gameType,
    domainId: descriptor.domainId,
    adapterId: descriptor.adapterId,
    coverage: descriptor.coverage,
    routable,
    executionClass: routable ? "read_only" : "suggest",
    adapter: adapter
      ? Object.freeze({
          schema: adapter.schema,
          gameType: adapter.gameType,
          rulesetId: adapter.rulesetId
        })
      : null,
    causalChainId: uglEvent?.meta?.causalChainId,
    interpretationOnly: true,
    nonExecutive: true
  });

  routeLogV0.unshift(route);
  if (routeLogV0.length > 64) routeLogV0.length = 64;

  return route;
}

/**
 * @param {string} gameType
 */
export function resolveArenaForGameTypeV0(gameType) {
  const descriptor = resolveDomainDescriptorV0(gameType);
  const adapter =
    descriptor.coverage === DOMAIN_COVERAGE_V0.FULL_ACTIVE && descriptor.adapterId
      ? selectAdapterByIdV0(descriptor.adapterId)
      : descriptor.adapterId
        ? selectAdapterByIdV0(descriptor.adapterId)
        : null;

  return Object.freeze({
    schema: RHIZOH_ARENA_ROUTER_SCHEMA_V0,
    descriptor,
    adapter,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getArenaRouterSnapshotV0() {
  const fabric = getDomainFabricSnapshotV0();
  return Object.freeze({
    schema: RHIZOH_ARENA_ROUTER_SCHEMA_V0,
    fabric,
    recentRoutes: Object.freeze(routeLogV0.slice(0, 16)),
    chessClusterRouterNote: "chessGameRouterV0 is chess-only 8-slot engine router — not this module",
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** Test only. */
export function clearArenaRouterLogForTestV0() {
  routeLogV0.length = 0;
}
