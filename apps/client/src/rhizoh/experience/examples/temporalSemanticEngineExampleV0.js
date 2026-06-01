/**
 * Temporal semantic engine — reference constants (example only, isolated).
 * @see TemporalSemanticEngineExampleV0.jsx
 */

export const TEMPORAL_SEMANTIC_EXAMPLE_CONTRACT_V0 = "temporal-semantic-engine-example-v0";

export const lerpV0 = (start, end, t) => start * (1 - t) + end * t;

export const INTENT_DICTIONARY_V0 = Object.freeze({
  OBSERVATION: Object.freeze({
    type: "EXPANSION",
    flow: "outward",
    baseTension: 0.4,
    color: [100, 200, 255]
  }),
  REASONING: Object.freeze({
    type: "LOOP",
    flow: "spiral",
    baseTension: 0.6,
    color: [200, 100, 255]
  }),
  MEMORY: Object.freeze({
    type: "CLOSURE",
    flow: "inward",
    baseTension: 0.3,
    color: [100, 255, 150]
  }),
  ACTION: Object.freeze({
    type: "DISRUPTION",
    flow: "spike",
    baseTension: 0.9,
    color: [255, 80, 80]
  })
});

export const SEMANTIC_AXES_TS_V0 = Object.freeze({
  OBSERVATION: Object.freeze(["merhaba", "selam", "kim", "açık", "sistem"]),
  REASONING: Object.freeze(["neden", "çözüm", "çünkü", "nasıl", "bağ"]),
  MEMORY: Object.freeze(["teşekkür", "hatırla", "geçmiş", "zaman", "kodex", "hafıza"]),
  ACTION: Object.freeze(["korku", "tehlike", "hata", "vur", "kaç"])
});

export const ECHO_MAP_TS_V0 = Object.freeze({
  teşekkür: Object.freeze({ intent: "MEMORY" }),
  merhaba: Object.freeze({ intent: "OBSERVATION" }),
  korku: Object.freeze({ intent: "ACTION" }),
  neden: Object.freeze({ intent: "REASONING" }),
  geçmiş: Object.freeze({ intent: "MEMORY" })
});

/**
 * @param {string} userInput
 */
export function resolveTemporalDominantIntentV0(userInput) {
  const words = String(userInput || "")
    .toLowerCase()
    .split(/\s+/);
  let obs = 0;
  let res = 0;
  let mem = 0;
  let act = 0;

  words.forEach((word) => {
    if (SEMANTIC_AXES_TS_V0.OBSERVATION.some((w) => word.includes(w))) obs += 1;
    if (SEMANTIC_AXES_TS_V0.REASONING.some((w) => word.includes(w))) res += 1;
    if (SEMANTIC_AXES_TS_V0.MEMORY.some((w) => word.includes(w))) mem += 1;
    if (SEMANTIC_AXES_TS_V0.ACTION.some((w) => word.includes(w))) act += 1;
  });

  let dominant = INTENT_DICTIONARY_V0.OBSERVATION;
  let maxScore = obs;
  if (res > maxScore) {
    dominant = INTENT_DICTIONARY_V0.REASONING;
    maxScore = res;
  }
  if (mem > maxScore) {
    dominant = INTENT_DICTIONARY_V0.MEMORY;
    maxScore = mem;
  }
  if (act > maxScore) {
    dominant = INTENT_DICTIONARY_V0.ACTION;
    maxScore = act;
  }

  return dominant;
}

/**
 * @param {string} userInput
 */
export function resolveTemporalPendingEchoV0(userInput) {
  const text = String(userInput || "").toLowerCase();
  const matchedKey = Object.keys(ECHO_MAP_TS_V0).find((k) => text.includes(k));
  if (matchedKey) return Object.freeze({ ...ECHO_MAP_TS_V0[matchedKey] });
  return Object.freeze({ intent: "OBSERVATION" });
}

export class CognitiveNodeTsV0 {
  /**
   * @param {number} index
   * @param {number} total
   * @param {boolean} [isEcho]
   * @param {number} [radiusOffset]
   */
  constructor(index, total, isEcho = false, radiusOffset = 1) {
    this.index = index;
    this.isEcho = isEcho;
    const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;

    this.originX = Math.cos(theta) * Math.sin(phi) * radiusOffset;
    this.originY = Math.sin(theta) * Math.sin(phi) * radiusOffset;
    this.originZ = Math.cos(phi) * radiusOffset;

    this.baseX = this.originX;
    this.baseY = this.originY;
    this.baseZ = this.originZ;

    this.x = this.originX;
    this.y = this.originY;
    this.z = this.originZ;
  }
}
