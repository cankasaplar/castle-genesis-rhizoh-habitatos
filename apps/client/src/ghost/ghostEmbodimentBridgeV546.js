/**
 * vNext-546 — Ghost → sahne: konum, oracle modu, nehir görünürlüğü, alan distorsiyonu.
 */

import * as THREE from "three";
import { ISTANBUL_V540_DISTRICTS, BOSPORUS_PATH_V540 } from "../scene/istanbulBiomePresetV540.js";
import { ghostDistrictAffinity01 } from "./ghostRenderer.js";
import { GhostEvolutionStage } from "./ghostEvolution.js";

/**
 * @param {THREE.Vector3} p
 * @param {THREE.Vector3[]} path
 * @returns {{ closest: THREE.Vector3, dist: number }}
 */
export function closestPointOnPolyline(p, path) {
  if (!path.length) return { closest: p.clone(), dist: 0 };
  let bestD = Infinity;
  let best = path[0].clone();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ab = new THREE.Vector3().subVectors(b, a);
    const ap = new THREE.Vector3().subVectors(p, a);
    const t = Math.max(0, Math.min(1, ap.dot(ab) / Math.max(1e-6, ab.lengthSq())));
    const q = new THREE.Vector3().lerpVectors(a, b, t);
    const d = q.distanceTo(p);
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return { closest: best, dist: bestD };
}

/**
 * Kadıköy playful, Fatih memory-heavy, Boğaz’da oracle bias.
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @param {object} [opts]
 * @param {typeof ISTANBUL_V540_DISTRICTS} [opts.districts]
 * @param {THREE.Vector3[]} [opts.bosphorusPath]
 * @param {number} [opts.oracleDistanceThreshold]
 */
export function computeGhostEmbodimentParams(frame, genome, stage, opts = {}) {
  const districts = opts.districts || ISTANBUL_V540_DISTRICTS;
  const bosphorusPath = opts.bosphorusPath || BOSPORUS_PATH_V540;
  const map = frame.regionalMap;
  const threshold = opts.oracleDistanceThreshold ?? 3.35;

  let sx = 0;
  let sy = 0;
  let sz = 0;
  let sw = 0;

  for (const d of districts) {
    const aff = ghostDistrictAffinity01(d.regionId, map);
    let bias = 1;
    if (d.regionId === "kadikoy") bias *= 0.5 + genome.playfulness * 0.75;
    if (d.regionId === "fatih") bias *= 0.5 + genome.memoryDepth * 0.75;
    if (d.regionId === "besiktas" || d.regionId === "uskudar") bias *= 0.92 + genome.curiosity * 0.12;
    const w = Math.max(0.02, aff * bias);
    sx += d.position.x * w;
    sy += d.position.y * w;
    sz += d.position.z * w;
    sw += w;
  }

  const anchor = new THREE.Vector3(sx / sw, sy / sw + 0.45, sz / sw);
  const { dist } = closestPointOnPolyline(anchor, bosphorusPath);
  const oracleMode =
    dist < threshold &&
    (stage === GhostEvolutionStage.Oracle ||
      stage === GhostEvolutionStage.Mythic ||
      genome.wisdom > 0.68);

  const branchVisibilityMul = Math.max(0.38, Math.min(1.45, 0.58 + genome.mutationBloom * 0.55 + (oracleMode ? 0.22 : 0)));
  const branchEmissiveMul = Math.max(0.65, Math.min(1.65, 0.88 + genome.sovereignBond * 0.38 + (oracleMode ? 0.28 : 0)));
  const fieldDistortionMul = Math.max(0.85, Math.min(1.55, 1 + genome.scarTension * 0.42 + (oracleMode ? 0.14 : 0)));

  /** @type {Record<string, { scaleMul: number, opacityMul: number }>} */
  const perDistrict = {};
  for (const d of districts) {
    let scaleMul = 1;
    let opacityMul = 1;
    if (d.regionId === "kadikoy") scaleMul += genome.playfulness * 0.24;
    if (d.regionId === "fatih") {
      opacityMul += genome.memoryDepth * 0.2;
      scaleMul += genome.memoryDepth * 0.06;
    }
    perDistrict[d.regionId] = { scaleMul, opacityMul };
  }

  return Object.freeze({
    anchor,
    oracleMode,
    branchVisibilityMul,
    branchEmissiveMul,
    fieldDistortionMul,
    perDistrict,
    bosphorusDistance: dist
  });
}
