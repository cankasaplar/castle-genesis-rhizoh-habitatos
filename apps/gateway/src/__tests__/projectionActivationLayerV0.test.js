import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createLifeContinuityStoreV0 } from "../rhizoh/lifeContinuityStoreV0.js";
import { createLifeEntityGraphV0 } from "../rhizoh/lifeEntityGraphV0.js";
import { buildProjectionBundleV0 } from "../rhizoh/lifeProjectionBridgeV0.js";
import { resolveLifeContinuityToEntityGraphV0 } from "../rhizoh/lifeContinuityResolverV0.js";
import {
  activateProjectionBundleV0,
  computeCastleRevealStageV0,
  resetProjectionActivationEmergenceV0,
  readProjectionActivationThresholdsV0
} from "../rhizoh/projectionActivationLayerV0.js";

const USER = "user_pal_test_01";
const CASTLE = "cst_ankara_home";
const TH = readProjectionActivationThresholdsV0();

function seedCastleGraph(graph) {
  graph.upsertNode({
    entity_id: `usr_${USER}`,
    entity_kind: "user",
    user_id: USER,
    label: "Test"
  });
  graph.upsertNode({
    entity_id: CASTLE,
    entity_kind: "castle",
    user_id: USER,
    label: "Ankara Castle"
  });
  graph.upsertNode({
    entity_id: "loc_ankara",
    entity_kind: "location",
    user_id: USER,
    label: "Ankara",
    payload: { lat: 39.93, lon: 32.85 }
  });
  graph.upsertEdge({ user_id: USER, rel: "owns", from_id: `usr_${USER}`, to_id: CASTLE });
  graph.upsertEdge({ user_id: USER, rel: "located_at", from_id: CASTLE, to_id: "loc_ankara" });
}

function appendUserTurns(store, n, thread_id) {
  for (let i = 0; i < n; i++) {
    store.appendTurn({
      user_id: USER,
      thread_id,
      role: "user",
      text: `user message ${i} about castle and continuity`,
      at: `2026-06-0${1 + i}T10:00:00.000Z`
    });
    store.appendTurn({
      user_id: USER,
      thread_id,
      role: "assistant",
      text: `reply ${i}`,
      at: `2026-06-0${1 + i}T10:01:00.000Z`
    });
  }
}

describe("projectionActivationLayerV0", () => {
  let store;
  let graph;

  beforeEach(() => {
    resetProjectionActivationEmergenceV0();
    store = createLifeContinuityStoreV0();
    graph = createLifeEntityGraphV0();
    seedCastleGraph(graph);
  });

  it("computeCastleRevealStageV0 — hinted before map threshold", () => {
    assert.equal(
      computeCastleRevealStageV0({ user_turns: 1, total_turns: 2, has_location: true }, TH),
      "hinted"
    );
    assert.equal(
      computeCastleRevealStageV0(
        { user_turns: TH.map_pin_min_user_turns, total_turns: TH.map_pin_min_total_turns, has_location: true },
        TH
      ),
      "revealed"
    );
  });

  it("map_pin hidden until user turn threshold", () => {
    const t = store.appendTurn({ user_id: USER, role: "user", text: "first" });
    const thread_id = t.thread.thread_id;
    resolveLifeContinuityToEntityGraphV0({
      user_id: USER,
      thread_id,
      safePayload: { context: { life_continuity: { castle_id: CASTLE } } },
      graph
    });

    const raw = buildProjectionBundleV0({ user_id: USER, graph, store });
    const act = activateProjectionBundleV0({ bundle: raw.bundle, user_id: USER, graph, store });
    const pin = act.bundle.projections.find((p) => p.projection_kind === "map_pin");
    assert.ok(pin);
    assert.equal(pin.activation.visible, false);
    assert.equal(pin.activation.stage, "hinted");
  });

  it("map_pin emerges once threshold met", () => {
    const t = store.appendTurn({ user_id: USER, role: "user", text: "seed" });
    const thread_id = t.thread.thread_id;
    resolveLifeContinuityToEntityGraphV0({
      user_id: USER,
      thread_id,
      turn_ids: [],
      safePayload: { context: { life_continuity: { castle_id: CASTLE } } },
      graph
    });
    appendUserTurns(store, TH.map_pin_min_user_turns, thread_id);

    const raw = buildProjectionBundleV0({ user_id: USER, graph, store });
    const act = activateProjectionBundleV0({ bundle: raw.bundle, user_id: USER, graph, store });
    const pin = act.bundle.projections.find((p) => p.projection_kind === "map_pin");
    assert.equal(pin.activation.visible, true);
    assert.equal(pin.activation.emergence, true);
    assert.equal(act.bundle.castle_reveal[0].stage, "revealed");
  });
});
