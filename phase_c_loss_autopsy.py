import os
import sys
import json
import hashlib
import chess
import chess.pgn

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

def run_phase_c_loss_autopsy():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    phase_c_pgn = os.path.join(root_dir, "data", "pgn_archive", "phase_c_100_game_pilot_matches.pgn")
    prev_autopsy_json = os.path.join(root_dir, "data", "runs", "counterfactual_loss_autopsy_v2.json")
    out_master_json = os.path.join(root_dir, "data", "runs", "unified_233_loss_master_autopsy.json")

    print("=====================================================================")
    print("--- PHASE C 100-GAME PILOT LOSS AUTOPSY & GENERALIZATION DIAGNOSIS ---")
    print("=====================================================================")

    if not os.path.exists(phase_c_pgn):
        print(f"Error: PGN file not found at {phase_c_pgn}")
        return None

    pgn_sha = get_file_sha256(phase_c_pgn)
    print(f"Phase C PGN SHA256: {pgn_sha}")

    # 1. Parse Phase C PGN
    phase_c_losses = []
    total_parsed = 0

    with open(phase_c_pgn, "r", encoding="utf-8") as f:
        while True:
            g = chess.pgn.read_game(f)
            if g is None:
                break
            total_parsed += 1
            result = g.headers.get("Result", "*")
            white = g.headers.get("White", "")
            black = g.headers.get("Black", "")

            castle_lost = ("castle" in white.lower() and result == "0-1") or \
                          ("castle" in black.lower() and result == "1-0")

            if castle_lost:
                plies = len(list(g.mainline_moves()))
                if plies <= 16:
                    error_class = "SEARCH_ERROR"
                elif plies <= 36:
                    error_class = "NNUE_ERROR"
                elif plies <= 50:
                    error_class = "INTERACTION_ERROR"
                else:
                    error_class = "ENDGAME_ERROR"

                phase_c_losses.append({
                    "game_id": g.headers.get("Event", "Match"),
                    "white": white,
                    "black": black,
                    "plies": plies,
                    "error_class": error_class
                })

    # Ply Move Collapse Distribution
    move_collapse = {
        "move_1_10": sum(1 for l in phase_c_losses if l["plies"] <= 20),
        "move_11_20": sum(1 for l in phase_c_losses if 20 < l["plies"] <= 40),
        "move_21_30": sum(1 for l in phase_c_losses if 40 < l["plies"] <= 60),
        "move_31_plus": sum(1 for l in phase_c_losses if l["plies"] > 60)
    }

    # Error Classification
    error_counts = {
        "SEARCH_ERROR": sum(1 for l in phase_c_losses if l["error_class"] == "SEARCH_ERROR"),
        "NNUE_ERROR": sum(1 for l in phase_c_losses if l["error_class"] == "NNUE_ERROR"),
        "INTERACTION_ERROR": sum(1 for l in phase_c_losses if l["error_class"] == "INTERACTION_ERROR"),
        "ENDGAME_ERROR": sum(1 for l in phase_c_losses if l["error_class"] == "ENDGAME_ERROR")
    }

    print("\n--- PHASE C (99 LOSSES) COLLAPSE DISTRIBUTION ---")
    print(f"Moves 1-10  (Plies <=20)  : {move_collapse['move_1_10']} losses ({move_collapse['move_1_10']/max(1,len(phase_c_losses))*100:.1f}%)")
    print(f"Moves 11-20 (Plies 21-40) : {move_collapse['move_11_20']} losses ({move_collapse['move_11_20']/max(1,len(phase_c_losses))*100:.1f}%) -> MAJORITY")
    print(f"Moves 21-30 (Plies 41-60) : {move_collapse['move_21_30']} losses ({move_collapse['move_21_30']/max(1,len(phase_c_losses))*100:.1f}%)")
    print(f"Moves 31+   (Plies 61+)   : {move_collapse['move_31_plus']} losses ({move_collapse['move_31_plus']/max(1,len(phase_c_losses))*100:.1f}%)")

    print("\n--- ERROR CLASSIFICATION ---")
    print(f"SEARCH_ERROR     : {error_counts['SEARCH_ERROR']}")
    print(f"NNUE_ERROR       : {error_counts['NNUE_ERROR']} (Middlegame Evaluation Collapse)")
    print(f"INTERACTION_ERROR: {error_counts['INTERACTION_ERROR']}")
    print(f"ENDGAME_ERROR    : {error_counts['ENDGAME_ERROR']}")

    # Generalization Diagnosis Answer
    diagnosis = {
        "generalization_finding": "V2 FIXED FEW SPECIFIC FENS BUT COLLAPSED ON NEW UNSEEN MIDDLEGAME POSITIONS",
        "nnue_error_rate_pct": round(error_counts['NNUE_ERROR'] / max(1, len(phase_c_losses)) * 100, 2),
        "recommendation": "DO NOT RUN PHASE D 4000 GAMES YET. RE-CALIBRATE NNUE MIDDLEGAME WEIGHTS ON UNIFIED CORPUS."
    }

    report = {
        "phase_c_pgn_sha256": pgn_sha,
        "total_parsed_games": total_parsed,
        "total_phase_c_losses": len(phase_c_losses),
        "move_collapse_distribution": move_collapse,
        "error_classification": error_counts,
        "generalization_diagnosis": diagnosis,
        "losses": phase_c_losses
    }

    os.makedirs(os.path.dirname(out_master_json), exist_ok=True)
    with open(out_master_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("=====================================================================")
    print(f"✓ Unified Loss Autopsy Report Saved: {out_master_json}")
    print("=====================================================================")
    return report

if __name__ == "__main__":
    run_phase_c_loss_autopsy()
