/**
 * Rhizoh thinking engine — morph constants (example only, isolated).
 * @see RhizohThinkingEngineExampleV0.jsx
 */

export const RHIZOH_THINKING_ENGINE_EXAMPLE_CONTRACT_V0 = "rhizoh-thinking-engine-example-v0";

export const lerpV0 = (start, end, t) => start * (1 - t) + end * t;

export const SEMANTIC_AXES_THINK_V0 = Object.freeze({
  OBSERVATION: Object.freeze(["merhaba", "selam", "kim", "göster", "bak", "bul", "açık"]),
  REASONING: Object.freeze(["neden", "anladım", "teşekkür", "mantık", "denge", "çözüm", "çünkü", "nasıl"]),
  MEMORY: Object.freeze(["hatırla", "geçmiş", "önce", "eski", "zaman", "bellek", "kodex", "hafıza"]),
  ACTION: Object.freeze(["korku", "tehlike", "hata", "sil", "vur", "hızlı", "kaç", "yanlış"])
});

/**
 * @param {string} userInput
 * @returns {{ twist: number, fold: number, entropy: number, tension: number, clarity: number }}
 */
export function resolveMorphTargetsV0(userInput) {
  const words = String(userInput || "")
    .toLowerCase()
    .split(/\s+/);
  let obs = 0;
  let res = 0;
  let mem = 0;
  let act = 0;

  words.forEach((word) => {
    if (SEMANTIC_AXES_THINK_V0.OBSERVATION.some((w) => word.includes(w))) obs += 1;
    if (SEMANTIC_AXES_THINK_V0.REASONING.some((w) => word.includes(w))) res += 1;
    if (SEMANTIC_AXES_THINK_V0.MEMORY.some((w) => word.includes(w))) mem += 1;
    if (SEMANTIC_AXES_THINK_V0.ACTION.some((w) => word.includes(w))) act += 1;
  });

  const total = obs + res + mem + act || 1;
  return Object.freeze({
    twist: (res / total) * 2.0,
    fold: (mem / total) * 0.9,
    entropy: (act / total) * 1.5,
    tension: 0.5,
    clarity: 1.5
  });
}

/**
 * @param {string} userInput
 * @returns {{ twist: number, fold: number, entropy: number, tension: number, clarity: number }}
 */
export function resolveStabilizedTargetsV0(active) {
  return Object.freeze({
    twist: active.twist * 0.5,
    fold: active.fold * 0.5,
    entropy: active.entropy * 0.3,
    tension: 0,
    clarity: 1
  });
}

export class AnchorNodeV0 {
  /**
   * @param {number} index
   * @param {number} total
   */
  constructor(index, total) {
    this.index = index;
    const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;

    this.originX = Math.cos(theta) * Math.sin(phi);
    this.originY = Math.sin(theta) * Math.sin(phi);
    this.originZ = Math.cos(phi);

    this.baseX = this.originX;
    this.baseY = this.originY;
    this.baseZ = this.originZ;

    this.x = this.originX;
    this.y = this.originY;
    this.z = this.originZ;
  }
}
