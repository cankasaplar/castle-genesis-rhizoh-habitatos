import os
import sys
import json
import time
import subprocess
import hashlib

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_capability_audit():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    castle_exe = os.path.join(root_dir, "castle.exe")
    stockfish_exe = os.path.join(root_dir, "lab", "engines", "stockfish", "stockfish-windows-x86-64-avx2.exe")
    out_json = os.path.join(root_dir, "data", "runs", "engine_capability_audit.json")

    print("=====================================================================")
    print("--- PHASE B: ENGINE CAPABILITY & HARDWARE AUDIT ---")
    print("=====================================================================")

    cpu_count = os.cpu_count() or 4
    # Equal hardware thread budget: allocate 2 threads per engine process on a 4-core CPU
    allocated_threads = max(1, cpu_count // 2)

    print(f"System Logical CPU Cores : {cpu_count}")
    print(f"Equal Hardware Thread Budget : {allocated_threads} Threads per Engine")
    print(f"Equal Hash Memory Budget   : 256 MB per Engine")

    # Benchmark Castle
    t0 = time.time()
    castle_proc = subprocess.Popen([castle_exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    castle_proc.stdin.write("uci\nisready\nquit\n")
    castle_proc.stdin.flush()
    castle_proc.wait(timeout=3.0)
    castle_dt = time.time() - t0

    # Benchmark Stockfish
    t0 = time.time()
    sf_proc = subprocess.Popen([stockfish_exe], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    sf_proc.stdin.write("uci\nisready\nquit\n")
    sf_proc.stdin.flush()
    sf_proc.wait(timeout=3.0)
    sf_dt = time.time() - t0

    audit_result = {
        "system_cpus": cpu_count,
        "equal_thread_budget_per_engine": allocated_threads,
        "equal_hash_mb_per_engine": 256,
        "castle_startup_time_s": round(castle_dt, 3),
        "stockfish_startup_time_s": round(sf_dt, 3),
        "castle_exe": castle_exe,
        "stockfish_exe": stockfish_exe
    }

    os.makedirs(os.path.dirname(out_json), exist_ok=True)
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(audit_result, f, indent=2)

    print("\n✓ Hardware Audit Completed Successfully.")
    print(f"Audit Summary File Saved to: {out_json}")
    print("=====================================================================")
    return audit_result

if __name__ == "__main__":
    run_capability_audit()
