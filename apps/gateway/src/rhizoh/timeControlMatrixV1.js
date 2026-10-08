/**
 * Rhizoh Phase 5 - P5-C: Time-Control Matrix Runner
 * 
 * Tests Elo scaling and search horizon behavior across standard time controls:
 * 1. 400ms (Fixed movetime / historical authoritative SPRT anchor)
 * 2. 1+0 (Ultra blitz)
 * 3. 3+0 (Short blitz)
 * 4. 3+2 (Increment effect)
 * 5. 5+3 (Rapid / medium thinking)
 * 6. 10+0 (Classical / long thinking)
 * 
 * Experimental Invariants:
 * - Paired opening design (Opening A: E5 White vs Candidate Black, then Candidate White vs E5 Black).
 * - Constant environment: 1 thread, 64MB TT, OwnBook=false, same hardware.
 * - Single variable: Time control.
 * - Automatic registration into P5-A Research Experiment Registry.
 * - Strict epistemological distinction: Pilot sample (n < 100) vs Established Scaling Law (n >= 100 x 6 TCs).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { registerExperiment, updateExperimentStatus, registerExperimentArtifact, CANONICAL_E5_ENGINE_SHA, CANONICAL_A50_MODEL_SHA } from "./researchLabV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SUPPORTED_TIME_CONTROLS = {
  "400ms": { name: "Fixed 400ms Movetime", base_sec: 0.4, inc_sec: 0, mode: "fixed_movetime", uci_cmd: "go movetime 400", exp_index: "0001" },
  "1+0":   { name: "Ultra Blitz 1m+0s",   base_sec: 60,  inc_sec: 0, mode: "clock_blitz",     uci_cmd: "go wtime 60000 btime 60000 winc 0 binc 0", exp_index: "0002" },
  "3+0":   { name: "Short Blitz 3m+0s",   base_sec: 180, inc_sec: 0, mode: "clock_blitz",     uci_cmd: "go wtime 180000 btime 180000 winc 0 binc 0", exp_index: "0003" },
  "3+2":   { name: "Blitz with Inc 3m+2s",base_sec: 180, inc_sec: 2, mode: "clock_increment", uci_cmd: "go wtime 180000 btime 180000 winc 2000 binc 2000", exp_index: "0004" },
  "5+3":   { name: "Rapid 5m+3s",         base_sec: 300, inc_sec: 3, mode: "clock_rapid",     uci_cmd: "go wtime 300000 btime 300000 winc 3000 binc 3000", exp_index: "0005" },
  "10+0":  { name: "Classical 10m+0s",    base_sec: 600, inc_sec: 0, mode: "clock_classical", uci_cmd: "go wtime 600000 btime 600000 winc 0 binc 0", exp_index: "0006" }
};

export const CANONICAL_PAIRED_OPENINGS = [
  { id: "op_giuoco_piano", name: "Italian Game: Giuoco Piano", fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4" },
  { id: "op_ruy_lopez",    name: "Ruy Lopez: Morphy Defense",  fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4" },
  { id: "op_sicilian",     name: "Sicilian: Open Classical",    fen: "r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 6" },
  { id: "op_french",       name: "French Defense: Winawer",     fen: "rnbqk1nr/ppp2ppp/4p3/3p4/1b1PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4" },
  { id: "op_caro_kann",    name: "Caro-Kann: Classical",        fen: "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5" },
  { id: "op_qgd",          name: "Queen's Gambit Declined",     fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4" },
  { id: "op_kings_indian", name: "King's Indian Defense",       fen: "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 3 6" },
  { id: "op_nimzo_indian", name: "Nimzo-Indian Defense",        fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4" },
  { id: "op_english",      name: "English Opening: Symmetrical",fen: "r1bqkb1r/pp1ppppp/2n2n2/2p5/2P5/2N2N2/PP1PPPPP/R1BQKB1R w KQkq - 4 4" },
  { id: "op_pirc",         name: "Pirc Defense: Austrian Attack",fen: "rnbqkb1r/ppp1pp1p/3p1np1/8/3PPP2/2N5/PPP3PP/R1BQKBNR b KQkq - 0 4" }
];

export function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(process.cwd(), ".."),
    process.cwd(),
    "C:/Users/LENOVO/Desktop/castle",
    "/home/castle/castle"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "data", "event_ledger.jsonl"))) {
      return c;
    }
  }
  return process.platform === "win32" ? "C:/Users/LENOVO/Desktop/castle" : "/home/castle/castle";
}

function resolveMatrixFile() {
  return path.join(resolveRepoRoot(), "data", "research_experiments", "time_control_matrix_v1.json");
}

/**
 * P5-C: Authoritative Historical SPRT Anchor Loader
 * Reads strictly from data/sprt_r07_4b_vs_e5_400_report.json
 */
export function getAuthoritativeSprtAnchor(candidateVersion = "R07.4b") {
  const repoRoot = resolveRepoRoot();
  const candidates = [
    path.join(repoRoot, "data", "sprt_r07_4b_vs_e5_400_report.json"),
    path.resolve(process.cwd(), "data", "sprt_r07_4b_vs_e5_400_report.json"),
    "C:/Users/LENOVO/Desktop/castle/data/sprt_r07_4b_vs_e5_400_report.json"
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf8"));
        return {
          experiment_id: "P5-TC-0001",
          candidate_version: candidateVersion,
          baseline_version: "E5",
          time_control: "400ms",
          tc_name: "Fixed 400ms Movetime (Authoritative SPRT Anchor)",
          base_sec: 0.4,
          inc_sec: 0,
          total_games: raw.total_games,
          wins: raw.cand_wins,
          draws: raw.draws,
          losses: raw.cand_losses,
          cand_points: raw.cand_points,
          score_pct: raw.score_pct,
          elo_delta: raw.elo_difference,
          ci_95: raw.ci_95,
          llr: raw.llr,
          sprt_bounds: raw.sprt_bounds,
          verdict: raw.verdict,
          paired_openings_count: CANONICAL_PAIRED_OPENINGS.length,
          authoritative_source: "data/sprt_r07_4b_vs_e5_400_report.json",
          status: "OFFICIAL_HISTORICAL_SPRT_ANCHOR",
          recorded_at: raw.timestamp_utc || "2026-10-08 11:22:25",
          notes: `Authoritative historical SPRT anchor point: 400ms fixed movetime (${raw.total_games} games: +${raw.cand_wins} =${raw.draws} -${raw.cand_losses}, ${raw.score_pct}%, Elo ${raw.elo_difference} ±${raw.ci_95}, LLR ${raw.llr}, verdict: ${raw.verdict})`
        };
      } catch (err) {
        console.error("Failed to parse SPRT report:", err);
      }
    }
  }
  return null;
}

let matrixStore = null;

export function loadMatrixStore() {
  if (matrixStore) return matrixStore;
  const filePath = resolveMatrixFile();
  if (fs.existsSync(filePath)) {
    try {
      matrixStore = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {}
  }
  if (!matrixStore) {
    matrixStore = {
      version: "rhizoh_tc_matrix_v1.0",
      baseline: "E5 Champion",
      candidate: "R07.4b",
      updated_at: new Date().toISOString(),
      runs: {}
    };
  }

  // Anchor 400ms to authoritative SPRT report
  const sprtAnchor = getAuthoritativeSprtAnchor(matrixStore.candidate || "R07.4b");
  if (sprtAnchor) {
    matrixStore.runs["400ms"] = sprtAnchor;
  }

  return matrixStore;
}

export function saveMatrixStore() {
  if (!matrixStore) return;
  const filePath = resolveMatrixFile();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(matrixStore, null, 2), "utf8");
}

/**
 * P5-C: Record a Time-Control Matrix Evaluation for E5 vs Candidate
 */
export function recordTimeControlEvaluation({
  candidateVersion = "R07.4b",
  timeControl = "400ms",
  totalGames = 20,
  wins = 8,
  draws = 4,
  losses = 8,
  notes = "Evaluated under paired opening protocol",
  forceAnchorOverride = false
}) {
  const tcConfig = SUPPORTED_TIME_CONTROLS[timeControl];
  if (!tcConfig) {
    return {
      ok: false,
      status: 400,
      error: "UNSUPPORTED_TIME_CONTROL",
      supported: Object.keys(SUPPORTED_TIME_CONTROLS)
    };
  }

  loadMatrixStore();

  // If 400ms and not force override, preserve official historical anchor
  if (timeControl === "400ms" && !forceAnchorOverride) {
    const sprtAnchor = getAuthoritativeSprtAnchor(candidateVersion);
    if (sprtAnchor) {
      matrixStore.runs["400ms"] = sprtAnchor;
      saveMatrixStore();
      return {
        ok: true,
        run: sprtAnchor,
        note: "Preserved official SPRT historical anchor point from data/sprt_r07_4b_vs_e5_400_report.json",
        curve: computeTimeControlScalingCurve(candidateVersion)
      };
    }
  }

  const total = Number(totalGames) || (wins + draws + losses);
  const candPoints = wins + (draws * 0.5);
  const scorePct = total > 0 ? Number(((candPoints / total) * 100).toFixed(2)) : 50.0;
  
  // Calculate empirical Elo delta: -400 * log10((1 / score) - 1)
  let eloDelta = 0;
  if (scorePct > 0 && scorePct < 100) {
    const p = scorePct / 100.0;
    eloDelta = Number((-400 * Math.log10((1 / p) - 1)).toFixed(2));
  } else if (scorePct >= 100) {
    eloDelta = 400;
  } else {
    eloDelta = -400;
  }

  const expId = `P5-TC-${tcConfig.exp_index}`;

  const runRecord = {
    experiment_id: expId,
    candidate_version: candidateVersion,
    baseline_version: "E5",
    time_control: timeControl,
    tc_name: tcConfig.name,
    base_sec: tcConfig.base_sec,
    inc_sec: tcConfig.inc_sec,
    total_games: total,
    wins,
    draws,
    losses,
    cand_points: candPoints,
    score_pct: scorePct,
    elo_delta: eloDelta,
    ci_95: Number((1.96 * Math.sqrt((scorePct * (100 - scorePct)) / total)).toFixed(2)),
    paired_openings_count: CANONICAL_PAIRED_OPENINGS.length,
    recorded_at: new Date().toISOString(),
    notes
  };

  matrixStore.runs[timeControl] = runRecord;
  saveMatrixStore();

  // Automatically register into P5-A Research Experiment Registry
  registerExperiment({
    experimentId: expId,
    experimentName: `Time-Control Scaling: E5 vs ${candidateVersion} at ${timeControl}`,
    experimentType: "TIME_CONTROL_CURVE",
    parentVersion: "E5",
    candidateVersion,
    hypothesis: `Assess whether ${candidateVersion} Elo scaling against E5 scales positively at ${timeControl} (${tcConfig.name}).`,
    provenance: {
      engine_sha: CANONICAL_E5_ENGINE_SHA,
      model_sha: CANONICAL_A50_MODEL_SHA
    },
    environment: {
      hardware: "x86_64 Standard Reference",
      threads: 1,
      hash_mb: 64,
      time_control: timeControl,
      ownbook: false,
      opening_set: "paired_openings_v3"
    },
    status: "VERDICT_RECORDED"
  });

  updateExperimentStatus({
    experimentId: expId,
    status: "VERDICT_RECORDED",
    result: {
      total_games: total,
      wins,
      draws,
      losses,
      score_pct: scorePct,
      elo_delta: eloDelta
    },
    verdict: eloDelta > 0 ? "SCALING_ADVANTAGE" : (eloDelta === 0 ? "BALANCED" : "SCALING_DEFICIT"),
    notes
  });

  return {
    ok: true,
    run: runRecord,
    curve: computeTimeControlScalingCurve(candidateVersion)
  };
}

/**
 * P5-C: Compute the complete Elo Scaling Curve across all evaluated time controls
 * Applies formal linear regression with statistical rigor:
 * Elo(t) = beta_0 + beta_1 * log10(t)
 */
export function computeTimeControlScalingCurve(candidateVersion = "R07.4b") {
  loadMatrixStore();
  const runs = matrixStore.runs || {};
  const entries = [];

  for (const [tc, config] of Object.entries(SUPPORTED_TIME_CONTROLS)) {
    const data = runs[tc] || null;
    const effectiveTimeSec = config.base_sec + (config.inc_sec * 40); // 40 moves average
    entries.push({
      time_control: tc,
      name: config.name,
      effective_time_sec: effectiveTimeSec,
      log_time: Math.log10(effectiveTimeSec),
      evaluated: Boolean(data),
      elo_delta: data ? data.elo_delta : null,
      score_pct: data ? data.score_pct : null,
      total_games: data ? data.total_games : 0,
      source: data?.authoritative_source || null
    });
  }

  const evaluatedEntries = entries.filter(e => e.evaluated);

  let slope = 0;
  let intercept = 0;
  let rSquared = 0;
  let stdError = 0;
  let ci95Slope = [0, 0];
  const residuals = [];

  let empiricalStatus = "INSUFFICIENT_DATA";
  let scalingConclusion = "NOT_ESTABLISHED";
  let scientificClaim = "NO_DATA";
  let diagnosis = "INSUFFICIENT_DATA: No evaluated time control runs recorded.";

  if (evaluatedEntries.length >= 2) {
    const n = evaluatedEntries.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for (const e of evaluatedEntries) {
      sumX += e.log_time;
      sumY += e.elo_delta;
      sumXY += e.log_time * e.elo_delta;
      sumXX += e.log_time * e.log_time;
      sumYY += e.elo_delta * e.elo_delta;
    }
    const denom = (n * sumXX) - (sumX * sumX);
    if (denom !== 0) {
      slope = Number((((n * sumXY) - (sumX * sumY)) / denom).toFixed(2));
      intercept = Number(((sumY - (slope * sumX)) / n).toFixed(2));
    }

    // Residuals and R^2
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    for (const e of evaluatedEntries) {
      const pred = intercept + (slope * e.log_time);
      const res = e.elo_delta - pred;
      residuals.push({
        time_control: e.time_control,
        actual_elo: e.elo_delta,
        predicted_elo: Number(pred.toFixed(2)),
        residual: Number(res.toFixed(2))
      });
      ssRes += res * res;
      ssTot += Math.pow(e.elo_delta - meanY, 2);
    }
    rSquared = ssTot > 0 ? Number((1 - (ssRes / ssTot)).toFixed(3)) : 1.0;

    // Standard error of slope
    const ssX = sumXX - ((sumX * sumX) / n);
    if (n > 2 && ssX > 0) {
      const residualVariance = ssRes / (n - 2);
      stdError = Number((Math.sqrt(residualVariance / ssX)).toFixed(2));
      ci95Slope = [
        Number((slope - (1.96 * stdError)).toFixed(2)),
        Number((slope + (1.96 * stdError)).toFixed(2))
      ];
    }

    // Epistemic sample size guard:
    const allRunsSufficient = evaluatedEntries.length === 6 && evaluatedEntries.every(e => e.total_games >= 100);
    const hasSmallSamples = evaluatedEntries.some(e => e.total_games < 100);

    if (!allRunsSufficient) {
      empiricalStatus = "INSUFFICIENT_SAMPLE_SIZE";
      scalingConclusion = "NOT_ESTABLISHED";
      scientificClaim = "PILOT_HYPOTHESIS_ONLY";
      diagnosis = `PILOT_OBSERVATION (Not Established): Sample size insufficient (n < 100 or incomplete TC coverage). Slope signal: ${slope > 0 ? "+" : ""}${slope} Elo/decade is hypothesis-generating only. Causal scaling laws cannot be claimed without complete 100+ paired-game gauntlets.`;
    } else {
      empiricalStatus = "SUFFICIENT_POWER";
      scalingConclusion = "ESTABLISHED";
      scientificClaim = "EMPIRICALLY_VERIFIED";
      if (slope > 15.0) {
        diagnosis = "POSITIVE_HORIZON_SCALING_ESTABLISHED: Candidate improves significantly with search depth; deficit is localized to shallow horizon/blitz.";
      } else if (slope < -10.0) {
        diagnosis = "NEGATIVE_SCALING_ESTABLISHED: Candidate degrades with deeper search; search instability or evaluation noise amplifies with depth.";
      } else {
        diagnosis = "FLAT_EVALUATION_SCALING_ESTABLISHED: Candidate performance is invariant to search depth; defect is rooted in static evaluation / NNUE weights.";
      }
    }
  }

  return {
    candidate_version: candidateVersion,
    evaluated_count: evaluatedEntries.length,
    total_time_controls: Object.keys(SUPPORTED_TIME_CONTROLS).length,
    empirical_status: empiricalStatus,
    scaling_conclusion: scalingConclusion,
    scientific_claim: scientificClaim,
    slope_elo_per_decade: slope,
    regression: {
      slope,
      intercept,
      r_squared: rSquared,
      std_error: stdError,
      ci_95_slope: ci95Slope,
      residuals
    },
    power_warning: "Scientific protocol requires at least 100 paired games per TC across all 6 time controls (600 games total) before establishing scaling slope. Small-sample observations (e.g. N=20 or N=50) cannot be used as established scaling laws.",
    diagnosis,
    curve_points: entries
  };
}

export function getTimeControlMatrixSummary() {
  loadMatrixStore();
  return {
    baseline: matrixStore.baseline,
    candidate: matrixStore.candidate,
    updated_at: matrixStore.updated_at,
    runs_count: Object.keys(matrixStore.runs || {}).length,
    runs: matrixStore.runs,
    scaling_curve: computeTimeControlScalingCurve(matrixStore.candidate)
  };
}

export function clearTimeControlMatrix() {
  matrixStore = {
    version: "rhizoh_tc_matrix_v1.0",
    baseline: "E5 Champion",
    candidate: "R07.4b",
    updated_at: new Date().toISOString(),
    runs: {}
  };
  // Re-seed authoritative SPRT anchor
  const sprtAnchor = getAuthoritativeSprtAnchor("R07.4b");
  if (sprtAnchor) {
    matrixStore.runs["400ms"] = sprtAnchor;
  }
  saveMatrixStore();
}
