/**
 * Rhizoh Cognitive Geometry Compiler — semantic text → topology mutation.
 * Ported from Gemini archive (Fibonacci sphere + OBS/RES/MEM/ACT axes).
 * @see docs/RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md
 * Invariant: cube.topology is never agent-owned — cognition_ingress only.
 */

import {
  assertCubeTopologyWriteV0,
  CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
  sealCubeTopologyOwnershipV0
} from "./cubeTopologyOwnershipInvariantV0.js";

export const COGNITIVE_SEMANTIC_AXES_V1 = Object.freeze({
  OBSERVATION: Object.freeze(["merhaba", "selam", "kim", "ne", "göster", "bak", "bul", "açık", "yeni"]),
  REASONING: Object.freeze(["neden", "anladım", "teşekkür", "mantık", "denge", "çözüm", "çünkü", "nasıl", "bağ"]),
  MEMORY: Object.freeze(["hatırla", "geçmiş", "önce", "eski", "zaman", "bellek", "dün", "iz", "kök"]),
  ACTION: Object.freeze(["korku", "tehlike", "hata", "sil", "vur", "hızlı", "kaç", "yanlış", "kır"])
});

export const COGNITIVE_DOMINANT_COLORS_V1 = Object.freeze({
  NEUTRAL: Object.freeze({ base: 0x6496ff, accent: 0x96c8ff, emissive: 0x4a7fd4, ring: 0xc8dcff }),
  OBSERVATION: Object.freeze({ base: 0x0e7490, accent: 0x22d3ee, emissive: 0x06b6d4, ring: 0x00d4ff }),
  REASONING: Object.freeze({ base: 0x7c3aed, accent: 0xe879f9, emissive: 0xc026d3, ring: 0xf0abfc }),
  MEMORY: Object.freeze({ base: 0x15803d, accent: 0x4ade80, emissive: 0x22c55e, ring: 0x86efac }),
  ACTION: Object.freeze({ base: 0xb91c1c, accent: 0xf87171, emissive: 0xef4444, ring: 0xffa8a8 })
});

/** @deprecated — tests + legacy tint bridge */
export const SPEAKING_CRYSTAL_PALETTE_V1 = Object.freeze([
  COGNITIVE_DOMINANT_COLORS_V1.OBSERVATION,
  COGNITIVE_DOMINANT_COLORS_V1.MEMORY,
  COGNITIVE_DOMINANT_COLORS_V1.REASONING,
  COGNITIVE_DOMINANT_COLORS_V1.ACTION
]);

export function lerpV1(start, end, t) {
  return start * (1 - t) + end * t;
}

export function randomRangeV1(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * @param {number} index
 * @param {number} total
 */
export function createCognitiveNodeV1(index, total) {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const originX = Math.cos(theta) * Math.sin(phi);
  const originY = Math.sin(theta) * Math.sin(phi);
  const originZ = Math.cos(phi);

  return {
    index,
    originX,
    originY,
    originZ,
    evolvedX: originX,
    evolvedY: originY,
    evolvedZ: originZ,
    x: originX,
    y: originY,
    z: originZ,
    vx: 0,
    vy: 0,
    vz: 0
  };
}

/**
 * @param {string} text
 */
export function analyzeCognitiveSemanticsV1(text) {
  const words = String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  let obs = 0;
  let res = 0;
  let mem = 0;
  let act = 0;

  for (const word of words) {
    if (COGNITIVE_SEMANTIC_AXES_V1.OBSERVATION.some((w) => word.includes(w))) obs += 1;
    if (COGNITIVE_SEMANTIC_AXES_V1.REASONING.some((w) => word.includes(w))) res += 1;
    if (COGNITIVE_SEMANTIC_AXES_V1.MEMORY.some((w) => word.includes(w))) mem += 1;
    if (COGNITIVE_SEMANTIC_AXES_V1.ACTION.some((w) => word.includes(w))) act += 1;
  }

  const total = obs + res + mem + act || 1;
  const targetTopology = {
    twist: (res / total) * 2.5,
    fold: (mem / total) * 0.8,
    spikes: (act / total) * 1.5,
    stretchY: 1 + (obs / total) * 1.0
  };

  const maxVal = Math.max(obs, res, mem, act);
  let dominant = "NEUTRAL";
  if (maxVal > 0) {
    if (maxVal === obs) dominant = "OBSERVATION";
    else if (maxVal === res) dominant = "REASONING";
    else if (maxVal === mem) dominant = "MEMORY";
    else if (maxVal === act) dominant = "ACTION";
  }

  return {
    obs,
    res,
    mem,
    act,
    total,
    dominant,
    contextWords: words.slice(-5),
    targetTopology,
    profile: {
      obs: Math.round((obs / total) * 100),
      res: Math.round((res / total) * 100),
      mem: Math.round((mem / total) * 100),
      act: Math.round((act / total) * 100)
    }
  };
}

/**
 * Mesh / octo tint rengi — topology + rhizohLock.
 * @param {{ twist: number, fold: number, spikes: number, stretchY: number }} topology
 * @param {number} rhizohLock
 * @param {string} [dominant]
 */
function invertHexChannelV1(value) {
  return 255 - Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Octo ↔ küp zıt renk çifti (RGB tersleme).
 * @param {{ base: number, accent: number, emissive: number, ring?: number, label?: string }} palette
 */
export function resolveOppositeCrystalColorV1(palette) {
  const invertHex = (hex) => {
    const r = invertHexChannelV1((hex >> 16) & 255);
    const g = invertHexChannelV1((hex >> 8) & 255);
    const b = invertHexChannelV1(hex & 255);
    return (r << 16) | (g << 8) | b;
  };

  return {
    base: invertHex(palette.base),
    accent: invertHex(palette.accent),
    emissive: invertHex(palette.emissive),
    ring: invertHex(palette.ring ?? palette.accent),
    label: `${palette.label || "neutral"}_inverse`
  };
}

function rgbToHslV1(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToRgbV1(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function shiftRgbHueV1(r, g, b, hueShift01, amount = 0.42) {
  const hsl = rgbToHslV1(r, g, b);
  const nextH = (hsl.h + hueShift01 * 360) % 360;
  const blendedH = lerpV1(hsl.h, nextH, amount);
  const blendedS = Math.min(1, hsl.s + 0.12);
  return hslToRgbV1(blendedH, blendedS, hsl.l);
}

/**
 * @param {string} [draftText]
 * @param {number} [time]
 */
export function resolveTypingHueShiftV1(draftText = "", time = 0) {
  const text = String(draftText || "");
  let seed = 0;
  for (let i = 0; i < text.length; i += 1) {
    seed += text.charCodeAt(i) * (i + 5);
  }
  return ((seed % 360) + time * 22) / 360;
}

export function resolveCognitiveCrystalColorV1(
  topology,
  rhizohLock = 0,
  dominant = "NEUTRAL",
  draftText = "",
  time = 0
) {
  const top = topology || { twist: 0, fold: 0, spikes: 0, stretchY: 1 };
  let r = 100;
  let g = 150;
  let b = 255;

  if (top.stretchY > 1.12) {
    r = 14;
    g = 165;
    b = 233;
  }
  if (top.twist > 0.35) {
    r = 255;
    g = 100;
    b = 255;
  }
  if (top.spikes > 0.35) {
    r = 255;
    g = 50;
    b = 50;
  }
  if (top.fold > 0.22) {
    r = 100;
    g = 255;
    b = 100;
  }

  const lock = Math.max(0, Math.min(1, rhizohLock * 0.42));
  r = Math.round(lerpV1(r, 200, lock));
  g = Math.round(lerpV1(g, 200, lock));
  b = Math.round(lerpV1(b, 255, lock));

  const hueShift = resolveTypingHueShiftV1(draftText, time);
  const shifted = shiftRgbHueV1(r, g, b, hueShift, draftText.trim() ? 0.52 : 0.28);
  r = shifted.r;
  g = shifted.g;
  b = shifted.b;

  const base = (r << 16) | (g << 8) | b;
  const accent = ((Math.min(255, r + 40)) << 16) | ((Math.min(255, g + 30)) << 8) | Math.min(255, b + 10);
  const emissive = ((Math.min(255, r + 18)) << 16) | ((Math.min(255, g + 12)) << 8) | Math.min(255, b + 24);
  const ring = ((Math.min(255, r + 80)) << 16) | ((Math.min(255, g + 80)) << 8) | Math.min(255, b + 20);

  return {
    base,
    accent,
    emissive,
    ring,
    label: dominant.toLowerCase(),
    rgb: { r, g, b },
    phase: top.twist + top.fold + top.spikes + hueShift
  };
}

/**
 * @param {string} draftText
 * @param {{ words?: number, activation?: number }} [drive]
 */
export function resolveSpeakingCrystalColorV1(draftText, drive = {}) {
  const text = String(draftText || "").trim();
  if (!text) return { ...COGNITIVE_DOMINANT_COLORS_V1.NEUTRAL, label: "neutral", phase: 0 };

  const semantic = analyzeCognitiveSemanticsV1(text);
  const activation = drive.activation ?? 0;
  const energy = Math.min(1, 0.25 + text.length / 120 + (drive.words ?? 0) * 0.06 + activation * 0.2);
  const rhizohLock = Math.max(0, 1 - energy);

  return resolveCognitiveCrystalColorV1(
    semantic.targetTopology,
    rhizohLock,
    semantic.dominant
  );
}

/**
 * @param {ReturnType<typeof createCognitiveNodeV1>[]} nodes
 * @param {number} [thresholdSq]
 */
export function buildCognitiveLinkPairsV1(nodes, thresholdSq = 0.18) {
  /** @type {[number, number][]} */
  const pairs = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.originX - b.originX;
      const dy = a.originY - b.originY;
      const dz = a.originZ - b.originZ;
      if (dx * dx + dy * dy + dz * dz < thresholdSq) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}

/**
 * @param {object} engine
 * @param {number} delta
 * @param {number} nowMs
 * @param {string} draftText
 */
export function stepCognitiveGeometryEngineV1(engine, delta, nowMs, draftText = "", opts = {}) {
  const timeSinceLastKey = nowMs - engine.lastTypingTime;
  const hasText = String(draftText || "").trim().length > 0;
  const sessionDrift = Boolean(opts.sessionDrift);

  if (hasText && timeSinceLastKey < 1500) {
    engine.energy = lerpV1(engine.energy, 1, Math.min(1, delta * 6));
    engine.rhizohLock = lerpV1(engine.rhizohLock, 0, Math.min(1, delta * 3));
    engine.status = "TOPOLOGY MUTATION";
  } else if (hasText) {
    engine.energy = lerpV1(engine.energy, 0.35, Math.min(1, delta * 2));
    engine.rhizohLock = lerpV1(engine.rhizohLock, 0.55, Math.min(1, delta * 1.5));
    engine.status = "RHIZOH ASSIMILATION";
  } else if (sessionDrift) {
    engine.energy = lerpV1(engine.energy, 0.5, Math.min(1, delta * 2.2));
    engine.rhizohLock = lerpV1(engine.rhizohLock, 0.28, Math.min(1, delta * 1.8));
    engine.status = "FREE DRIFT";
  } else {
    engine.energy = lerpV1(engine.energy, 0, Math.min(1, delta * 2));
    engine.rhizohLock = lerpV1(engine.rhizohLock, 1, Math.min(1, delta * 2));
    engine.status = engine.rhizohLock > 0.99 ? "GEOMETRY LOCKED" : "SYSTEM IDLE";
  }

  const top = engine.currentTopology;
  const target = engine.targetTopology;
  const blend = Math.min(1, delta * 3);
  top.twist = lerpV1(top.twist, target.twist, blend);
  top.fold = lerpV1(top.fold, target.fold, blend);
  top.spikes = lerpV1(top.spikes, target.spikes, blend);
  top.stretchY = lerpV1(top.stretchY, target.stretchY, blend);

  const cubeSpinSign = engine.cubeSpinSign ?? 1;
  const cubeSpinRate = opts.cubeSpinRate ?? 1;
  engine.rotationY += delta * (0.22 + engine.energy * 0.72) * cubeSpinSign * cubeSpinRate;
  engine.rotationX += delta * 0.09 * cubeSpinSign * cubeSpinRate;

  const energy = engine.energy;
  const lock = engine.rhizohLock;

  for (const node of engine.nodes) {
    let nx = node.originX;
    let ny = node.originY;
    let nz = node.originZ;

    const twistAngle = top.twist * ny * Math.PI;
    const tx = nx * Math.cos(twistAngle) - nz * Math.sin(twistAngle);
    const tz = nx * Math.sin(twistAngle) + nz * Math.cos(twistAngle);
    nx = tx;
    nz = tz;

    const dist = Math.sqrt(nx * nx + ny * ny + nz * nz);
    const foldFactor = Math.max(0.2, 1 - top.fold / (dist + 0.1));
    nx *= foldFactor;
    ny *= foldFactor;
    nz *= foldFactor;

    const spike = Math.sin(nx * 15) * Math.cos(ny * 15) * top.spikes;
    nx += nx * spike;
    ny += ny * spike;
    nz += nz * spike;

    ny *= top.stretchY;

    if (energy > 0.02) {
      node.evolvedX = lerpV1(node.evolvedX, nx, 0.05 * energy);
      node.evolvedY = lerpV1(node.evolvedY, ny, 0.05 * energy);
      node.evolvedZ = lerpV1(node.evolvedZ, nz, 0.05 * energy);
    }

    node.vx += randomRangeV1(-energy, energy) * 0.05;
    node.vy += randomRangeV1(-energy, energy) * 0.05;
    node.vz += randomRangeV1(-energy, energy) * 0.05;

    node.vx += (node.evolvedX - node.x) * (0.02 + lock * 0.1);
    node.vy += (node.evolvedY - node.y) * (0.02 + lock * 0.1);
    node.vz += (node.evolvedZ - node.z) * (0.02 + lock * 0.1);

    node.vx *= 0.85;
    node.vy *= 0.85;
    node.vz *= 0.85;

    node.x += node.vx;
    node.y += node.vy;
    node.z += node.vz;
  }

  return resolveCognitiveCrystalColorV1(top, lock, engine.dominant, draftText, nowMs / 1000);
}

/**
 * @param {number} [numNodes]
 */
export function createCognitiveGeometryEngineV1(numNodes = 96) {
  const nodes = [];
  for (let i = 0; i < numNodes; i += 1) {
    nodes.push(createCognitiveNodeV1(i, numNodes));
  }

  const engine = {
    nodes,
    numNodes,
    linkPairs: buildCognitiveLinkPairsV1(nodes),
    rotationX: 0,
    rotationY: 0,
    targetTopology: { twist: 0, fold: 0, spikes: 0, stretchY: 1 },
    currentTopology: { twist: 0, fold: 0, spikes: 0, stretchY: 1 },
    energy: 0,
    rhizohLock: 1,
    lastTypingTime: Date.now(),
    lastDraftSnapshot: "",
    lastSentenceSnapshot: "",
    dominant: "NEUTRAL",
    status: "SYSTEM IDLE",
    contextWords: []
  };
  sealCubeTopologyOwnershipV0(engine);
  return engine;
}

/**
 * @param {ReturnType<typeof createCognitiveGeometryEngineV1>} engine
 * @param {string} draftText
 */
/**
 * @param {string} text
 */
export function extractActiveSentenceV1(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || trimmed;
}

/**
 * @param {string} draftText
 * @param {string} replyText
 * @param {number} [submitPulse]
 */
export function buildSentenceColorKeyV1(draftText, replyText, submitPulse = 0) {
  const active =
    extractActiveSentenceV1(draftText) || extractActiveSentenceV1(replyText);
  return `${submitPulse}::${active}`;
}

export function ingestCognitiveDraftV1(engine, draftText) {
  const text = String(draftText || "");
  if (text === engine.lastDraftSnapshot) return;
  engine.lastDraftSnapshot = text;
  engine.lastTypingTime = Date.now();

  if (!text.trim()) return;

  const semantic = analyzeCognitiveSemanticsV1(text);
  const write = assertCubeTopologyWriteV0(
    engine,
    CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
    semantic.targetTopology
  );
  if (!write.ok) return;
  engine.targetTopology = { ...semantic.targetTopology };
  engine.dominant = semantic.dominant;
  engine.contextWords = semantic.contextWords;
  engine.status = "TOPOLOGY MUTATION";
}

/**
 * Her yeni cümlede topoloji + renk tazele.
 * @param {ReturnType<typeof createCognitiveGeometryEngineV1>} engine
 * @param {string} sentence
 */
export function ingestActiveSentenceV1(engine, sentence) {
  const text = String(sentence || "").trim();
  if (!text) return false;
  if (text === engine.lastSentenceSnapshot) return false;
  engine.lastSentenceSnapshot = text;
  engine.lastTypingTime = Date.now();

  const semantic = analyzeCognitiveSemanticsV1(text);
  const write = assertCubeTopologyWriteV0(
    engine,
    CUBE_TOPOLOGY_COGNITION_INGRESS_V0,
    semantic.targetTopology
  );
  if (!write.ok) return false;
  engine.targetTopology = { ...semantic.targetTopology };
  engine.dominant = semantic.dominant;
  engine.contextWords = semantic.contextWords;
  engine.status = "SENTENCE MUTATION";
  return true;
}
