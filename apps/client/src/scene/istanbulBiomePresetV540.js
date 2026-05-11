/**
 * vNext-540 — Istanbul constitutional field: anchors + feed stubs (5 districts, Boğaz path).
 */

import * as THREE from "three";
import { aggregateRegionalSnapshots } from "../kernel/render/regionalSnapshotAggregator.js";
import { buildFieldAtlas } from "../kernel/render/fieldAtlasBuilder.js";
import { buildBranchRiverSegments } from "../kernel/render/branchRiverRenderer.js";

/**
 * @typedef {object} IstanbulDistrictAnchor
 * @property {string} regionId
 * @property {string} label
 * @property {number} cx
 * @property {number} cy
 * @property {number} cz
 * @property {THREE.Vector3} position stylized scene units (not WGS84)
 */

/** @type {IstanbulDistrictAnchor[]} */
export const ISTANBUL_V540_DISTRICTS = [
  {
    regionId: "besiktas",
    label: "Beşiktaş",
    cx: 2,
    cy: 0,
    cz: 1,
    position: new THREE.Vector3(-4.2, 0.2, -12)
  },
  {
    regionId: "kadikoy",
    label: "Kadıköy",
    cx: 3,
    cy: 0,
    cz: 2,
    position: new THREE.Vector3(6.5, 0.15, 4.8)
  },
  {
    regionId: "sisli",
    label: "Şişli",
    cx: 1,
    cy: 1,
    cz: 0,
    position: new THREE.Vector3(-6.5, 0.25, -2)
  },
  {
    regionId: "uskudar",
    label: "Üsküdar",
    cx: 4,
    cy: 0,
    cz: 1,
    position: new THREE.Vector3(4.8, 0.18, -8)
  },
  {
    regionId: "fatih",
    label: "Fatih",
    cx: 0,
    cy: 0,
    cz: 2,
    position: new THREE.Vector3(-1.5, 0.12, 2.5)
  }
];

/** Piecewise Boğaz spine for lineage rivers (Europe → Asia, stylized). */
export const BOSPORUS_PATH_V540 = [
  new THREE.Vector3(-8, 0, -14),
  new THREE.Vector3(-5, 0, -10),
  new THREE.Vector3(-2, 0, -5),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(2.5, 0, 4),
  new THREE.Vector3(5.5, 0, 8),
  new THREE.Vector3(9, 0, 12)
];

/**
 * Stub feeds → regional snapshots (pressure + resonance shaped by domain).
 * @param {object} [feeds]
 * @param {number} [feeds.weather] 0–1
 * @param {number} [feeds.traffic] 0–1
 * @param {number} [feeds.transit] 0–1
 * @param {number} [feeds.events] 0–1
 * @param {number} [feeds.microseism] 0–1
 * @param {number} [feeds.gridHealth] 0–1 şebeke sağlığı (yüksek = düşük latent stress)
 * @param {number} [t] time phase for gentle motion
 * @returns {Array<import("../kernel/render/regionalSnapshotAggregator.js").RegionalSnapshot>}
 */
export function stubRegionalSnapshotsFromFeeds(feeds = {}, t = 0) {
  const w = feeds.weather ?? 0.5;
  const tr = feeds.traffic ?? 0.45;
  const transit = feeds.transit ?? 0.5;
  const ev = feeds.events ?? 0.4;
  const ms = feeds.microseism ?? 0.05;
  const gh = feeds.gridHealth ?? 0.74;
  const latentStress = Math.max(0, Math.min(1, 1 - gh));
  const phase = Math.sin(t * 0.7) * 0.04;

  /** @type {Array<import("../kernel/render/regionalSnapshotAggregator.js").RegionalSnapshot>} */
  const out = [];
  let i = 0;
  for (const d of ISTANBUL_V540_DISTRICTS) {
    const bias = i * 0.07;
    let truth = 0.55 + w * 0.25 + phase - bias * 0.1 - latentStress * 0.06;
    let contradiction = 0.25 + tr * 0.45 + (i === 1 || i === 3 ? 0.08 : 0) + latentStress * 0.14;
    const legitimacy = 0.5 + transit * 0.2 + (i === 4 ? 0.12 : 0) - latentStress * 0.04;
    let memory = 0.45 + ms * 0.35 + (i === 4 ? 0.1 : 0) + latentStress * 0.08;
    const novelty = 0.35 + ev * 0.4 + (i === 0 || i === 2 ? 0.1 : 0);
    truth = Math.min(1, Math.max(0, truth));
    contradiction = Math.min(1, Math.max(0, contradiction));
    memory = Math.min(1, Math.max(0, memory));
    out.push({
      regionId: d.regionId,
      pressureVector: [
        Math.min(1, Math.max(0, truth)),
        Math.min(1, Math.max(0, contradiction)),
        Math.min(1, Math.max(0, legitimacy)),
        Math.min(1, Math.max(0, memory)),
        Math.min(1, Math.max(0, novelty))
      ],
      resonanceField: {
        truthResonance: 0.5 + w * 0.2,
        contradictionResonance: 0.15 + tr * 0.35 + latentStress * 0.12,
        memoryResonance: 0.4 + ms * 0.25 + latentStress * 0.08,
        legitimacyResonance: 0.5 + transit * 0.25,
        noveltyResonance: 0.35 + ev * 0.35
      },
      branchEntropy: Math.min(1, 0.08 + tr * 0.15 + i * 0.02 + latentStress * 0.12),
      conflictSeverity: Math.min(1, 0.05 + tr * 0.2 + contradiction * 0.15 + latentStress * 0.1)
    });
    i++;
  }
  return out;
}

/** @type {Record<string, string>} */
export const ISTANBUL_DISTRICT_LABEL_TR = Object.fromEntries(
  ISTANBUL_V540_DISTRICTS.map((d) => [d.regionId, d.label])
);

/**
 * Atlas + bridge input from an existing canonical regional map (vNext-541+).
 * @param {Map<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} regionalMap
 * @param {object} [opts]
 * @param {object} [opts.weatherSummary]
 * @param {string} [opts.epochHash]
 * @param {string} [opts.parentEpochHash]
 */
export function buildIstanbulBridgePayloadFromRegionalMap(regionalMap, opts = {}) {
  const cells = ISTANBUL_V540_DISTRICTS.map((d) => ({
    cx: d.cx,
    cy: d.cy,
    cz: d.cz,
    sample: regionalMap.get(d.regionId)
  })).filter((c) => c.sample);
  const atlas = buildFieldAtlas({ cells });
  const branchSegments = buildBranchRiverSegments({
    parentEpochHash: opts.parentEpochHash ?? "0xistanbul-root",
    children: [
      { epochHash: "0xepoch-besiktas", lineageBranchId: "bogaz-n" },
      { epochHash: "0xepoch-kadikoy", lineageBranchId: "bogaz-s" },
      { epochHash: "0xepoch-fatih", lineageBranchId: "main" }
    ],
    mergeMeta: { mergeAncestry: ["0xmerge-a", "0xmerge-b"] },
    prunedHashes: ["0xpruned-demo"]
  });
  const ws = opts.weatherSummary && typeof opts.weatherSummary === "object" ? opts.weatherSummary : {};
  return {
    atlas,
    regionalMap,
    regionalSamples: regionalMap,
    branchSegments,
    weatherSummary: { ...ws },
    epochHash: opts.epochHash ?? `0xist-${Date.now()}`
  };
}

/**
 * Full bridge input: atlas + regional map + demo lineage along Boğaz metaphor.
 * @param {object} [opts]
 * @param {object} [opts.feeds]
 * @param {number} [opts.t]
 * @param {string} [opts.epochHash]
 */
export function buildIstanbulBridgeInputV540(opts = {}) {
  const feeds = opts.feeds ?? {};
  const t = opts.t ?? 0;
  const snaps = stubRegionalSnapshotsFromFeeds(feeds, t);
  const regionalMap = aggregateRegionalSnapshots(snaps);
  const payload = buildIstanbulBridgePayloadFromRegionalMap(regionalMap, {
    epochHash: opts.epochHash ?? `0xist-${Math.floor(t * 1000)}`,
    parentEpochHash: opts.parentEpochHash,
    weatherSummary: {
      meanGlow: feeds.weather ?? 0.5,
      trafficStress: feeds.traffic ?? 0.45,
      culturalNovelty: feeds.events ?? 0.4
    }
  });
  return payload;
}
