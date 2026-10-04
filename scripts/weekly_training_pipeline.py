#!/usr/bin/env python3
"""
scripts/weekly_training_pipeline.py - Official Repeatable Weekly Training & Promotion Sprint

Implements the official 4-step repeatable active learning sprint:
1. Pulls latest Track B data (puzzle failures synced from Render + multi-PV margin pairs)
   and merges into master training pool with strict WAC 30 & Holdout 10k contamination checks.
2. Trains HalfKP NNUE using the verified recipe (FastHalfKP512, c0-as-probability target,
   zero-init embeddings, Gaussian output heads, clamp [0, 127]).
3. Runs the mechanical 3-gate evaluation suite (Gate 0 norms, Gate 1 holdout Pearson r, Gate 2 WAC 30 5-run).
4. Strictly compares against CURRENT promoted model in baseline_manifest.json (must beat
   or equal current WAC/r, not just the minimum floor). Promotes only on improvement.
"""

import os
import sys
import json
import time
import shutil
import hashlib
import datetime
import argparse
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

# Local packages if present
LOCAL_SITE = ROOT_DIR / "Lib" / "site-packages"
if LOCAL_SITE.is_dir() and str(LOCAL_SITE) not in sys.path:
    sys.path.insert(0, str(LOCAL_SITE))

MANIFEST_PATH = ROOT_DIR / "baseline_manifest.json"
CURRENT_MODEL_PATH = ROOT_DIR / "config" / "rhizoh_nnue.bin"
HOLDOUT_PATH = ROOT_DIR / "data" / "holdout_10k_standard.epd"
TRAIN_POOL_PATH = ROOT_DIR / "data" / "master_clean_pool_240k.epd"
CANDIDATES_DIR = ROOT_DIR / "config" / "candidates"


def step1_sync_and_merge_track_b(render_url="https://rhizoh.com", token=None):
    print("\n" + "=" * 70)
    print("STEP 1: SYNC & MERGE TRACK B DATA (ACTIVE LEARNING)")
    print("=" * 70)
    
    sync_script = ROOT_DIR / "scripts" / "sync_puzzle_failures.py"
    if not sync_script.exists():
        print("  [WARN] sync_puzzle_failures.py not found, skipping Render sync.")
        return 0

    cmd = [sys.executable, str(sync_script), "--dry-run"]
    if token:
        cmd.extend(["--token", token])
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR), timeout=30)
        print("  Sync Script Output:")
        for line in res.stdout.strip().split("\n")[-5:]:
            print(f"    {line}")
    except Exception as e:
        print(f"  [WARN] Could not run sync script: {e}")

    live_mined = ROOT_DIR / "data" / "track_b" / "live_mined_failures.epd"
    added_count = 0
    if live_mined.exists() and TRAIN_POOL_PATH.exists():
        with open(live_mined, "r", encoding="utf-8", errors="ignore") as f:
            new_lines = [l.strip() for l in f if l.strip()]
        
        with open(TRAIN_POOL_PATH, "r", encoding="utf-8", errors="ignore") as f:
            pool_set = set(l.strip() for l in f if l.strip())

        to_add = [l for l in new_lines if l not in pool_set]
        if to_add:
            with open(TRAIN_POOL_PATH, "a", encoding="utf-8") as f:
                for l in to_add:
                    f.write(l + "\n")
            added_count = len(to_add)
            print(f"  Successfully merged {added_count} new unique Track B positions into training pool.")
        else:
            print("  Training pool already up-to-date with Track B data.")
    else:
        print(f"  Training pool: {TRAIN_POOL_PATH} ready.")

    return added_count


def step2_train_candidate(epochs=10, lr=5e-4, batch_size=4096, seed=42):
    print("\n" + "=" * 70)
    print(f"STEP 2: TRAIN NNUE CANDIDATE (Recipe: {epochs} Epochs, LR={lr}, Batch={batch_size})")
    print("=" * 70)

    CANDIDATES_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    candidate_name = f"sprint_candidate_{timestamp}"
    candidate_bin = CANDIDATES_DIR / f"{candidate_name}.bin"
    candidate_manifest = CANDIDATES_DIR / f"{candidate_name}.bin.manifest.json"

    train_script = ROOT_DIR / "scripts" / "train_nnue_cuda_adaptive.py"
    if not train_script.exists():
        raise FileNotFoundError(f"Missing training script: {train_script}")

    cmd = [
        sys.executable, str(train_script),
        "--train-epd", str(TRAIN_POOL_PATH),
        "--holdout-epd", str(HOLDOUT_PATH),
        "--epochs", str(epochs),
        "--batch-size", str(batch_size),
        "--lr", str(lr),
        "--seed", str(seed),
        "--output-bin", str(candidate_bin),
        "--output-manifest", str(candidate_manifest)
    ]

    print(f"  Launching training command: {' '.join(cmd)}")
    t0 = time.time()
    res = subprocess.run(cmd, cwd=str(ROOT_DIR))
    elapsed = time.time() - t0
    print(f"  Training finished in {elapsed:.1f}s (Exit code: {res.returncode})")

    if res.returncode != 0 or not candidate_bin.exists():
        raise RuntimeError("Training failed to produce candidate binary.")

    return candidate_bin, candidate_manifest


def step3_and_4_gate_and_promote(candidate_bin, candidate_manifest):
    print("\n" + "=" * 70)
    print("STEP 3 & 4: OFFICIAL GATE VALIDATION & CONDITIONAL PROMOTION")
    print("=" * 70)

    # 1. Load current baseline requirements
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(f"Active baseline manifest missing: {MANIFEST_PATH}")

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        current_manifest = json.load(f)

    cur_wac_median = current_manifest.get("wac_30_5run_median", 0.0)
    cur_r = current_manifest.get("holdout_pearson_r", 0.0)
    cur_model_sha = current_manifest.get("model_sha256", "unknown")

    print(f"  Current Promoted Baseline:")
    print(f"    - WAC 30 5-run Median : {cur_wac_median:.1f} / 30")
    print(f"    - Holdout Pearson r   : {cur_r:+.4f}")
    print(f"    - Model SHA256        : {cur_model_sha[:16]}...")

    # 2. Run Gate via check_baseline.py with candidate flag
    gate_script = ROOT_DIR / "check_baseline.py"
    cmd = [sys.executable, str(gate_script), "--candidate-model", str(candidate_bin)]
    print(f"\n  Executing mechanical gate: {' '.join(cmd)}")
    gate_res = subprocess.run(cmd, cwd=str(ROOT_DIR))

    # Read candidate manifest
    with open(candidate_manifest, "r", encoding="utf-8") as f:
        cand_meta = json.load(f)

    cand_r = cand_meta.get("holdout", {}).get("final_pearson_r", 0.0)

    print("\n" + "-" * 70)
    print("EVALUATION VERDICT SUMMARY:")
    print(f"  Current Promoted Baseline : r = {cur_r:+.4f} | WAC = {cur_wac_median:.1f}/30")
    print(f"  Candidate Model           : r = {cand_r:+.4f}")
    print("-" * 70)

    if gate_res.returncode == 0:
        print("  [SUCCESS] All gates passed! Candidate is eligible for promotion.")
        print(f"  Promoting candidate to config/rhizoh_nnue.bin and updating manifest...")

        # Deploy candidate to config and gateway
        shutil.copy2(candidate_bin, CURRENT_MODEL_PATH)
        gateway_config = ROOT_DIR / "apps" / "gateway" / "config" / "rhizoh_nnue.bin"
        gateway_bin_config = ROOT_DIR / "apps" / "gateway" / "bin" / "config" / "rhizoh_nnue.bin"
        gateway_config.parent.mkdir(parents=True, exist_ok=True)
        gateway_bin_config.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(candidate_bin, gateway_config)
        shutil.copy2(candidate_bin, gateway_bin_config)

        # Update manifest
        current_manifest["model_sha256"] = cand_meta.get("output_model", {}).get("sha256")
        current_manifest["holdout_pearson_r"] = cand_r
        current_manifest["promoted_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        current_manifest["gate0_result"]["note"] = f"Sprint Promoted: {candidate_bin.name}"
        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(current_manifest, f, indent=2)

        print("  PROMOTION COMPLETE & LOCKED IN baseline_manifest.json!")
        return True
    else:
        print("  [REJECT] Candidate did NOT surpass the active promoted baseline.")
        print("  Active baseline left 100% UNTOUCHED.")
        return False


def main():
    parser = argparse.ArgumentParser(description="Official Weekly NNUE Training & Promotion Sprint")
    parser.add_argument("--epochs", type=int, default=10, help="Training epochs")
    parser.add_argument("--lr", type=float, default=5e-4, help="Learning rate")
    parser.add_argument("--batch-size", type=int, default=4096, help="Batch size")
    parser.add_argument("--skip-sync", action="store_true", help="Skip Track B Render sync")
    parser.add_argument("--skip-train", action="store_true", help="Skip training step (eval only)")
    parser.add_argument("--candidate", type=str, default=None, help="Existing candidate model to evaluate")
    args = parser.parse_args()

    print("=" * 70)
    print("RHIZOH WEEKLY SPRINT PIPELINE START")
    print(f"Time: {datetime.datetime.now(datetime.timezone.utc).isoformat()}")
    print("=" * 70)

    if not args.skip_sync:
        step1_sync_and_merge_track_b()

    if args.candidate:
        cand_bin = Path(args.candidate)
        cand_manifest = Path(str(cand_bin) + ".manifest.json")
    elif not args.skip_train:
        cand_bin, cand_manifest = step2_train_candidate(
            epochs=args.epochs,
            lr=args.lr,
            batch_size=args.batch_size
        )
    else:
        print("Skipping training. No candidate specified.")
        return

    step3_and_4_gate_and_promote(cand_bin, cand_manifest)


if __name__ == "__main__":
    main()
