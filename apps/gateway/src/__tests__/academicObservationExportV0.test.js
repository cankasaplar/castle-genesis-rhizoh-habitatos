import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createLifeContinuityStoreV0, resetLifeContinuityStoreV0 } from "../rhizoh/lifeContinuityStoreV0.js";
import { createLifeEntityGraphV0, resetLifeEntityGraphV0 } from "../rhizoh/lifeEntityGraphV0.js";
import { resolveLifeContinuityToEntityGraphV0 } from "../rhizoh/lifeContinuityResolverV0.js";
import {
  ACADEMIC_OBSERVATION_CONTRACT_V0,
  attachAcademicObservatoryAfterGatewayTurnV0,
  buildAcademicObservationExportV0,
  buildPaperBlocksFromExportV0,
  formatAcademicPaperMarkdownV0,
  isAcademicObservatoryEnabledV0
} from "../rhizoh/academicObservationExportV0.js";

const USER = "user_academic_export_01";

describe("academicObservationExportV0", () => {
  /** @type {string | undefined} */
  let prevObs;
  /** @type {ReturnType<typeof createLifeContinuityStoreV0>} */
  let store;
  /** @type {ReturnType<typeof createLifeEntityGraphV0>} */
  let graph;

  beforeEach(() => {
    prevObs = process.env.CASTLE_ACADEMIC_OBSERVATORY;
    resetLifeContinuityStoreV0();
    resetLifeEntityGraphV0();
    store = createLifeContinuityStoreV0();
    graph = createLifeEntityGraphV0();
  });

  afterEach(() => {
    if (prevObs === undefined) delete process.env.CASTLE_ACADEMIC_OBSERVATORY;
    else process.env.CASTLE_ACADEMIC_OBSERVATORY = prevObs;
    delete process.env.CASTLE_ACADEMIC_OBSERVATORY_INLINE;
    resetLifeContinuityStoreV0();
    resetLifeEntityGraphV0();
  });

  it("disabled by default env", () => {
    delete process.env.CASTLE_ACADEMIC_OBSERVATORY;
    assert.equal(isAcademicObservatoryEnabledV0(), false);
  });

  it("builds export envelope with turns and graph", () => {
    const row = store.appendTurn({
      user_id: USER,
      role: "user",
      text: "Ankara kalesi hakkında.",
      at: "2026-06-01T12:00:00.000Z"
    });
    assert.equal(row.ok, true);
    const thread_id = String(row.thread.thread_id);

    resolveLifeContinuityToEntityGraphV0({
      user_id: USER,
      thread_id,
      turn_ids: [String(row.turn.turn_id)],
      safePayload: {
        context: {
          life_continuity: {
            castle_id: "cst_test_01",
            location: { lat: 39.93, lon: 32.85, place_name: "Ankara" }
          }
        }
      },
      graph
    });

    const built = buildAcademicObservationExportV0({
      user_id: USER,
      thread_id,
      trace_id: "trace_acad_001",
      store,
      graph
    });
    assert.equal(built.ok, true);
    assert.equal(built.export.contract_version, ACADEMIC_OBSERVATION_CONTRACT_V0);
    assert.equal(built.export.user_id, USER);
    assert.ok(built.export.life_continuity.turns_sample.length >= 1);
    assert.ok(built.export.entity_graph.nodes.length >= 2);
    const paper = buildPaperBlocksFromExportV0(built.export);
    assert.ok(paper.methods.includes("Academic Observatory"));
    assert.ok(paper.observation_summary.includes(thread_id));
    const md = formatAcademicPaperMarkdownV0(built.export);
    assert.ok(md.includes("## Methods"));
    assert.ok(md.includes("## Appendix — reproducibility"));
  });

  it("attach pointer on turn when observatory enabled", () => {
    process.env.CASTLE_ACADEMIC_OBSERVATORY = "1";
    const result = { reply: "ok", lifeContinuity: { thread_id: "thr_ptr" } };
    const r = attachAcademicObservatoryAfterGatewayTurnV0({
      auth: { ok: true, uid: USER },
      safePayload: { message: "hi" },
      result,
      traceId: "trace_ptr",
      lifeAppend: { thread_id: "thr_ptr" }
    });
    assert.equal(r.ok, true);
    assert.equal(r.attached, "pointer");
    assert.equal(result.academicObservatory.export_path, "/rhizoh/academic/observatory/export");
    assert.equal(result.academicObservatory.trace_id, "trace_ptr");
  });
});
