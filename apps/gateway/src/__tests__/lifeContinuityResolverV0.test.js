import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createLifeContinuityStoreV0 } from "../rhizoh/lifeContinuityStoreV0.js";
import { createLifeEntityGraphV0 } from "../rhizoh/lifeEntityGraphV0.js";
import { buildProjectionBundleV0 } from "../rhizoh/lifeProjectionBridgeV0.js";
import {
  extractEntityHintsFromPayloadV0,
  resolveLifeContinuityToEntityGraphV0
} from "../rhizoh/lifeContinuityResolverV0.js";

const USER = "usr_metehan_firebase_01";

describe("lifeContinuityResolverV0", () => {
  let store;
  let graph;

  beforeEach(() => {
    store = createLifeContinuityStoreV0();
    graph = createLifeEntityGraphV0();
  });

  it("extractEntityHintsFromPayloadV0 reads castle + location from context", () => {
    const hints = extractEntityHintsFromPayloadV0({
      context: {
        life_continuity: {
          castle_id: "cst_ankara_home",
          castle_label: "Ankara Castle",
          location: { lat: 39.93, lon: 32.85, place_name: "Ankara" }
        }
      }
    });
    assert.equal(hints.castle_id, "cst_ankara_home");
    assert.equal(hints.location?.place_name, "Ankara");
  });

  it("resolve creates owns, located_at, linked_thread edges", () => {
    const r = resolveLifeContinuityToEntityGraphV0({
      user_id: USER,
      thread_id: "thr_481",
      turn_ids: ["trn_001"],
      safePayload: {
        context: {
          life_continuity: {
            castle_id: "cst_ankara_home",
            location: { lat: 39.9334, lon: 32.8597, place_name: "Ankara" }
          }
        }
      },
      graph
    });
    assert.equal(r.ok, true);
    assert.ok(r.edges_created.includes("owns"));
    assert.ok(r.edges_created.includes("located_at"));
    assert.ok(r.edges_created.includes("linked_thread"));

    const bundle = buildProjectionBundleV0({ user_id: USER, graph, store });
    assert.equal(bundle.ok, true);
    const pin = bundle.bundle.projections.find((p) => p.projection_kind === "map_pin");
    assert.ok(pin);
    assert.equal(pin.location.lat, 39.9334);
  });

  it("skips graph when no castle hint", () => {
    const r = resolveLifeContinuityToEntityGraphV0({
      user_id: USER,
      thread_id: "thr_x",
      safePayload: { context: {} },
      graph
    });
    assert.equal(r.skipped_graph, true);
  });
});
