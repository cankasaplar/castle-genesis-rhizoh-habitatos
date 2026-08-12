import os
import sys
import json
import time
import subprocess
import threading
import chess
import chess.engine

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def generate_distillation_fens(stockfish_path, output_epd, target_fens=1000, threads_per_engine=1, depth=14):
    os.makedirs(os.path.dirname(output_epd), exist_ok=True)
    engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
    engine.configure({"Threads": threads_per_engine, "Hash": 128})

    board = chess.Board()
    fens_collected = 0
    t0 = time.time()

    with open(output_epd, "w", encoding="utf-8") as f_out:
        while fens_collected < target_fens:
            if board.is_game_over() or board.fullmove_number > 80:
                board = chess.Board()

            # Run Stockfish 18 at depth 14-16
            info = engine.analyse(board, chess.engine.Limit(depth=depth))
            score = info.get("score")
            if score and score.relative:
                cp_val = score.relative.score(mate_score=10000)
                fen_str = board.fen()
                f_out.write(f"{fen_str} | eval {cp_val}\n")
                f_out.flush()
                fens_collected += 1

                if fens_collected % 100 == 0:
                    dt = time.time() - t0
                    rate = fens_collected / dt
                    print(f"[DISTILLATION GENERATOR] {fens_collected}/{target_fens} FENs generated ({rate:.1f} FENs/sec)")

            # Make legal move with random choice among top moves
            legal_moves = list(board.legal_moves)
            if not legal_moves:
                board = chess.Board()
                continue
            mv = legal_moves[0]
            board.push(mv)

    engine.quit()
    dt_total = (time.time() - t0) / 60.0
    print(f"✓ Distillation dataset generation complete: {fens_collected} FENs saved to {output_epd} ({dt_total:.2f} min)")

if __name__ == "__main__":
    root_dir = os.path.dirname(os.path.abspath(__file__))
    sf_exe = os.path.join(root_dir, "lab", "engines", "stockfish", "stockfish-windows-x86-64-avx2.exe")
    out_epd = os.path.join(root_dir, "data", "distillation_10m_sample.epd")
    generate_distillation_fens(sf_exe, out_epd, target_fens=200, depth=12)
