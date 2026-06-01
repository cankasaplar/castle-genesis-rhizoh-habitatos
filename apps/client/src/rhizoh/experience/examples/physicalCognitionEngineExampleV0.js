/**
 * Physical cognition engine — reference constants & node (example only).
 * @see PhysicalCognitionEngineExampleV0.jsx
 * SPECFLOW: RESEARCH-ONLY — not production T0 shell
 */

export const PHYSICAL_COGNITION_EXAMPLE_CONTRACT_V0 = "physical-cognition-engine-example-v0";

export const lerpV0 = (start, end, t) => start * (1 - t) + end * t;
export const randomRangeV0 = (min, max) => Math.random() * (max - min) + min;

export const INTENT_PHYSICS_V0 = Object.freeze({
  OBSERVATION: Object.freeze({
    type: "EXPANSION",
    color: [100, 200, 255],
    lightMode: "soft_global",
    forceScalar: 0.8
  }),
  REASONING: Object.freeze({
    type: "VORTEX",
    color: [200, 100, 255],
    lightMode: "laser_line",
    forceScalar: 1.5
  }),
  MEMORY: Object.freeze({
    type: "GRAVITY",
    color: [100, 255, 150],
    lightMode: "volumetric_fog",
    forceScalar: 1.2
  }),
  ACTION: Object.freeze({
    type: "SHOCKWAVE",
    color: [255, 80, 80],
    lightMode: "flash_burst",
    forceScalar: 2.5
  })
});

export const SEMANTIC_AXES_V0 = Object.freeze({
  OBSERVATION: Object.freeze(["merhaba", "selam", "kim", "açık", "sistem", "göster"]),
  REASONING: Object.freeze(["neden", "çözüm", "çünkü", "nasıl", "bağ", "mantık"]),
  MEMORY: Object.freeze(["teşekkür", "hatırla", "geçmiş", "zaman", "kodex", "hafıza"]),
  ACTION: Object.freeze(["korku", "tehlike", "hata", "vur", "kaç", "sil"])
});

export const ECHO_MAP_V0 = Object.freeze({
  teşekkür: Object.freeze({ intent: "MEMORY" }),
  merhaba: Object.freeze({ intent: "OBSERVATION" }),
  korku: Object.freeze({ intent: "ACTION" }),
  neden: Object.freeze({ intent: "REASONING" }),
  geçmiş: Object.freeze({ intent: "MEMORY" })
});

/**
 * @param {string} userInput
 */
export function resolveDominantIntentV0(userInput) {
  const words = String(userInput || "")
    .toLowerCase()
    .split(/\s+/);
  let obs = 0;
  let res = 0;
  let mem = 0;
  let act = 0;

  words.forEach((word) => {
    if (SEMANTIC_AXES_V0.OBSERVATION.some((w) => word.includes(w))) obs += 1;
    if (SEMANTIC_AXES_V0.REASONING.some((w) => word.includes(w))) res += 1;
    if (SEMANTIC_AXES_V0.MEMORY.some((w) => word.includes(w))) mem += 1;
    if (SEMANTIC_AXES_V0.ACTION.some((w) => word.includes(w))) act += 1;
  });

  let dominantIntent = "OBSERVATION";
  let maxScore = obs;
  if (res > maxScore) {
    dominantIntent = "REASONING";
    maxScore = res;
  }
  if (mem > maxScore) {
    dominantIntent = "MEMORY";
    maxScore = mem;
  }
  if (act > maxScore) {
    dominantIntent = "ACTION";
    maxScore = act;
  }

  return Object.freeze({ name: dominantIntent, word: userInput });
}

/**
 * @param {string} userInput
 */
export function resolvePendingEchoV0(userInput) {
  const text = String(userInput || "").toLowerCase();
  const matchedKey = Object.keys(ECHO_MAP_V0).find((k) => text.includes(k));
  if (matchedKey) return Object.freeze({ ...ECHO_MAP_V0[matchedKey] });
  return Object.freeze({ intent: "OBSERVATION" });
}

export class PhysicalNodeV0 {
  /**
   * @param {number} index
   * @param {number} total
   * @param {boolean} [isEcho]
   * @param {number} [radiusOffset]
   * @param {{ x: number, y: number, z: number } | null} [inheritSnapshot]
   */
  constructor(index, total, isEcho = false, radiusOffset = 1, inheritSnapshot = null) {
    this.index = index;
    this.isEcho = isEcho;

    if (inheritSnapshot) {
      this.originX = inheritSnapshot.x;
      this.originY = inheritSnapshot.y;
      this.originZ = inheritSnapshot.z;
    } else {
      const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      this.originX = Math.cos(theta) * Math.sin(phi) * radiusOffset;
      this.originY = Math.sin(theta) * Math.sin(phi) * radiusOffset;
      this.originZ = Math.cos(phi) * radiusOffset;
    }

    this.baseX = this.originX;
    this.baseY = this.originY;
    this.baseZ = this.originZ;
    this.x = this.originX;
    this.y = this.originY;
    this.z = this.originZ;

    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.mass = randomRangeV0(0.8, 1.5);
    this.elasticity = randomRangeV0(0.02, 0.08);
    this.inertia = randomRangeV0(0.85, 0.95);
  }
}
