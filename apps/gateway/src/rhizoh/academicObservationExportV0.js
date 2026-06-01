/**
 * Academic Observatory Layer (AOL) v0 — read-only observation export.
 * @see docs/RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md
 * @see docs/schemas/academic-observation-export-v0.schema.json
 * SPECFLOW: RESEARCH-ONLY — does not write execution core / WAL.
 */

import { LIFE_CONTINUITY_CONTRACT_V0, getLifeContinuityStoreV0 } from "./lifeContinuityStoreV0.js";
import { LIFE_ENTITY_CONTRACT_V0, getLifeEntityGraphV0 } from "./lifeEntityGraphV0.js";
import {
  extractEntityHintsFromPayloadV0,
  RESOLVER_MODE_V0
} from "./lifeContinuityResolverV0.js";
import {
  isLifeContinuityAppendEnabledV0,
  isLifeContinuityRecallAttachEnabledV0
} from "./lifeContinuityGatewayHookV0.js";
import { isLifeEntityResolverEnabledV0 } from "./lifeContinuityResolverV0.js";
import { isProjectionActivationEnabledV0, PAL_VERSION_V0 } from "./projectionActivationLayerV0.js";

export const ACADEMIC_OBSERVATION_CONTRACT_V0 = "academic-observation-export-v0";
export const ACADEMIC_OBSERVATORY_EXPORT_ROUTE_V0 = "/rhizoh/academic/observatory/export";

export function isAcademicObservatoryEnabledV0() {
  return String(process.env.CASTLE_ACADEMIC_OBSERVATORY || "").trim() === "1";
}

/** Full export on every /rhizoh/llm response — default off (use GET export). */
export function isAcademicObservatoryInlineOnTurnV0() {
  return (
    isAcademicObservatoryEnabledV0() &&
    String(process.env.CASTLE_ACADEMIC_OBSERVATORY_INLINE || "").trim() === "1"
  );
}

function isoNow() {
  return new Date().toISOString();
}

function readReproducibilitySnapshotV0() {
  return Object.freeze({
    life_continuity_contract: LIFE_CONTINUITY_CONTRACT_V0,
    life_entity_contract: LIFE_ENTITY_CONTRACT_V0,
    resolver_mode: RESOLVER_MODE_V0,
    pal_version: PAL_VERSION_V0,
    recall_mode: isLifeContinuityRecallAttachEnabledV0()
      ? "deterministic_token_match_v0"
      : "off",
    env_snapshot: Object.freeze({
      CASTLE_LIFE_CONTINUITY_APPEND: process.env.CASTLE_LIFE_CONTINUITY_APPEND || "",
      CASTLE_LIFE_ENTITY_RESOLVER: process.env.CASTLE_LIFE_ENTITY_RESOLVER || "",
      CASTLE_PROJECTION_ACTIVATION: process.env.CASTLE_PROJECTION_ACTIVATION || "",
      CASTLE_LIFE_CONTINUITY_RECALL: process.env.CASTLE_LIFE_CONTINUITY_RECALL || "",
      CASTLE_ACADEMIC_OBSERVATORY: "1"
    })
  });
}

/**
 * @param {Record<string, unknown>} exp
 */
export function buildPaperBlocksFromExportV0(exp) {
  const threadId = String(exp?.session_ref?.thread_id || "—");
  const traceId = String(exp?.session_ref?.trace_id || "—");
  const turnCount = Array.isArray(exp?.life_continuity?.turns_sample)
    ? exp.life_continuity.turns_sample.length
    : 0;
  const nodeCount = Array.isArray(exp?.entity_graph?.nodes) ? exp.entity_graph.nodes.length : 0;
  const edgeCount = Array.isArray(exp?.entity_graph?.edges) ? exp.entity_graph.edges.length : 0;
  const edgesCreated = Array.isArray(exp?.resolver_trace?.edges_created)
    ? exp.resolver_trace.edges_created.join(", ")
    : "—";

  return Object.freeze({
    methods: [
      "Rhizoh Academic Observatory v0 export (read-only).",
      `Contracts: L1=${exp?.reproducibility?.life_continuity_contract}, L2=${exp?.reproducibility?.life_entity_contract}.`,
      `Resolver: ${exp?.reproducibility?.resolver_mode}; PAL: ${exp?.reproducibility?.pal_version}.`
    ].join("\n"),
    observation_summary: [
      `Session thread=${threadId}, trace=${traceId}.`,
      `Turn sample (n=${turnCount}), entity graph nodes=${nodeCount}, edges=${edgeCount}.`,
      `Resolver edges this context: ${edgesCreated}.`
    ].join("\n"),
    reproducibility_note: [
      "Replay requires matching env_snapshot and in-memory store state (process-local until L1 persist).",
      `Exported at ${exp?.exported_at || isoNow()}.`
    ].join("\n")
  });
}

/**
 * Full session paper (markdown) — habitat / `scripts/export-academic-paper-v0.mjs`.
 * @param {Record<string, unknown>} exp
 * @param {ReturnType<typeof buildPaperBlocksFromExportV0>} [paperBlocks]
 */
export function formatAcademicPaperMarkdownV0(exp, paperBlocks) {
  const blocks = paperBlocks || buildPaperBlocksFromExportV0(exp);
  const title = `Rhizoh observation — ${String(exp?.session_ref?.thread_id || exp?.user_id || "session")}`;
  const appendix = [
    "## Appendix — reproducibility",
    "",
    "```json",
    JSON.stringify(exp?.reproducibility ?? {}, null, 2),
    "```",
    "",
    "## Appendix — env snapshot",
    "",
    "```json",
    JSON.stringify(
      exp?.reproducibility?.env_snapshot && typeof exp.reproducibility.env_snapshot === "object"
        ? exp.reproducibility.env_snapshot
        : {},
      null,
      2
    ),
    "```"
  ].join("\n");

  return [
    `# ${title}`,
    "",
    `**Contract:** ${String(exp?.contract_version || ACADEMIC_OBSERVATION_CONTRACT_V0)}`,
    `**Exported:** ${String(exp?.exported_at || "—")}`,
    `**User:** ${String(exp?.user_id || "—")}`,
    "",
    "## Methods",
    "",
    blocks.methods,
    "",
    "## Observation summary",
    "",
    blocks.observation_summary,
    "",
    "## Reproducibility",
    "",
    blocks.reproducibility_note,
    "",
    appendix
  ].join("\n");
}

/**
 * Assemble academic observation envelope for a user/session.
 * @param {{
 *   user_id: string,
 *   thread_id?: string,
 *   trace_id?: string,
 *   cohort_mode?: string,
 *   safePayload?: Record<string, unknown>,
 *   gatewayResult?: Record<string, unknown>,
 *   store?: import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0,
 *   graph?: import('./lifeEntityGraphV0.js').LifeEntityGraphV0
 * }} input
 */
export function buildAcademicObservationExportV0(input) {
  const user_id = String(input.user_id || "").trim();
  if (user_id.length < 8) return { ok: false, code: "invalid_user_id" };

  const store = input.store || getLifeContinuityStoreV0();
  const graph = input.graph || getLifeEntityGraphV0();
  const thread_id = String(input.thread_id || "").trim();
  const trace_id = String(input.trace_id || "").trim();

  const threadList = store.listThreadsForUser(user_id, { limit: 32 });
  /** @type {Record<string, unknown>[]} */
  let turns_sample = [];
  if (thread_id) {
    const recent = store.getRecentTurns(thread_id, { user_id, limit: 24 });
    if (recent.ok) turns_sample = recent.turns;
  }

  const nodeRows = graph.listNodesForUser(user_id);
  const edgeRows = graph.listEdgesForUser(user_id);

  const hints =
    input.safePayload && typeof input.safePayload === "object"
      ? extractEntityHintsFromPayloadV0(input.safePayload)
      : Object.freeze({});

  const gr = input.gatewayResult && typeof input.gatewayResult === "object" ? input.gatewayResult : {};
  const resolverSlice = gr.lifeEntityResolver;
  const projectionSlice = gr.lifeEntityProjection;
  const recallSlice = gr.lifeContinuityRecall;

  /** @type {unknown[]} */
  const castle_reveal = [];
  if (projectionSlice && typeof projectionSlice === "object") {
    const pins = /** @type {Record<string, unknown>} */ (projectionSlice).map_pin;
    if (pins) castle_reveal.push({ kind: "map_pin", value: pins });
    const strip = /** @type {Record<string, unknown>} */ (projectionSlice).continuity_strip;
    if (strip) castle_reveal.push({ kind: "continuity_strip", value: strip });
  }

  const exportEnvelope = Object.freeze({
    contract_version: ACADEMIC_OBSERVATION_CONTRACT_V0,
    exported_at: isoNow(),
    user_id,
    session_ref: Object.freeze({
      trace_id: trace_id || undefined,
      thread_id: thread_id || undefined,
      cohort_mode: input.cohort_mode || undefined
    }),
    reproducibility: readReproducibilitySnapshotV0(),
    life_continuity: Object.freeze({
      threads: threadList.ok ? threadList.threads : [],
      turns_sample,
      recall_last: recallSlice || undefined
    }),
    entity_graph: Object.freeze({
      nodes: nodeRows.ok ? nodeRows.nodes : [],
      edges: edgeRows.ok ? edgeRows.edges : [],
      castle_reveal
    }),
    resolver_trace: Object.freeze({
      hints_extracted: hints,
      edges_created:
        resolverSlice &&
        typeof resolverSlice === "object" &&
        Array.isArray(/** @type {Record<string, unknown>} */ (resolverSlice).edges_created)
          ? /** @type {Record<string, unknown>} */ (resolverSlice).edges_created
          : [],
      projection_activation: projectionSlice ? [projectionSlice] : [],
      resolver_enabled: isLifeEntityResolverEnabledV0(),
      append_enabled: isLifeContinuityAppendEnabledV0(),
      pal_enabled: isProjectionActivationEnabledV0()
    }),
    gateway_turn: Object.freeze({
      lifeContinuity: gr.lifeContinuity || undefined,
      lifeEntityProjection: projectionSlice || undefined,
      lifeEntityResolver: resolverSlice || undefined,
      traceId: trace_id || undefined
    })
  });

  const paper_blocks = buildPaperBlocksFromExportV0(exportEnvelope);

  return Object.freeze({
    ok: true,
    export: exportEnvelope,
    paper_blocks
  });
}

/**
 * After gateway turn — attach pointer or inline export (never mutates stores).
 * @param {{
 *   auth: { ok: boolean, uid?: string },
 *   safePayload: Record<string, unknown>,
 *   result: Record<string, unknown>,
 *   traceId: string,
 *   lifeAppend?: Record<string, unknown>
 * }} input
 */
export function attachAcademicObservatoryAfterGatewayTurnV0(input) {
  if (!isAcademicObservatoryEnabledV0()) {
    return { ok: true, skipped: true, reason: "observatory_disabled" };
  }
  const { auth, safePayload, result, traceId, lifeAppend } = input;
  if (!auth?.ok || !auth.uid) {
    return { ok: true, skipped: true, reason: "anon" };
  }

  const thread_id = String(
    lifeAppend?.thread_id ||
      (result?.lifeContinuity &&
      typeof result.lifeContinuity === "object" &&
      /** @type {Record<string, unknown>} */ (result.lifeContinuity).thread_id) ||
      ""
  ).trim();

  if (isAcademicObservatoryInlineOnTurnV0()) {
    const built = buildAcademicObservationExportV0({
      user_id: auth.uid,
      thread_id: thread_id || undefined,
      trace_id: traceId,
      safePayload,
      gatewayResult: result
    });
    if (!built.ok) return built;
    Object.assign(result, {
      academicObservatory: Object.freeze({
        contract_version: ACADEMIC_OBSERVATION_CONTRACT_V0,
        inline: true,
        export: built.export,
        paper_blocks: built.paper_blocks
      })
    });
    return { ok: true, attached: "inline" };
  }

  Object.assign(result, {
    academicObservatory: Object.freeze({
      contract_version: ACADEMIC_OBSERVATION_CONTRACT_V0,
      ok: true,
      thread_id: thread_id || undefined,
      trace_id: traceId,
      export_path: ACADEMIC_OBSERVATORY_EXPORT_ROUTE_V0
    })
  });
  return { ok: true, attached: "pointer" };
}
