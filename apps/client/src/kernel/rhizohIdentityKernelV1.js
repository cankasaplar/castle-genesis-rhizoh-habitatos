/**
 * Rhizoh Identity Graph v0 — kalıcı persona + dünya sürekliliği (client-first).
 * localStorage: rhizoh.identity.graph.v1
 */

import { WORLD_MESH_LABELS_V0 } from "../rhizoh/spatial/worldMeshLabelsV0.js";

const STORAGE_KEY = "rhizoh.identity.graph.v1";

export function defaultIdentityGraph() {
  return {
    version: 1,
    updatedAt: Date.now(),
    user: {
      interests: [],
      habits: [],
      goals: [],
      unfinished: [],
      emotionalTone: "curious",
      preferredModality: "mixed",
      favoriteAgents: [],
      favoritePlaces: ["Bootstrap window · Istanbul"],
      lastVisitAt: Date.now(),
      visitCount: 1
    },
    rhizoh: {
      trust: 0.42,
      familiarity: 0.35,
      opinionSummary: "Operator is building continuity with the city field.",
      lastSuggestion: ""
    },
    world: {
      lastBroadcastTitle: "",
      lastBroadcastTraceId: "",
      lastBroadcastAt: 0,
      lastGreenRoomAck: "",
      openThreads: [],
      worldDeltaSummary: ""
    },
    artifacts: []
  };
}

export function readIdentityGraph() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const def = defaultIdentityGraph();
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return def;
    return {
      ...def,
      ...parsed,
      user: { ...def.user, ...parsed.user },
      rhizoh: { ...def.rhizoh, ...parsed.rhizoh },
      world: { ...def.world, ...parsed.world },
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : def.artifacts
    };
  } catch {
    return defaultIdentityGraph();
  }
}

/** Tarayıcı oturumu başına ziyaret sayacı (sayfa yenilemede tekrar etmez). */
export function touchIdentitySessionOnce() {
  try {
    if (window.sessionStorage.getItem("rhizoh.identity.sessionTouched") === "1") return readIdentityGraph();
    window.sessionStorage.setItem("rhizoh.identity.sessionTouched", "1");
  } catch {
    /* noop */
  }
  const g = readIdentityGraph();
  g.user.visitCount = Math.max(1, Number(g.user.visitCount || 0) + 1);
  g.user.lastVisitAt = Date.now();
  return writeIdentityGraph(g);
}

export function writeIdentityGraph(graph) {
  try {
    const next = { ...graph, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return graph;
  }
}

function uniq(arr, cap) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = String(x || "").trim();
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s.slice(0, 120));
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Oturum sinyalleriyle grafiği güncelle (deterministik, küçük).
 */
export function hydrateIdentityGraphFromSignals(prev, signals = {}) {
  const base = prev && prev.version === 1 ? structuredClone(prev) : defaultIdentityGraph();
  const now = Date.now();

  base.user.lastVisitAt = now;
  base.user.visitCount = Math.max(1, Number(base.user.visitCount || 1));

  const profileGoals = Array.isArray(signals.profileGoals) ? signals.profileGoals : [];
  base.user.goals = uniq([...base.user.goals, ...profileGoals], 12);

  if (signals.unfinishedJourneys > 0) {
    const line = `${signals.unfinishedJourneys} open journey(s) in substrate`;
    if (!base.user.unfinished.includes(line)) base.user.unfinished = uniq([line, ...base.user.unfinished], 8);
  }

  if (signals.governanceState) {
    const g = String(signals.governanceState).toUpperCase();
    if (g === "FROZEN") base.user.emotionalTone = "tense-field";
    else if (g === "RECOVERY") base.user.emotionalTone = "rebuilding";
    else if (g === "DEGRADED") base.user.emotionalTone = "watchful";
    else base.user.emotionalTone = "steady";
  }

  if (Array.isArray(signals.heroLabels) && signals.heroLabels.length) {
    base.user.favoriteAgents = uniq([...signals.heroLabels, ...base.user.favoriteAgents], 10);
  }

  if (signals.memoryLinks > 0) {
    base.world.worldDeltaSummary = `Memory lattice ~${signals.memoryLinks} links active in Istanbul field.`;
  }

  if (signals.greenRoom && signals.greenRoom.traceId) {
    base.world.lastBroadcastTitle = String(signals.greenRoom.title || base.world.lastBroadcastTitle).slice(0, 160);
    base.world.lastBroadcastTraceId = String(signals.greenRoom.traceId);
    base.world.lastBroadcastAt = now;
    base.world.lastGreenRoomAck = String(signals.greenRoom.ack || "BROADCAST_ROUTED");
    const art = {
      id: signals.greenRoom.traceId,
      title: String(signals.greenRoom.title || "Live broadcast"),
      kind: "broadcast_card",
      at: now
    };
    base.artifacts = [art, ...base.artifacts.filter((a) => a.id !== art.id)].slice(0, 10);
    base.rhizoh.trust = Math.min(0.95, Number(base.rhizoh.trust || 0) + 0.04);
    base.rhizoh.familiarity = Math.min(0.98, Number(base.rhizoh.familiarity || 0) + 0.03);
    base.rhizoh.lastSuggestion = "Continue the broadcast thread or open replay trace.";
  }

  if (signals.lastIntentRaw) {
    const intent = String(signals.lastIntentRaw).slice(0, 200);
    if (/yayın|broadcast|canlı|greenroom/i.test(intent)) {
      base.user.interests = uniq([...base.user.interests, "live field / broadcast"], 8);
    }
    if (/istanbul|fatih/i.test(intent)) {
      base.user.favoritePlaces = uniq([...base.user.favoritePlaces, "Istanbul"], 6);
    }
  }

  if (signals.userMessage && signals.assistantSnippet) {
    base.rhizoh.familiarity = Math.min(0.99, Number(base.rhizoh.familiarity || 0) + 0.015);
  }

  return writeIdentityGraph(base);
}

/**
 * LLM system prompt için sıkı özet (Türkçe-uyumlu anahtarlar).
 */
export function buildIdentityNarrativeForLlm(graph) {
  const g = graph || defaultIdentityGraph();
  const u = g.user || {};
  const r = g.rhizoh || {};
  const w = g.world || {};
  const arts = Array.isArray(g.artifacts) ? g.artifacts.slice(0, 5) : [];

  const lines = [
    `IDENTITY_GRAPH v1 (Rhizoh uses this as continuity truth; do not invent facts beyond it):`,
    `User goals: ${(u.goals || []).slice(0, 6).join("; ") || "unknown"}`,
    `User interests: ${(u.interests || []).slice(0, 6).join("; ") || "unknown"}`,
    `Unfinished: ${(u.unfinished || []).slice(0, 4).join("; ") || "none noted"}`,
    `Tone: ${u.emotionalTone || "neutral"} · modality: ${u.preferredModality || "mixed"}`,
    `Favorite agents in field: ${(u.favoriteAgents || []).slice(0, 8).join(", ") || "none yet"}`,
    `Places: ${(u.favoritePlaces || []).slice(0, 4).join(", ")}`,
    `Rhizoh→user trust=${(Number(r.trust || 0)).toFixed(2)} familiarity=${(Number(r.familiarity || 0)).toFixed(2)} · ${r.opinionSummary || ""}`,
    `World: ${w.worldDeltaSummary || "field stable"}`,
    w.lastBroadcastTraceId
      ? `Last broadcast: "${w.lastBroadcastTitle}" trace=${w.lastBroadcastTraceId} ack=${w.lastGreenRoomAck || "n/a"} at=${w.lastBroadcastAt ? new Date(w.lastBroadcastAt).toISOString() : "n/a"}`
      : `Last broadcast: none in graph yet`,
    arts.length ? `Recent artifacts: ${arts.map((a) => `${a.kind}:${a.title}`).join(" | ")}` : `Recent artifacts: none`
  ];
  return lines.join("\n").slice(0, 2400);
}

/**
 * Geri dönen kullanıcı kartı — yayın / Curator-Scout hattı / açık journey (Türkçe).
 */
export function buildRhizohWelcomeNarrativeTr(firstName, graph, ctx = {}) {
  const g = graph && graph.version === 1 ? graph : null;
  const name = firstName ? String(firstName).trim() : "";
  const greet = name ? `${name}, tekrar hos geldin.` : "Tekrar hos geldin.";
  const unfinished = Number(ctx.unfinishedJourneys || 0);
  const mem = Number(ctx.memoryLinks || 0);

  if (!g || !g.world?.lastBroadcastTraceId) {
    const sub =
      unfinished > 0
        ? `${unfinished} acik journey substratta bekliyor. Devam mi, yeni bir sey mi kuruyoruz?`
        : mem >= 3
          ? `Hafiza kafesi ${mem} bag ile isiniyor. Bugun neye odaklanalim?`
          : "Alan sakin; bugun ne kesfediyoruz, ne yayinliyoruz?";
    return { primary: `${greet} ${sub}`, secondary: WORLD_MESH_LABELS_V0.welcomeHint };
  }

  const title = String(g.world.lastBroadcastTitle || "yayin").slice(0, 72);
  const fav = (g.user?.favoriteAgents || []).map((x) => String(x)).filter(Boolean);
  const pick = fav.find((a) => /curator|scout|archivist|broadcaster/i.test(a)) || "Curator";
  const secondAgent = fav.find((a) => a !== pick && /scout|curator|archivist/i.test(a));

  const agentLine = secondAgent ? `${pick} ve ${secondAgent} hatlari` : `${pick} hatti`;
  const primary = `${greet} Gecen gelisinde "${title}" icin bir yayin baslatmistin. ${agentLine} o yayinin yankilarini hala tutuyor.`;
  const secondary =
    unfinished > 0
      ? `${unfinished} acik journey var. Bugun devam mi ediyoruz, yeni bir sey mi kuruyoruz?`
      : "Bugun devam mi ediyoruz, yeni bir sey mi kuruyoruz?";

  return { primary, secondary };
}
