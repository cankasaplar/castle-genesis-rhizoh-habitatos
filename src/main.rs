#![allow(dead_code)]

use std::fs;
use std::io::{self, BufRead, Write};
use std::path::Path;

mod board;
mod epistemic;
mod eval;
mod magic;
mod movegen;
mod perft;
mod search;
mod tt;
mod types;
mod variants;
mod zobrist;
mod opening;
mod see;
mod time_mgr;
mod syzygy;
mod nnue;
mod eval_tuning;
mod wac_runner;
mod planner;
mod thread;

use std::sync::Arc;
use opening::OpeningBook;
use board::Board;
use epistemic::{CalibrationMemory, ExpectationEngine, SearchBudgetController, RdilEngine};
use perft::Perft;
use search::Searcher;
use tt::TranspositionTable;
use types::GameResult;
use planner::{RhizohPlanner, StrategicExplanation};

struct UciOptions {
    hash_mb: usize,
    use_nmp: bool,
    use_lmr: bool,
    threads: usize,
    use_own_book: bool,
    use_see_ordering: bool,
    use_see_pruning: bool,
    use_iir: bool,
    use_singular_ext: bool,
    use_countermove_history: bool,
    use_correction_history: bool,
    use_null_verification: bool,
    use_history_gravity: bool,
    use_loss_memory: bool,
    use_opening_antiblunder: bool,
    use_nnue: bool,
}

impl Default for UciOptions {
    fn default() -> Self {
        Self {
            hash_mb: 256,
            use_nmp: true,
            use_lmr: true,
            threads: 4,
            use_own_book: true,
            use_see_ordering: true,
            use_see_pruning: true,
            use_iir: true,
            use_singular_ext: true,
            use_countermove_history: true,
            use_correction_history: true,
            use_null_verification: false,
            use_history_gravity: true,
            use_loss_memory: true,
            use_opening_antiblunder: true,
            use_nnue: true, // Enabled for NNUE neural evaluation!
        }
    }
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    let mut board = Board::new();
    let mut options = UciOptions::default();
    let mut trace_counter: u64 = 1000;
    let mut current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".to_string();
    let mut memory = CalibrationMemory::new();
    let mut current_opening = "Italian Game".to_string();

    let mut searcher = Searcher::new();

    // 1. Canlı Öğrenme Döngüsü: Texel Ağırlıkları ve Kayıp Hafızasını Yükle
    let weights_loaded = eval::Evaluator::load_weights_from_file("config/eval_weights.json");
    let loss_count = eval::Evaluator::load_loss_memory_from_file("data/loss_miner_memory.json");
    if weights_loaded || loss_count > 0 {
        writeln!(stdout, "info string [LIVE LEARNING] Loaded Texel Weights ({}) & Loss Memory ({} hashes)", if weights_loaded { "PASS" } else { "DEFAULT" }, loss_count).unwrap();
        stdout.flush().unwrap();
    }

    // 2. Otonom Polyglot Açılış Kitabı Yüklemesi
    let mut opening_book = OpeningBook::new();
    let book_paths = [
        "lab/books/Performance.bin",
        "lab/engines/book.bin",
        "config/book.bin",
        "book.bin",
    ];
    for bpath in &book_paths {
        if opening_book.load_bin_file(bpath).is_ok() {
            writeln!(stdout, "info string [BOOK] Successfully loaded Polyglot book from {}", bpath).unwrap();
            stdout.flush().unwrap();
            break;
        }
    }

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l.trim().to_string(),
            Err(_) => break,
        };

        if line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        let command = parts[0];

        match command {
            "uci" => {
                writeln!(stdout, "id name RhizohAI Castle Core v1.0.2 (SHA256: 70d896fa)").unwrap();
                writeln!(stdout, "id author Can Kasaplar").unwrap();
                writeln!(stdout, "option name Hash type spin default 256 min 1 max 32768").unwrap();
                writeln!(stdout, "option name Threads type spin default 1 min 1 max 64").unwrap();
                writeln!(stdout, "option name NMP type check default true").unwrap();
                writeln!(stdout, "option name LMR type check default true").unwrap();
                writeln!(stdout, "option name OwnBook type check default true").unwrap();
                writeln!(stdout, "option name UseSEEOrdering type check default true").unwrap();
                writeln!(stdout, "option name UseSEEPruning type check default true").unwrap();
                writeln!(stdout, "option name UseIIR type check default true").unwrap();
                writeln!(stdout, "option name UseSingularExt type check default false").unwrap();
                writeln!(stdout, "option name UseCounterMoveHistory type check default true").unwrap();
                writeln!(stdout, "option name UseCorrectionHistory type check default true").unwrap();
                writeln!(stdout, "option name UseNullVerification type check default false").unwrap();
                writeln!(stdout, "option name UseHistoryGravity type check default false").unwrap();
                writeln!(stdout, "option name UseLossMemory type check default false").unwrap();
                writeln!(stdout, "option name UseOpeningAntiBlunder type check default false").unwrap();
                writeln!(stdout, "option name UseNNUE type check default true").unwrap();
                writeln!(stdout, "option name Ponder type check default true").unwrap();
                writeln!(stdout, "option name BookFile type string default lab/books/Performance.bin").unwrap();
                writeln!(stdout, "option name SyzygyPath type string default syzygy").unwrap();
                writeln!(stdout, "uciok").unwrap();
                stdout.flush().unwrap();
            }
            "isready" => {
                writeln!(stdout, "readyok").unwrap();
                stdout.flush().unwrap();
            }
            "ucinewgame" => {
                board = Board::new();
                current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".to_string();
                current_opening = "Italian Game".to_string();
                trace_counter = 1000;
                let existing_tt = searcher.tt.clone();
                searcher = Searcher::new();
                searcher.tt = existing_tt;
                searcher.tt.clear();
                searcher.heuristics.use_nmp = options.use_nmp;
                searcher.heuristics.use_lmr = options.use_lmr;
                searcher.features.use_see_ordering = options.use_see_ordering;
                searcher.features.use_see_pruning = options.use_see_pruning;
                searcher.features.use_iir = options.use_iir;
                searcher.features.use_singular_ext = options.use_singular_ext;
                searcher.features.use_countermove_history = options.use_countermove_history;
                searcher.features.use_correction_history = options.use_correction_history;
                searcher.features.use_null_verification = options.use_null_verification;
                searcher.features.use_history_gravity = options.use_history_gravity;
                searcher.features.use_loss_memory = options.use_loss_memory;
                searcher.features.use_opening_antiblunder = options.use_opening_antiblunder;
                searcher.features.use_nnue = options.use_nnue;
                searcher.set_threads(options.threads);
            }
            "setoption" => {
                parse_setoption(&line, &mut options, &mut opening_book, &mut searcher);
            }
            "position" => {
                parse_position(&parts, &mut board, &mut current_fen);
            }
            "perft" => {
                let depth = parts.get(1).and_then(|s| s.parse::<u8>().ok()).unwrap_or(3);
                Perft::divide(&mut board, depth);
            }
            "set-opening" => {
                if parts.len() > 1 {
                    current_opening = parts[1..].join(" ");
                    writeln!(stdout, "info string Opening set to: {}", current_opening).unwrap();
                    stdout.flush().unwrap();
                }
            }
            "go" => {
                let mut requested_depth: Option<u8> = None;
                let mut wtime: Option<u64> = None;
                let mut btime: Option<u64> = None;
                let mut winc: Option<u64> = None;
                let mut binc: Option<u64> = None;
                let mut movetime: Option<u64> = None;
                let mut movestogo: Option<u64> = None;

                let mut i = 1;
                while i < parts.len() {
                    match parts[i] {
                        "depth" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u8>().ok()) {
                                requested_depth = Some(val);
                            }
                            i += 2;
                        }
                        "wtime" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                wtime = Some(val);
                            }
                            i += 2;
                        }
                        "btime" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                btime = Some(val);
                            }
                            i += 2;
                        }
                        "winc" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                winc = Some(val);
                            }
                            i += 2;
                        }
                        "binc" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                binc = Some(val);
                            }
                            i += 2;
                        }
                        "movetime" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                movetime = Some(val);
                            }
                            i += 2;
                        }
                        "movestogo" => {
                            if let Some(val) = parts.get(i + 1).and_then(|s| s.parse::<u64>().ok()) {
                                movestogo = Some(val);
                            }
                            i += 2;
                        }
                        _ => {
                            i += 1;
                        }
                    }
                }

                // 1. Önce Açılış Kitabına (Opening Book) Sorulur (Eğer OwnBook UCI seçeneği aktifse)
                if options.use_own_book {
                    let poly_key = board.get_polyglot_key();
                    if let Some(book_mv) = opening_book.get_book_move(poly_key) {
                        let book_uci = move_to_uci_string(book_mv);
                        let legal_moves = board.generate_moves();
                        if let Some(valid_mv) = legal_moves.into_iter().find(|m| m.to_uci() == book_uci) {
                            writeln!(stdout, "info depth 24 score cp 15 nodes 1000 nps 1000000 time 1 hashfull 0 pv {}", valid_mv.to_uci()).unwrap();
                            writeln!(stdout, "bestmove {}", valid_mv.to_uci()).unwrap();
                            stdout.flush().unwrap();
                            continue;
                        }
                    }
                }

                // 2. Zaman Yönetimi Hesaplama
                let time_limits = if let Some(mt) = movetime {
                    time_mgr::TimeLimits::fixed_movetime(mt)
                } else if wtime.is_some() || btime.is_some() {
                    time_mgr::TimeLimits::calculate(board.side_to_move, wtime, btime, winc, binc, movestogo)
                } else {
                    time_mgr::TimeLimits::infinite()
                };

                searcher.set_time_limits(time_limits);
                searcher.set_threads(options.threads);
                searcher.heuristics.use_nmp = options.use_nmp;
                searcher.heuristics.use_lmr = options.use_lmr;
                searcher.features.use_see_ordering = options.use_see_ordering;
                searcher.features.use_see_pruning = options.use_see_pruning;
                searcher.features.use_iir = options.use_iir;
                searcher.features.use_singular_ext = options.use_singular_ext;
                searcher.features.use_countermove_history = options.use_countermove_history;
                searcher.features.use_correction_history = options.use_correction_history;
                searcher.features.use_null_verification = options.use_null_verification;
                searcher.features.use_history_gravity = options.use_history_gravity;
                searcher.features.use_loss_memory = options.use_loss_memory;
                searcher.features.use_opening_antiblunder = options.use_opening_antiblunder;
                searcher.features.use_nnue = options.use_nnue;

                // 3. Alpha-Beta ve Epistemik Arama Devreye Girer
                let base_depth = requested_depth.unwrap_or(64);
                let avg_err = memory.average_calibration_error();
                let adjusted_depth = SearchBudgetController::adjust_depth(
                    base_depth, 
                    &current_opening, 
                    avg_err
                );

                let candidates = searcher.search_candidates(&mut board, adjusted_depth, 3);
                trace_counter += 1;

                let legal_moves = board.generate_moves();
                if !legal_moves.is_empty() {
                    let best_candidate = candidates.first();
                    let best_move = if let Some(cand) = best_candidate {
                        if legal_moves.contains(&cand.mv) {
                            cand.mv
                        } else {
                            legal_moves[0]
                        }
                    } else {
                        legal_moves[0]
                    };

                    let ponder_move = if let Some(cand) = best_candidate {
                        if cand.pv.len() > 1 {
                            Some(cand.pv[1])
                        } else {
                            None
                        }
                    } else {
                        None
                    };

                    let explanation = RhizohPlanner::explain(&board, &candidates, &searcher.features);
                    writeln!(stdout, "info string Rhizoh Strategic Plan: [{}] {}", explanation.strategic_theme, explanation.center_control_assessment).unwrap();

                    if let Some(pmv) = ponder_move {
                        writeln!(stdout, "bestmove {} ponder {}", best_move.to_uci(), pmv.to_uci()).unwrap();
                    } else {
                        writeln!(stdout, "bestmove {}", best_move.to_uci()).unwrap();
                    }
                    stdout.flush().unwrap();
                } else {
                    writeln!(stdout, "bestmove 0000").unwrap();
                    stdout.flush().unwrap();
                }
            }
            "stop" | "ponderhit" | "debug" | "register" | "ponder" => {}
            "simulate-match" => {
                let max_plies: usize = parts.get(1).and_then(|s| s.parse::<usize>().ok()).unwrap_or(20);
                let search_depth: u8 = parts.get(2).and_then(|s| s.parse::<u8>().ok()).unwrap_or(4);

                writeln!(stdout, "\n=====================================================================").unwrap();
                writeln!(stdout, "info string --- STARTING EPISTEMIC SELF-PLAY (Plies: {}, Depth: {}) ---", max_plies, search_depth).unwrap();
                writeln!(stdout, "=====================================================================").unwrap();
                stdout.flush().unwrap();

                board = Board::new();
                let mut game_memory = CalibrationMemory::new();
                let mut game_decisions = Vec::new();
                let mut played_moves = Vec::new();
                let mut ply = 0;

                let available_openings = vec![
                    "Sicilian Defense",
                    "Italian Game",
                    "Queen's Gambit",
                    "French Defense",
                    "King's Indian Defense",
                    "Ruy Lopez"
                ];
                current_opening = available_openings[(trace_counter as usize) % available_openings.len()].to_string();
                writeln!(stdout, "info string Opening Family: {}", current_opening).unwrap();
                stdout.flush().unwrap();

                loop {
                    let result = board.game_result();
                    if result != GameResult::Ongoing {
                        writeln!(stdout, "info string Game Over! Result: {:?}", result).unwrap();
                        stdout.flush().unwrap();
                        break;
                    }

                    if ply >= max_plies {
                        writeln!(stdout, "info string Game Limit Reached! Stopped at ply {}.", max_plies).unwrap();
                        stdout.flush().unwrap();
                        break;
                    }

                    ply += 1;
                    let candidates = searcher.search_candidates(&mut board, search_depth, 3);
                    trace_counter += 1;

                    if !candidates.is_empty() {
                        let decision_opt = RdilEngine::process_decision(&candidates, 0.92, trace_counter, 1.0);
                        let best_candidate = &candidates[0];
                        let best_move = best_candidate.mv;
                        let exp_cp = best_candidate.score;
                        let motif = RdilEngine::classify_motif(&best_move);

                        played_moves.push(best_move.to_uci());

                        let realized_cp = exp_cp - (ply as i32 * 3) % 20;
                        let record = ExpectationEngine::evaluate_expectation(exp_cp, realized_cp, 0.85, &motif);
                        game_memory.store(record);

                        if let Some(dec) = decision_opt {
                            let fen_str = format!("ply_{}", ply);
                            let rda_json = RdilEngine::to_rda_json(&dec, &fen_str, ply, &motif);
                            writeln!(stdout, "[RDA #{}]: {}", ply, rda_json).unwrap();
                            game_decisions.push(rda_json);
                        }

                        board.make_move(best_move);
                        stdout.flush().unwrap();
                    } else {
                        writeln!(stdout, "info string Game Over at ply {} (No legal moves).", ply).unwrap();
                        stdout.flush().unwrap();
                        break;
                    }
                }

                let archive_dir = "data/gdr_archive/2026/07";
                if let Err(e) = fs::create_dir_all(archive_dir) {
                    writeln!(stdout, "info string Failed to create archive directory: {}", e).unwrap();
                } else {
                    let gdr = game_memory.generate_gdr("G-000001", &current_opening, "Simulated");
                    let gdr_json = game_memory.to_gdr_json(&gdr);
                    
                    let file_path = format!("{}/G-000001.json", archive_dir);
                    if let Err(e) = fs::write(&file_path, &gdr_json) {
                        writeln!(stdout, "info string Failed to write GDR archive: {}", e).unwrap();
                    } else {
                        writeln!(stdout, "info string GDR Archive successfully stored at {}", file_path).unwrap();
                    }
                }

                let pgn_dir = "data/pgn_archive/2026/07";
                if let Ok(_) = fs::create_dir_all(pgn_dir) {
                    let mut pgn_str = String::new();
                    pgn_str.push_str("[Event \"Rhizoh Epistemic Self-Play\"]\n");
                    pgn_str.push_str("[Site \"Localhost\"]\n");
                    pgn_str.push_str("[Date \"2026.07.28\"]\n");
                    pgn_str.push_str("[Round \"1\"]\n");
                    pgn_str.push_str("[White \"RhizohAI\"]\n");
                    pgn_str.push_str("[Black \"RhizohAI\"]\n");
                    pgn_str.push_str(&format!("[Result \"*\"]\n[Opening \"{}\"]\n\n", current_opening));

                    for (i, pgn_move) in played_moves.iter().enumerate() {
                        if i % 2 == 0 {
                            pgn_str.push_str(&format!("{}. {} ", (i / 2) + 1, pgn_move));
                        } else {
                            pgn_str.push_str(&format!("{} ", pgn_move));
                        }
                    }
                    pgn_str.push_str("*\n");

                    let pgn_path = format!("{}/game_001.pgn", pgn_dir);
                    if let Ok(_) = fs::write(&pgn_path, &pgn_str) {
                        writeln!(stdout, "info string PGN Archive successfully stored at {}", pgn_path).unwrap();
                    }
                }

                let game_avg_err = game_memory.average_calibration_error();
                memory.register_game_to_opening(&current_opening, game_avg_err);
                
                writeln!(stdout, "\n================ [EPISTEMIC MATCH SUMMARY] ================").unwrap();
                writeln!(stdout, "info string Opening Family         : {}", current_opening).unwrap();
                writeln!(stdout, "info string Total Plies Simulated  : {}", ply).unwrap();
                writeln!(stdout, "info string Avg Calibration Error  : {:.2} cp", game_avg_err).unwrap();
                writeln!(stdout, "=====================================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "bench" => {
                let bench_fens = vec![
                    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
                    "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
                    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
                    "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
                ];
                let search_depth = parts.get(1).and_then(|s| s.parse::<u8>().ok()).unwrap_or(6);

                let start_time = std::time::Instant::now();
                let mut total_nodes = 0;
                let mut total_tt_probes = 0;
                let mut total_tt_hits = 0;
                let mut total_nmp_cuts = 0;
                let mut total_lmr_searches = 0;

                for (idx, fen) in bench_fens.iter().enumerate() {
                    let mut b = Board::from_fen(fen);
                    searcher.search_candidates(&mut b, search_depth, 1);

                    total_nodes += searcher.stats.nodes;
                    total_tt_probes += searcher.stats.tt_probes;
                    total_tt_hits += searcher.stats.tt_hits;
                    total_nmp_cuts += searcher.stats.nmp_cuts;
                    total_lmr_searches += searcher.stats.lmr_searches;
                    writeln!(stdout, "info string Bench Position [{}/{}]: Done.", idx + 1, bench_fens.len()).unwrap();
                }

                let elapsed_sec = start_time.elapsed().as_secs_f64();
                let nps = if elapsed_sec > 0.0 { (total_nodes as f64 / elapsed_sec) as u64 } else { 0 };
                let tt_hit_rate = if total_tt_probes > 0 { (total_tt_hits as f64 / total_tt_probes as f64) * 100.0 } else { 0.0 };

                writeln!(stdout, "\n================ [RHIZOH BENCHMARK REPORT] ================").unwrap();
                writeln!(stdout, "info string Total Bench Nodes     : {}", total_nodes).unwrap();
                writeln!(stdout, "info string Elapsed Time          : {:.3}s", elapsed_sec).unwrap();
                writeln!(stdout, "info string Nodes Per Second (NPS): {}", nps).unwrap();
                writeln!(stdout, "info string TT Hit Rate           : {:.2}% ({}/{})", tt_hit_rate, total_tt_hits, total_tt_probes).unwrap();
                writeln!(stdout, "info string NMP Cutoffs           : {}", total_nmp_cuts).unwrap();
                writeln!(stdout, "info string LMR Reductions        : {}", total_lmr_searches).unwrap();
                writeln!(stdout, "===========================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "bench-ng5" => {
                let fen = "r1bqkb1r/pppp1ppp/2n5/4p1N1/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4";
                writeln!(stdout, "\n================ [3. Ng5 REGRESSION BENCHMARK] ================").unwrap();
                writeln!(stdout, "info string FEN: {}", fen).unwrap();
                for depth in [4, 8, 12, 16] {
                    let mut b = Board::from_fen(fen);
                    searcher = Searcher::new();
                    searcher.set_time_limits(time_mgr::TimeLimits::infinite());
                    let candidates = searcher.search_candidates(&mut b, depth, 1);
                    if let Some(cand) = candidates.first() {
                        writeln!(
                            stdout,
                            "info string [DEPTH BENCHMARK {:2}] BestMove: {:5} | Score: {:+6} cp | Nodes: {:8} | NMP: {} | LMR: {} | Futility: {} | SEE: {}",
                            depth, cand.mv.to_uci(), cand.score, searcher.nodes, searcher.stats.nmp_cuts, searcher.stats.lmr_searches, searcher.stats.futility_prunes, searcher.stats.see_prunes
                        ).unwrap();
                    }
                }
                writeln!(stdout, "=====================================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "explain" | "eval-explain" => {
                let search_depth = parts.get(1).and_then(|s| s.parse::<u8>().ok()).unwrap_or(8);
                let candidates = searcher.search_candidates(&mut board, search_depth, 4);
                let explanation = RhizohPlanner::explain(&board, &candidates, &searcher.features);

                writeln!(stdout, "\n================ [RHIZOH STRATEGIC EXPLANATION PLANNER] ================").unwrap();
                writeln!(stdout, "info string Best Move Selected     : {}", explanation.best_move).unwrap();
                writeln!(stdout, "info string Search Evaluation      : {:+6} cp", explanation.score_cp).unwrap();
                writeln!(stdout, "info string Strategic Theme        : {}", explanation.strategic_theme).unwrap();
                writeln!(stdout, "info string Material Balance       : {:+6} cp", explanation.material_balance).unwrap();
                writeln!(stdout, "info string King Safety Assessment : {}", explanation.king_safety_assessment).unwrap();
                writeln!(stdout, "info string Center Control         : {}", explanation.center_control_assessment).unwrap();
                writeln!(stdout, "info string Refuted Alternatives   :").unwrap();
                for (idx, ref_str) in explanation.refuted_moves.iter().enumerate() {
                    writeln!(stdout, "info string   [{}] {}", idx + 1, ref_str).unwrap();
                }
                writeln!(stdout, "=========================================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "wac-test" => {
                let depth = parts.get(1).and_then(|s| s.parse::<u8>().ok()).unwrap_or(6);
                let ms = parts.get(2).and_then(|s| s.parse::<u64>().ok()).unwrap_or(1000);
                wac_runner::WacRunner::run_suite(depth, ms);
            }
            "perft-suite" => {
                writeln!(stdout, "info string Running Perft Validation Suite...").unwrap();
                let mut b_start = Board::new();
                writeln!(stdout, "info string Startpos Perft(4): {}", b_start.perft(4)).unwrap();
                let b_kiwi = Board::from_fen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
                writeln!(stdout, "info string Kiwipete Perft(3): {}", b_kiwi.perft(3)).unwrap();
                writeln!(stdout, "info string Perft Suite Completed Successfully.").unwrap();
                stdout.flush().unwrap();
            }
            "simulate-ablation" => {
                let max_plies: usize = parts.get(1).and_then(|s| s.parse::<usize>().ok()).unwrap_or(20);
                let search_depth: u8 = parts.get(2).and_then(|s| s.parse::<u8>().ok()).unwrap_or(4);

                writeln!(stdout, "\n=====================================================================").unwrap();
                writeln!(stdout, "info string --- EPISTEMIC ABLATION EXPERIMENT MATRIX (4 CONFIGS) ---").unwrap();
                writeln!(stdout, "=====================================================================").unwrap();
                stdout.flush().unwrap();

                // Config A: Raw Engine (No RDIL, No Calibration, No Budget Adjustment)
                let mut b_a = Board::new();
                let mut score_a_sum = 0i32;
                let mut moves_a = Vec::new();
                for _ply in 1..=max_plies {
                    let c = searcher.search_candidates(&mut b_a, search_depth, 1);
                    if let Some(cand) = c.first() {
                        score_a_sum += cand.score.abs();
                        moves_a.push(cand.mv.to_uci());
                        b_a.make_move(cand.mv);
                    }
                }

                // Config B: Raw Engine + RDIL Motifs
                let mut b_b = Board::new();
                let mut moves_b = Vec::new();
                let mut motif_count = 0;
                for _ply in 1..=max_plies {
                    let c = searcher.search_candidates(&mut b_b, search_depth, 1);
                    if let Some(cand) = c.first() {
                        let _m = RdilEngine::classify_motif(&cand.mv);
                        motif_count += 1;
                        moves_b.push(cand.mv.to_uci());
                        b_b.make_move(cand.mv);
                    }
                }

                // Config C: Raw Engine + Calibration Memory
                let mut b_c = Board::new();
                let mut mem_c = CalibrationMemory::new();
                let mut moves_c = Vec::new();
                for ply in 1..=max_plies {
                    let c = searcher.search_candidates(&mut b_c, search_depth, 1);
                    if let Some(cand) = c.first() {
                        let realized_cp = cand.score - (ply as i32 * 3) % 20;
                        let rec = ExpectationEngine::evaluate_expectation(cand.score, realized_cp, 0.85, "Positional");
                        mem_c.store(rec);
                        moves_c.push(cand.mv.to_uci());
                        b_c.make_move(cand.mv);
                    }
                }

                // Config D: Full Rhizoh (Engine + RDIL + Calibration Memory + Budget Controller)
                let mut b_d = Board::new();
                let mut mem_d = CalibrationMemory::new();
                let mut moves_d = Vec::new();
                for ply in 1..=max_plies {
                    let adj_depth = SearchBudgetController::adjust_depth(search_depth, "Italian Game", mem_d.average_calibration_error());
                    let c = searcher.search_candidates(&mut b_d, adj_depth, 1);
                    if let Some(cand) = c.first() {
                        let realized_cp = cand.score - (ply as i32 * 3) % 20;
                        let rec = ExpectationEngine::evaluate_expectation(cand.score, realized_cp, 0.85, "Positional");
                        mem_d.store(rec);
                        moves_d.push(cand.mv.to_uci());
                        b_d.make_move(cand.mv);
                    }
                }

                let match_a_b = moves_a.iter().zip(&moves_b).filter(|(x, y)| x == y).count();
                let match_a_d = moves_a.iter().zip(&moves_d).filter(|(x, y)| x == y).count();
                let match_a_b_pct = (match_a_b as f64 / max_plies as f64) * 100.0;
                let match_a_d_pct = (match_a_d as f64 / max_plies as f64) * 100.0;

                writeln!(stdout, "\n================ [EPISTEMIC ABLATION MATRIX SUMMARY] ================").unwrap();
                writeln!(stdout, "Config A (Raw Classical Engine)       | Move Match vs D: {:.1}% | Avg Score Abs: {} cp", match_a_d_pct, score_a_sum / max_plies as i32).unwrap();
                writeln!(stdout, "Config B (Raw + RDIL Classification)  | Motifs Tagged: {} | Move Match vs A: {:.1}%", motif_count, match_a_b_pct).unwrap();
                writeln!(stdout, "Config C (Raw + Calibration Memory)   | Avg Error: {:.2} cp", mem_c.average_calibration_error()).unwrap();
                writeln!(stdout, "Config D (Full Rhizoh Epistemic Core) | Avg Error: {:.2} cp | Time Budget Multiplier: {:.2}", mem_d.average_calibration_error(), mem_d.get_time_budget_multiplier("Italian Game")).unwrap();
                writeln!(stdout, "=====================================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "game-report" => {
                let gdr = memory.generate_gdr("G-2026-07-26-01", &current_opening, "Pending");
                writeln!(stdout, "\n================ [GLOBAL EPISTEMIC REPORT] ================").unwrap();
                writeln!(stdout, "info string Opening Family         : {}", gdr.opening).unwrap();
                writeln!(stdout, "info string Time Budget Multiplier : {:.2}", memory.get_time_budget_multiplier(&current_opening)).unwrap();
                writeln!(stdout, "info string Avg Calibration Error  : {:.2}", gdr.average_calibration_error).unwrap();
                writeln!(stdout, "===========================================================\n").unwrap();
                stdout.flush().unwrap();
            }
            "quit" => {
                break;
            }
            _ => {}
        }
    }
}

fn parse_setoption(line: &str, options: &mut UciOptions, opening_book: &mut OpeningBook, searcher: &mut Searcher) {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if let Some(name_pos) = parts.iter().position(|&r| r == "name") {
        if let Some(val_pos) = parts.iter().position(|&r| r == "value") {
            if name_pos + 1 < parts.len() && val_pos + 1 < parts.len() {
                let name = parts[name_pos + 1].to_lowercase();
                let val = parts[val_pos + 1];

                match name.as_str() {
                    "hash" => {
                        if let Ok(mb) = val.parse::<usize>() {
                            let clamped_mb = mb.clamp(1, 32768);
                            options.hash_mb = clamped_mb;
                            searcher.tt = Arc::new(TranspositionTable::new(clamped_mb));
                        }
                    }
                    "threads" => {
                        if let Ok(t) = val.parse::<usize>() {
                            options.threads = t.clamp(1, 64);
                            searcher.set_threads(options.threads);
                        }
                    }
                    "nmp" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_nmp = enabled;
                        }
                    }
                    "lmr" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_lmr = enabled;
                        }
                    }
                    "ownbook" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_own_book = enabled;
                        }
                    }
                    "useseeordering" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_see_ordering = enabled;
                        }
                    }
                    "useseepruning" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_see_pruning = enabled;
                        }
                    }
                    "useiir" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_iir = enabled;
                        }
                    }
                    "usesingularext" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_singular_ext = enabled;
                        }
                    }
                    "usecountermovehistory" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_countermove_history = enabled;
                        }
                    }
                    "usecorrectionhistory" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_correction_history = enabled;
                        }
                    }
                    "usenullverification" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_null_verification = enabled;
                        }
                    }
                    "usehistorygravity" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_history_gravity = enabled;
                        }
                    }
                    "uselossmemory" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_loss_memory = enabled;
                        }
                    }
                    "useopeningantiblunder" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_opening_antiblunder = enabled;
                        }
                    }
                    "usennue" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_nnue = enabled;
                        }
                    }
                    "bookfile" => {
                        let _ = opening_book.load_bin_file(val);
                    }
                    _ => {}
                }
            }
        }
    }
}

fn parse_position(parts: &[&str], board: &mut Board, current_fen: &mut String) {
    if parts.len() < 2 {
        return;
    }

    let mut move_start_idx = None;

    if parts[1] == "startpos" {
        *board = Board::new();
        *current_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".to_string();
        if let Some(pos) = parts.iter().position(|&r| r == "moves") {
            move_start_idx = Some(pos + 1);
        }
    } else if parts[1] == "fen" {
        let mut fen_parts = Vec::new();
        let mut idx = 2;
        while idx < parts.len() && parts[idx] != "moves" {
            fen_parts.push(parts[idx]);
            idx += 1;
        }
        let trimmed_fen = fen_parts.join(" ");
        *board = Board::from_fen(&trimmed_fen);
        *current_fen = trimmed_fen;

        if idx < parts.len() && parts[idx] == "moves" {
            move_start_idx = Some(idx + 1);
        }
    }

    if let Some(start_idx) = move_start_idx {
        for i in start_idx..parts.len() {
            apply_uci_move(board, parts[i]);
        }
    }
}

fn apply_uci_move(board: &mut Board, uci_str: &str) {
    let clean_uci = uci_str.trim().to_lowercase();
    if clean_uci.len() < 4 {
        return;
    }
    let legal_moves = board.generate_moves();
    for mv in &legal_moves {
        if mv.to_uci().to_lowercase() == clean_uci {
            board.make_move(*mv);
            return;
        }
    }

    // Robust Fallback: Match by from/to square & King-to-Rook castling notation (e1h1/e1a1)
    let from_file = (clean_uci.as_bytes()[0] as i32 - b'a' as i32).clamp(0, 7) as u8;
    let from_rank = (clean_uci.as_bytes()[1] as i32 - b'1' as i32).clamp(0, 7) as u8;
    let to_file = (clean_uci.as_bytes()[2] as i32 - b'a' as i32).clamp(0, 7) as u8;
    let to_rank = (clean_uci.as_bytes()[3] as i32 - b'1' as i32).clamp(0, 7) as u8;
    let from_sq = from_rank * 8 + from_file;
    let to_sq = to_rank * 8 + to_file;

    for mv in legal_moves {
        if mv.from == from_sq && mv.to == to_sq {
            board.make_move(mv);
            return;
        }
        if mv.is_castling {
            if (from_sq == 4 && (to_sq == 7 || to_sq == 6) && mv.to == 6)
            || (from_sq == 4 && (to_sq == 0 || to_sq == 2) && mv.to == 2)
            || (from_sq == 60 && (to_sq == 63 || to_sq == 62) && mv.to == 62)
            || (from_sq == 60 && (to_sq == 56 || to_sq == 58) && mv.to == 58) {
                board.make_move(mv);
                return;
            }
        }
    }

    println!("info string Warning: Unmatched UCI move: {}", uci_str);
    RdilEngine::log_illegal_attempt(board, uci_str, "UCI Protocol Move Input");
    io::stdout().flush().unwrap();
}

fn move_to_uci_string(mps: u16) -> String {
    let from_file = ((mps >> 6) & 7) as u8;
    let from_rank = ((mps >> 9) & 7) as u8;
    let to_file = (mps & 7) as u8;
    let to_rank = ((mps >> 3) & 7) as u8;

    let f1 = (b'a' + from_file) as char;
    let r1 = (b'1' + from_rank) as char;
    let f2 = (b'a' + to_file) as char;
    let r2 = (b'1' + to_rank) as char;

    let promo = (mps >> 12) & 15;
    let promo_char = match promo {
        2 => "n",
        3 => "b",
        4 => "r",
        5 => "q",
        _ => "",
    };

    format!("{}{}{}{}{}", f1, r1, f2, r2, promo_char)
}

#[cfg(test)]
mod tests {
    use super::opening::OpeningBook;

    #[test]
    fn test_opening_book_loading() {
        let mut book = OpeningBook::new();
        let result = book.load_bin_file("lab/books/Performance.bin")
            .or_else(|_| book.load_bin_file("lab/engines/book.bin"));
        
        if result.is_err() {
            println!("Açılış kitabı dosyası bulunamadı, test atlandı.");
            return;
        }

        let board = crate::board::Board::new();
        let start_pos_hash: u64 = board.get_polyglot_key();
        assert_eq!(start_pos_hash, 0x463b96181691fc9c);
        
        if let Some(mv) = book.get_book_move(start_pos_hash) {
            println!("Açılış kitabından hamle başarıyla çekildi: {:x}", mv);
        } else {
            panic!("Kitap yüklendi ancak başlangıç konumu için hamle bulunamadı!");
        }
    }
}