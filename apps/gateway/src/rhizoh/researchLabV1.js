/**
 * Rhizoh Phase 5 - P5-A: Research Experiment Registry & P5-B: Engine Council
 * 
 * Core Principles:
 * 1. Scientific Rigor: Every experiment requires an immutable ID, hypothesis,
 *    and exact provenance (engine SHA, model SHA, code SHA, dataset SHA, holdout SHA).
 * 2. Immutable Engine Council: 8 designated roles with E5 Champion as locked baseline.
 * 3. Zero Mutation on E5 Champion binary, A50 NNUE weights, and Chronicle #001.
 * 4. Separation of Observation vs Execution: Experiments produce empirical findings,
 *    verdicts, and artifacts — NOT automatic promotion.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_REGISTRY_VERSION = "rhizoh_experiment_registry_v1.0";
export const CANONICAL_E5_ENGINE_SHA = "00ccc8c47e1b6d74ccd2e2e5fb394cb7075b8f772a4f8e1d8962c6603d30d269";
export const CANONICAL_A50_MODEL_SHA = "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c";

function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(process.cwd(), ".."),
    process.cwd(),
    "/home/castle/castle"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "data", "event_ledger.jsonl"))) {
      return c;
    }
  }
  return process.platform === "win32" ? path.resolve(__dirname, "..", "..", "..", "..") : "/home/castle/castle";
}

function resolveExperimentsDir() {
  const root = resolveRepoRoot();
  const dir = path.join(root, "data", "research_experiments");
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return dir;
}

function resolveRegistryFile() {
  return path.join(resolveExperimentsDir(), "experiments_registry_v1.jsonl");
}

function resolveManifestFile() {
  return path.join(resolveExperimentsDir(), "experiments_manifest_v1.json");
}

function resolveCouncilFile() {
  return path.join(resolveExperimentsDir(), "engine_council_v1.json");
}

// In-memory store
const experimentsStore = new Map();
let storeLoaded = false;

/**
 * P5-B: Canonical Engine Council Manifest (8 Designations)
 */
export const ENGINE_COUNCIL_ROSTER = {
  version: "rhizoh_engine_council_v1.0",
  charter: "Empirical validation council for Rhizoh engine evolution. External engines provide calibration and teacher signals; only head-to-head SPRT against E5 baseline controls promotion.",
  members: [
    {
      role: "PRODUCTION_BASELINE",
      designation: "E5_CHAMPION",
      name: "Castle Core v1.0.2 E5 Champion",
      engine_sha256: CANONICAL_E5_ENGINE_SHA,
      model_sha256: CANONICAL_A50_MODEL_SHA,
      status: "SEALED_CHAMPION",
      description: "Immutable production baseline anchor. All promotion SPRTs are contested against E5."
    },
    {
      role: "ACTIVE_CANDIDATE",
      designation: "R07_CANDIDATE",
      name: "Rhizoh R07.x Series (R07.3 / R07.4b / R07.5)",
      status: "ACTIVE_EVALUATION",
      description: "Primary neural network candidate track evaluated under two-stage statistical gate."
    },
    {
      role: "TEACHER_EXTERNAL_REFERENCE",
      designation: "STOCKFISH",
      name: "Stockfish 16+ Ground Truth Reference",
      rule: "NON_PROMOTION_REFERENCE",
      status: "REFERENCE_BENCHMARK",
      description: "External oracle for move agreement, distillation loss, and objective evaluation anchoring. Defeating Stockfish is NOT required for promotion."
    },
    {
      role: "DIAGNOSTIC_PEER",
      designation: "LEORIK",
      name: "Leorik Benchmark Peer",
      status: "PEER_ANCHOR",
      description: "Peer open-source engine used for rating calibration, tactical stress-testing, and out-of-distribution evaluation."
    },
    {
      role: "SEARCH_LABORATORY",
      designation: "SEARCH_VARIANTS",
      name: "Search Ablation Variants",
      scope: ["singular_extensions", "lmr_reduction_curves", "futility_pruning", "null_move_guards"],
      status: "DIAGNOSTIC_LAB",
      description: "Isolates search mechanics from evaluation to determine whether defects stem from search depth/horizon or static eval."
    },
    {
      role: "EVALUATION_LABORATORY",
      designation: "NNUE_VARIANTS",
      name: "NNUE Architecture & Distillation Variants",
      scope: ["halfkp_perspective_alignment", "quantization_q", "micro_motif_specialists", "linear_combos"],
      status: "EVALUATION_LAB",
      description: "Laboratory exploring weight adaptations, micro-motifs, and bounded training deltas."
    },
    {
      role: "MULTI_TC_ANALYTICS",
      designation: "TIME_CONTROL_GAUNTLET",
      name: "Time-Control Matrix Suite",
      supported_tc: ["400ms", "1+0", "3+0", "3+2", "5+3", "10+0"],
      status: "ANALYTICS_GAUNTLET",
      description: "Measures Elo scaling curve across varying node/time budgets to identify horizon vs evaluation defects."
    },
    {
      role: "REGRESSION_GUARD",
      designation: "HISTORICAL_BENCHMARKS",
      name: "Historical Milestone Suite (E3, E4, R1)",
      status: "CONTINUITY_GUARD",
      description: "Protects against catastrophic forgetting and negative regressions on solved legacy domains."
    }
  ]
};

export function getEngineCouncilManifest() {
  const councilFile = resolveCouncilFile();
  if (!fs.existsSync(councilFile)) {
    try {
      fs.writeFileSync(councilFile, JSON.stringify(ENGINE_COUNCIL_ROSTER, null, 2), "utf8");
    } catch {}
  }
  return ENGINE_COUNCIL_ROSTER;
}

/**
 * Valid experiment status lifecycle transitions
 */
const VALID_STATUSES = [
  "PLANNED",
  "PROVISIONED",
  "RUNNING",
  "COMPLETED",
  "VERDICT_RECORDED",
  "ABORTED",
  "DISQUALIFIED"
];

const VALID_EXPERIMENT_TYPES = [
  "SEARCH_FORENSICS",
  "SEARCH_ABLATION",
  "NNUE_DISTILLATION",
  "TIME_CONTROL_CURVE",
  "COUNCIL_GAUNTLET",
  "SPRT_VALIDATION",
  "HOLDOUT_WAC",
  "HISTORICAL_RECOVERY"
];

/**
 * P5-A: Register a new Research Experiment
 */
export function registerExperiment({
  experimentId,
  experimentName,
  experimentType,
  parentVersion = "E5",
  candidateVersion,
  hypothesis,
  provenance = {},
  environment = {},
  parameters = {},
  status = "PLANNED"
}) {
  loadExperimentsStore();

  if (!experimentId || typeof experimentId !== "string") {
    return { ok: false, status: 400, error: "EXPERIMENT_ID_REQUIRED", message: "experiment_id is required." };
  }

  const expId = experimentId.trim();
  if (experimentsStore.has(expId)) {
    return {
      ok: false,
      status: 409,
      error: "EXPERIMENT_ALREADY_EXISTS",
      message: `Experiment ${expId} is already registered.`
    };
  }

  if (!hypothesis || typeof hypothesis !== "string" || hypothesis.trim().length < 10) {
    return {
      ok: false,
      status: 400,
      error: "HYPOTHESIS_REQUIRED",
      message: "Every experiment must have a scientific hypothesis (min 10 chars)."
    };
  }

  if (!candidateVersion) {
    return {
      ok: false,
      status: 400,
      error: "CANDIDATE_VERSION_REQUIRED",
      message: "candidate_version is required for scientific comparison."
    };
  }

  const type = String(experimentType || "SEARCH_FORENSICS").toUpperCase();
  if (!VALID_EXPERIMENT_TYPES.includes(type)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_EXPERIMENT_TYPE",
      valid_types: VALID_EXPERIMENT_TYPES
    };
  }

  // Provenance SHA Capture
  const prov = {
    code_sha: provenance.code_sha || "HEAD",
    engine_sha: provenance.engine_sha || CANONICAL_E5_ENGINE_SHA,
    model_sha: provenance.model_sha || CANONICAL_A50_MODEL_SHA,
    config_sha: provenance.config_sha || crypto.createHash("sha256").update(JSON.stringify(parameters)).digest("hex").slice(0, 16),
    dataset_sha: provenance.dataset_sha || null,
    holdout_sha: provenance.holdout_sha || null
  };

  // Environment Hardware / Time-Control / Thread Capture
  const env = {
    hardware: environment.hardware || "x86_64",
    threads: Number(environment.threads) || 1,
    hash_mb: Number(environment.hash_mb) || 64,
    time_control: environment.time_control || "400ms",
    ownbook: Boolean(environment.ownbook),
    opening_set: environment.opening_set || "supercomputer_master_games"
  };

  const now = new Date().toISOString();

  // Compute deterministic Experiment Hash
  const hashMaterial = [
    expId,
    parentVersion,
    candidateVersion,
    type,
    prov.engine_sha,
    prov.model_sha,
    env.time_control,
    env.threads
  ].join(":");
  const experimentHash = crypto.createHash("sha256").update(hashMaterial, "utf8").digest("hex");

  const record = {
    experiment_id: expId,
    experiment_name: experimentName || expId,
    experiment_type: type,
    parent_version: parentVersion,
    candidate_version: candidateVersion,
    hypothesis: hypothesis.trim(),
    status: VALID_STATUSES.includes(status) ? status : "PLANNED",
    provenance: prov,
    environment: env,
    parameters: parameters || {},
    lifecycle: {
      created_at: now,
      started_at: status === "RUNNING" ? now : null,
      completed_at: null
    },
    result: null,
    verdict: null,
    artifacts: [],
    experiment_hash: experimentHash,
    registry_version: CANONICAL_REGISTRY_VERSION
  };

  experimentsStore.set(expId, record);
  appendExperimentToFile(record);
  computeExperimentRegistryManifest();

  return {
    ok: true,
    status: 201,
    experiment_id: expId,
    experiment_hash: experimentHash,
    experiment: record
  };
}

/**
 * P5-A: Update Experiment Status Lifecycle, Results & Verdict
 */
export function updateExperimentStatus({
  experimentId,
  status,
  result = null,
  verdict = null,
  notes = null
}) {
  loadExperimentsStore();

  const exp = experimentsStore.get(experimentId);
  if (!exp) {
    return { ok: false, status: 404, error: "EXPERIMENT_NOT_FOUND", message: `Experiment ${experimentId} not found.` };
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: "INVALID_STATUS", valid_statuses: VALID_STATUSES };
  }

  const now = new Date().toISOString();
  if (status) {
    exp.status = status;
    if (status === "RUNNING" && !exp.lifecycle.started_at) {
      exp.lifecycle.started_at = now;
    }
    if ((status === "COMPLETED" || status === "VERDICT_RECORDED") && !exp.lifecycle.completed_at) {
      exp.lifecycle.completed_at = now;
    }
  }

  if (result) {
    exp.result = { ...(exp.result || {}), ...result };
  }

  if (verdict) {
    exp.verdict = verdict;
    if (exp.status === "COMPLETED") exp.status = "VERDICT_RECORDED";
  }

  if (notes) {
    exp.notes = notes;
  }

  exp.lifecycle.updated_at = now;

  // Re-save store
  saveAllExperimentsToDisk();
  computeExperimentRegistryManifest();

  return {
    ok: true,
    experiment_id: experimentId,
    status: exp.status,
    verdict: exp.verdict,
    experiment: exp
  };
}

/**
 * P5-A: Register an artifact (PGN, Report JSON, Trace Log) with SHA-256
 */
export function registerExperimentArtifact({
  experimentId,
  artifactType,
  relativePath,
  sha256 = null,
  description = ""
}) {
  loadExperimentsStore();

  const exp = experimentsStore.get(experimentId);
  if (!exp) {
    return { ok: false, status: 404, error: "EXPERIMENT_NOT_FOUND" };
  }

  if (!relativePath || typeof relativePath !== "string") {
    return { ok: false, status: 400, error: "RELATIVE_PATH_REQUIRED" };
  }

  // If file exists on disk, compute SHA-256 if not provided
  let fileSha = sha256;
  const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(resolveRepoRoot(), relativePath);
  if (!fileSha && fs.existsSync(fullPath)) {
    try {
      const data = fs.readFileSync(fullPath);
      fileSha = crypto.createHash("sha256").update(data).digest("hex");
    } catch {}
  }

  const artifactRecord = {
    artifact_id: "art_" + crypto.createHash("sha256").update(experimentId + ":" + relativePath).digest("hex").slice(0, 12),
    type: artifactType || "report",
    path: relativePath,
    sha256: fileSha || "unverified_sha",
    description,
    registered_at: new Date().toISOString()
  };

  exp.artifacts.push(artifactRecord);
  saveAllExperimentsToDisk();
  computeExperimentRegistryManifest();

  return {
    ok: true,
    experiment_id: experimentId,
    artifact: artifactRecord
  };
}

export function getExperimentById(experimentId) {
  loadExperimentsStore();
  return experimentsStore.get(experimentId) || null;
}

export function listExperiments(filter = {}) {
  loadExperimentsStore();
  let list = Array.from(experimentsStore.values());
  if (filter.type) {
    list = list.filter(e => e.experiment_type === filter.type.toUpperCase());
  }
  if (filter.status) {
    list = list.filter(e => e.status === filter.status.toUpperCase());
  }
  if (filter.candidate) {
    list = list.filter(e => e.candidate_version === filter.candidate);
  }
  return list;
}

/**
 * P5-A: Manifest & Cryptographic Registry Hash
 */
export function computeExperimentRegistryManifest() {
  loadExperimentsStore();
  const all = Array.from(experimentsStore.values());

  const statusCounts = {};
  const typeCounts = {};

  for (const e of all) {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    typeCounts[e.experiment_type] = (typeCounts[e.experiment_type] || 0) + 1;
  }

  // Sorted list of IDs and hashes for deterministic manifest hash
  const sortedSignatures = all
    .sort((a, b) => a.experiment_id.localeCompare(b.experiment_id))
    .map(e => e.experiment_id + ":" + e.experiment_hash);

  const registryHash = crypto.createHash("sha256")
    .update(sortedSignatures.join(","), "utf8")
    .digest("hex");

  const manifest = {
    algorithm: "rhizoh_research_experiment_manifest_v1.0",
    registry_version: CANONICAL_REGISTRY_VERSION,
    total_experiments: all.length,
    status_breakdown: statusCounts,
    type_breakdown: typeCounts,
    registry_hash: registryHash,
    e5_baseline_sha: CANONICAL_E5_ENGINE_SHA,
    a50_golden_sha: CANONICAL_A50_MODEL_SHA,
    last_updated: new Date().toISOString()
  };

  try {
    fs.writeFileSync(resolveManifestFile(), JSON.stringify(manifest, null, 2), "utf8");
  } catch {}

  return manifest;
}

export function loadExperimentsStore(force = false) {
  if (storeLoaded && !force) return experimentsStore;
  storeLoaded = true; // Prevent recursive re-entry
  const filePath = resolveRegistryFile();
  experimentsStore.clear();

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const lines = fileContent.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const rec = JSON.parse(line);
          if (rec?.experiment_id) {
            experimentsStore.set(rec.experiment_id, rec);
          }
        } catch {}
      }
    } catch (err) {
      console.error("[EXPERIMENTS_STORE_LOAD_ERROR]", err);
    }
  }

  // Ensure engine council exists
  getEngineCouncilManifest();

  // If empty on first boot, index historical SPRT benchmarks
  if (experimentsStore.size === 0) {
    bootstrapHistoricalExperiments();
  }

  return experimentsStore;
}

function appendExperimentToFile(record) {
  try {
    const filePath = resolveRegistryFile();
    fs.appendFileSync(filePath, JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    console.error("[EXPERIMENT_APPEND_ERROR]", err);
  }
}

function saveAllExperimentsToDisk() {
  try {
    const filePath = resolveRegistryFile();
    const lines = Array.from(experimentsStore.values()).map(e => JSON.stringify(e)).join("\n") + "\n";
    fs.writeFileSync(filePath, lines, "utf8");
  } catch (err) {
    console.error("[EXPERIMENTS_SAVE_ERROR]", err);
  }
}

/**
 * Indexes verified historical SPRT & diagnostic runs into the registry
 */
export function bootstrapHistoricalExperiments() {
  const root = resolveRepoRoot();
  const historicalFiles = [
    {
      file: "data/sprt_r07_3_vs_e5_400_report.json",
      id: "P5-HIST-0001",
      name: "SPRT Gauntlet: R07.3 Candidate vs E5 Champion",
      candidate: "R07.3",
      type: "SPRT_VALIDATION",
      hypothesis: "R07.3 trained on 1M Kaggle T4 games outperforms E5 baseline under standard SPRT."
    },
    {
      file: "data/sprt_r07_4a_vs_e5_400_report.json",
      id: "P5-HIST-0002",
      name: "SPRT Gauntlet: R07.4a Candidate vs E5 Champion",
      candidate: "R07.4a",
      type: "SPRT_VALIDATION",
      hypothesis: "R07.4a candidate with tactical dataset refinement achieves positive SPRT pass over E5."
    },
    {
      file: "data/sprt_r07_4b_vs_e5_400_report.json",
      id: "P5-HIST-0003",
      name: "SPRT Gauntlet: R07.4b Candidate vs E5 Champion",
      candidate: "R07.4b",
      type: "SPRT_VALIDATION",
      hypothesis: "R07.4b with focused defense loss fixes early black deviations against E5."
    }
  ];

  for (const h of historicalFiles) {
    const p = path.join(root, h.file);
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        registerExperiment({
          experimentId: h.id,
          experimentName: h.name,
          experimentType: h.type,
          parentVersion: "E5",
          candidateVersion: h.candidate,
          hypothesis: h.hypothesis,
          provenance: {
            engine_sha: CANONICAL_E5_ENGINE_SHA,
            model_sha: CANONICAL_A50_MODEL_SHA
          },
          environment: {
            time_control: "400ms",
            threads: 1,
            hash_mb: 64,
            ownbook: false,
            opening_set: "paired_openings_v3"
          },
          status: "VERDICT_RECORDED"
        });

        updateExperimentStatus({
          experimentId: h.id,
          status: "VERDICT_RECORDED",
          result: {
            total_games: data.total_games,
            wins: data.cand_wins,
            draws: data.draws,
            losses: data.cand_losses,
            elo_delta: data.elo_difference,
            ci_95: data.ci_95,
            llr: data.llr,
            sprt_bounds: data.sprt_bounds,
            score_pct: data.score_pct
          },
          verdict: data.verdict || "PROMOTION_DENIED"
        });

        registerExperimentArtifact({
          experimentId: h.id,
          artifactType: "report",
          relativePath: h.file,
          description: "Canonical SPRT benchmark report"
        });
      } catch (err) {
        console.warn("[HISTORICAL_BOOTSTRAP_WARN]", err.message);
      }
    }
  }

  computeExperimentRegistryManifest();
}

export function clearExperimentsRegistry() {
  experimentsStore.clear();
  try {
    const file = resolveRegistryFile();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
  computeExperimentRegistryManifest();
}
