import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAcademicPaperDocumentV0 } from "../rhizoh/academicPaperBuilderV0.js";

describe("academicPaperBuilderV0", () => {
  it("builds deterministic paper document", () => {
    const doc = buildAcademicPaperDocumentV0({
      contract_version: "academic-observation-export-v0",
      session_ref: { thread_id: "thr_paper", trace_id: "trc_1" },
      life_continuity: {
        turns_sample: [
          { turn_id: "trn_u1", role: "user", text: "Ankara'da bir kale.", at: "2026-06-01T12:00:00Z" },
          { turn_id: "trn_a1", role: "assistant", text: "Devam edelim.", at: "2026-06-01T12:00:01Z" }
        ]
      },
      entity_graph: {
        nodes: [{ entity_id: "cst_1", entity_kind: "castle", label: "Metehan Kale" }],
        edges: []
      },
      resolver_trace: { edges_created: ["owns", "located_at"] }
    });
    assert.equal(doc.thread_id, "thr_paper");
    assert.equal(doc.abstract.length, 4);
    assert.equal(doc.turn_citations.length, 2);
    assert.equal(doc.entity_mentions[0].label, "Metehan Kale");
    assert.ok(doc.title.includes("Metehan"));
  });
});
