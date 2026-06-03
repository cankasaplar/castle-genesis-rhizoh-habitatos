/**
 * World Expansion Layer v0.1 — post-deploy evolution orchestrator.
 * Priority: Pet Evolution → Studio Live Editor → Castle Graph → Hot Reload → SCR Mesh
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { tickPetEvolutionV0 } from "./rhizohPetEvolutionV0.js";
import { publishStudioLiveEditorV0, submitStudioEditSuggestionV0, STUDIO_EDIT_TARGET_V0 } from "./rhizohStudioLiveEditorV0.js";
import { publishCastleGraphV0, registerCastleGraphNodeV0, linkCastleGraphNodesV0 } from "./rhizohCastleGraphV0.js";
import { executeWorldHotReloadV0 } from "./rhizohHotReloadRuntimeV0.js";
import { publishScrDistributedMeshV0, reportScrRegionHeartbeatV0 } from "./rhizohScrDistributedMeshV0.js";

export const WORLD_EXPANSION_LAYER_SCHEMA_V0 = "castle.rhizoh.world_expansion_layer.v0";

export const EXPANSION_LAYER_ORDER_V0 = Object.freeze([
  "pet_evolution",
  "studio_live_editor",
  "castle_graph",
  "hot_reload",
  "scr_distributed_mesh"
]);

/**
 * @param {{
 *   skipHotReload?: boolean,
 *   skipScrMesh?: boolean,
 *   regions?: { region: string, coherence_id: string, jitter_ms?: number }[]
 * }} [opts]
 */
export async function tickWorldExpansionLayerV0(opts = {}) {
  const steps = [];

  const pet = tickPetEvolutionV0();
  steps.push(Object.freeze({ layer: "pet_evolution", ok: pet.ok }));

  publishStudioLiveEditorV0();
  steps.push(Object.freeze({ layer: "studio_live_editor", ok: true }));

  const graph = publishCastleGraphV0();
  steps.push(Object.freeze({ layer: "castle_graph", ok: graph.ok }));

  if (!opts.skipHotReload) {
    const hot = await executeWorldHotReloadV0({ moduleLabels: ["expansion_tick"] });
    steps.push(Object.freeze({ layer: "hot_reload", ok: hot.ok }));
  }

  if (!opts.skipScrMesh) {
    for (const r of opts.regions || []) {
      reportScrRegionHeartbeatV0(r);
    }
    const mesh = publishScrDistributedMeshV0();
    steps.push(Object.freeze({ layer: "scr_distributed_mesh", ok: mesh.ok }));
  }

  const ok = steps.every((s) => s.ok !== false);

  const report = Object.freeze({
    schema: WORLD_EXPANSION_LAYER_SCHEMA_V0,
    atMs: Date.now(),
    version: "0.1",
    ok,
    steps: Object.freeze(steps),
    layers: EXPANSION_LAYER_ORDER_V0
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.worldExpansionLayer = report;
  }

  return report;
}

/**
 * Bootstrap expansion stack with demo castle graph edge (research / staging).
 */
export async function primeWorldExpansionLayerV0() {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const castleId = rh.castleProjection?.castle_node_id || "castle_proj_local";
  registerCastleGraphNodeV0({ castle_node_id: castleId, label: "local" });
  registerCastleGraphNodeV0({ castle_node_id: "castle_peer_v0", label: "peer" });
  linkCastleGraphNodesV0({
    from: castleId,
    to: "castle_peer_v0",
    kind: "visual_echo",
    weight: 0.4
  });

  submitStudioEditSuggestionV0({
    target: STUDIO_EDIT_TARGET_V0.CASTLE_COMPOSITION,
    mode: "suggestion_only",
    payload: { surface_density: 0.55, attention_weight_map: { local: 0.6, peer: 0.4 } }
  });

  return tickWorldExpansionLayerV0({
    regions: [
      { region: "TR", coherence_id: rh.presenceFrame?.coherenceId || "tr_t0", jitter_ms: 24 },
      { region: "EU", coherence_id: rh.presenceFrame?.coherenceId || "eu_t0", jitter_ms: 48 }
    ]
  });
}

export function readWorldExpansionLayerV0() {
  return typeof window !== "undefined" ? window.__rhizoh?.worldExpansionLayer || null : null;
}

export function resetRhizohWorldExpansionLayerForTestV0() {
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.worldExpansionLayer;
  }
}
