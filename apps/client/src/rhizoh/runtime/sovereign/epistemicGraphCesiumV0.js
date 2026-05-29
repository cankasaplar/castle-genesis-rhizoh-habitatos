/**
 * Phase 21 — Epistemic graph visualization on Cesium (non-physical).
 * Arc rendering · coherence field halos · topology pulse animation.
 */

import * as Cesium from "cesium";
import { isCastleDebugGranularFlagEnabled } from "../castleDebugGateV0.js";
import { isSatelliteNodeRegistryEnabledV0 } from "./satelliteNodeRegistryV0.js";
import {
  EPISTEMIC_GRAPH_ENTITY_PREFIX_V0,
  EPISTEMIC_GRAPH_VIZ_SCHEMA_V0
} from "./epistemicGraphVisualizationContractV0.js";
import { buildShadowCoherenceGraphV0 } from "./shadowCoherenceGraphV0.js";
import { getCrossNodeResonanceForVisualizationV0 } from "./crossNodeResonanceWireV0.js";
import { buildGeodesicArcPositionsV0 } from "./geodesicCausalityV0.js";
import { getTemporalLayerForNodeV0 } from "./temporalInterferenceLayerV0.js";

export function isEpistemicGraphVisualizationEnabledV0() {
  if (isCastleDebugGranularFlagEnabled("VITE_EPISTEMIC_GRAPH_VIZ_V0")) return true;
  return isSatelliteNodeRegistryEnabledV0();
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {ReturnType<typeof buildShadowCoherenceGraphV0>} graph
 * @param {Map<string, import("cesium").Entity>} entityMap
 */
function renderGraphToCesiumV0(viewer, graph, entityMap) {
  const resonance = getCrossNodeResonanceForVisualizationV0();
  const resonanceByPair = new Map(
    (resonance?.pairs || []).map((p) => [
      `${p.from}|${p.to}`,
      {
        score: p.interferenceScore,
        temporal: p.temporalInterferenceScore ?? 0
      }
    ])
  );
  const temporalLayers = resonance?.temporalLayers || [];

  for (const node of graph.nodes) {
    const id = `${EPISTEMIC_GRAPH_ENTITY_PREFIX_V0}node-${node.nodeId}`;
    if (entityMap.has(id)) continue;
    const ent = viewer.entities.add({
      id,
      position: Cesium.Cartesian3.fromDegrees(
        node.anchor.lon,
        node.anchor.lat,
        4000
      ),
      point: {
        pixelSize: node.localPrimary ? 10 : 7,
        color: node.localPrimary
          ? Cesium.Color.fromCssColorString("#10b981").withAlpha(0.85)
          : Cesium.Color.VIOLET.withAlpha(0.75),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.6),
        outlineWidth: 1
      },
      label: {
        text: node.nodeId.replace("node:", ""),
        font: "10px monospace",
        fillColor: Cesium.Color.WHITE.withAlpha(0.7),
        pixelOffset: new Cesium.Cartesian2(0, -14),
        scale: 0.85
      }
    });
    entityMap.set(id, ent);
  }

  for (const edge of graph.edges) {
    const arcId = `${EPISTEMIC_GRAPH_ENTITY_PREFIX_V0}arc-${edge.from}-${edge.to}`;
    if (entityMap.has(arcId)) continue;

    const fromNode = graph.nodes.find((n) => n.nodeId === edge.from);
    const toNode = graph.nodes.find((n) => n.nodeId === edge.to);
    if (!fromNode || !toNode) continue;

    const key = `${edge.from}|${edge.to}`;
    const pairRes = resonanceByPair.get(key);
    const interference = pairRes?.score ?? edge.shadowCoherence;
    const temporal = pairRes?.temporal ?? 0;
    const fieldCoupling =
      edge.shadowCoherence * 0.4 + interference * 0.35 + temporal * 0.25;
    const phase = edge.from.length * 0.07;

    const geodesicPositions = buildGeodesicArcPositionsV0(
      fromNode.anchor.lon,
      fromNode.anchor.lat,
      toNode.anchor.lon,
      toNode.anchor.lat,
      { fieldCoupling, steps: 72 }
    );

    const ent = viewer.entities.add({
      id: arcId,
      polyline: {
        positions: geodesicPositions,
        width: new Cesium.CallbackProperty(
          () => 1.5 + edge.shadowCoherence * 2 + interference * 1.5,
          false
        ),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const pulse = 0.35 + Math.abs(Math.sin(performance.now() / 900 + phase)) * 0.45;
            const a = Math.min(
              0.9,
              edge.shadowCoherence * pulse + interference * 0.15 + temporal * 0.25
            );
            return Cesium.Color.fromCssColorString(
              temporal > interference
                ? "#c084fc"
                : edge.edgeClass === "mediterranean_shadow_link"
                  ? "#a78bfa"
                  : "#34d399"
            ).withAlpha(a);
          }, false)
        ),
        arcType: Cesium.ArcType.GEODESIC
      }
    });
    entityMap.set(arcId, ent);

    const midLon = (fromNode.anchor.lon + toNode.anchor.lon) / 2;
    const midLat = (fromNode.anchor.lat + toNode.anchor.lat) / 2;
    const fieldId = `${EPISTEMIC_GRAPH_ENTITY_PREFIX_V0}field-${edge.from}-${edge.to}`;
    const fieldEnt = viewer.entities.add({
      id: fieldId,
      position: Cesium.Cartesian3.fromDegrees(midLon, midLat, 10000),
      ellipse: {
        semiMajorAxis: new Cesium.CallbackProperty(
          () => 180000 + interference * 80000 + Math.sin(performance.now() / 1200) * 20000,
          false
        ),
        semiMinorAxis: new Cesium.CallbackProperty(
          () => 120000 + edge.shadowCoherence * 50000 + Math.sin(performance.now() / 1400) * 15000,
          false
        ),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const layerA = getTemporalLayerForNodeV0(temporalLayers, edge.from);
            const layerB = getTemporalLayerForNodeV0(temporalLayers, edge.to);
            const hist =
              ((layerA?.cumulativeIntensity ?? 0) + (layerB?.cumulativeIntensity ?? 0)) /
              2;
            const a =
              0.04 + edge.shadowCoherence * 0.06 + interference * 0.05 + hist * 0.08;
            return Cesium.Color.CYAN.withAlpha(a);
          }, false)
        ),
        outline: false,
        height: 0
      }
    });
    entityMap.set(fieldId, fieldEnt);
  }
}

/**
 * @param {import("cesium").Viewer} viewer
 * @returns {() => void}
 */
export function maybeInstallEpistemicGraphVisualizationOnCesiumV0(viewer) {
  if (!isEpistemicGraphVisualizationEnabledV0() || !viewer) {
    return () => {};
  }

  /** @type {Map<string, import("cesium").Entity>} */
  const entityMap = new Map();
  let lastRefreshMs = 0;

  const refresh = () => {
    try {
      const graph = buildShadowCoherenceGraphV0();
      renderGraphToCesiumV0(viewer, graph, entityMap);
      if (typeof window !== "undefined") {
        window.__rhizoh_epistemic_graph_viz = {
          schema: EPISTEMIC_GRAPH_VIZ_SCHEMA_V0,
          entityCount: entityMap.size,
          executive: false,
          nonPhysical: true,
          geodesicCausality: true,
          temporalLayering: true
        };
      }
    } catch {
      /* viz must not break map */
    }
  };

  refresh();

  const onPostRender = () => {
    const now = performance.now();
    if (now - lastRefreshMs < 3000) return;
    lastRefreshMs = now;
    refresh();
  };

  viewer.scene.postRender.addEventListener(onPostRender);

  return () => {
    try {
      viewer.scene.postRender.removeEventListener(onPostRender);
    } catch {
      /* noop */
    }
    for (const ent of entityMap.values()) {
      try {
        viewer.entities.remove(ent);
      } catch {
        /* noop */
      }
    }
    entityMap.clear();
    if (typeof window !== "undefined") {
      try {
        delete window.__rhizoh_epistemic_graph_viz;
      } catch {
        /* noop */
      }
    }
  };
}
