/**
 * Ghost Ecology v1 + Dynamics v1.1 — thread↔thread ecology with decay kernels (projection only).
 * Caps + ephemeral pollen; dynamics curb affinity lock, rivalry spiral, coalition empire.
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/** @param {Record<string, unknown>} m */
function mixL1Intent(m, n) {
  const x = m && typeof m === "object" ? m : {};
  const y = n && typeof n === "object" ? n : {};
  return (
    Math.abs(Number(x.BUILD) - Number(y.BUILD)) +
    Math.abs(Number(x.CRISIS) - Number(y.CRISIS)) +
    Math.abs(Number(x.PLAY) - Number(y.PLAY)) +
    Math.abs(Number(x.OBSERVE) - Number(y.OBSERVE))
  );
}

export const GHOST_ECOLOGY_V1 = Object.freeze({
  version: "1.1",
  maxAffinityEdges: 12,
  maxRivalryEdges: 6,
  maxCoalitionSize: 3,
  pollenTtlMs: 360_000,
  /** Dynamics v1.1 */
  pollenHalfLifeMs: 140_000,
  rivalryCoolingHalfLifeMs: 95_000,
  affinityFatigueBuildPerMs: 4.2e-6,
  affinityFatigueRelaxPowPerSec: 0.88,
  affinityFatigueWeight: 0.42,
  coalitionExposureHalfLifeMs: 110_000,
  coalitionExposureBump: 0.16,
  coalitionEntropyCoeff: 0.24,
  mimicryDecayHalfLifeMs: 72_000,
  mimicryDecayFloor: 0.22
});

/** @param {string} a @param {string} b */
function pairKey(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

/** Role complementarity (symmetric) → 0..1 */
const COMPLEMENT = {
  listener: { scout: 0.82, mediator: 0.62, counterweight: 0.48, listener: 0.35 },
  scout: { listener: 0.82, mediator: 0.52, counterweight: 0.58, scout: 0.28 },
  mediator: { listener: 0.62, scout: 0.52, counterweight: 0.72, mediator: 0.3 },
  counterweight: { listener: 0.48, scout: 0.58, mediator: 0.72, counterweight: 0.25 }
};

function complementScore(roleA, roleB) {
  const a = String(roleA || "listener");
  const b = String(roleB || "listener");
  const row = COMPLEMENT[a] || COMPLEMENT.listener;
  return clamp01(Number(row[b]) || 0.42);
}

/** Directed pollen residue */
const pollenStore = new Map();

/** Singleton dynamics state (session-local; not continuity). */
const dynamics = {
  lastTickAt: 0,
  lastDomTheme: "",
  affinityFatigue: new Map(),
  rivalryHeat: new Map(),
  exposure: new Map(),
  mimicMul: new Map()
};

function decayPollenStrength(now) {
  const half = GHOST_ECOLOGY_V1.pollenHalfLifeMs;
  for (const [k, v] of pollenStore.entries()) {
    if (!v || typeof v !== "object") {
      pollenStore.delete(k);
      continue;
    }
    const last = Number(v.lastTick) || now;
    const dt = Math.max(0, Math.min(180_000, now - last));
    let s = Number(v.strength) || 0;
    if (dt > 0 && half > 1) {
      s *= Math.pow(0.5, dt / half);
    }
    if (s < 0.018 || Number(v.expiresAt) <= now) pollenStore.delete(k);
    else pollenStore.set(k, { ...v, strength: clamp01(s), lastTick: now });
  }
}

function prunePollen(now) {
  for (const [k, v] of pollenStore.entries()) {
    if (!v || Number(v.expiresAt) <= now) pollenStore.delete(k);
  }
}

function bumpPollen(from, to, amount, now) {
  const a = String(from);
  const b = String(to);
  if (!a || !b || a === b) return;
  const k = `${a}|${b}`;
  const prev = pollenStore.get(k);
  const strength = clamp01((prev?.strength || 0) + amount);
  pollenStore.set(k, {
    strength,
    expiresAt: now + GHOST_ECOLOGY_V1.pollenTtlMs,
    lastTick: now
  });
}

/**
 * @param {ReturnType<typeof computeGhostEcologyV1>} ge
 * @param {number} now
 */
function buildGhostEcologySnapshot(ge, now) {
  const transfers = Array.isArray(ge.pollenTransfers) ? ge.pollenTransfers : [];
  const incoming = new Map();
  for (const p of transfers) {
    const to = String(p.to);
    incoming.set(to, (incoming.get(to) || 0) + Number(p.strength) || 0);
  }
  const dominantPollenSignatures = [...incoming.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([threadId, score]) => ({
      threadId,
      score: Math.round(score * 1000) / 1000
    }));

  const coalitions = Array.isArray(ge.coalitions) ? ge.coalitions : [];
  const threadEcology = ge.threadEcology && typeof ge.threadEcology === "object" ? ge.threadEcology : {};
  const coalitionResidues = coalitions.slice(0, 4).map((c) => {
    const members = Array.isArray(c.members) ? c.members : [];
    let sum = 0;
    let n = 0;
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const ta = threadEcology[members[i]];
        const tb = threadEcology[members[j]];
        const w =
          ta?.affinity?.[members[j]] ??
          tb?.affinity?.[members[i]] ??
          0;
        sum += Number(w) || 0;
        n += 1;
      }
    }
    const residue = n ? Math.round((sum / n) * 1000) / 1000 : 0;
    return { coalitionId: String(c.id || ""), memberCount: members.length, residue };
  });

  const dormancyClusters = Array.isArray(ge.dormancyClusters) ? ge.dormancyClusters : [];
  const dormancySeeds = dormancyClusters.slice(0, 4).map((d) => ({
    clusterId: String(d.id || ""),
    threadCount: Array.isArray(d.threadIds) ? d.threadIds.length : 0,
    seedHint: "latent_awakening"
  }));

  return {
    version: "1",
    capturedAt: now,
    dominantPollenSignatures,
    coalitionResidues,
    dormancySeeds
  };
}

/**
 * @param {{ cognitiveThreads: unknown[], chorus: Record<string, unknown>, socialPhysics?: Record<string, unknown> | null, now?: number }} input
 */
export function computeGhostEcologyV1(input) {
  const now = Number(input.now) || Date.now();
  prunePollen(now);
  decayPollenStrength(now);

  const dt =
    dynamics.lastTickAt > 0 ? Math.max(0, Math.min(90_000, now - dynamics.lastTickAt)) : 0;
  dynamics.lastTickAt = now;

  const threads = (Array.isArray(input.cognitiveThreads) ? input.cognitiveThreads : []).filter(
    (t) => t && typeof t === "object" && String(t.id || "").trim()
  );
  const chorus = input.chorus && typeof input.chorus === "object" ? input.chorus : {};
  const domTheme = String(chorus.dominantTheme || "");
  const conflictNote = String(chorus.conflictNote || "");
  const sp = input.socialPhysics && typeof input.socialPhysics === "object" ? input.socialPhysics : {};
  const trustMean = clamp01(Number(sp.trustMean) || 0);
  const famMean = clamp01(Number(sp.familiarityMean) || 0);
  const trustRes = clamp01(0.55 * trustMean + 0.45 * famMean);

  if (domTheme !== dynamics.lastDomTheme) {
    dynamics.lastDomTheme = domTheme;
    dynamics.mimicMul.clear();
  }

  const expHalf = GHOST_ECOLOGY_V1.coalitionExposureHalfLifeMs;
  const expDecay = expHalf > 0 ? Math.exp(-dt / expHalf) : 1;

  /** @type {{ id: string, role: string, util: number, mix: Record<string, unknown>, status: string }[]} */
  const nodes = threads.map((t) => ({
    id: String(t.id),
    role: String(t.role || "listener"),
    util: clamp01(Number(t.utilityAccumulator) || 0),
    mix: t.sourceIntentMix && typeof t.sourceIntentMix === "object" ? t.sourceIntentMix : {},
    status: String(t.status || "active")
  }));

  for (const n of nodes) {
    let e = (dynamics.exposure.get(n.id) || 0) * expDecay;
    dynamics.exposure.set(n.id, clamp01(e));
  }

  const leaderIdByTheme = new Map();
  for (const n of nodes) {
    if (!domTheme || n.role !== domTheme) continue;
    const prev = leaderIdByTheme.get(domTheme);
    const pu = nodes.find((x) => x.id === prev)?.util ?? -1;
    if (!prev || n.util > pu) leaderIdByTheme.set(domTheme, n.id);
  }

  /** @type {Record<string, Record<string, number>>} */
  const affinityM = {};
  /** @type {Record<string, Record<string, number>>} */
  const rivalryM = {};

  const pairs = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      pairs.push([nodes[i], nodes[j]]);
    }
  }

  const rivHalf = GHOST_ECOLOGY_V1.rivalryCoolingHalfLifeMs;
  const rivDecay = rivHalf > 0 ? Math.exp(-dt / rivHalf) : 1;
  const fatRelax =
    dt > 0 ? Math.pow(GHOST_ECOLOGY_V1.affinityFatigueRelaxPowPerSec, dt / 1000) : 1;

  for (const [a, b] of pairs) {
    const intentOverlap = clamp01(1 - mixL1Intent(a.mix, b.mix) / 4);
    const roleComp = complementScore(a.role, b.role);
    const rawAff = clamp01(0.52 * intentOverlap + 0.28 * trustRes + 0.2 * roleComp);

    const sameNiche = a.role === b.role ? 0.52 : 0.1;
    let conflictBoost = 0;
    if (conflictNote && conflictNote.includes(a.role) && conflictNote.includes(b.role) && a.role !== b.role) {
      conflictBoost = 0.22;
    }
    const intentFight = clamp01(mixL1Intent(a.mix, b.mix) / 4) * 0.38;
    const sumU = Math.max(0.02, a.util + b.util);
    const attentionRace = clamp01(1 - Math.abs(a.util - b.util) / sumU) * (0.25 + 0.55 * Math.max(a.util, b.util));
    const rawRiv = clamp01(sameNiche + conflictBoost + intentFight * 0.35 + attentionRace * 0.45);

    const pk = pairKey(a.id, b.id);

    let fat = dynamics.affinityFatigue.get(pk) || 0;
    if (rawAff > 0.52) fat = clamp01(fat + dt * GHOST_ECOLOGY_V1.affinityFatigueBuildPerMs);
    else fat *= fatRelax;
    dynamics.affinityFatigue.set(pk, fat);
    let aff = rawAff * (1 - GHOST_ECOLOGY_V1.affinityFatigueWeight * fat);

    let heat = dynamics.rivalryHeat.get(pk) || 0;
    heat = clamp01(heat * rivDecay + rawRiv * 0.32);
    dynamics.rivalryHeat.set(pk, heat);
    const riv = heat;

    let ea = dynamics.exposure.get(a.id) || 0;
    let eb = dynamics.exposure.get(b.id) || 0;
    if (rawAff > 0.48) {
      ea = clamp01(ea + GHOST_ECOLOGY_V1.coalitionExposureBump);
      eb = clamp01(eb + GHOST_ECOLOGY_V1.coalitionExposureBump);
    }
    dynamics.exposure.set(a.id, ea);
    dynamics.exposure.set(b.id, eb);
    const entropyTax = 1 / (1 + GHOST_ECOLOGY_V1.coalitionEntropyCoeff * (ea + eb));
    aff = clamp01(aff * entropyTax);

    if (!affinityM[a.id]) affinityM[a.id] = {};
    if (!affinityM[b.id]) affinityM[b.id] = {};
    affinityM[a.id][b.id] = aff;
    affinityM[b.id][a.id] = aff;

    if (!rivalryM[a.id]) rivalryM[a.id] = {};
    if (!rivalryM[b.id]) rivalryM[b.id] = {};
    rivalryM[a.id][b.id] = riv;
    rivalryM[b.id][a.id] = riv;

    if (aff > 0.56) {
      bumpPollen(a.id, b.id, 0.035, now);
      bumpPollen(b.id, a.id, 0.03, now);
    }
  }

  /** @type {Record<string, { affinity: Record<string, number>, rivalry: Record<string, number>, mimicry: { weight: number, towardTheme: string }, coalition: string | null, dormancyCluster: string | null, pollenSignature: Record<string, number> }>} */
  const threadEcology = {};

  const mimicHalf = GHOST_ECOLOGY_V1.mimicryDecayHalfLifeMs;
  const mimicDecay = mimicHalf > 0 ? Math.exp(-dt / mimicHalf) : 1;

  for (const n of nodes) {
    let rawMimic = 0;
    if (domTheme && n.role === domTheme) {
      const leader = leaderIdByTheme.get(domTheme);
      if (leader && leader !== n.id) {
        const lu = nodes.find((x) => x.id === leader)?.util || 0.001;
        rawMimic = clamp01((lu - n.util) / Math.max(lu, 0.08));
      }
    }

    let mul = dynamics.mimicMul.get(n.id);
    if (mul == null) mul = 1;
    mul = Math.max(GHOST_ECOLOGY_V1.mimicryDecayFloor, mul * mimicDecay);
    if (rawMimic > 0.06) mul = clamp01(mul + rawMimic * 0.07);
    dynamics.mimicMul.set(n.id, mul);
    const mimicWeight = clamp01(rawMimic * mul);

    const affRow = affinityM[n.id] || {};
    const rivRow = rivalryM[n.id] || {};

    const topAff = Object.entries(affRow)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3);
    const topRiv = Object.entries(rivRow)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3);

    const pollenSig = {};
    for (const other of nodes) {
      if (other.id === n.id) continue;
      const pk = `${other.id}|${n.id}`;
      const cell = pollenStore.get(pk);
      if (cell && cell.strength > 0.02) pollenSig[other.id] = Math.round(cell.strength * 1000) / 1000;
    }

    threadEcology[n.id] = {
      affinity: Object.fromEntries(topAff),
      rivalry: Object.fromEntries(topRiv),
      mimicry: { weight: mimicWeight, towardTheme: domTheme || "" },
      coalition: null,
      dormancyCluster: null,
      pollenSignature: pollenSig
    };
  }

  const affinityEdges = pairs
    .map(([a, b]) => {
      const w = affinityM[a.id]?.[b.id] ?? 0;
      return { from: a.id, to: b.id, w: Math.round(w * 1000) / 1000 };
    })
    .filter((e) => e.w > 0.38)
    .sort((x, y) => y.w - x.w)
    .slice(0, GHOST_ECOLOGY_V1.maxAffinityEdges);

  const rivalryEdges = pairs
    .map(([a, b]) => {
      const w = rivalryM[a.id]?.[b.id] ?? 0;
      return { from: a.id, to: b.id, w: Math.round(w * 1000) / 1000 };
    })
    .filter((e) => e.w > 0.42)
    .sort((x, y) => y.w - x.w)
    .slice(0, GHOST_ECOLOGY_V1.maxRivalryEdges);

  /** Coalitions */
  const coalitionAdj = new Map();
  for (const e of affinityEdges) {
    if (e.w < 0.5) continue;
    if (!coalitionAdj.has(e.from)) coalitionAdj.set(e.from, new Set());
    if (!coalitionAdj.has(e.to)) coalitionAdj.set(e.to, new Set());
    coalitionAdj.get(e.from).add(e.to);
    coalitionAdj.get(e.to).add(e.from);
  }

  const visited = new Set();
  /** @type {{ id: string, members: string[] }[]} */
  const coalitions = [];
  let coalIdx = 0;
  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    if (!coalitionAdj.has(n.id)) continue;
    const stack = [n.id];
    const comp = [];
    visited.add(n.id);
    while (stack.length) {
      const x = stack.pop();
      comp.push(x);
      const nb = coalitionAdj.get(x);
      if (!nb) continue;
      for (const y of nb) {
        if (!visited.has(y)) {
          visited.add(y);
          stack.push(y);
        }
      }
    }
    if (comp.length >= 2) {
      const members = comp.slice(0, GHOST_ECOLOGY_V1.maxCoalitionSize);
      const id = `coal_${coalIdx}`;
      coalIdx += 1;
      coalitions.push({ id, members });
      for (const mid of members) {
        if (threadEcology[mid]) threadEcology[mid].coalition = id;
      }
      for (const leftover of comp.slice(GHOST_ECOLOGY_V1.maxCoalitionSize)) {
        visited.delete(leftover);
      }
    }
  }

  /** Intra-coalition cohesion tax on displayed edges (empire curb) */
  const coalByThread = new Map();
  for (const c of coalitions) {
    for (const m of c.members) coalByThread.set(m, c.id);
  }
  for (const e of affinityEdges) {
    const ca = coalByThread.get(e.from);
    const cb = coalByThread.get(e.to);
    if (ca && cb && ca === cb) {
      const c = coalitions.find((x) => x.id === ca);
      const s = c?.members?.length ?? 2;
      const tax = 1 / (1 + 0.11 * Math.max(0, s - 2));
      e.w = Math.round(e.w * tax * 1000) / 1000;
    }
  }

  const dormant = nodes.filter((x) => x.status === "warm" || x.status === "hibernating");
  /** @type {{ id: string, threadIds: string[] }[]} */
  const dormancyClusters = [];
  const dormSeen = new Set();
  let dIdx = 0;
  for (const seed of dormant) {
    if (dormSeen.has(seed.id)) continue;
    const cluster = [seed.id];
    dormSeen.add(seed.id);
    for (const other of dormant) {
      if (dormSeen.has(other.id)) continue;
      if (mixL1Intent(seed.mix, other.mix) < 0.42) {
        cluster.push(other.id);
        dormSeen.add(other.id);
      }
    }
    if (cluster.length >= 2) {
      const id = `dorm_${dIdx}`;
      dIdx += 1;
      dormancyClusters.push({ id, threadIds: cluster });
      for (const tid of cluster) {
        if (threadEcology[tid]) threadEcology[tid].dormancyCluster = id;
      }
    }
  }

  /** @type {{ from: string, to: string, strength: number }[]} */
  const pollenTransfers = [];
  for (const [k, v] of pollenStore.entries()) {
    if (!v || v.expiresAt <= now) continue;
    const [from, to] = k.split("|");
    pollenTransfers.push({
      from,
      to,
      strength: Math.round(Number(v.strength) * 1000) / 1000
    });
  }
  pollenTransfers.sort((a, b) => b.strength - a.strength);
  if (pollenTransfers.length > 24) pollenTransfers.length = 24;

  const mimicChains = nodes
    .filter((n) => threadEcology[n.id]?.mimicry?.weight > 0.08)
    .map((n) => ({
      followerId: n.id,
      theme: domTheme,
      weight: threadEcology[n.id].mimicry.weight
    }))
    .slice(0, 6);

  const base = {
    version: GHOST_ECOLOGY_V1.version,
    limits: { ...GHOST_ECOLOGY_V1 },
    threadEcology,
    affinityEdges,
    rivalryEdges,
    coalitions,
    mimicChains,
    pollenTransfers,
    dormancyClusters,
    meta: {
      computedAt: now,
      trustResonance: Math.round(trustRes * 1000) / 1000,
      dominantTheme: domTheme || null,
      conflictActive: conflictNote.length > 0,
      dynamics: {
        affinityFatiguePairs: dynamics.affinityFatigue.size,
        rivalryHeatPairs: dynamics.rivalryHeat.size,
        mimicMulTracked: dynamics.mimicMul.size
      }
    }
  };

  base.snapshot = buildGhostEcologySnapshot(base, now);

  return base;
}
