/**
 * RHIZOH constitutional category sketch — faz/konteks nesneleri ve operatör zinciri morfizmaları.
 * Tam CT kurumu değil; bileşim + birim + zayıf fonktör kontrolleri için hesaplanabilir iskele.
 */

import { composeRhizohPhaseSpaceOperators } from "./constitutionalPhaseSpaceAlgebraV1.js";

export const RHIZOH_CONSTITUTIONAL_CATEGORY_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   objectId: string,
 *   representativeTheta?: number,
 *   representativeStress?: number
 * }} RhizohConstitutionalCategoryObject
 */

/**
 * @typedef {{
 *   dom: string,
 *   cod: string,
 *   chain: ReadonlyArray<{ id: string, args?: Record<string, unknown> }>
 * }} RhizohConstitutionalMorphism
 */

/**
 * @param {ReadonlyArray<string>} phaseLikeIds
 * @param {(id: string) => number} [thetaOf]
 */
export function buildRhizohConstitutionalDiscreteObjects(phaseLikeIds, thetaOf) {
  const mapFn =
    thetaOf ||
    ((id) =>
      id.includes("elastic") ? 0.08 : id.includes("immune") ? 0.82 : 0.46);
  return phaseLikeIds.map((objectId) => ({
    objectId,
    representativeTheta: clamp01(mapFn(objectId)),
    representativeStress: 0.42
  }));
}

/**
 * Morfizm = kaynak nesneden hedefe operatör zinciri (soldan sağa uygulanır).
 * @param {string} dom
 * @param {string} cod
 * @param {RhizohConstitutionalMorphism["chain"]} chain
 */
export function morphismRhizohConstitutional(dom, cod, chain) {
  return { dom, cod, chain: [...chain] };
}

/**
 * g ∘ f : önce f zinciri, sonra g (concat [f.chain, g.chain]).
 */
export function composeRhizohConstitutionalMorphisms(g, f) {
  if (f.cod !== g.dom) {
    return {
      ok: false,
      reason: "cod_dom_mismatch",
      detail: { fCod: f.cod, gDom: g.dom }
    };
  }
  return {
    ok: true,
    morphism: {
      dom: f.dom,
      cod: g.cod,
      chain: [...f.chain, ...g.chain]
    }
  };
}

export function isRhizohConstitutionalComposable(g, f) {
  return composeRhizohConstitutionalMorphisms(g, f).ok === true;
}

/**
 * Birim morfizm: boş zincir (θ üzerinde kimlik etkisi — phase_space identity).
 * @param {string} objId
 */
export function identityRhizohConstitutionalMorphism(objId) {
  return morphismRhizohConstitutional(objId, objId, [{ id: "identity" }]);
}

/**
 * Zinciri başlangıç durumunda uygular ve θ çıktısını döner.
 * @param {RhizohConstitutionalMorphism} mor
 * @param {{ theta: number, stressIndex: number, adaptation?: { disabled?: boolean } }} seed
 */
export function realizeRhizohConstitutionalMorphism(mor, seed) {
  const { finalState } = composeRhizohPhaseSpaceOperators(mor.chain, {
    theta: clamp01(seed.theta),
    stressIndex: clamp01(seed.stressIndex ?? 0.4),
    adaptation: seed.adaptation
  });
  return finalState;
}

/**
 * Kategori teorik anlamda bileşim tak-çıkarlığı sayısal doğrulama:
 * realize(g∘f) ≟ realize(g)( realize(f)(seed) ) tek concat ile aynı olmalı.
 */
export function verifyRhizohConstitutionalCompositionCoherence(f, g, seed) {
  const gf = composeRhizohConstitutionalMorphisms(g, f);
  if (!gf.ok || !gf.morphism) return { ok: false, residual: null };
  const left = realizeRhizohConstitutionalMorphism(gf.morphism, seed).theta;
  const mid = realizeRhizohConstitutionalMorphism(f, seed);
  const right = realizeRhizohConstitutionalMorphism(g, {
    theta: mid.theta,
    stressIndex: mid.stressIndex,
    adaptation: mid.adaptation ?? seed.adaptation
  }).theta;
  const residual = Math.round(Math.abs(left - right) * 10000) / 10000;
  return { ok: residual < 1e-4, residual, left, right };
}

/**
 * Küçük iki-kategori arasında nesne/morfizm eşlemesi + örnek koruma testi.
 * @param {{
 *   objectMap: Record<string, string>,
 *   morphismRules: Record<string, RhizohConstitutionalMorphism["chain"]>,
 *   samples?: Array<{ domObj: string, theta: number, stressIndex?: number }>
 * }} spec
 */
export function probeRhizohConstitutionalFunctoriality(spec) {
  const samples = spec.samples?.length
    ? spec.samples
    : [{ domObj: "constitutional_balanced", theta: 0.44, stressIndex: 0.4 }];
  /** @type {{ morphismKey: string, residual: number }[]} */
  const rows = [];
  for (const key of Object.keys(spec.morphismRules || {})) {
    const chain = spec.morphismRules[key];
    const mor = morphismRhizohConstitutional(key, spec.objectMap[key] || key, chain);
    let maxRes = 0;
    for (const s of samples) {
      const out = realizeRhizohConstitutionalMorphism(mor, {
        theta: s.theta,
        stressIndex: s.stressIndex ?? 0.4
      });
      maxRes = Math.max(maxRes, Math.abs(out.theta - s.theta));
    }
    rows.push({ morphismKey: key, residual: Math.round(maxRes * 10000) / 10000 });
  }
  return {
    functorSketchVersion: RHIZOH_CONSTITUTIONAL_CATEGORY_VERSION,
    objectMap: spec.objectMap,
    morphismProbe: rows
  };
}
