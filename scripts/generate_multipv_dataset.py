#!/usr/bin/env python3
"""
Track B: Multi-PV Pairwise Margin Dataset Generator.

Generates training positions with Multi-PV evaluations (top N moves + centipawn evaluations)
for training next-gen NNUE with pairwise ranking loss ("fine tactical distinction").
Features:
- Reads `data/puzzle_failures.json` (hard negatives where Rhizoh failed tactical puzzles).
- Oversamples tactical failure positions (default: 5x).
- Uses UCI MultiPV search (default: MultiPV=4) to calculate move margins.
- Outputs annotated EPD records with margins for offline/cloud PyTorch training.
- Designed for autonomous execution on Hetzner worker instances (month-start rollout).
"""

import argparse
import json
import os
import subprocess
import sys
import time


def parse_args():
    parser = argparse.ArgumentParser(description="Generate Multi-PV Pairwise Training Data")
    parser.add_argument("--engine-path", default="castle.exe", help="Path to UCI engine binary")
    parser.add_argument("--output", default="data/multipv_training.epd", help="Output EPD file path")
    parser.add_argument("--failures-path", default="data/puzzle_failures.json", help="Path to puzzle failures JSON")
    parser.add_argument("--oversample-failures", type=int, default=5, help="Oversample factor for puzzle failures")
    parser.add_argument("--multipv", type=int, default=4, help="Number of MultiPV paths (default: 4)")
    parser.add_argument("--movetime", type=int, default=300, help="Search time per position in ms (default: 300)")
    parser.add_argument("--depth", type=int, default=10, help="Search depth per position (default: 10)")
    parser.add_argument("--max-positions", type=int, default=100, help="Maximum positions to process (default: 100)")
    return parser.parse_args()


def load_failure_positions(failures_path, oversample=5):
    positions = []
    if os.path.exists(failures_path):
        try:
            with open(failures_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    fen = item.get("fen", "").strip()
                    if fen:
                        entry = {
                            "fen": fen,
                            "id": item.get("puzzleId", "Failure"),
                            "motif": item.get("motif", "HardNegative"),
                            "bestMove": item.get("bestMove", ""),
                            "isFailure": True
                        }
                        for _ in range(oversample):
                            positions.append(entry)
                print(f"[DATASET] Loaded {len(data)} unique failure positions, oversampled {oversample}x -> {len(positions)} positions.")
        except Exception as e:
            print(f"[DATASET_WARN] Failed reading failures JSON: {e}")
    else:
        print(f"[DATASET_INFO] No existing failures file at {failures_path}.")
    return positions


def load_supplementary_puzzles(epd_path, count=50):
    positions = []
    if os.path.exists(epd_path):
        try:
            with open(epd_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            for line in lines:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if " bm " in line:
                    parts = line.split(" bm ")
                    fen = parts[0].strip()
                    # check 8 ranks
                    if fen.split(" ")[0].count("/") == 7:
                        positions.append({
                            "fen": fen,
                            "id": f"Tactic_{len(positions)+1}",
                            "motif": "TacticPool",
                            "bestMove": "",
                            "isFailure": False
                        })
                if len(positions) >= count:
                    break
            print(f"[DATASET] Loaded {len(positions)} supplementary positions from {epd_path}.")
        except Exception as e:
            print(f"[DATASET_WARN] Failed reading EPD: {e}")
    return positions


class UciMultiPvEngine:
    def __init__(self, binary_path, multipv=4):
        self.binary_path = binary_path
        self.multipv = multipv
        self.proc = None
        self._start()

    def _start(self):
        if not os.path.exists(self.binary_path):
            candidates = [
                os.path.join("apps", "gateway", "bin", self.binary_path),
                os.path.join(os.path.dirname(__file__), "..", self.binary_path),
                os.path.join(os.path.dirname(__file__), "..", "apps", "gateway", "bin", self.binary_path)
            ]
            for c in candidates:
                if os.path.exists(c):
                    self.binary_path = c
                    break

        print(f"[ENGINE_INIT] Spawning engine from: {self.binary_path}")
        self.proc = subprocess.Popen(
            [self.binary_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )
        self._send("uci")
        self._send("setoption name UseNNUE value false")
        self._send("setoption name OwnBook value false")
        self._send(f"setoption name MultiPV value {self.multipv}")
        self._send("isready")
        self._wait_for("readyok")

    def _send(self, cmd):
        if self.proc and self.proc.stdin:
            self.proc.stdin.write(cmd + "\n")
            self.proc.stdin.flush()

    def _wait_for(self, target, timeout=5.0):
        t0 = time.time()
        while time.time() - t0 < timeout:
            line = self.proc.stdout.readline()
            if not line:
                break
            if target in line:
                return line
        return None

    def analyze_position(self, fen, movetime=300, depth=10):
        self._send("ucinewgame")
        self._send(f"position fen {fen}")
        self._send(f"go depth {depth} movetime {movetime}")

        pvs = {}
        bestmove = None

        t0 = time.time()
        max_wait = (movetime / 1000.0) + 4.0

        while time.time() - t0 < max_wait:
            line = self.proc.stdout.readline()
            if not line:
                break
            trimmed = line.strip()
            if trimmed.startswith("info ") and " pv " in trimmed:
                pv_num = 1
                if "multipv " in trimmed:
                    try:
                        parts = trimmed.split()
                        idx = parts.index("multipv")
                        pv_num = int(parts[idx + 1])
                    except (ValueError, IndexError):
                        pass

                cp = 0
                if "score cp " in trimmed:
                    try:
                        parts = trimmed.split()
                        idx = parts.index("cp")
                        cp = int(parts[idx + 1])
                    except (ValueError, IndexError):
                        pass

                pv_idx = trimmed.find(" pv ")
                pv_moves = trimmed[pv_idx + 4:].strip().split()
                move = pv_moves[0] if pv_moves else ""

                pvs[pv_num] = {
                    "move": move,
                    "cp": cp,
                    "pv": pv_moves[:4]
                }

            elif trimmed.startswith("bestmove"):
                parts = trimmed.split()
                if len(parts) >= 2:
                    bestmove = parts[1]
                break

        return {"bestmove": bestmove, "pvs": pvs}

    def close(self):
        if self.proc:
            try:
                self._send("quit")
                self.proc.terminate()
                self.proc.wait(timeout=2.0)
            except Exception:
                pass


def main():
    args = parse_args()
    print("=" * 70)
    print("  RHIZOH TRACK B: MULTI-PV PAIRWISE MARGIN DATA GENERATOR")
    print(f"  Engine: {args.engine_path} | MultiPV: {args.multipv} | Depth: {args.depth} | Movetime: {args.movetime}ms")
    print("=" * 70)

    # 1. Load failure positions (hard negative mining)
    failures = load_failure_positions(args.failures_path, oversample=args.oversample_failures)

    # 2. Supplementary tactical positions if needed
    needed = max(0, args.max_positions - len(failures))
    supplementary = []
    if needed > 0:
        epd_candidate = os.path.join(os.path.dirname(__file__), "..", "data", "tactics_puzzles.epd")
        supplementary = load_supplementary_puzzles(epd_candidate, count=needed)

    all_positions = (failures + supplementary)[:args.max_positions]
    print(f"[DATASET] Total positions queued for Multi-PV evaluation: {len(all_positions)}")

    if not all_positions:
        print("[DATASET_ERROR] No positions to analyze.")
        sys.exit(1)

    # 3. Initialize engine
    try:
        engine = UciMultiPvEngine(args.engine_path, multipv=args.multipv)
    except Exception as e:
        print(f"[ENGINE_ERROR] Could not start engine: {e}")
        sys.exit(1)

    # 4. Process positions and write output
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    generated = 0

    with open(args.output, "w", encoding="utf-8") as out_f:
        for idx, item in enumerate(all_positions):
            fen = item["fen"]
            pos_id = item["id"]
            motif = item["motif"]
            is_fail = item.get("isFailure", False)

            res = engine.analyze_position(fen, movetime=args.movetime, depth=args.depth)
            pvs = res.get("pvs", {})

            if len(pvs) >= 2:
                pv1 = pvs.get(1, {})
                pv2 = pvs.get(2, {})
                m1 = pv1.get("move", "")
                m2 = pv2.get("move", "")
                cp1 = pv1.get("cp", 0)
                cp2 = pv2.get("cp", 0)
                margin = cp1 - cp2

                # Format annotated EPD line
                epd_line = f"{fen} bm {m1}; id \"{pos_id}\"; c0 \"{motif}\"; pv2 {m2}; s1 {cp1}; s2 {cp2}; margin {margin}; fail {int(is_fail)};\n"
                out_f.write(epd_line)
                out_f.flush()
                generated += 1

                if (idx + 1) % 5 == 0 or idx == len(all_positions) - 1:
                    print(f"[{idx+1}/{len(all_positions)}] ID: {pos_id:15} | PV1: {m1:5} (+{cp1}cp) | PV2: {m2:5} (+{cp2}cp) | Margin: {margin:4}cp | Fail: {is_fail}")

    engine.close()
    print("=" * 70)
    print(f"  SUCCESS: Generated {generated} Multi-PV training records -> {args.output}")
    print("=" * 70)


if __name__ == "__main__":
    main()
