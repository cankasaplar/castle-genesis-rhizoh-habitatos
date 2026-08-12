import os
import sys
import json
import time
import subprocess
import hashlib
import chess
import chess.pgn
from scientific_uci_harness import play_full_strength_game, OPENING_SUITE

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def get_file_sha256(path):
    if not os.path.exists(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def execute_phase_c_v6_pilot(num_opening_pairs=50, movetime_ms=1000, threads=2, hash_mb=256):
    root_dir = os.path.dirname(os.path.abspath(__file__))
    castle_exe = os.path.join(root_dir, "castle.exe")
    nnue_weights = os.path.join(root_dir, "config", "rhizoh_nnue.bin")
    stockfish_exe = os.path.join(root_dir, "lab", "engines", "stockfish", "stockfish-windows-x86-64-avx2.exe")

    castle_sha = get_file_sha256(castle_exe)
    nnue_sha = get_file_sha256(nnue_weights)
    stockfish_sha = get_file_sha256(stockfish_exe)

    total_declared = num_opening_pairs * 2
    pgn_path = os.path.join(root_dir, "data", "pgn_archive", "phase_c_v6_100_game_pilot_matches.pgn")
    report_path = os.path.join(root_dir, "data", "runs", "phase_c_v6_100_game_pilot_report.json")
    os.makedirs(os.path.dirname(pgn_path), exist_ok=True)

    print("=====================================================================")
    print("--- PHASE C V6: 100-GAME COMBINED SEARCH+NNUE REAL MASTER PILOT ---")
    print("=====================================================================")
    print(f"Castle Binary SHA256     : {castle_sha} (Optimized C++ Search Engine)")
    print(f"Candidate V6 NNUE SHA256 : {nnue_sha} (RHNNUE_CANDIDATE_V5 Aligned Loaded)")
    print(f"Stockfish Binary SHA256  : {stockfish_sha} (Stockfish 18 AVX2)")
    print(f"Equal Hardware Budget    : Threads={threads}, Hash={hash_mb}MB per Engine")
    print(f"Time Control             : {movetime_ms}ms (1.0s/move Deep CPU Search)")
    print(f"Match Volume             : {total_declared} Real Paired UCI Games")
    print(f"Output PGN Archive       : {pgn_path}")
    print("=====================================================================")

    games = []
    w, l, d = 0, 0, 0
    valid_count = 0
    invalid_count = 0
    term_counts = {}
    t_start_all = time.time()

    with open(pgn_path, "a", encoding="utf-8") as f_pgn:
        for i in range(1, num_opening_pairs + 1):
            fen_pos, fen_name = OPENING_SUITE[(i - 1) % len(OPENING_SUITE)]

            # Game A: Combined Search+NNUE Castle White vs Stockfish Black
            g1_id = 2 * i - 1
            print(f"[PILOT V6 Match #{g1_id:03d}/{total_declared:03d}] Castle (W) vs Stockfish (B) [{fen_name}]... ", end="")
            t0 = time.time()
            g1 = play_full_strength_game(g1_id, castle_exe, stockfish_exe, fen_pos, movetime_ms=movetime_ms, threads=threads, hash_mb=hash_mb)
            dt1 = time.time() - t0
            games.append(g1)
            term1 = g1["termination"]
            term_counts[term1] = term_counts.get(term1, 0) + 1

            if g1["valid_game_for_stats"]:
                valid_count += 1
                res = g1["result"]
                if res == "1-0": w += 1
                elif res == "0-1": l += 1
                else: d += 1
                print(f"DONE ({dt1:.1f}s, {g1['plies']} plies, Term: {term1}, Res: {res})")
            else:
                invalid_count += 1
                print(f"INVALIDATED ({dt1:.1f}s, {g1['plies']} plies, Term: {term1})")

            f_pgn.write(f'[Event "Phase C V6 Pilot Match #{g1_id}"]\n')
            f_pgn.write(f'[White "{g1["white_engine"]}"]\n')
            f_pgn.write(f'[Black "{g1["black_engine"]}"]\n')
            f_pgn.write(f'[Result "{g1["result"]}"]\n')
            f_pgn.write(f'[FEN "{g1["initial_fen"]}"]\n')
            f_pgn.write(f'[Termination "{g1["termination"]}"]\n\n')
            f_pgn.write(" ".join(g1["moves"]) + f" {g1['result']}\n\n")
            f_pgn.flush()

            # Game B: Stockfish White vs Combined Search+NNUE Castle Black (Paired Color Swap)
            g2_id = 2 * i
            print(f"[PILOT V6 Match #{g2_id:03d}/{total_declared:03d}] Stockfish (W) vs Castle (B) [{fen_name}]... ", end="")
            t0 = time.time()
            g2 = play_full_strength_game(g2_id, stockfish_exe, castle_exe, fen_pos, movetime_ms=movetime_ms, threads=threads, hash_mb=hash_mb)
            dt2 = time.time() - t0
            games.append(g2)
            term2 = g2["termination"]
            term_counts[term2] = term_counts.get(term2, 0) + 1

            if g2["valid_game_for_stats"]:
                valid_count += 1
                res = g2["result"]
                if res == "0-1": w += 1
                elif res == "1-0": l += 1
                else: d += 1
                print(f"DONE ({dt2:.1f}s, {g2['plies']} plies, Term: {term2}, Res: {res})")
            else:
                invalid_count += 1
                print(f"INVALIDATED ({dt2:.1f}s, {g2['plies']} plies, Term: {term2})")

            f_pgn.write(f'[Event "Phase C V6 Pilot Match #{g2_id}"]\n')
            f_pgn.write(f'[White "{g2["white_engine"]}"]\n')
            f_pgn.write(f'[Black "{g2["black_engine"]}"]\n')
            f_pgn.write(f'[Result "{g2["result"]}"]\n')
            f_pgn.write(f'[FEN "{g2["initial_fen"]}"]\n')
            f_pgn.write(f'[Termination "{g2["termination"]}"]\n\n')
            f_pgn.write(" ".join(g2["moves"]) + f" {g2['result']}\n\n")
            f_pgn.flush()

    total_valid = w + l + d
    score_pct = ((w + 0.5 * d) / total_valid * 100) if total_valid else 0.0
    elapsed_min = (time.time() - t_start_all) / 60.0

    report = {
        "benchmark_stage": "PHASE_C_V6_100_GAME_PILOT",
        "candidate_id": "RHNNUE_CANDIDATE_V6_COMBINED_SEARCH_NNUE",
        "castle_sha256": castle_sha,
        "candidate_nnue_sha256": nnue_sha,
        "stockfish_sha256": stockfish_sha,
        "declared_games": total_declared,
        "executed_games": len(games),
        "valid_games_for_stats": total_valid,
        "protocol_error_invalidated_games": invalid_count,
        "duration_minutes": round(elapsed_min, 2),
        "options": {"threads": threads, "hash_mb": hash_mb, "movetime_ms": movetime_ms},
        "castle_record": {"wins": w, "losses": l, "draws": d},
        "castle_score_pct": round(score_pct, 2),
        "termination_breakdown": term_counts,
        "pgn_archive": pgn_path
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n---------------------------------------------------------------------")
    print(f"PHASE C V6 PILOT SUMMARY: {total_valid} Valid Real Games ({elapsed_min:.2f} min)")
    print(f"Declared: {total_declared} | Executed: {len(games)} | Valid: {total_valid} | Protocol Errors: {invalid_count}")
    print(f"Castle Record : {w} Wins / {l} Losses / {d} Draws (Score: {score_pct:.2f}%)")
    print(f"Terminations  : {term_counts}")
    print(f"Report File   : {report_path}")
    print("=====================================================================")
    return report

if __name__ == "__main__":
    execute_phase_c_v6_pilot(num_opening_pairs=50, movetime_ms=1000, threads=2, hash_mb=256)
