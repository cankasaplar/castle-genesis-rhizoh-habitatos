#!/usr/bin/env python3
"""
promote_baseline.py - Hardened Two-Stage Statistical Gate Promotion System

This script is the SOLE AUTHORIZED GATEKEEPER for promoting any NNUE model to production.
No manual copying or judgment calls are permitted.

MANDATORY ENFORCED SEQUENCE:
1. Hard-Veto 1: Gate 0 Health & Symmetry Check
2. Hard-Veto 2: Mean Search-Control Drift <= 10.0 cp vs CURRENT CHAMPION
3. Stage A (Cheap Pre-Screen): 50-game gauntlet vs Current Champion (>= 50.0% required to proceed)
4. Stage B (Statistical Confirmation): 200-game Wald SPRT vs Current Champion
   - H0: Delta Elo <= 0, H1: Delta Elo >= 25 (alpha=0.05, beta=0.05)
   - Stopping Bounds: LLR <= -2.944 (Reject H1), LLR >= +2.944 (Accept H1)
   - ONLY an H1 ACCEPT promotes. Inconclusive or H0 = IMMEDIATE REJECT.
5. Final Re-verification & Atomic Promotion:
   - Updates config/rhizoh_nnue.bin, gateway paths, baseline_manifest.json, and champion_manifest.json.
"""

import os
import sys
import time
import math
import shutil
import tempfile
import json
import hashlib
import statistics
import argparse
import subprocess
import chess
import chess.engine
import chess.pgn
import torch
import numpy as np

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CASTLE_EXE = os.path.join(ROOT_DIR, "castle.exe")
CHAMPION_PATH = os.path.join(ROOT_DIR, "config", "rhizoh_nnue.bin")
MANIFEST_PATH = os.path.join(ROOT_DIR, "baseline_manifest.json")
CHAMPION_MANIFEST_PATH = os.path.join(ROOT_DIR, "data", "champion_manifest.json")
RESEARCH_POOL_PATH = os.path.join(ROOT_DIR, "data", "confirmed_search_research_pool.json")
HOLDOUT_PATH = os.path.join(ROOT_DIR, "data", "holdout_10k_standard.epd")

GATE_SEARCH_CONTROL_DRIFT_MAX = 10.0  # HARD VETO: Max allowed mean drift in centipawns
STAGE_A_GAMES = 50
STAGE_B_MAX_GAMES = 200
MOVE_TIME = 0.10

from scripts.train_nnue_cuda_adaptive import FastHalfKP512_NNUE, fen_to_halfkp_indices_dual, QUANT_SCALE, evaluate_pearson_holdout
from check_baseline import TACTICAL_SUITE_30, run_gate0

PAIRED_OPENINGS = [
    ("Italian Game (Giuoco Piano)", "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"),
    ("Ruy Lopez (Closed Morphy)", "r1bqkb1r/1ppp1ppp/p1n5/4p3/B3P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 5"),
    ("Sicilian Defense (Open Classical)", "r1bqkb1r/pp2pppp/2np1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 6"),
    ("Sicilian Defense (Najdorf)", "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6"),
    ("French Defense (Winawer)", "rnbqk1nr/ppp2ppp/4p3/3p4/3PP3/2b5/PPPN1PPP/R1BQKBNR w KQkq - 0 5"),
    ("French Defense (Tarrasch)", "rnbqkb1r/ppp2ppp/4pn2/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4"),
    ("Caro-Kann Defense (Advance)", "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3"),
    ("Caro-Kann Defense (Classical)", "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5"),
    ("Queen's Gambit Declined (Exchange)", "rnbqkb1r/ppp2ppp/4pn2/3P4/2PP4/2N5/PP3PPP/R1BQKBNR b KQkq - 0 4"),
    ("Queen's Gambit Accepted", "rnbqkbnr/ppp1pppp/8/8/2pP4/4P3/PP3PPP/RNBQKBNR b KQkq - 0 3"),
    ("Nimzo-Indian Defense (Rubinstein)", "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4"),
    ("King's Indian Defense (Mar del Plata)", "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQkq - 3 5"),
    ("Grunfeld Defense (Exchange)", "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4"),
    ("English Opening (Symmetrical)", "rnbqkb1r/pp1ppppp/5n2/2p5/2P5/2N5/PP1PPPPP/R1BQKBNR w KQkq - 2 3"),
    ("Reti Opening (King's Indian Setup)", "rnbqkb1r/pppppp1p/5np1/8/2P5/5N2/PP1PPPPP/RNBQKB1R w KQkq - 2 3"),
    ("Slav Defense (Modern)", "rnbqkb1r/pp2pppp/2p2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R b KQkq - 3 4"),
    ("Semi-Slav Defense (Meran)", "rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5"),
    ("Scotch Game (Mieses)", "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3"),
    ("Scandinavian Defense (Main Line)", "rnb1kbnr/ppp1pppp/8/q7/3P4/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 4"),
    ("Alekhine Defense (Modern)", "rnbqkb1r/ppp1pppp/3p4/3nP3/3P4/5N2/PPP2PPP/RNBQKB1R b KQkq - 1 4"),
    ("Vienna Game (Falkbeer)", "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/2N5/PPPP1PPP/R1BQK1NR b KQkq - 3 3"),
    ("Benoni Defense (Modern)", "rnbqkb1r/pp1p1ppp/4pn2/2p5/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4"),
    ("Dutch Defense (Classical)", "rnbqkb1r/ppppp1pp/5n2/5p2/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3"),
    ("Pirc Defense (Austrian Attack)", "rnbqkb1r/ppp1pp1p/3p1np1/8/3PPP2/2N5/PPP3PP/R1BQKBNR b KQkq - 0 4"),
    ("King's Gambit (Accepted)", "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2"),
]

def compute_sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def create_sandbox_engine(model_path, prefix):
    sb = tempfile.TemporaryDirectory(prefix=prefix)
    cfg_dir = os.path.join(sb.name, "config")
    os.makedirs(cfg_dir, exist_ok=True)
    shutil.copyfile(model_path, os.path.join(cfg_dir, "rhizoh_nnue.bin"))
    eng = chess.engine.SimpleEngine.popen_uci([CASTLE_EXE], cwd=sb.name)
    eng.configure({"UseNNUE": True, "UseCentralPawnBonus": False, "Hash": 64})
    return eng, sb

def eval_search_control_drift(candidate_path, champion_path):
    """Hard-veto evaluation: Mean Search-Control Drift must be <= 10.0 cp vs champion."""
    print("\n" + "=" * 76)
    print("  [HARD-VETO AUDIT] SEARCH-CONTROL EVALUATION DRIFT")
    print("=" * 76)
    print(f"  Candidate Model : {candidate_path}")
    print(f"  Current Champion: {champion_path}")
    print(f"  Benchmark Pool  : {RESEARCH_POOL_PATH}")

    if not os.path.exists(RESEARCH_POOL_PATH):
        raise FileNotFoundError(f"Research pool not found: {RESEARCH_POOL_PATH}")

    device = torch.device("cpu")
    m_champ = FastHalfKP512_NNUE().to(device)
    m_champ.load_quantized(champion_path)
    m_champ.eval()

    m_cand = FastHalfKP512_NNUE().to(device)
    m_cand.load_quantized(candidate_path)
    m_cand.eval()

    with open(RESEARCH_POOL_PATH, 'r', encoding='utf-8') as f:
        d = json.load(f)
    records = d.get('records', d)

    diffs = []
    for r in records:
        fen = r['fen'] if isinstance(r, dict) and 'fen' in r else r
        try:
            b = chess.Board(fen)
        except Exception:
            continue
        w_idx, b_idx = fen_to_halfkp_indices_dual(b)
        w_f = torch.tensor(w_idx, dtype=torch.long)
        w_o = torch.tensor([0], dtype=torch.long)
        b_f = torch.tensor(b_idx, dtype=torch.long)
        b_o = torch.tensor([0], dtype=torch.long)
        stm = torch.tensor([1.0 if b.turn == chess.WHITE else 0.0], dtype=torch.float32)
        with torch.no_grad():
            s_champ = m_champ(w_f, w_o, b_f, b_o, stm).item()
            s_cand = m_cand(w_f, w_o, b_f, b_o, stm).item()
        diffs.append(abs(s_cand - s_champ))

    if not diffs:
        raise ValueError("No positions could be evaluated in search research pool!")

    mean_drift = float(sum(diffs) / len(diffs))
    max_drift = float(max(diffs))
    passed = mean_drift <= GATE_SEARCH_CONTROL_DRIFT_MAX

    print(f"  Positions Evaluated       : {len(diffs)}")
    print(f"  Mean Search-Control Drift : {mean_drift:.2f} cp (Hard Limit: <= {GATE_SEARCH_CONTROL_DRIFT_MAX:.1f} cp)")
    print(f"  Max Search-Control Drift  : {max_drift:.2f} cp")
    print(f"  Hard-Veto Status          : {'PASSED [OK]' if passed else 'FAILED [HARD-VETO REJECT]'}")
    print("=" * 76)
    return mean_drift, max_drift, passed

def run_stage_a_prescreen(cand_path, champ_path):
    """Stage A: 50-game gauntlet vs champion. Must score >= 50.0% to pass."""
    print("\n" + "=" * 76)
    print("  [STAGE A: CHEAP PRE-SCREEN] 50-GAME GAUNTLET VS CURRENT CHAMPION")
    print("=" * 76)
    print(f"  Games: 50 (25 paired openings, color-swapped, {MOVE_TIME*1000:.0f}ms/move)")
    print(f"  Passing Criterion: Score >= 50.0% (25.0 / 50 pts)")

    eng_cand, sb_cand = create_sandbox_engine(cand_path, "castle-stg-a-cand-")
    eng_champ, sb_champ = create_sandbox_engine(champ_path, "castle-stg-a-champ-")

    cand_wins, cand_draws, cand_losses = 0, 0, 0
    game_idx = 0

    for pair_idx, (op_name, fen) in enumerate(PAIRED_OPENINGS[:25], 1):
        # Game 1: Cand White, Champ Black
        game_idx += 1
        b1 = chess.Board(fen)
        while not b1.is_game_over() and len(b1.move_stack) < 140:
            cur = eng_cand if b1.turn == chess.WHITE else eng_champ
            res = cur.play(b1, chess.engine.Limit(time=MOVE_TIME))
            if not res.move: break
            b1.push(res.move)
        r1 = b1.result(claim_draw=True)
        if r1 == "1-0": cand_wins += 1
        elif r1 == "0-1": cand_losses += 1
        else: cand_draws += 1

        # Game 2: Champ White, Cand Black
        game_idx += 1
        b2 = chess.Board(fen)
        while not b2.is_game_over() and len(b2.move_stack) < 140:
            cur = eng_champ if b2.turn == chess.WHITE else eng_cand
            res = cur.play(b2, chess.engine.Limit(time=MOVE_TIME))
            if not res.move: break
            b2.push(res.move)
        r2 = b2.result(claim_draw=True)
        if r2 == "0-1": cand_wins += 1
        elif r2 == "1-0": cand_losses += 1
        else: cand_draws += 1

        pts = cand_wins + 0.5 * cand_draws
        pct = (pts / game_idx) * 100.0
        print(f"  Pair {pair_idx:02d}/25 ({game_idx:02d}G) | Cand: {cand_wins}W - {cand_draws}D - {cand_losses}L | Score: {pts:.1f}/{game_idx} ({pct:.1f}%)")

    try:
        eng_cand.quit()
        eng_champ.quit()
    except Exception:
        pass
    sb_cand.cleanup()
    sb_champ.cleanup()

    total_pts = cand_wins + 0.5 * cand_draws
    win_pct = (total_pts / STAGE_A_GAMES) * 100.0
    passed = win_pct >= 50.0

    print("\n" + "=" * 76)
    print(f"  STAGE A RESULT: {cand_wins}W - {cand_draws}D - {cand_losses}L ({total_pts:.1f} / 50 = {win_pct:.1f}%)")
    print(f"  Stage A Filter: {'PASSED -> ADVANCING TO STAGE B' if passed else 'FAILED [REJECTED - NEVER PROMOTES]'}")
    print("=" * 76)
    return win_pct, passed

def elo_to_prob(delta_elo):
    return 1.0 / (1.0 + 10.0 ** (-delta_elo / 400.0))

def compute_sprt_llr(wins, draws, losses, elo0=0.0, elo1=25.0):
    total = wins + draws + losses
    if total == 0: return 0.0
    p0, p1 = elo_to_prob(elo0), elo_to_prob(elo1)
    draw_ratio = draws / max(1, total)
    if draw_ratio >= 0.99: draw_ratio = 0.5
    w0, w1 = max(0.001, p0 - draw_ratio / 2.0), max(0.001, p1 - draw_ratio / 2.0)
    l0, l1 = max(0.001, (1.0 - p0) - draw_ratio / 2.0), max(0.001, (1.0 - p1) - draw_ratio / 2.0)
    return wins * math.log(w1 / w0) + losses * math.log(l1 / l0)

def run_stage_b_confirmation(cand_path, champ_path):
    """Stage B: Up to 200-game Wald SPRT. ONLY an H1 ACCEPT promotes."""
    print("\n" + "=" * 76)
    print("  [STAGE B: STATISTICAL CONFIRMATION] 200-GAME WALD SPRT")
    print("=" * 76)
    print("  Hypotheses : H0: Delta Elo <= 0 | H1: Delta Elo >= 25 (alpha=0.05, beta=0.05)")
    print("  Stopping Bounds: Lower = -2.944 (Reject H1) | Upper = +2.944 (Accept H1)")
    print("  Rule       : ONLY H1 Accept promotes. Inconclusive or H0 = REJECT.")

    alpha, beta = 0.05, 0.05
    lower_bound = math.log(beta / (1.0 - alpha))   # -2.944
    upper_bound = math.log((1.0 - beta) / alpha)   # +2.944

    eng_cand, sb_cand = create_sandbox_engine(cand_path, "castle-stg-b-cand-")
    eng_champ, sb_champ = create_sandbox_engine(champ_path, "castle-stg-b-champ-")

    cand_wins, cand_draws, cand_losses = 0, 0, 0
    game_idx = 0
    h1_accepted = False
    verdict = "INCONCLUSIVE (REACHED MAX 200 GAMES)"

    full_pairs = []
    for _ in range(4):
        for op in PAIRED_OPENINGS:
            full_pairs.append(op)
    full_pairs = full_pairs[:100]

    for pair_idx, (op_name, fen) in enumerate(full_pairs, 1):
        # Game 1: Cand White, Champ Black
        game_idx += 1
        b1 = chess.Board(fen)
        while not b1.is_game_over() and len(b1.move_stack) < 140:
            cur = eng_cand if b1.turn == chess.WHITE else eng_champ
            res = cur.play(b1, chess.engine.Limit(time=MOVE_TIME))
            if not res.move: break
            b1.push(res.move)
        r1 = b1.result(claim_draw=True)
        if r1 == "1-0": cand_wins += 1
        elif r1 == "0-1": cand_losses += 1
        else: cand_draws += 1

        # Game 2: Champ White, Cand Black
        game_idx += 1
        b2 = chess.Board(fen)
        while not b2.is_game_over() and len(b2.move_stack) < 140:
            cur = eng_champ if b2.turn == chess.WHITE else eng_cand
            res = cur.play(b2, chess.engine.Limit(time=MOVE_TIME))
            if not res.move: break
            b2.push(res.move)
        r2 = b2.result(claim_draw=True)
        if r2 == "0-1": cand_wins += 1
        elif r2 == "1-0": cand_losses += 1
        else: cand_draws += 1

        pts = cand_wins + 0.5 * cand_draws
        pct = (pts / game_idx) * 100.0
        llr = compute_sprt_llr(cand_wins, cand_draws, cand_losses, elo0=0.0, elo1=25.0)

        p = pts / game_idx
        delta_elo = -400.0 * math.log10(1.0 / max(0.001, min(0.999, p)) - 1.0) if 0.01 < p < 0.99 else 0.0
        variance = (cand_wins * ((1.0 - p) ** 2) + cand_draws * ((0.5 - p) ** 2) + cand_losses * ((0.0 - p) ** 2)) / game_idx
        ci_95 = 400.0 * (1.96 * math.sqrt(variance / game_idx)) / (p * (1.0 - p) * math.log(10.0)) if 0.01 < p < 0.99 else 999.0

        print(f"  Pair {pair_idx:03d}/100 ({game_idx:03d}G) | Cand: {cand_wins}W - {cand_draws}D - {cand_losses}L ({pts:.1f}/{game_idx} = {pct:.1f}%) | Elo: {delta_elo:+.1f} [+/- {ci_95:.1f}] | LLR: {llr:+.2f} [Bounds: {lower_bound:.2f}, {upper_bound:.2f}]")

        if llr >= upper_bound:
            verdict = "ACCEPTED H1 (STATISTICALLY VERIFIED PROGRESSION, p < 0.05)"
            h1_accepted = True
            print(f"\n>>> SPRT STOPPING TRIGGERED: LLR ({llr:.2f}) >= Upper Bound (+2.944). H1 ACCEPTED!")
            break
        elif llr <= lower_bound:
            verdict = "ACCEPTED H0 (NO IMPROVEMENT / REGRESSION, REJECT CLAIM)"
            h1_accepted = False
            print(f"\n>>> SPRT STOPPING TRIGGERED: LLR ({llr:.2f}) <= Lower Bound (-2.944). H0 ACCEPTED!")
            break

    try:
        eng_cand.quit()
        eng_champ.quit()
    except Exception:
        pass
    sb_cand.cleanup()
    sb_champ.cleanup()

    total_pts = cand_wins + 0.5 * cand_draws
    win_pct = (total_pts / game_idx) * 100.0
    p = total_pts / game_idx
    delta_elo = -400.0 * math.log10(1.0 / max(0.001, min(0.999, p)) - 1.0) if 0.01 < p < 0.99 else 0.0

    print("\n" + "=" * 76)
    print(f"  STAGE B FINAL RESULT: {cand_wins}W - {cand_draws}D - {cand_losses}L ({total_pts:.1f} / {game_idx} = {win_pct:.1f}%, Elo: {delta_elo:+.1f})")
    print(f"  SPRT Verdict        : {verdict}")
    print(f"  Promotion Eligible  : {'YES (H1 ACCEPTED)' if h1_accepted else 'NO (REJECTED - CHAMPION UNCHANGED)'}")
    print("=" * 76)
    return h1_accepted, delta_elo, win_pct, game_idx, verdict

def promote_candidate(candidate_path, dry_run_veto_only=False):
    print("=" * 76)
    print("  RHIZOH HARDENED TWO-STAGE PROMOTION GATE (promote_baseline.py)")
    print("=" * 76)
    if not os.path.exists(candidate_path):
        print(f"[ERROR] Candidate file does not exist: {candidate_path}")
        sys.exit(1)

    cand_sha = compute_sha256(candidate_path)
    champ_sha = compute_sha256(CHAMPION_PATH) if os.path.exists(CHAMPION_PATH) else None

    print(f"  Candidate Path   : {candidate_path} (SHA: {cand_sha})")
    print(f"  Current Champion : {CHAMPION_PATH} (SHA: {champ_sha})")

    # 1. GATE 0 CHECK
    print("\n[CHECK 1] Running Gate 0 Health & Symmetry Verification...")
    gate0_ok, gate0_meta = run_gate0(candidate_path)
    if not gate0_ok:
        print(f"[FAIL] GATE 0 FAILED: Candidate model has broken symmetry or dead activations. REJECTED.")
        sys.exit(1)
    print("  Gate 0: PASSED [OK]")

    # 2. HARD-VETO: MEAN SEARCH-CONTROL DRIFT
    print("\n[CHECK 2] Evaluating Search-Control Drift Hard-Veto...")
    mean_drift, max_drift, veto_passed = eval_search_control_drift(candidate_path, CHAMPION_PATH)
    if not veto_passed:
        print(f"\n[HARD-VETO TRIGGERED] PROMOTION REJECTED!")
        print(f"  Candidate Mean Drift: {mean_drift:.2f} cp EXCEEDS HARD LIMIT of {GATE_SEARCH_CONTROL_DRIFT_MAX:.1f} cp!")
        print(f"  Rule: Zero tolerance for Search-Control drift > 10.0 cp. Champion remains unchanged.")
        sys.exit(1)

    if dry_run_veto_only:
        print("\n[DRY RUN] Hard-veto checks passed. Exiting without match play as requested by --check-veto-only.")
        return

    # 3. STAGE A: 50-GAME GAUNTLET PRE-SCREEN
    print("\n[CHECK 3] Running Stage A 50-Game Pre-Screen...")
    stg_a_pct, stg_a_passed = run_stage_a_prescreen(candidate_path, CHAMPION_PATH)
    if not stg_a_passed:
        print(f"\n[STAGE A FAILED] PROMOTION REJECTED!")
        print(f"  Candidate scored {stg_a_pct:.1f}% < 50.0% required in Stage A. Champion remains unchanged.")
        sys.exit(1)

    # 4. STAGE B: 200-GAME WALD SPRT
    print("\n[CHECK 4] Running Stage B 200-Game Statistical Confirmation (SPRT)...")
    h1_accepted, delta_elo, win_pct, games_played, verdict = run_stage_b_confirmation(candidate_path, CHAMPION_PATH)
    if not h1_accepted:
        print(f"\n[STAGE B FAILED] PROMOTION REJECTED!")
        print(f"  SPRT Verdict: {verdict}. Did not achieve H1 Accept. Champion remains unchanged.")
        sys.exit(1)

    # 5. FINAL RE-VERIFICATION & ATOMIC PROMOTION
    print("\n[CHECK 5] Final Re-Verification & Atomic Promotion Execution...")
    mean_drift_final, _, veto_final = eval_search_control_drift(candidate_path, CHAMPION_PATH)
    if not veto_final:
        print(f"[FATAL] Final hard-veto re-check failed ({mean_drift_final:.2f} cp). Aborting promotion.")
        sys.exit(1)

    print("\n>>> ALL GATES PASSED! EXECUTING ATOMIC PROMOTION INTO PRODUCTION <<<")

    # Copy binary to production paths
    shutil.copyfile(candidate_path, CHAMPION_PATH)
    gateway_cfg = os.path.join(ROOT_DIR, "apps", "gateway", "config", "rhizoh_nnue.bin")
    gateway_bin_cfg = os.path.join(ROOT_DIR, "apps", "gateway", "bin", "config", "rhizoh_nnue.bin")
    if os.path.exists(os.path.dirname(gateway_cfg)):
        shutil.copyfile(candidate_path, gateway_cfg)
    if os.path.exists(os.path.dirname(gateway_bin_cfg)):
        shutil.copyfile(candidate_path, gateway_bin_cfg)

    # Measure final holdout Pearson on candidate
    dev = torch.device("cpu")
    cand_m = FastHalfKP512_NNUE().to(dev)
    cand_m.load_quantized(candidate_path)
    cand_m.eval()
    holdout_r = evaluate_pearson_holdout(cand_m, HOLDOUT_PATH, dev, max_eval=10000)

    # Update manifest
    manifest_data = {
        "eval_mode": "NNUE",
        "binary_sha256": compute_sha256(CASTLE_EXE),
        "model_sha256": cand_sha,
        "previous_champion_sha256": champ_sha,
        "holdout_pearson_r": round(holdout_r, 4),
        "gate0_result": {"passed": True, "note": "Passed Hardened Two-Stage Promotion Gate"},
        "search_control_drift_cp": round(mean_drift_final, 2),
        "stage_a_score_pct": round(stg_a_pct, 1),
        "stage_b_sprt": {
            "verdict": verdict,
            "games_played": games_played,
            "score_pct": round(win_pct, 2),
            "delta_elo": round(delta_elo, 1)
        },
        "promoted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2)
    with open(CHAMPION_MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2)

    print(f"  ✓ Successfully updated {CHAMPION_PATH}")
    print(f"  ✓ Successfully updated {MANIFEST_PATH}")
    print(f"  ✓ Promotion Complete: New Reigning Champion Active!")
    print("=" * 76)

def main():
    parser = argparse.ArgumentParser(description="Rhizoh Hardened Two-Stage Promotion Gate")
    parser.add_argument("--candidate", type=str, help="Path to candidate NNUE binary")
    parser.add_argument("--check-veto-only", action="store_true", help="Run Gate 0 and Search-Control hard-veto only (diagnostic / dry-run)")
    args = parser.parse_args()

    if not args.candidate:
        print("Usage: py promote_baseline.py --candidate <path_to_candidate.bin> [--check-veto-only]")
        sys.exit(1)

    promote_candidate(args.candidate, dry_run_veto_only=args.check_veto_only)

if __name__ == '__main__':
    main()
