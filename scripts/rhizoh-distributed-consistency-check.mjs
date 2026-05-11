#!/usr/bin/env node
/**
 * Dağıtık tutarlılık doğrulaması — iki mod:
 *
 * 1) Policy-only (varsayılan): CASTLE_RHIZOH_MULTI_REGION_PEERS_JSON ile çok-bölge özeti.
 *    Çıkış ≠0 ise RHIZOH_DISTRIBUTED_STRICT=1 ve mode=review_required.
 *
 * 2) Gateway çoklu uç: RHIZOH_GATEWAY_PEERS="url1,url2" — her birine duman POST (LLM maliyetli);
 *    yapısal alanları karşılaştırır (yanıt metni değil).
 *
 *   GATEWAY=https://a RHIZOH_GATEWAY_PEERS=https://a,https://b CASTLE_DEV_UID=x node scripts/rhizoh-distributed-consistency-check.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function loadOperational() {
  const p = path.join(repoRoot, "apps/client/src/rhizoh/constitution/constitutionalOperationalHardeningV1.js");
  return import(pathToFileURL(p).href);
}

const peersJson = String(process.env.CASTLE_RHIZOH_MULTI_REGION_PEERS_JSON || "").trim();
const strict = process.env.RHIZOH_DISTRIBUTED_STRICT === "1";
const peersUrls = String(process.env.RHIZOH_GATEWAY_PEERS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

const devUid = String(process.env.CASTLE_DEV_UID || "dist-check").trim();
const bearer = String(process.env.FIREBASE_ID_TOKEN || "").trim();
const gatewayToken = String(process.env.CASTLE_GATEWAY_TOKEN || "").trim();

/** @type {Record<string, unknown>} */
const report = { schema: "rhizoh.distributed_consistency.v1", modes: [] };

if (peersJson) {
  const { synthesizeRhizohConstitutionalMultiRegionPolicySync } = await loadOperational();
  let peers;
  try {
    peers = JSON.parse(peersJson);
  } catch (e) {
    console.error("CASTLE_RHIZOH_MULTI_REGION_PEERS_JSON parse hatası", e);
    process.exit(1);
  }
  if (!Array.isArray(peers)) {
    console.error("Peers bir JSON dizi olmalı");
    process.exit(1);
  }
  const sync = synthesizeRhizohConstitutionalMultiRegionPolicySync(peers);
  report.modes.push({ kind: "policy_peers", sync });
  console.log(JSON.stringify(report, null, 2));
  if (strict && sync.mode === "review_required") process.exit(2);
  if (!peersUrls.length) process.exit(0);
}

if (peersUrls.length >= 1) {
  async function probe(base) {
    const u = `${base}/rhizoh/llm`;
    const headers = { "Content-Type": "application/json" };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    else headers["X-Castle-Dev-Uid"] = devUid;
    if (gatewayToken) headers["x-castle-gateway-token"] = gatewayToken;
    const r = await fetch(u, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "Distributed consistency probe — tek satır.",
        llmKeySource: "env",
        context: {
          agentId: "RHIZOH-DIST-CHECK",
          continuity: { recentTurns: [] },
          constitutionalTheta: 0.46
        }
      })
    });
    const json = await r.json().catch(() => null);
    const rp = json?.rhizohProduction;
    const snap = rp
      ? {
          status: r.status,
          pipelineVersion: rp.pipelineVersion ?? null,
          hardening: rp.operational?.hardeningVersion ?? null,
          decisionAction: rp.decision?.action ?? null,
          policyVersion: rp.governance?.primaryPolicyVersion ?? null,
          decisionFingerprint: rp.operational?.decisionFingerprint ?? null
        }
      : { status: r.status, error: "no_rhizohProduction" };
    return snap;
  }

  const snapshots = [];
  for (const base of peersUrls) {
    snapshots.push({ base, snap: await probe(base) });
  }

  const fps = snapshots.map((s) => s.snap.decisionFingerprint).filter(Boolean);
  const fpOk = fps.length <= 1 || fps.every((x) => x === fps[0]);
  const pv = snapshots.map((s) => s.snap.policyVersion).filter((x) => x != null && x !== "baseline");
  const pvOk = pv.length <= 1 || pv.every((x) => x === pv[0]);

  report.modes.push({
    kind: "gateway_peers",
    snapshots,
    fingerprintAligned: fpOk,
    policyVersionAligned: pvOk,
    note:
      "Karar parmak izi farklılığı LLM çıktısından kaynaklanabilir; policyVersion hizası R7 ile daha anlamlıdır."
  });
  console.log(JSON.stringify(report, null, 2));

  const structuralOk = snapshots.every((s) => s.snap.status === 200 && s.snap.pipelineVersion);
  if (!structuralOk || !pvOk) process.exit(strict ? 3 : 0);
  process.exit(0);
}

if (!peersJson && peersUrls.length === 0) {
  console.error(
    "CASTLE_RHIZOH_MULTI_REGION_PEERS_JSON veya RHIZOH_GATEWAY_PEERS (virgülle URL listesi) gerekli"
  );
  process.exit(1);
}
