import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");

export const ENGINE_GENERATIONS = [
  {
    generation_id: "GEN-0",
    name: "Generation 0 — Historical Anchor",
    status: "RETIRED_BENCHMARK",
    tag: "Stockfish Baseline",
    description: "External calibration standard used as baseline and test suite reference.",
    active_in_prod: false
  },
  {
    generation_id: "GEN-1",
    name: "Generation 1 — Sovereign Baseline",
    status: "ACTIVE_PRODUCTION",
    tag: "Castle Core v1.0.2 E5 Champion",
    description: "Production champion engine paired with A50 Golden NNUE weights. Protected by Reality Seal & Chronicle #001.",
    active_in_prod: true,
    engine_binary: "castle-core-v1.0.2-e5.exe",
    engine_sha: "00ccc8c47e1b6d74ceb3aa15276e0339d226a4eb8d58c8a14ec13cfa5d4817a2",
    nnue_model: "nn-a50-golden.nnue",
    nnue_sha: "39d3d9ce9aba72da9a19c4381395f1906a2ff507fa71c888d30e5d4cb0480b54",
    chronicle_binding: "#001"
  },
  {
    generation_id: "GEN-2",
    name: "Generation 2 — Research Candidate Lineage",
    status: "LAB_EXPERIMENTS",
    tag: "R07 Candidate Series",
    description: "Autonomous candidate evolution (R07.4b, R07.5-C). Evaluated via Engine Council, SPRT Gauntlet, and Forensic Autopsy.",
    active_in_prod: false,
    promoted: false,
    candidates: [
      {
        candidate_id: "R07.4b",
        engine_sha: "71e5443372c0507304192667bb8bb31988894fa8ec6ce0d8a57bbfa743126e38",
        status: "EVALUATION_INCONCLUSIVE",
        sprt_verdict: "INCONCLUSIVE / RETAIN E5",
        wac30_score: "19/30",
        historical_anchor_400ms: {
          games: 400,
          score_pct: 44.12,
          elo: -41.01,
          llr: -1.7207
        },
        forensic_autopsy: "200 losses ingested (H1 Candidate Hypothesis: 45.0% search horizon signal)"
      }
    ]
  },
  {
    generation_id: "GEN-3",
    name: "Generation 3 — Autonomous Continuous Loop",
    status: "PLANNED_ARCHITECTURE",
    tag: "P13 Full Cycle",
    description: "Fully integrated self-play, mining, bounded learning, SPRT promotion, and sovereign deployment loop.",
    active_in_prod: false
  }
];

export const PROMOTION_HISTORY = [
  {
    promotion_id: "PROM-001",
    timestamp: "2026-07-15T00:00:00Z",
    generation: "GEN-1",
    promoted_model: "E5 Champion / A50 Golden NNUE",
    baseline: "Pre-E5 Alpha",
    sprt_games: 400,
    elo_gain: "+45 Elo",
    status: "SEALED_PRODUCTION",
    chronicle_id: "#001",
    reality_seal_sha: "00ccc8c47e1b6d74ceb3aa15276e0339d226a4eb8d58c8a14ec13cfa5d4817a2"
  }
];

export function getEvolutionGenerations() {
  return {
    ok: true,
    active_generation: "GEN-1",
    generations: ENGINE_GENERATIONS
  };
}

export function getEvolutionModels() {
  return {
    ok: true,
    production_model: {
      generation: "GEN-1",
      name: "Castle Core v1.0.2 E5 Champion",
      weights: "A50 Golden NNUE",
      status: "PRODUCTION_ACTIVE",
      immutable: true,
      sha: "00ccc8c47e1b6d74ceb3aa15276e0339d226a4eb8d58c8a14ec13cfa5d4817a2"
    },
    candidate_models: [
      {
        id: "R07.4b",
        generation: "GEN-2",
        status: "LAB_TESTING",
        promoted: false,
        epistemic_status: "Hypothesis H1 active (Search Horizon vs Pruning)"
      }
    ]
  };
}

export function getEvolutionPromotions() {
  return {
    ok: true,
    total_promotions: PROMOTION_HISTORY.length,
    promotions: PROMOTION_HISTORY
  };
}

export function getEvolutionStrengthGraph() {
  return {
    ok: true,
    milestones: [
      { date: "2026-05-15", version: "E3", elo: 2450, note: "Early tactical prototype" },
      { date: "2026-06-20", version: "E4", elo: 2580, note: "HalfKP NNUE initial calibration" },
      { date: "2026-07-15", version: "E5 / A50", elo: 2720, note: "Production Champion Sealed (#001)" },
      { date: "2026-10-04", version: "R07.4b (Lab)", elo: 2679, note: "SPRT 400 games (Inconclusive vs E5)" }
    ]
  };
}
