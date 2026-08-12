import os
import sys
import json
import time
import subprocess
import chess

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

OPENING_SUITE = [
    ("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "Standard Start Position"),
    ("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", "King's Pawn Opening (1. e4)"),
    ("rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1", "Queen's Pawn Opening (1. d4)"),
    ("r1bqk2r/ppp2ppp/2n5/2bpp3/4P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 6", "Italian Game / Ruy Lopez Midgame"),
    ("r2q1rk1/ppp2ppp/2np4/4p3/2B1P1b1/3P1N2/PPP2PPP/R2Q1RK1 w - - 0 9", "Giuoco Piano Tactical FEN")
]

class ScientificUCIProcess:
    def __init__(self, name, exe_path, threads=2, hash_mb=256):
        self.name = name
        self.exe_path = exe_path
        self.threads = threads
        self.hash_mb = hash_mb
        self.proc = None
        self.last_cmd = None
        self.last_resp = None

    def start(self):
        if not os.path.exists(self.exe_path):
            raise FileNotFoundError(f"Engine binary not found: {self.exe_path}")
        self.proc = subprocess.Popen(
            [self.exe_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self.send("uci")
        t0 = time.time()
        while time.time() - t0 < 2.0:
            line = self.proc.stdout.readline()
            if not line or "uciok" in line:
                break

        # Set Full-Strength Engine Options
        self.send(f"setoption name Threads value {self.threads}")
        self.send(f"setoption name Hash value {self.hash_mb}")
        self.send("isready")
        t0 = time.time()
        while time.time() - t0 < 2.0:
            line = self.proc.stdout.readline()
            if not line or "readyok" in line:
                break

    def send(self, cmd):
        if not self.is_alive():
            return
        self.last_cmd = cmd
        self.proc.stdin.write(cmd + "\n")
        self.proc.stdin.flush()

    def get_bestmove(self, fen, movetime_ms=1000):
        if not self.is_alive():
            return None, "ENGINE_CRASH"

        self.send(f"position fen {fen}")
        self.send(f"go movetime {movetime_ms}")

        t0 = time.time()
        bestmove = None
        while time.time() - t0 < (movetime_ms / 1000.0 + 5.0):
            line = self.proc.stdout.readline()
            if not line:
                break
            line = line.strip()
            self.last_resp = line
            if line.startswith("bestmove"):
                parts = line.split()
                if len(parts) >= 2:
                    bestmove = parts[1]
                break

        if not bestmove or bestmove in ["(none)", "0000", "null"]:
            return None, "PROTOCOL_ERROR"
        return bestmove, "OK"

    def is_alive(self):
        return self.proc is not None and self.proc.poll() is None

    def exit_code(self):
        return self.proc.poll() if self.proc else -1

    def terminate(self):
        if self.is_alive():
            try:
                self.proc.terminate()
                self.proc.wait(timeout=1.0)
            except Exception:
                pass

def play_full_strength_game(game_id, white_path, black_path, initial_fen, movetime_ms=1000, threads=2, hash_mb=256, max_watchdog_plies=400):
    white = ScientificUCIProcess("WhiteEngine", white_path, threads=threads, hash_mb=hash_mb)
    black = ScientificUCIProcess("BlackEngine", black_path, threads=threads, hash_mb=hash_mb)

    try:
        white.start()
        black.start()
    except Exception as e:
        return {
            "game_id": game_id,
            "white_engine": os.path.basename(white_path),
            "black_engine": os.path.basename(black_path),
            "initial_fen": initial_fen,
            "moves": [],
            "result": "1/2-1/2",
            "termination": "HARNESS_ERROR",
            "plies": 0,
            "white_exit_code": white.exit_code(),
            "black_exit_code": black.exit_code(),
            "white_process_alive": white.is_alive(),
            "black_process_alive": black.is_alive(),
            "last_uci_command": "start",
            "last_uci_response": str(e),
            "valid_game_for_stats": False
        }

    board = chess.Board(initial_fen)
    moves = []
    termination = "UNKNOWN"
    result = "1/2-1/2"
    valid = True

    for ply in range(1, max_watchdog_plies + 1):
        if board.is_checkmate():
            termination = "CHECKMATE"
            result = "0-1" if board.turn == chess.WHITE else "1-0"
            break
        if board.is_stalemate():
            termination = "STALEMATE"
            result = "1/2-1/2"
            break
        if board.is_insufficient_material():
            termination = "INSUFFICIENT_MATERIAL"
            result = "1/2-1/2"
            break
        if board.can_claim_threefold_repetition() or board.is_fivefold_repetition():
            termination = "REPETITION"
            result = "1/2-1/2"
            break
        if board.can_claim_fifty_moves() or board.is_seventyfive_moves():
            termination = "FIFTY_MOVE"
            result = "1/2-1/2"
            break

        current_engine = white if board.turn == chess.WHITE else black
        bestmove_str, status = current_engine.get_bestmove(board.fen(), movetime_ms=movetime_ms)

        if status != "OK" or not bestmove_str:
            termination = "PROTOCOL_ERROR" if status == "PROTOCOL_ERROR" else "ENGINE_CRASH"
            valid = False
            result = "1/2-1/2"
            break

        try:
            move = chess.Move.from_uci(bestmove_str)
            if move not in board.legal_moves:
                termination = "ILLEGAL_MOVE"
                valid = False
                result = "1/2-1/2"
                break
        except Exception:
            termination = "PROTOCOL_ERROR"
            valid = False
            result = "1/2-1/2"
            break

        board.push(move)
        moves.append(bestmove_str)

    if ply >= max_watchdog_plies and termination == "UNKNOWN":
        termination = "HARNESS_TIMEOUT"
        valid = False
        result = "1/2-1/2"

    if len(moves) <= 1 and termination not in ["CHECKMATE", "STALEMATE"]:
        valid = False
        if termination == "UNKNOWN":
            termination = "HARNESS_ERROR"

    white_exit = white.exit_code()
    black_exit = black.exit_code()
    white_alive = white.is_alive()
    black_alive = black.is_alive()

    white.terminate()
    black.terminate()

    return {
        "game_id": game_id,
        "white_engine": os.path.basename(white_path),
        "black_engine": os.path.basename(black_path),
        "initial_fen": initial_fen,
        "moves": moves,
        "result": result,
        "termination": termination,
        "plies": len(moves),
        "white_exit_code": white_exit,
        "black_exit_code": black_exit,
        "white_process_alive": white_alive,
        "black_process_alive": black_alive,
        "last_uci_command": white.last_cmd if board.turn == chess.WHITE else black.last_cmd,
        "last_uci_response": white.last_resp if board.turn == chess.WHITE else black.last_resp,
        "valid_game_for_stats": valid
    }
