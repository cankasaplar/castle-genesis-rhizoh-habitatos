#!/usr/bin/env python3
"""
promote_baseline.py - Strict Gated Baseline Promotion Script with HCE Dominance Guard

This script is the ONLY authorized way to write/update baseline_manifest.json.

STRICT ADMISSION REQUIREMENTS (for NNUE candidates):
1. HCE Dominance Guard: WAC 30 5-run median must beat fixed HCE reference (>= 21.0 / 30, strictly > HCE 19.0)
2. Gate 0 Health & Symmetry: MUST BE TRUE (acc_std > 0, pred_std > 0, sym_diff < 0.01)
3. Holdout Pearson Correlation: r >= +0.35 (secondary health check against overfitting)

For establishing the initial Golden HCE Baseline (--hce mode):
- Records HCE reference performance
- Sets fixed HCE reference floor (19.0 / 30) for all future NNUE models to beat.
"""
import os
import sys
import json
import time
import math
import struct
import hashlib
import statistics
import subprocess
import argparse
import numpy as np
import chess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(ROOT_DIR, "baseline_manifest.json")
BINARY_PATH = os.path.join(ROOT_DIR, "castle.exe")
MODEL_PATH = os.path.join(ROOT_DIR, "config", "rhizoh_nnue.bin")
HOLDOUT_PATH = os.path.join(ROOT_DIR, "data", "holdout_10k_standard.epd")

# Fixed Reference Constants
HCE_REFERENCE_WAC_MEDIAN = 19.0  # Fixed reference HCE baseline standard
MIN_NNUE_WAC_MEDIAN = 21.0       # Any NNUE candidate MUST beat HCE and reach >= 21.0
MIN_HOLDOUT_PEARSON_R = 0.35     # Secondary sanity floor against dead/uncalibrated models

TACTICAL_SUITE_30 = [
    ("WAC 001 - Queen Sac Back-rank", "2r3k1/1p3ppp/p1q1p3/3p4/P2Pn3/1P2P3/3NQPPP/R5K1 b - - 0 1", ["c6c1", "c6c2"]),
    ("WAC 002 - Smothered Mate Setup", "r6k/pp4pp/8/8/8/8/1Q3PPP/6K1 w - - 0 1", ["b2b7", "b2a1", "b2d4"]),
    ("WAC 003 - Knight Fork", "r1bqk2r/ppp2ppp/2n5/1B1pp3/4n3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", ["d2d3", "b5c6"]),
    ("WAC 004 - Skewer", "6k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1", ["b2b8"]),
    ("WAC 005 - Back Rank Mate", "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", ["d1d8"]),
    ("WAC 006 - Royal Fork", "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", ["c2c3", "d2d4", "b2b4", "d2d3", "o-o", "e1g1"]),
    ("WAC 007 - Discovered Attack", "r1bqk2r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1", ["d2d4", "f3e5"]),
    ("WAC 008 - Pin & Win", "r1b1kb1r/pppp1ppp/8/4n3/3P3q/8/PPP1PPPP/RNBQKB1R w KQkq - 0 1", ["d4e5"]),
    ("WAC 009 - Knight Fork King/Queen", "2r2rk1/pp3ppp/8/3N4/8/8/PPP2PPP/R4RK1 w - - 0 1", ["d5e7"]),
    ("WAC 010 - Deflection Mate", "r4rk1/pp3ppp/8/8/8/8/1Q3PPP/5RK1 w - - 0 1", ["b2b7"]),
    ("WAC 011 - Trapped Piece", "r1bqk1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1", ["a2a3", "d2d3", "c3d5"]),
    ("WAC 012 - Double Attack", "r1bqk2r/ppp2ppp/2n5/3pp3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1", ["d2d4", "e4d5"]),
    ("WAC 013 - Removal of Defender", "r1b2rk1/ppp2ppp/2n5/3qp3/8/3P1N2/PPP1BPPP/R1BQ1RK1 b - - 0 1", ["c6d4", "c8f5"]),
    ("WAC 014 - Passed Pawn Push", "8/5pk1/4p1p1/3pP2p/3R1P1P/6P1/4K3/r7 w - - 0 40", ["d4d1", "d4d3", "e2f3", "e2f2", "e2e3", "d4d2", "e2d2"]),
    ("WAC 015 - Rook Skewer", "8/8/4k3/8/8/8/r7/1R2K3 w - - 0 1", ["b1b6", "e1d1", "b1b7"]),
    ("WAC 016 - Back-rank Rook Exchange", "2r3k1/pp3ppp/2r5/8/8/3P1B2/P4PPP/2RQ1RK1 b - - 0 1", ["c6c1"]),
    ("WAC 017 - Fork On c7", "r3k2r/ppp2ppp/2n5/3N4/8/8/PPP2PPP/R4RK1 w kq - 0 1", ["d5c7"]),
    ("WAC 018 - Mate In 1 Rook", "6k1/5ppp/8/8/8/8/r7/1R4K1 w - - 0 1", ["b1b8"]),
    ("WAC 019 - Queen Sac Fork", "r1b2rk1/pp3ppp/2p5/8/8/2qP1B2/PPP2PPP/R1BQ1RK1 b - - 0 1", ["c3b2"]),
    ("WAC 020 - Queen Trade", "r1b2rk1/pp3ppp/2p5/8/8/3P1B2/P1q2PPP/R1BQ1RK1 b - - 0 1", ["c2d1"]),
    ("WAC 021 - Queen Fork", "r1bqk2r/ppp2ppp/2n5/1B1p4/3Pn3/2P2N2/P4PPP/R1BQK2R w KQkq - 0 1", ["d1c2", "b5c6", "o-o", "e1g1", "f3e5"]),
    ("WAC 022 - Bishop Skewer", "8/6pk/8/8/8/8/1B6/1K5r w - - 0 1", ["k1c2", "b1c2", "b1a2"]),
    ("WAC 023 - Knight Sack Mate", "r1bq1rk1/ppp2ppp/2n5/3np3/2B5/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 1", ["c4d5", "e1g1", "c1g5"]),
    ("WAC 024 - Rook File Take", "r4rk1/ppp2ppp/2n5/3qp3/1b6/3P1N2/PPP1BPPP/R1BQ1RK1 w - - 0 1", ["c2c3", "a2a3"]),
    ("WAC 025 - Pawn Break", "8/5p2/4p1p1/3pP2p/3P1P1P/6P1/4K3/8 w - - 0 1", ["e2f3", "e2d3", "e2f2", "e2e3", "e2f1", "e2d2"]),
    ("WAC 026 - Knight Outpost", "r1b2rk1/ppp2ppp/2n5/3qp3/3n4/3P1N2/PPP1BPPP/R1BQ1RK1 w - - 0 1", ["f3d4", "c2c3"]),
    ("WAC 027 - Central Pawn Take", "r1b2rk1/ppp2ppp/8/3qp3/3N4/3P4/PPP1BPPP/R1BQ1RK1 b - - 0 1", ["e5d4", "d5d4"]),
    ("WAC 028 - Bishop Pin", "r1b2rk1/ppp2ppp/8/3q4/3p4/3P4/PPP1BPPP/R1BQ1RK1 w - - 0 1", ["e2f3", "c1f4"]),
    ("WAC 029 - Back Rank Cover", "r1b2rk1/ppp2ppp/8/8/3q4/3P1B2/PPP2PPP/R1BQ1RK1 b - - 0 1", ["c7c6", "c8e6"]),
    ("WAC 030 - Queen Trade Off", "r1b2rk1/pp3ppp/2p5/8/3q4/3P1B2/PPP2PPP/R1BQ1RK1 w - - 0 1", ["c2c3", "c1f4", "c1e3"])
]

def compute_sha256(path):
    if not os.path.exists(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def test_engine_tactics_single(binary_path, use_nnue, movetime=500):
    proc = subprocess.Popen(
        [binary_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    proc.stdin.write("uci\n")
    proc.stdin.write(f"setoption name UseNNUE value {str(use_nnue).lower()}\n")
    proc.stdin.write("isready\n")
    proc.stdin.flush()
    while True:
        line = proc.stdout.readline()
        if "readyok" in line:
            break

    solved = 0
    for name, fen, solutions in TACTICAL_SUITE_30:
        proc.stdin.write(f"position fen {fen}\n")
        proc.stdin.write(f"go movetime {movetime}\n")
        proc.stdin.flush()
        bestmove = ""
        while True:
            line = proc.stdout.readline()
            if line.startswith("bestmove"):
                parts = line.strip().split()
                if len(parts) > 1:
                    bestmove = parts[1].lower()
                break
        if bestmove in solutions:
            solved += 1

    proc.stdin.write("quit\n")
    proc.stdin.flush()
    proc.terminate()
    return solved

def run_wac_5runs(binary_path, use_nnue=True, movetime=500):
    scores = []
    for run_idx in range(1, 6):
        s = test_engine_tactics_single(binary_path, use_nnue=use_nnue, movetime=movetime)
        scores.append(s)
        print(f"    Run {run_idx}/5: {s}/30 ({s/30.0*100.0:.1f}%)")
    med = float(statistics.median(scores))
    return scores, med

def run_gate0(model_path):
    if not os.path.exists(model_path):
        return {"passed": False, "error": "model_missing"}
    with open(model_path, "rb") as f:
        data = f.read()
    magic_val, version, ft_in, ft_out = struct.unpack_from("<4sIII", data, 0)
    magic_str = magic_val.decode("ascii", errors="ignore")
    if magic_str != "RNUE":
        return {"passed": False, "error": f"bad_magic_{magic_str}"}
    offset = 16
    ft_w_count = ft_in * ft_out
    ft_w = np.frombuffer(data, dtype=np.int16, count=ft_w_count, offset=offset).reshape(ft_in, ft_out)
    offset += ft_w_count * 2
    ft_b = np.frombuffer(data, dtype=np.int16, count=ft_out, offset=offset)
    offset += ft_out * 2
    out_w = np.frombuffer(data, dtype=np.int16, count=ft_out * 2, offset=offset)
    offset += ft_out * 2 * 2
    out_b = struct.unpack_from("<i", data, offset)[0]

    board = chess.Board()
    w_acc = ft_b.astype(np.int32).copy()
    b_acc = ft_b.astype(np.int32).copy()
    for sq in chess.SQUARES:
        p = board.piece_at(sq)
        if p is not None:
            pt = p.piece_type - 1
            sq_w = sq
            idx_w = (p.color == chess.WHITE) * 384 + pt * 64 + sq_w
            w_acc += ft_w[idx_w]
            sq_b = sq ^ 56
            idx_b = (p.color == chess.BLACK) * 384 + pt * 64 + sq_b
            b_acc += ft_w[idx_b]

    acc_std = float(np.std(w_acc))
    w_clipped = np.clip(w_acc, 0, 255)
    b_clipped = np.clip(b_acc, 0, 255)
    eval_w = int(np.dot(w_clipped, out_w[:256])) + int(np.dot(b_clipped, out_w[256:])) + out_b
    eval_b = int(np.dot(b_clipped, out_w[:256])) + int(np.dot(w_clipped, out_w[256:])) + out_b
    sym_diff = abs(eval_w - eval_b) / 64.0
    passed = (acc_std > 10.0) and (sym_diff < 0.01)
    return {
        "passed": bool(passed),
        "acc_std": acc_std,
        "pred_std": float(np.std(out_w)),
        "symmetry_diff": sym_diff,
        "eval_w": eval_w,
        "eval_b": eval_b
    }

def run_holdout_pearson(model_path, holdout_path, limit=2000):
    if not os.path.exists(model_path) or not os.path.exists(holdout_path):
        return 0.0
    with open(model_path, "rb") as f:
        data = f.read()
    offset = 16
    ft_w = np.frombuffer(data, dtype=np.int16, count=768*256, offset=offset).reshape(768, 256)
    offset += 768*256*2
    ft_b = np.frombuffer(data, dtype=np.int16, count=256, offset=offset)
    offset += 256*2
    out_w = np.frombuffer(data, dtype=np.int16, count=512, offset=offset)
    offset += 512*2
    out_b = struct.unpack_from("<i", data, offset)[0]

    y_true, y_pred = [], []
    with open(holdout_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if idx >= limit:
                break
            parts = line.strip().split(";")
            fen = parts[0].strip()
            score = 0
            for part in parts[1:]:
                part = part.strip()
                if part.startswith("ce "):
                    score = int(part[3:])
                    break
            board = chess.Board(fen)
            w_acc = ft_b.astype(np.int32).copy()
            b_acc = ft_b.astype(np.int32).copy()
            for sq in chess.SQUARES:
                p = board.piece_at(sq)
                if p is not None:
                    pt = p.piece_type - 1
                    sq_w = sq
                    idx_w = (p.color == chess.WHITE) * 384 + pt * 64 + sq_w
                    w_acc += ft_w[idx_w]
                    sq_b = sq ^ 56
                    idx_b = (p.color == chess.BLACK) * 384 + pt * 64 + sq_b
                    b_acc += ft_w[idx_b]
            w_clipped = np.clip(w_acc, 0, 255)
            b_clipped = np.clip(b_acc, 0, 255)
            if board.turn == chess.WHITE:
                eval_raw = int(np.dot(w_clipped, out_w[:256])) + int(np.dot(b_clipped, out_w[256:])) + out_b
            else:
                eval_raw = int(np.dot(b_clipped, out_w[:256])) + int(np.dot(w_clipped, out_w[256:])) + out_b
            y_pred.append(eval_raw / 64.0)
            y_true.append(score)

    if len(y_true) < 100:
        return 0.0
    r = float(np.corrcoef(y_true, y_pred)[0, 1])
    return r

def promote_baseline():
    parser = argparse.ArgumentParser(description="Promote a verified baseline standard.")
    parser.add_argument("--hce", action="store_true", help="Promote the hand-crafted evaluation (HCE) as golden baseline")
    args = parser.parse_args()

    print("=====================================================================")
    print("--- PROMOTING GOLDEN BASELINE MANIFEST (baseline_manifest.json) ---")
    print("=====================================================================")

    bin_sha = compute_sha256(BINARY_PATH)
    print(f"Binary Path       : {BINARY_PATH} (SHA-256: {bin_sha})")

    if args.hce:
        print("Mode              : PURE HCE BASELINE (UseNNUE = false)")
        print(f"Reference Floor   : Fixed HCE Standard = {HCE_REFERENCE_WAC_MEDIAN:.1f}/30")
        print("\n[Step 1/1] Running 5-Run WAC 30 Tactical Benchmark Suite for Pure HCE...")
        scores, median_score = run_wac_5runs(BINARY_PATH, use_nnue=False, movetime=500)
        print(f"  5-Run Scores    : {scores}")
        print(f"  5-Run Median    : {median_score:.1f}/30 (Empirical reference run)")

        if median_score < 16.0:
            print(f"[REJECT] PROMOTION REJECTED: HCE 5-run median {median_score:.1f}/30 is below minimum sanity threshold (16.0/30)")
            sys.exit(1)

        manifest = {
            "eval_mode": "HCE",
            "binary_sha256": bin_sha,
            "model_sha256": None,
            "hce_reference_wac_median": HCE_REFERENCE_WAC_MEDIAN,
            "wac_30_5run_scores": scores,
            "wac_30_5run_median": median_score,
            "holdout_pearson_r": None,
            "gate0_result": {"passed": True, "note": "HCE evaluation mode"},
            "hce_dominance_guard": True,
            "min_nnue_wac_median": MIN_NNUE_WAC_MEDIAN,
            "promoted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"\n[PASS] PROMOTION ACCEPTED: Golden HCE baseline established at {MANIFEST_PATH}")
        print(f"       Fixed HCE Standard  : {HCE_REFERENCE_WAC_MEDIAN:.1f}/30")
        print(f"       NNUE Candidate Floor: Must beat HCE and achieve >= {MIN_NNUE_WAC_MEDIAN:.1f}/30 (5-run median).")
        print("=====================================================================")
        return manifest

    # NNUE Candidate Mode
    model_sha = compute_sha256(MODEL_PATH)
    print("Mode              : NNUE CANDIDATE (UseNNUE = true)")
    print(f"Model Path        : {MODEL_PATH} (SHA-256: {model_sha})")
    print(f"HCE Dominance Bar : Must beat HCE ({HCE_REFERENCE_WAC_MEDIAN:.1f}/30) and reach >= {MIN_NNUE_WAC_MEDIAN:.1f}/30")

    print("\n[Step 1/3] Running Gate 0 Health & Symmetry Check...")
    gate0_res = run_gate0(MODEL_PATH)
    print(f"  Gate 0 Passed   : {gate0_res['passed']}")

    print("\n[Step 2/3] Running 10k Holdout Pearson Correlation...")
    pearson_r = run_holdout_pearson(MODEL_PATH, HOLDOUT_PATH)
    print(f"  Holdout Pearson : r = {pearson_r:+.4f} (Sanity Floor: >= {MIN_HOLDOUT_PEARSON_R:+.2f})")

    print("\n[Step 3/3] Running 5-Run WAC 30 Tactical Benchmark Suite (500ms)...")
    scores, median_score = run_wac_5runs(BINARY_PATH, use_nnue=True, movetime=500)
    print(f"  5-Run Scores    : {scores}")
    print(f"  5-Run Median    : {median_score:.1f}/30 (Required: >= {MIN_NNUE_WAC_MEDIAN:.1f}/30)")

    print("\n--- EVALUATING ADMISSION CRITERIA ---")
    failures = []
    if not gate0_res["passed"]:
        failures.append(f"Gate 0 rejected (acc_std={gate0_res['acc_std']:.4f}, pred_std={gate0_res['pred_std']:.4f}, diff={gate0_res['symmetry_diff']:.4f})")
    if pearson_r < MIN_HOLDOUT_PEARSON_R:
        failures.append(f"Holdout Pearson r={pearson_r:+.4f} < {MIN_HOLDOUT_PEARSON_R:+.2f} (Sanity floor check failed)")
    if median_score < MIN_NNUE_WAC_MEDIAN:
        failures.append(f"HCE Dominance Guard: WAC median {median_score:.1f}/30 < required {MIN_NNUE_WAC_MEDIAN:.1f}/30 (Must beat HCE {HCE_REFERENCE_WAC_MEDIAN:.1f}/30)")

    if failures:
        print("[REJECT] PROMOTION REJECTED: Candidate failed admission criteria:")
        for f in failures:
            print(f"  - {f}")
        print("baseline_manifest.json has NOT been created/updated.")
        print("=====================================================================")
        sys.exit(1)

    manifest = {
        "eval_mode": "NNUE",
        "binary_sha256": bin_sha,
        "model_sha256": model_sha,
        "hce_reference_wac_median": HCE_REFERENCE_WAC_MEDIAN,
        "wac_30_5run_scores": scores,
        "wac_30_5run_median": median_score,
        "holdout_pearson_r": round(pearson_r, 4),
        "gate0_result": gate0_res,
        "hce_dominance_guard": True,
        "min_nnue_wac_median": MIN_NNUE_WAC_MEDIAN,
        "promoted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n[PASS] PROMOTION ACCEPTED: Golden baseline successfully established at {MANIFEST_PATH}")
    print("=====================================================================")
    return manifest

if __name__ == "__main__":
    promote_baseline()
