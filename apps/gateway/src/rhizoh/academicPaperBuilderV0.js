/**
 * Deterministic academic paper document from AOL export (no LLM).
 * @see docs/RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md
 */

import { ACADEMIC_OBSERVATION_CONTRACT_V0 } from "./academicObservationExportV0.js";

/**
 * @param {unknown} text
 * @param {number} max
 */
function excerpt(text, max = 240) {
  const s = String(text ?? "").trim().replace(/\s+/g, " ");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * @param {Record<string, unknown>} exp
 */
export function buildAcademicPaperDocumentV0(exp) {
  const thread_id = String(exp?.session_ref?.thread_id || "").trim();
  const trace_id = String(exp?.session_ref?.trace_id || "").trim();
  const turns = Array.isArray(exp?.life_continuity?.turns_sample)
    ? exp.life_continuity.turns_sample
    : [];
  const nodes = Array.isArray(exp?.entity_graph?.nodes) ? exp.entity_graph.nodes : [];
  const edges = Array.isArray(exp?.entity_graph?.edges) ? exp.entity_graph.edges : [];
  const edgesCreated = Array.isArray(exp?.resolver_trace?.edges_created)
    ? exp.resolver_trace.edges_created
    : [];

  const userTurns = turns.filter((t) => String(t?.role) === "user");
  const castleNode = nodes.find((n) => String(n?.entity_kind) === "castle");

  /** @type {string[]} */
  const abstract = [
    thread_id
      ? `Thread ${thread_id} — ${turns.length} turn(s) in observation sample.`
      : `Observation sample with ${turns.length} turn(s).`,
    trace_id ? `Gateway trace: ${trace_id}.` : "No trace id bound.",
    castleNode
      ? `Castle entity: ${String(castleNode.label || castleNode.entity_id)}.`
      : "No castle node in graph snapshot.",
    edgesCreated.length
      ? `Resolver edges: ${edgesCreated.join(", ")}.`
      : "Resolver produced no edges in this context (or resolver off)."
  ];

  /** @type {{ kind: string, detail: string, turn_id?: string }[]} */
  const observations = [];
  for (const turn of turns) {
    observations.push({
      kind: `turn_${String(turn?.role || "unknown")}`,
      turn_id: String(turn?.turn_id || ""),
      detail: excerpt(turn?.text, 320)
    });
  }
  if (nodes.length) {
    observations.push({
      kind: "graph_nodes",
      detail: `${nodes.length} node(s), ${edges.length} edge(s) in user scope.`
    });
  }

  const entity_mentions = nodes.map((n) =>
    Object.freeze({
      entity_id: String(n?.entity_id || ""),
      entity_kind: String(n?.entity_kind || ""),
      label: String(n?.label || "")
    })
  );

  const turn_citations = turns.map((t) =>
    Object.freeze({
      turn_id: String(t?.turn_id || ""),
      role: String(t?.role || ""),
      at: String(t?.at || ""),
      excerpt: excerpt(t?.text, 200)
    })
  );

  const title = castleNode
    ? `Rhizoh observation — ${String(castleNode.label || thread_id || "session")}`
    : thread_id
      ? `Rhizoh observation — ${thread_id}`
      : "Rhizoh observation — session";

  return Object.freeze({
    contract_version: ACADEMIC_OBSERVATION_CONTRACT_V0,
    paper_schema: "academic-paper-document-v0",
    title,
    thread_id: thread_id || null,
    trace_id: trace_id || null,
    abstract,
    observations,
    entity_mentions,
    turn_citations
  });
}
