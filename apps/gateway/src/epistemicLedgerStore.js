import { getFirebasePersistence } from "./firebasePersistence.js";

const lastBySubject = new Map();

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function layerIndex(layer) {
  const m = /^L(\d+)$/i.exec(String(layer || ""));
  if (!m) return 10;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(0, Math.min(13, n)) : 10;
}

function sealScore(sealState) {
  const s = String(sealState || "").toUpperCase();
  if (s === "VERIFIED") return 1;
  if (s === "DEGRADED") return 0.5;
  if (s === "PENDING") return 0.4;
  if (s === "UNSIGNED") return 0.2;
  return 0;
}

function realityStability(mode) {
  const r = String(mode || "").toUpperCase();
  if (r === "REAL_MAP") return 0.92;
  if (r === "GLOBE") return 0.86;
  return 0.72;
}

function governanceStress(governanceState) {
  const g = String(governanceState || "NORMAL").toUpperCase();
  if (g === "CRITICAL" || g === "FROZEN") return 1;
  if (g === "DEGRADED") return 0.7;
  if (g === "RECOVERY") return 0.35;
  return 0.12;
}

function hexDistanceNorm(a, b) {
  const x = String(a || "").replace(/^0x/i, "");
  const y = String(b || "").replace(/^0x/i, "");
  if (!x || !y) return 0;
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  let diff = 0;
  for (let i = 0; i < n; i += 1) {
    if (x.charCodeAt(i) !== y.charCodeAt(i)) diff += 1;
  }
  return diff / n;
}

export function normalizeEpistemicLogEntry(entry, subjectId) {
  const t = Number(entry?.timestamp || Date.now());
  const L = layerIndex(entry?.primaryLayer);
  const S = sealScore(entry?.sealState);
  const R = realityStability(entry?.realityMode);
  const gStress = governanceStress(entry?.governanceState);
  const G = 1 - gStress;

  const prev = lastBySubject.get(subjectId) || null;
  const dh = prev ? hexDistanceNorm(entry?.runtimeHash, prev.runtimeHash) : 0;
  const dm = prev ? hexDistanceNorm(entry?.memoryDigest, prev.memoryDigest) : 0;
  const dw = prev ? hexDistanceNorm(entry?.worldSnapshotHash, prev.worldSnapshotHash) : 0;
  const D = clamp01((dh + dm + dw) / 3);

  const Ln = L / 13;
  const sigma = clamp01(0.25 * Ln + 0.25 * S + 0.2 * R + 0.15 * G + 0.15 * (1 - D));

  const vector = {
    timestamp: t,
    primaryLayer: String(entry?.primaryLayer || `L${L}`),
    layerIndex: L,
    sealState: String(entry?.sealState || "UNKNOWN").toUpperCase(),
    sealScore: Math.round(S * 1000) / 1000,
    realityMode: String(entry?.realityMode || "UNKNOWN"),
    realityStability: Math.round(R * 1000) / 1000,
    governanceState: String(entry?.governanceState || "NORMAL"),
    govStress: Math.round(gStress * 1000) / 1000,
    driftIndex: Math.round(D * 1000) / 1000,
    vectorScore: Math.round(sigma * 1000) / 1000,
    runtimeHash: String(entry?.runtimeHash || ""),
    memoryDigest: String(entry?.memoryDigest || ""),
    worldSnapshotHash: String(entry?.worldSnapshotHash || ""),
    modelRoute: {
      provider: entry?.modelRoute?.provider ?? null,
      model: entry?.modelRoute?.model ?? null
    },
    traceId: String(entry?.traceId || ""),
    turnId: String(entry?.turnId || ""),
    source: String(entry?.source || "client"),
    uid: String(subjectId || "unknown")
  };

  lastBySubject.set(subjectId, {
    runtimeHash: vector.runtimeHash,
    memoryDigest: vector.memoryDigest,
    worldSnapshotHash: vector.worldSnapshotHash
  });

  return vector;
}

export async function persistEpistemicLedgerBatch(subjectId, entries) {
  const rows = Array.isArray(entries) ? entries : [];
  if (!rows.length) return { ok: true, persisted: 0, mode: "skip", normalized: [] };

  const normalized = rows.map((e) => normalizeEpistemicLogEntry(e, subjectId));
  const { db, mode } = getFirebasePersistence();
  if (!db) {
    return { ok: true, persisted: normalized.length, mode, normalized };
  }

  const batch = db.batch();
  for (const row of normalized) {
    const source = rows.find((x) => String(x?.traceId || "") === row.traceId) || null;
    const traceRef = row.traceId ? db.collection("epistemic_traces").doc(row.traceId) : db.collection("epistemic_traces").doc();
    batch.set(
      traceRef,
      {
        ...row,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    if (row.turnId) {
      const turnRef = db.collection("weighted_turns").doc(String(row.turnId));
      batch.set(
        turnRef,
        {
          turnId: row.turnId,
          traceId: row.traceId || null,
          sealState: row.sealState,
          modelRoute: row.modelRoute,
          epistemicVector: {
            layerIndex: row.layerIndex,
            sealScore: row.sealScore,
            realityStability: row.realityStability,
            govStress: row.govStress,
            driftIndex: row.driftIndex,
            vectorScore: row.vectorScore
          },
          replayIndex: row.timestamp,
          updatedAt: Date.now(),
          uid: row.uid
        },
        { merge: true }
      );
    }

    if (row.traceId && row.sealState === "VERIFIED") {
      const sealRef = db.collection("seals").doc(String(row.traceId));
      batch.set(
        sealRef,
        {
          sealId: row.traceId,
          traceId: row.traceId,
          traceHash: row.runtimeHash,
          gatewaySignature: String(source?.signature || ""),
          validity: "verified",
          timestamp: row.timestamp,
          uid: row.uid,
          modelRoute: row.modelRoute,
          updatedAt: Date.now()
        },
        { merge: true }
      );
    }
  }

  await batch.commit();
  return { ok: true, persisted: normalized.length, mode: "firebase", normalized };
}
