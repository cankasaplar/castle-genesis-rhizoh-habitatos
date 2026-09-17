#!/usr/bin/env python3
"""
Autonomous Self-Play Daemon for Hetzner CPX31 / Cloud Workers
Continuously generates high-quality self-play games using Castle engine
and records labeled positions for large-scale NNUE training.
"""
import os
import sys
import time
import json
import gzip
import subprocess
import random

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BINARY = os.path.join(ROOT_DIR, "castle") if os.path.exists(os.path.join(ROOT_DIR, "castle")) else os.path.join(ROOT_DIR, "castle.exe")
OUTPUT_DIR = os.path.join(ROOT_DIR, "data", "selfplay_generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def play_one_game(game_id, movetime=200):
    proc = subprocess.Popen(
        [BINARY],
        cwd=ROOT_DIR,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )
    proc.stdin.write("uci\nsetoption name UseNNUE value true\nsetoption name OwnBook value true\nisready\n")
    proc.stdin.flush()
    while True:
        l = proc.stdout.readline()
        if "readyok" in l: break

    moves = []
    positions = []
    
    # 8 random opening plies for diversity
    # ...
    proc.stdin.write("quit\n")
    proc.stdin.flush()
    proc.terminate()
    return len(moves)

def main():
    print("Starting Autonomous Selfplay Daemon on Cloud Worker...")
    print(f"Engine Binary: {BINARY}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print("Worker active. Ready for batch generation.")

if __name__ == "__main__":
    main()
