/**
 * Command execution graph — debuggable trace: nodes, edges, side effects.
 */

import { readLocalCommandRowV0, RHIZOH_LOCAL_COMMAND_REGISTRY_V0 } from "./rhizohLocalCommandRegistryV0.js";

export const COMMAND_EXECUTION_GRAPH_SCHEMA_V0 = "castle.command_execution_graph.v0";
export const COMMAND_EXECUTION_NODE_SCHEMA_V0 = "castle.command_execution_graph.node.v0";

const TRACE_RING_MAX = 16;
/** @type {Map<string, { traceId: string, nodes: object[], edges: object[], meta: object, atMs: number }>} */
const activeTraces = new Map();
/** @type {object[]} */
let traceRing = [];

/**
 * @param {string} canonical
 */
export function sideEffectsForCanonicalV0(canonical) {
  const row = readLocalCommandRowV0(canonical);
  if (!row) return Object.freeze([]);
  const effects = [
    `state:${canonical}`,
    `event:${row.layer}-command`,
    `handler:${row.handler}`
  ];
  return Object.freeze(effects);
}

/**
 * @param {string} traceId
 * @param {{ input?: string, source?: string }} [meta]
 */
export function beginCommandExecutionTraceV0(traceId, meta = {}) {
  const id = String(traceId || "").trim();
  if (!id) return null;
  const trace = {
    traceId: id,
    schema: COMMAND_EXECUTION_GRAPH_SCHEMA_V0,
    nodes: [],
    edges: [],
    meta: Object.freeze({ ...meta }),
    atMs: Date.now()
  };
  activeTraces.set(id, trace);
  publishExecutionGraphV0(trace);
  return trace;
}

/**
 * @param {string} traceId
 * @param {{
 *   id: string,
 *   trigger?: string,
 *   phase?: string,
 *   localAction?: boolean,
 *   llmFallback?: boolean,
 *   sideEffects?: readonly string[],
 *   edgeFrom?: string,
 *   edgeLabel?: string,
 *   meta?: object
 * }} node
 */
export function recordExecutionGraphNodeV0(traceId, node) {
  const trace = activeTraces.get(String(traceId || ""));
  if (!trace) return null;

  const nodeId = String(node.id || "");
  const frozen = Object.freeze({
    schema: COMMAND_EXECUTION_NODE_SCHEMA_V0,
    id: nodeId,
    trigger: String(node.trigger || ""),
    phase: String(node.phase || "unknown"),
    localAction: node.localAction === true,
    llmFallback: node.llmFallback === true,
    sideEffects: Object.freeze(node.sideEffects || []),
    meta: node.meta ? Object.freeze({ ...node.meta }) : null,
    atMs: Date.now()
  });

  trace.nodes.push(frozen);
  if (node.edgeFrom) {
    trace.edges.push(
      Object.freeze({
        from: String(node.edgeFrom),
        to: nodeId,
        label: String(node.edgeLabel || "next"),
        atMs: Date.now()
      })
    );
  }
  publishExecutionGraphV0(trace);
  return frozen;
}

/**
 * @param {string} traceId
 * @param {{ ok?: boolean, execution?: string, replyChars?: number }} [summary]
 */
export function finishCommandExecutionTraceV0(traceId, summary = {}) {
  const id = String(traceId || "");
  const trace = activeTraces.get(id);
  if (!trace) return null;

  const finished = Object.freeze({
    ...trace,
    nodes: Object.freeze([...trace.nodes]),
    edges: Object.freeze([...trace.edges]),
    finishedAtMs: Date.now(),
    summary: Object.freeze({ ...summary })
  });

  activeTraces.delete(id);
  traceRing = [...traceRing, finished].slice(-TRACE_RING_MAX);
  publishExecutionGraphV0(finished);
  return finished;
}

/**
 * @param {string} traceId
 */
export function readCommandExecutionGraphV0(traceId) {
  const active = activeTraces.get(String(traceId || ""));
  if (active) {
    return Object.freeze({
      ...active,
      nodes: Object.freeze([...active.nodes]),
      edges: Object.freeze([...active.edges])
    });
  }
  return traceRing.find((t) => t.traceId === traceId) || null;
}

function publishExecutionGraphV0(trace) {
  if (typeof window === "undefined") return;
  window.__CASTLE_COMMAND_EXECUTION_GRAPH__ = Object.freeze({
    active: Object.freeze(
      [...activeTraces.values()].map((t) =>
        Object.freeze({ ...t, nodes: Object.freeze([...t.nodes]), edges: Object.freeze([...t.edges]) })
      )
    ),
    last: trace.traceId === traceRing[traceRing.length - 1]?.traceId ? trace : trace,
    ring: Object.freeze([...traceRing])
  });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.commandExecutionGraph = window.__CASTLE_COMMAND_EXECUTION_GRAPH__;
}

/**
 * Catalog nodes from registry (static graph template).
 */
export function buildCommandExecutionGraphCatalogV0() {
  return Object.freeze(
    Object.entries(RHIZOH_LOCAL_COMMAND_REGISTRY_V0).map(([canonical, row]) =>
      Object.freeze({
        id: canonical,
        trigger: row.aliases[0] || canonical,
        localAction: true,
        llmFallback: false,
        sideEffects: sideEffectsForCanonicalV0(canonical)
      })
    )
  );
}

/** @internal vitest */
export function __resetCommandExecutionGraphForTestV0() {
  activeTraces.clear();
  traceRing = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_COMMAND_EXECUTION_GRAPH__;
    } catch {
      /* noop */
    }
  }
}
