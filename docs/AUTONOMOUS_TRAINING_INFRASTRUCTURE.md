# Autonomous Large-Scale NNUE Training Infrastructure Blueprint

## Strategic Roadmap: Two-Track Execution

### Track 1: Live Grandmaster NNUE (Immediate - DEPLOYED)
- **Engine Evaluator**: Stockfish CC0 Open Network (`nn-9931db908a9b.nnue`, 21MB HalfKP)
- **Runtime**: Native MIT Rust AVX2 SIMD (`nnue-rs` v0.4.0)
- **Licensing**: 100% CC0 1.0 Universal public domain weights + MIT pure Rust runtime. Zero GPL contagion.
- **Cross-Platform**: Bitwise & tactical evaluation parity confirmed between Windows (`castle.exe`) and Linux (`x86_64-unknown-linux-musl`).
- **Live Endpoint**: Deployed to `https://rhizoh.com/api/chess/move` via Render and Firebase Hosting.

---

### Track 2: Long-Term Autonomous Custom Training Pipeline ($0 Spent This Week)

```
+-------------------------------------------------------------------------+
| HETZNER CLOUD WORKER (CPX31 - Month-Start Rollout: ~€13.40/mo)          |
| - 4 vCPU AMD EPYC, 8 GB RAM, 160 GB NVMe                               |
| - Dockerized Selfplay Daemon (`docker/selfplay-worker/Dockerfile`)      |
| - Generates ~25,000 selfplay games/day with opening book diversity     |
| - Validated with Syzygy 5-piece endgame tablebases                      |
+------------------------------------+------------------------------------+
                                     |
                                     v [Compressed EPD Chunks (GCS / Firebase Storage)]
+------------------------------------+------------------------------------+
| TARGET DATASET MILESTONES                                               |
| - Milestone 1: 2,000,000 positions (Tactical + Positional Balanced)     |
| - Milestone 2: 10,000,000 positions (Full Grandmaster Diversity)       |
+------------------------------------+------------------------------------+
                                     |
                                     v [On-Demand Spot GPU Batch]
+------------------------------------+------------------------------------+
| CLOUD GPU TRAINING BATCH (RunPod / GCP Spot L4 / Lambda)               |
| - Hourly Spot Rate: ~$0.20 - $0.35/hr                                  |
| - Run Duration: 6 to 8 hours per training epoch (~$1.50 - $2.80 total)  |
| - Model: HalfKA (45,056 -> 512x2 -> 1) INT16 AVX2 Dual-Perspective     |
| - Optimizer: AdamW with cosine annealing & WDL-margin loss              |
+------------------------------------+------------------------------------+
                                     |
                                     v [Automated Gating Pipeline]
+------------------------------------+------------------------------------+
| FOUR-GATE PROMOTION SYSTEM                                              |
| - Gate 0: Sanity & Sign Inversion (100% pass)                           |
| - Gate 1: Pearson r Holdout >= 0.44 (10,000 standard holdout EPD)       |
| - Gate 2: Static Evaluation Delta > 800 cp on Queen imbalance          |
| - Gate 3: WAC 30 5-Run Median >= 21.0 / 30                              |
| - Promotion: Only when Gate 3 >= 21.0 and Candidate beats HCE           |
+-------------------------------------------------------------------------+
```

## Budget & Cost Control
1. **This Week**: **$0.00 spent**. All Dockerfiles, daemons, and cross-compilation completed locally.
2. **Month-Start Activation**:
   - Hetzner CPX31 instance: €13.40 / month (€0.021 / hr)
   - Spot GPU for 10M distillation: ~€2.50 one-off
   - Total monthly investment: **< €16 / month**
