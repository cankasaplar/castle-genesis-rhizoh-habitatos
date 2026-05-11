/**
 * vNext-538 — Morton-keyed field atlas for GPU upload (RGBA32F-style packing per cell).
 */

import { morton3D16 } from "../spatialMorton.js";
import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} FieldCell
 * GPU stride 8: truth, contradiction, legitimacy, novelty, memory, entropy, branchEntropy, conflictSeverity
 * @property {number} truth
 * @property {number} contradiction
 * @property {number} legitimacy
 * @property {number} novelty
 * @property {number} memory
 * @property {number} entropy combined field tension (not raw branch)
 * @property {number} branchEntropy
 * @property {number} conflictSeverity
 */

/**
 * @typedef {object} FieldAtlas
 * @property {readonly number[]} mortonKeys
 * @property {Float32Array} texels
 * @property {number} texelStride
 * @property {number} cellCount
 */

/**
 * @typedef {object} FieldSample
 * @property {string} regionId
 * @property {number[]} pressureMean
 * @property {number[]} resonanceMean
 * @property {number} branchEntropy
 * @property {number} conflictSeverity
 */

/**
 * Map regional aggregate → shader cell scalars.
 * pressure: [truth, contradiction, legitimacy, memory, novelty] (constitutionalPressureBus order)
 * resonance: [truth, contradiction, memory, legitimacy, novelty]
 * @param {FieldSample} sample
 * @returns {FieldCell}
 */
export function fieldSampleToCell(sample) {
  const p = sample.pressureMean;
  const r = sample.resonanceMean;
  const be = clamp01(sample.branchEntropy ?? 0);
  const cs = clamp01(sample.conflictSeverity ?? 0);
  return Object.freeze({
    truth: clamp01((p[0] ?? 0) * 0.55 + (r[0] ?? 0) * 0.45),
    contradiction: clamp01((p[1] ?? 0) * 0.5 + (r[1] ?? 0) * 0.5),
    legitimacy: clamp01((p[2] ?? 0) * 0.5 + (r[3] ?? 0) * 0.5),
    novelty: clamp01((p[4] ?? 0) * 0.55 + (r[4] ?? 0) * 0.45),
    memory: clamp01((p[3] ?? 0) * 0.5 + (r[2] ?? 0) * 0.5),
    entropy: clamp01(be * 0.35 + cs * 0.45 + (1 - (p[0] ?? 0.5)) * 0.2),
    branchEntropy: be,
    conflictSeverity: cs
  });
}

/**
 * @param {object} o
 * @param {Array<{ cx: number, cy: number, cz: number, sample: FieldSample }>} o.cells
 */
/** @returns {FieldAtlas} */
export function buildFieldAtlas(o) {
  /** @type {Map<number, FieldCell>} */
  const byMorton = new Map();
  for (const c of o.cells || []) {
    const key = morton3D16(c.cx, c.cy, c.cz);
    const cell = fieldSampleToCell(c.sample);
    byMorton.set(key, cell);
  }
  const keys = Array.from(byMorton.keys()).sort((a, b) => a - b);
  const texels = new Float32Array(keys.length * 8);
  for (let i = 0; i < keys.length; i++) {
    const cell = byMorton.get(keys[i]);
    const b = i * 8;
    texels[b] = cell.truth;
    texels[b + 1] = cell.contradiction;
    texels[b + 2] = cell.legitimacy;
    texels[b + 3] = cell.novelty;
    texels[b + 4] = cell.memory;
    texels[b + 5] = cell.entropy;
    texels[b + 6] = cell.branchEntropy;
    texels[b + 7] = cell.conflictSeverity;
  }
  return Object.freeze({
    mortonKeys: Object.freeze(keys),
    texels,
    texelStride: 8,
    cellCount: keys.length
  });
}
