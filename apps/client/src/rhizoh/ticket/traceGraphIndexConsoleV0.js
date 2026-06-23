/**
 * Trace Graph Index console mount — causal ticket mesh DevTools facade.
 * interpretationOnly · nonExecutive · observation ≠ execution
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md
 */

import { listMutationRecordsV0 } from "./mutationRecordEmitterV0.js";
import { runTicketMemoryPipelineV0 } from "./ticketMemoryPipelineV0.js";
import {
  TRACE_GRAPH_INDEX_SCHEMA_V0,
  extractDriftSignalsV0,
  getLiveIndexSnapshotV0,
  getTraceGraphIndexSnapshotV0,
  ingestMutationRecordForIndexV0,
  listCausalResiduesV0,
  optimizeTraceGraphIndexV0
} from "./traceGraphIndexOptimizerV0.js";

export const TRACE_GRAPH_INDEX_CONSOLE_SCHEMA_V0 = "castle.rhizoh.trace_graph_index_console.v0";

let mountedV0 = false;
let bootstrappedV0 = false;

function bootstrapTraceGraphFromLedgerV0(limit = 200) {
  if (bootstrappedV0) return 0;
  bootstrappedV0 = true;
  const records = listMutationRecordsV0(limit);
  for (const record of records) ingestMutationRecordForIndexV0(record);
  return records.length;
}

/**
 * Idempotent — mounts window.__rhizoh.traceGraphIndex for full system report + DevTools.
 */
export function mountTraceGraphIndexConsoleV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ ok: false, reason: "no_window" });
  }

  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.traceGraphIndex?.schema === TRACE_GRAPH_INDEX_CONSOLE_SCHEMA_V0) {
    return Object.freeze({
      ok: true,
      mounted: true,
      schema: TRACE_GRAPH_INDEX_CONSOLE_SCHEMA_V0,
      bootstrappedRecords: bootstrapTraceGraphFromLedgerV0()
    });
  }

  const bootstrappedRecords = bootstrapTraceGraphFromLedgerV0();

  window.__rhizoh.traceGraphIndex = Object.freeze({
    schema: TRACE_GRAPH_INDEX_CONSOLE_SCHEMA_V0,
    snapshot: getLiveIndexSnapshotV0,
    getSnapshot: getLiveIndexSnapshotV0,
    getTraceGraphIndexSnapshotV0,
    ingest: ingestMutationRecordForIndexV0,
    optimize: optimizeTraceGraphIndexV0,
    extractDrift: extractDriftSignalsV0,
    runPipeline: runTicketMemoryPipelineV0,
    listResidues: listCausalResiduesV0,
    bootstrapFromLedger: (limit = 200) => {
      bootstrappedV0 = false;
      return bootstrapTraceGraphFromLedgerV0(limit);
    },
    consoleHint: "window.__rhizoh.traceGraphIndex.snapshot()",
    interpretationOnly: true,
    nonExecutive: true
  });

  if (!mountedV0) {
    mountedV0 = true;
    window.__CASTLE_BOOT_LOG__?.ok?.(
      "boot.trace_graph_index",
      `ticket mesh · bootstrapped=${bootstrappedRecords}`
    );
  }

  return Object.freeze({
    ok: true,
    mounted: true,
    schema: TRACE_GRAPH_INDEX_SCHEMA_V0,
    bootstrappedRecords
  });
}

/** Test reset — clears mount flag only (index state cleared via clearTraceGraphIndexForTestV0). */
export function resetTraceGraphIndexConsoleForTestV0() {
  mountedV0 = false;
  bootstrappedV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.traceGraphIndex;
  }
}

export function isTraceGraphIndexConsoleMountedV0() {
  if (typeof window === "undefined") return false;
  return window.__rhizoh?.traceGraphIndex?.schema === TRACE_GRAPH_INDEX_CONSOLE_SCHEMA_V0;
}
