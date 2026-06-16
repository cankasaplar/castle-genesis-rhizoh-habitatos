/**
 * Semantic event folding — compress high-volume spawn streams into behavior patterns.
 */

import { normalizeCodexEventTypeV0 } from "./codexReducerV0.js";

export const RHIZOH_SEMANTIC_FOLD_SCHEMA_V0 = "castle.rhizoh.semantic_fold.v0";

/**
 * @param {object[]} events
 */
export function foldSpawnEventsIntoPatternsV0(events) {
  const list = Array.isArray(events) ? events : [];
  /** @type {Map<string, { routeKey: string, origin: string, destination: string, count: number, kinds: Map<string, number>, firstSeq: number, lastSeq: number }>} */
  const routes = new Map();

  for (const event of list) {
    const type = normalizeCodexEventTypeV0(event?.type);
    if (type !== "GHOST_DISPATCH") continue;
    const p = event?.payload || {};
    const origin = String(p.origin || p.src || "");
    const destination = String(p.destination || p.dst || "");
    const kind = String(p.type || p.kind || "mirror");
    const routeKey = `${origin}→${destination}`;
    const row = routes.get(routeKey) || {
      routeKey,
      origin,
      destination,
      count: 0,
      kinds: new Map(),
      firstSeq: Number(event.seq) || 0,
      lastSeq: Number(event.seq) || 0
    };
    row.count += 1;
    row.kinds.set(kind, (row.kinds.get(kind) || 0) + 1);
    row.lastSeq = Number(event.seq) || row.lastSeq;
    routes.set(routeKey, row);
  }

  const patterns = [...routes.values()].map((row) => {
    let dominantKind = "mirror";
    let maxKind = 0;
    for (const [kind, n] of row.kinds) {
      if (n > maxKind) {
        maxKind = n;
        dominantKind = kind;
      }
    }
    return Object.freeze({
      schema: RHIZOH_SEMANTIC_FOLD_SCHEMA_V0,
      routeKey: row.routeKey,
      origin: row.origin,
      destination: row.destination,
      spawnCount: row.count,
      dominantKind,
      firstSeq: row.firstSeq,
      lastSeq: row.lastSeq
    });
  });

  return Object.freeze({
    schema: RHIZOH_SEMANTIC_FOLD_SCHEMA_V0,
    patternCount: patterns.length,
    totalSpawns: patterns.reduce((sum, p) => sum + p.spawnCount, 0),
    patterns: Object.freeze(patterns)
  });
}

/**
 * @param {object[]} events
 * @param {object} [codexState]
 */
export function attachFoldedPatternsToCodexStateV0(codexState, events) {
  const base = codexState && typeof codexState === "object" ? codexState : {};
  const folded = foldSpawnEventsIntoPatternsV0(events);
  return Object.freeze({
    ...base,
    behaviorPatterns: folded.patterns
  });
}
