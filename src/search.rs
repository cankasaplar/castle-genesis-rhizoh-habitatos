use std::sync::{Arc, LazyLock};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::thread;
use crate::board::Board;
use crate::eval::Evaluator;
use crate::see::see_eval;
use crate::time_mgr::TimeLimits;
use crate::tt::{NodeType, TranspositionTable};
use crate::types::{CandidateMove, Color, Move, PieceType, SearchFeatures, SearchHeuristics};

static LMR_TABLE: LazyLock<[[usize; 64]; 64]> = LazyLock::new(|| {
    // Aligned LMR formula: 0.70 + ln(depth) * ln(moves) / 2.25
    // Optimized reduction for deep tree search & move ordering
    let mut table = [[0usize; 64]; 64];
    for d in 1..64 {
        for m in 1..64 {
            let r = 0.70 + (d as f64).ln() * (m as f64).ln() / 2.25;
            table[d][m] = (r.floor() as usize).max(1);
        }
    }
    table
});

/// Razoring margins by depth (centipawns)
const RAZORING_MARGIN: [i32; 4] = [0, 125, 250, 400];

const MATE_SCORE: i32 = 30000;

#[inline]
fn score_to_tt(score: i32, ply: usize) -> i32 {
    if score > MATE_SCORE - 100 {
        score + ply as i32
    } else if score < -MATE_SCORE + 100 {
        score - ply as i32
    } else {
        score
    }
}

#[inline]
fn score_from_tt(score: i32, ply: usize) -> i32 {
    if score > MATE_SCORE - 100 {
        score - ply as i32
    } else if score < -MATE_SCORE + 100 {
        score + ply as i32
    } else {
        score
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct SearchStats {
    pub nodes: u64,
    pub qnodes: u64,
    pub tt_probes: u64,
    pub tt_hits: u64,
    pub first_move_cutoffs: u64,
    pub beta_cutoffs: u64,
    pub nmp_cuts: u64,
    pub lmr_searches: u64,
    pub futility_prunes: u64,
    pub see_prunes: u64,
    pub delta_prunes: u64,
    pub aspiration_attempts: u64,
    pub aspiration_researches: u64,
    pub aspiration_fail_high: u64,
    pub aspiration_fail_low: u64,
}

pub struct Searcher {
    pub nodes: u64,
    pub tt: Arc<TranspositionTable>,
    pub heuristics: SearchHeuristics,
    pub features: SearchFeatures,
    pub time_limits: Option<TimeLimits>,
    pub aborted: bool,
    pub shared_abort: Option<Arc<AtomicBool>>,
    pub threads: usize,
    pub stats: SearchStats,
}

fn has_non_pawn_material(board: &Board, color: Color) -> bool {
    let c_idx = color as usize;
    (board.pieces[c_idx][PieceType::Knight as usize]
        | board.pieces[c_idx][PieceType::Bishop as usize]
        | board.pieces[c_idx][PieceType::Rook as usize]
        | board.pieces[c_idx][PieceType::Queen as usize])
        != 0
}

impl Searcher {
    pub fn new() -> Self {
        Searcher {
            nodes: 0,
            tt: Arc::new(TranspositionTable::new(64)),
            heuristics: SearchHeuristics::new(),
            features: SearchFeatures::default(),
            time_limits: None,
            aborted: false,
            shared_abort: None,
            threads: 1,
            stats: SearchStats::default(),
        }
    }

    pub fn set_threads(&mut self, threads: usize) {
        self.threads = threads.max(1);
    }

    pub fn set_time_limits(&mut self, limits: TimeLimits) {
        self.time_limits = Some(limits);
        self.aborted = false;
    }

    pub fn set_shared_abort(&mut self, shared_abort: Arc<AtomicBool>) {
        self.shared_abort = Some(shared_abort);
    }

    pub fn check_time_limits(&mut self) {
        if let Some(ref sa) = self.shared_abort {
            if sa.load(Ordering::Relaxed) {
                self.aborted = true;
                return;
            }
        }
        if self.nodes % 1024 == 0 {
            if let Some(ref limits) = self.time_limits {
                if limits.is_hard_limit_exceeded() || limits.is_emergency_stop() {
                    self.aborted = true;
                    if let Some(ref sa) = self.shared_abort {
                        sa.store(true, Ordering::Relaxed);
                    }
                }
            }
        }
    }

    pub fn extract_pv_string(&self, board: &Board, max_depth: usize) -> String {
        let mut pv_moves = Vec::new();
        let mut curr_board = board.clone();
        let mut visited = std::collections::HashSet::new();

        for _ in 0..max_depth.min(16) {
            let key = curr_board.get_zobrist_key();
            if visited.contains(&key) {
                break;
            }
            visited.insert(key);

            if let Some(entry) = self.tt.probe(key) {
                if let Some(mv_u16) = entry.best_move {
                    if let Some(mv) = curr_board.is_legal_u16(mv_u16) {
                        pv_moves.push(mv.to_uci());
                        curr_board.make_move(mv);
                        continue;
                    }
                }
            }
            break;
        }

        if pv_moves.is_empty() {
            String::new()
        } else {
            pv_moves.join(" ")
        }
    }

    /// Performs Lazy SMP Multi-Threaded Iterative Deepening Search
    pub fn search_candidates(
        &mut self,
        board: &mut Board,
        target_depth: u8,
        top_n: usize,
    ) -> Vec<CandidateMove> {
        self.nodes = 0;
        self.aborted = false;
        self.stats = SearchStats::default();
        self.tt.new_search();

        let legal_moves = board.generate_moves();
        if legal_moves.is_empty() {
            return Vec::new();
        }

        if self.threads <= 1 {
            return self.search_single_thread(board, target_depth, top_n);
        }

        // Lazy SMP Multi-Threaded Execution
        // Shared abort flag: when main thread finishes, workers see abort=true and exit
        let shared_abort = Arc::new(AtomicBool::new(false));
        let mut handles = Vec::new();
        let num_workers = self.threads - 1;
        let worker_nodes_counter = Arc::new(AtomicU64::new(0));

        for thread_id in 1..=num_workers {
            let mut worker_board = board.clone();
            let tt_clone = Arc::clone(&self.tt);
            let limits_clone = self.time_limits;
            let heuristics_clone = self.heuristics.clone();
            let features_clone = self.features;
            let counter_clone = Arc::clone(&worker_nodes_counter);
            let abort_clone = Arc::clone(&shared_abort);

            let handle = thread::spawn(move || {
                let mut worker_searcher = Searcher {
                    nodes: 0,
                    tt: tt_clone,
                    heuristics: heuristics_clone,
                    features: features_clone,
                    time_limits: limits_clone,
                    aborted: false,
                    shared_abort: Some(Arc::clone(&abort_clone)),
                    threads: 1,
                    stats: SearchStats::default(),
                };
                // Workers check shared abort flag in their search loop
                // search_single_thread already checks time_limits internally;
                // we also pre-check abort before starting each iteration
                if !abort_clone.load(Ordering::Relaxed) {
                    let _ = worker_searcher.search_single_thread(
                        &mut worker_board,
                        target_depth + (thread_id % 2) as u8,
                        1,
                    );
                }
                counter_clone.fetch_add(worker_searcher.nodes, Ordering::Relaxed);
            });

            handles.push(handle);
        }

        // Main thread executes primary search
        let candidates = self.search_single_thread(board, target_depth, top_n);

        // Signal all workers to stop immediately
        shared_abort.store(true, Ordering::Release);
        self.aborted = true;

        for handle in handles {
            let _ = handle.join();
        }

        let extra_nodes = worker_nodes_counter.load(Ordering::Relaxed);
        self.nodes += extra_nodes;

        candidates
    }

    /// Single-threaded core search engine
    pub fn search_single_thread(
        &mut self,
        board: &mut Board,
        target_depth: u8,
        top_n: usize,
    ) -> Vec<CandidateMove> {
        let mut candidates = Vec::new();
        let legal_moves = board.generate_moves();
        if legal_moves.is_empty() {
            return candidates;
        }

        if self.features.use_nnue && board.accumulator.is_none() {
            let nnue = crate::nnue::get_global_nnue();
            if nnue.is_enabled() {
                board.accumulator = Some(nnue.compute_accumulator(board));
            }
        }

        let mut move_scores: Vec<(Move, i32)> = Vec::new();

        for current_depth in 1..=target_depth {
            if self.aborted {
                break;
            }

            // Age history heuristic table every iteration to prevent history saturation
            self.heuristics.age_history();

            let is_prev_mate = move_scores.first().map_or(false, |(_, s)| s.abs() > MATE_SCORE - 1000);
            let prev_best_at_root = move_scores.first().cloned();
            let mut delta = 16;
            let mut alpha = if current_depth >= 4 && !move_scores.is_empty() && !is_prev_mate {
                move_scores[0].1 - delta
            } else {
                -i32::MAX
            };
            let mut beta = if current_depth >= 4 && !move_scores.is_empty() && !is_prev_mate {
                move_scores[0].1 + delta
            } else {
                i32::MAX
            };

            let mut current_move_scores = Vec::new();
            let mut searched_moves = legal_moves.clone();

            let zobrist_key = board.get_zobrist_key();
            let raw_tt_move = self.tt.probe(zobrist_key).and_then(|e| e.best_move);
            let tt_move = raw_tt_move.filter(|&m_u16| board.is_legal_u16(m_u16).is_some());

            // Order root moves
            self.order_moves(board, &mut searched_moves, 0, tt_move, None);

            let mut loop_count = 0;
            loop {
                current_move_scores.clear();
                let mut search_alpha = alpha;
                if loop_count > 0 {
                    self.stats.aspiration_researches += 1;
                }
                loop_count += 1;

                for (i, &mv) in searched_moves.iter().enumerate() {
                    if self.aborted {
                        break;
                    }
                    if i > 0 {
                        if let Some(ref limits) = self.time_limits {
                            if limits.is_soft_limit_exceeded() || limits.is_hard_limit_exceeded() {
                                self.aborted = true;
                                break;
                            }
                        }
                    }

                    let mut next_board = board.clone();
                    next_board.make_move(mv);

                    let is_quiet = mv.captured.is_none() && !mv.is_en_passant && mv.promotion.is_none();
                    let can_reduce_root = self.heuristics.use_lmr && current_depth >= 3 && i >= 2 && is_quiet && !board.is_king_in_check(board.side_to_move);

                    let mut score = if i == 0 {
                        // Principal Variation (PV) move: full window
                        -self.alpha_beta(&mut next_board, (current_depth as usize).saturating_sub(1), 1, -beta, -search_alpha)
                    } else if can_reduce_root {
                        // Root Late Move Reduction (Root LMR)
                        let r = LMR_TABLE[current_depth.min(63) as usize][i.min(63)];
                        let reduced_depth = (current_depth as usize).saturating_sub(1 + r).max(1);
                        let lmr_score = -self.alpha_beta(&mut next_board, reduced_depth, 1, -search_alpha - 1, -search_alpha);
                        if lmr_score > search_alpha {
                            -self.alpha_beta(&mut next_board, (current_depth as usize).saturating_sub(1), 1, -beta, -search_alpha)
                        } else {
                            lmr_score
                        }
                    } else {
                        // Zero/Null Window Search (PVS)
                        let pvs_score = -self.alpha_beta(&mut next_board, (current_depth as usize).saturating_sub(1), 1, -search_alpha - 1, -search_alpha);
                        if pvs_score > search_alpha && pvs_score < beta {
                            // Re-search with full window if zero-window search failed high
                            -self.alpha_beta(&mut next_board, (current_depth as usize).saturating_sub(1), 1, -beta, -search_alpha)
                        } else {
                            pvs_score
                        }
                    };

                    // Root Bad Capture Guard: Penalize unsound piece sacrifices with negative SEE
                    if (mv.captured.is_some() || mv.is_en_passant) && !board.is_king_in_check(board.side_to_move) {
                        let see_val = see_eval(board, mv);
                        if see_val < -100 {
                            score -= 20000; // Unsound piece loss at root IS 100% ELIMINATED!
                        } else if see_val < 0 {
                            score += see_val * 2;
                        }
                    }

                    // Root Move Inertia Stabilizer: Apply small stability hysteresis bonus (+6cp) to previous PV move
                    if let Some((prev_mv, _)) = prev_best_at_root {
                        if mv == prev_mv && current_depth >= 6 {
                            score += 6;
                        }
                    }

                    if self.aborted {
                        break;
                    }

                    current_move_scores.push((mv, score));
                    if score > search_alpha {
                        search_alpha = score;
                    }
                }

                current_move_scores.sort_by(|a, b| b.1.cmp(&a.1));

                if self.aborted || current_depth < 4 || move_scores.is_empty() || is_prev_mate {
                    break;
                }

                let best_s = current_move_scores.iter().map(|(_, s)| *s).max().unwrap_or(0);
                if best_s <= alpha {
                    alpha = (alpha - delta).max(-i32::MAX / 2);
                    delta = (delta * 2).min(2000);
                    if delta >= 1000 || loop_count >= 4 {
                        alpha = -i32::MAX / 2;
                        beta = i32::MAX / 2;
                    }
                } else if best_s >= beta {
                    beta = (beta + delta).min(i32::MAX / 2);
                    delta = (delta * 2).min(2000);
                    if delta >= 1000 || loop_count >= 4 {
                        alpha = -i32::MAX / 2;
                        beta = i32::MAX / 2;
                    }
                } else {
                    break;
                }
            }

            if !self.aborted {
                let old_best = move_scores.first().cloned();
                move_scores = current_move_scores;
                if let Some(&(best_mv, best_score)) = move_scores.first() {
                    // Dynamic Time Management: Extend search time on root move instability or score collapse (>30cp drop)
                    if let Some((prev_mv, prev_score)) = old_best {
                        if current_depth >= 4 {
                            if best_mv != prev_mv {
                                if let Some(ref mut limits) = self.time_limits {
                                    limits.extend_time_for_panic(1.4);
                                }
                            } else if best_score < prev_score - 30 {
                                if let Some(ref mut limits) = self.time_limits {
                                    limits.extend_time_for_panic(1.25);
                                }
                            }
                        }
                    }

                    let elapsed_ms = self.time_limits.as_ref().map_or(1, |t| t.elapsed_ms()).max(1);
                    let nps = (self.nodes * 1000) / elapsed_ms;
                    let hashfull = self.tt.hashfull_per_mille();
                    let score_str = if best_score > MATE_SCORE - 1000 {
                        let mate_in_plies = MATE_SCORE - best_score;
                        let mate_in_moves = (mate_in_plies + 1) / 2;
                        format!("mate {}", mate_in_moves)
                    } else if best_score < -MATE_SCORE + 1000 {
                        let mate_in_plies = MATE_SCORE + best_score;
                        let mate_in_moves = (mate_in_plies + 1) / 2;
                        format!("mate -{}", mate_in_moves)
                    } else {
                        format!("cp {}", best_score)
                    };
                    let pv_str = self.extract_pv_string(board, current_depth as usize);
                    let final_pv = if pv_str.is_empty() { best_mv.to_uci() } else { pv_str };
                    println!(
                        "info depth {} score {} nodes {} nps {} time {} hashfull {} pv {}",
                        current_depth, score_str, self.nodes, nps, elapsed_ms, hashfull, final_pv
                    );
                    use std::io::Write;
                    let _ = std::io::stdout().flush();
                }
            }

            // Early stop on proven forced mate
            if let Some(&(_, best_score)) = move_scores.first() {
                if best_score.abs() > MATE_SCORE - 1000 {
                    break;
                }
            }

            if let Some(ref limits) = self.time_limits {
                if limits.is_soft_limit_exceeded() {
                    break;
                }
            }
        }

        // Fallback: If move_scores is empty due to early abort, populate with legal_moves with score 0
        if move_scores.is_empty() {
            for &mv in &legal_moves {
                move_scores.push((mv, 0));
            }
        }

        // Sort descending by score
        move_scores.sort_by(|a, b| b.1.cmp(&a.1));

        // Strict Legal Move Verification Filter: Ensure candidates only contains valid legal moves on current board
        for (mv, score) in move_scores.into_iter().take(top_n) {
            if legal_moves.contains(&mv) {
                candidates.push(CandidateMove {
                    mv,
                    score,
                    depth: target_depth,
                    pv: vec![mv],
                });
            }
        }

        // Emergency Safety Fallback: If candidates is still empty, add first legal move
        if candidates.is_empty() {
            let first_legal = legal_moves[0];
            candidates.push(CandidateMove {
                mv: first_legal,
                score: 0,
                depth: target_depth,
                pv: vec![first_legal],
            });
        }

        candidates
    }

    /// Computes move priority score for move ordering with instant MVV-LVA
    fn score_move(&self, board: &Board, mv: Move, ply: usize, tt_move: Option<u16>, prev_move: Option<Move>) -> i32 {
        let mv_u16 = ((mv.from as u16) << 6) | (mv.to as u16);
        if Some(mv_u16) == tt_move {
            return 2_000_000_000;
        }

        if mv.captured.is_some() || mv.is_en_passant {
            let mvv_lva = self.score_move_mvv_lva(board, mv);
            let cap_hist = if let Some(cap) = mv.captured {
                self.heuristics.get_capture_history(mv.piece, cap, mv.to as usize)
            } else { 0 };
            return 1_000_000_000 + mvv_lva + cap_hist;
        }

        if let Some(promo) = mv.promotion {
            let promo_val = match promo {
                PieceType::Queen => 900,
                PieceType::Rook => 500,
                PieceType::Bishop => 330,
                PieceType::Knight => 320,
                _ => 0,
            };
            return 900_000 + promo_val;
        }

        // Killer Moves
        if ply < 64 {
            if let Some(k0) = self.heuristics.killer_moves[ply][0] {
                if k0 == mv && board.is_legal(&mv) {
                    return 800_000;
                }
            }
            if let Some(k1) = self.heuristics.killer_moves[ply][1] {
                if k1 == mv && board.is_legal(&mv) {
                    return 700_000;
                }
            }
        }

        // Countermove Heuristic
        if self.features.use_countermove_history {
            if let Some(pm) = prev_move {
                if let Some(cm) = self.heuristics.counter_moves[pm.from as usize][pm.to as usize] {
                    if cm == mv && board.is_legal(&mv) {
                        return 650_000;
                    }
                }
            }
        }

        // History & Continuation History
        let history_score = self.heuristics.history_table[mv.from as usize][mv.to as usize];
        let con_hist = self.heuristics.get_continuation_history(prev_move, mv);
        (history_score + con_hist).min(600_000)
    }

    /// Sorts moves in place according to priority score
    fn order_moves(&self, board: &Board, moves: &mut [Move], ply: usize, tt_move: Option<u16>, prev_move: Option<Move>) {
        moves.sort_by_key(|mv| -self.score_move(board, *mv, ply, tt_move, prev_move));
    }

    /// Quiescence Search: Searches capture moves to prevent horizon effect with Delta & SEE Pruning
    pub fn quiescence(&mut self, board: &mut Board, ply: usize, mut alpha: i32, beta: i32) -> i32 {
        self.nodes += 1;
        self.stats.nodes += 1;
        self.stats.qnodes += 1;
        self.check_time_limits();
        if self.aborted {
            return 0;
        }

        let zobrist_key = board.get_zobrist_key();
        if let Some(entry) = self.tt.probe(zobrist_key) {
            let tt_score = score_from_tt(entry.score, ply);
            match entry.node_type {
                NodeType::Exact => return tt_score,
                NodeType::Alpha if tt_score <= alpha => return alpha,
                NodeType::Beta if tt_score >= beta => return beta,
                _ => {}
            }
        }

        let in_check = board.is_king_in_check(board.side_to_move);

        // Standing Pat
        let stand_pat = Evaluator::evaluate(board, &self.features);
        if !in_check {
            if stand_pat >= beta {
                return beta;
            }
            if stand_pat > alpha {
                alpha = stand_pat;
            }
        }

        // Generate legal moves (captures, evasions or quiet checks at shallow quiescence)
        let moves = board.generate_moves();
        let captures: Vec<Move> = moves.into_iter().filter(|m| {
            if in_check || m.captured.is_some() || m.is_en_passant || m.promotion.is_some() {
                return true;
            }
            if ply <= 2 {
                let mut test_b = board.clone();
                test_b.make_move(*m);
                if test_b.is_king_in_check(test_b.side_to_move) {
                    return true;
                }
            }
            false
        }).collect();

        if captures.is_empty() {
            if in_check {
                return -MATE_SCORE + ply as i32;
            }
            return alpha;
        }

        // Sort captures by MVV-LVA + SEE
        let mut sorted_captures = captures;
        sorted_captures.sort_by_key(|mv| -self.score_move_mvv_lva(board, *mv));

        let orig_alpha = alpha;
        for mv in sorted_captures {
            let captured_val = match mv.captured {
                Some(p) => crate::see::get_piece_value(p),
                None => if mv.is_en_passant { 100 } else { 0 },
            };

            // 1. Delta Pruning: If even capturing piece cannot raise alpha, prune capture
            if !in_check && mv.promotion.is_none() {
                if stand_pat + captured_val + 200 < alpha {
                    self.stats.delta_prunes += 1;
                    continue;
                }
            }

            // 2. SEE Pruning: Skip losing capture sequences in quiescence (exempt promotions)
            if !in_check && mv.promotion.is_none() && (mv.captured.is_some() || mv.is_en_passant) {
                if crate::see::see_eval(board, mv) < 0 {
                    self.stats.see_prunes += 1;
                    continue;
                }
            }

            let mut next_board = board.clone();
            next_board.make_move(mv);
            let score = -self.quiescence(&mut next_board, ply + 1, -beta, -alpha);

            if self.aborted {
                return 0;
            }

            if score >= beta {
                let tt_score = score_to_tt(beta, ply);
                self.tt.store(zobrist_key, 0, tt_score, NodeType::Beta, None);
                return beta;
            }
            if score > alpha {
                alpha = score;
            }
        }

        if !self.aborted {
            let node_type = if alpha > orig_alpha { NodeType::Exact } else { NodeType::Alpha };
            let tt_score = score_to_tt(alpha, ply);
            self.tt.store(zobrist_key, 0, tt_score, node_type, None);
        }

        alpha
    }

    /// Alpha-Beta Recursive Search with NMP, LMR, PVS & Lazy SMP
    pub fn alpha_beta(
        &mut self,
        board: &mut Board,
        depth: usize,
        ply: usize,
        alpha: i32,
        beta: i32,
    ) -> i32 {
        self.alpha_beta_with_prev(board, depth, ply, alpha, beta, None, None)
    }

    pub fn alpha_beta_with_prev(
        &mut self,
        board: &mut Board,
        depth: usize,
        ply: usize,
        mut alpha: i32,
        mut beta: i32,
        prev_move: Option<Move>,
        excluded_move: Option<Move>,
    ) -> i32 {
        self.nodes += 1;
        self.stats.nodes += 1;
        self.check_time_limits();
        if self.aborted {
            return 0;
        }

        // 1. Mate Distance Pruning: Clamp alpha/beta bounds to mating bounds at current ply
        let max_mate_score = MATE_SCORE - ply as i32;
        let min_mate_score = -MATE_SCORE + ply as i32;

        if alpha >= max_mate_score {
            return alpha;
        }
        if beta <= min_mate_score {
            return beta;
        }

        alpha = alpha.max(min_mate_score);
        beta = beta.min(max_mate_score);
        if alpha >= beta {
            return alpha;
        }

        // Syzygy Endgame Tablebase Probing
        if ply > 0 && board.combined_occupancy.count_ones() <= 5 {
            if let Some(tb_score) = crate::syzygy::SyzygyProber::probe_wdl(board, ply) {
                return tb_score;
            }
        }

        let zobrist_key = board.get_zobrist_key();
        let mut tt_move = None;

        self.stats.tt_probes += 1;
        if let Some(entry) = self.tt.probe(zobrist_key) {
            if let Some(m_u16) = entry.best_move {
                if board.is_legal_u16(m_u16).is_some() {
                    tt_move = Some(m_u16);
                }
            }
            if entry.depth >= depth as u8 {
                self.stats.tt_hits += 1;
                let tt_score = score_from_tt(entry.score, ply);
                match entry.node_type {
                    NodeType::Exact => return tt_score,
                    NodeType::Alpha if tt_score <= alpha => return alpha,
                    NodeType::Beta if tt_score >= beta => return beta,
                    _ => {}
                }
            }
        }

        // Check Extensions: Extend search depth if currently in check
        let in_check = board.is_king_in_check(board.side_to_move);
        let depth = if in_check && ply < 64 { depth + 1 } else { depth };

        if depth == 0 {
            return self.quiescence(board, ply, alpha, beta);
        }
        
        // Internal Iterative Reduction (IIR): Reduce depth by 1 if no TT move available at non-PV node
        let depth = if tt_move.is_none() && depth >= 4 && !in_check {
            depth - 1
        } else {
            depth
        };

        let static_eval = Evaluator::evaluate(board, &self.features);
        let pawn_hash = board.pieces[board.side_to_move as usize][PieceType::Pawn as usize];
        let non_pawn_hash = board.color_occupancy[board.side_to_move as usize] ^ pawn_hash;
        let p_corr = self.heuristics.get_correction(board.side_to_move, pawn_hash);
        let np_corr = self.heuristics.get_non_pawn_correction(board.side_to_move, non_pawn_hash);
        let adjusted_eval = static_eval + p_corr + np_corr;

        // Razoring: At shallow depths, if static eval is far below alpha, drop to quiescence
        if !in_check && ply > 0 && depth <= 3 && alpha.abs() < MATE_SCORE - 1000 {
            let razor_margin = RAZORING_MARGIN[depth];
            if adjusted_eval + razor_margin <= alpha {
                if depth <= 1 {
                    return self.quiescence(board, ply, alpha, beta);
                }
                let qs_score = self.quiescence(board, ply, alpha, beta);
                if qs_score <= alpha {
                    return qs_score;
                }
            }
        }

        // 1. Reverse Futility Pruning (RFP / Static Null Move Pruning)
        if depth <= 6 && !in_check && ply > 0 && beta.abs() < MATE_SCORE - 1000 {
            let rfp_margin = depth as i32 * 90;
            if adjusted_eval - rfp_margin >= beta {
                return adjusted_eval;
            }
        }

        // 2. Multi-ProbCut (ProbCut): Shallow high-beta pruning
        // Margin reduced to 150cp (was 200cp) to avoid false cutoffs
        if depth >= 5 && !in_check && ply > 0 && beta.abs() < MATE_SCORE - 1000 && adjusted_eval >= beta + 80 {
            let probcut_beta = (beta + 150).min(MATE_SCORE - 1000);
            let probcut_depth = depth.saturating_sub(4).max(1);
            let mut pc_board = board.clone();
            // Only try ProbCut on captures (avoid expensive quiet searches)
            let pc_moves = board.generate_moves();
            let pc_captures: Vec<_> = pc_moves.iter().filter(|m| {
                m.captured.is_some() || m.is_en_passant
            }).take(6).cloned().collect();
            for pc_mv in pc_captures {
                let see_val = crate::see::see_eval(board, pc_mv);
                if see_val < 0 { continue; } // Skip losing captures in ProbCut
                let mut pc_board2 = board.clone();
                pc_board2.make_move(pc_mv);
                let pc_score = -self.alpha_beta_with_prev(&mut pc_board2, probcut_depth, ply + 1, -probcut_beta, -probcut_beta + 1, None, None);
                if pc_score >= probcut_beta {
                    return beta;
                }
            }
        }

        // Multi-Cut Pruning: If at high depth, many moves cause beta cutoff at reduced depth, prune
        if depth >= 8 && !in_check && ply > 0 && beta.abs() < MATE_SCORE - 1000 {
            let mc_depth = depth.saturating_sub(4).max(1);
            let mc_moves = board.generate_moves();
            let mut mc_sorted = mc_moves;
            self.order_moves(board, &mut mc_sorted, ply, tt_move, prev_move);
            let mut cuts = 0;
            let mc_limit = mc_sorted.len().min(6);
            for mc_i in 0..mc_limit {
                let mc_mv = mc_sorted[mc_i];
                let mut mc_board = board.clone();
                mc_board.make_move(mc_mv);
                let mc_score = -self.alpha_beta_with_prev(&mut mc_board, mc_depth, ply + 1, -beta, -beta + 1, Some(mc_mv), None);
                if mc_score >= beta {
                    cuts += 1;
                    if cuts >= 3 {
                        return beta;
                    }
                }
            }
        }

        // 3. Null Move Pruning (NMP) with Verification Search
        if self.heuristics.use_nmp && depth >= 3 && ply > 0 && !in_check && adjusted_eval >= beta - 50 && adjusted_eval >= -150 && has_non_pawn_material(board, board.side_to_move) {
            let eval_margin = ((adjusted_eval - beta) / 160).clamp(0, 4) as usize;
            let r = 2 + (depth / 3) + eval_margin;
            let reduced_depth = depth.saturating_sub(1 + r);
            let mut null_board = board.clone();
            null_board.side_to_move = null_board.side_to_move.opposite();
            null_board.en_passant_square = None;

            let nmp_score = -self.alpha_beta_with_prev(&mut null_board, reduced_depth, ply + 1, -beta, -beta + 1, None, None);

            if self.aborted {
                return 0;
            }

            if nmp_score >= beta {
                self.stats.nmp_cuts += 1;
                // Verification search at high depth to prevent zugzwang false cutoffs
                if depth >= 10 {
                    let verify_depth = depth.saturating_sub(r + 2).max(1);
                    let verify_score = self.alpha_beta_with_prev(board, verify_depth, ply, alpha, beta, prev_move, excluded_move);
                    if self.aborted { return 0; }
                    if verify_score >= beta {
                        return beta;
                    }
                    // Verification failed — don't trust NMP, continue searching
                } else {
                    return beta;
                }
            }
        }

        let moves = board.generate_moves();

        if moves.is_empty() {
            if in_check {
                return -MATE_SCORE + ply as i32;
            } else {
                return 0; // Stalemate
            }
        }

        let mut sorted_moves = moves;
        self.order_moves(board, &mut sorted_moves, ply, tt_move, prev_move);

        let mut best_score = -i32::MAX;
        let mut node_type = NodeType::Alpha;
        let mut best_move_found = None;
        let mut searched_quiets = Vec::new();

        for (i, mv) in sorted_moves.into_iter().enumerate() {
            if Some(mv) == excluded_move {
                continue;
            }

            let is_quiet = mv.captured.is_none() && !mv.is_en_passant && mv.promotion.is_none();

            // 1. Late Move Pruning (LMP): Prune quiet moves beyond threshold at shallow depths in non-PV nodes
            if i > 0 && is_quiet && !in_check && depth <= 4 {
                let lmp_threshold = 3 + depth * depth;
                if searched_quiets.len() > lmp_threshold {
                    continue;
                }
            }

            let mv_u16 = ((mv.from as u16) << 6) | (mv.to as u16);
            let is_tt_move = Some(mv_u16) == tt_move;
            let is_recapture = prev_move.map_or(false, |pm| mv.to == pm.to && mv.captured.is_some());

            // 2. Futility Pruning: Prune quiet moves at low depth if static eval + margin <= alpha
            if i > 0 && is_quiet && !in_check && !is_tt_move && depth <= 3 {
                let futility_margin = depth as i32 * 95 + 30;
                if adjusted_eval + futility_margin <= alpha {
                    self.stats.futility_prunes += 1;
                    continue;
                }
            }

            let mut next_board = board.clone();
            next_board.make_move(mv);
            let gives_check = next_board.is_king_in_check(next_board.side_to_move);

            if is_quiet {
                searched_quiets.push(mv);
            }

            // Singular Extension Probe: Extend search depth by +1 if TT move is singular
            let singular_extension = if self.features.use_singular_ext && is_tt_move && depth >= 6 && ply > 0 && excluded_move.is_none() {
                if let Some(entry) = self.tt.probe(zobrist_key) {
                    let tt_score = score_from_tt(entry.score, ply);
                    if (entry.node_type == NodeType::Exact || entry.node_type == NodeType::Beta) && entry.depth >= (depth as u8).saturating_sub(3) {
                        let singular_margin = (depth as i32) * 3;
                        let singular_beta = tt_score - singular_margin;
                        let singular_depth = (depth - 1) / 2;

                        let singular_score = self.alpha_beta_with_prev(board, singular_depth, ply, singular_beta - 1, singular_beta, prev_move, Some(mv));
                        if singular_score < singular_beta { 1 } else { 0 }
                    } else { 0 }
                } else { 0 }
            } else { 0 };

            let extension = if is_recapture { 1 } else if gives_check && ply < 64 { 1 } else { singular_extension };
            let current_depth = depth + extension;

            // Main Search SEE Pruning: Prune losing captures at non-PV nodes (NEVER PRUNE CHECKS OR PROMOTIONS!)
            if i > 0 && !in_check && !gives_check && mv.promotion.is_none() && (mv.captured.is_some() || mv.is_en_passant) && current_depth <= 4 {
                let see_val = crate::see::see_eval(board, mv);
                if see_val < -(current_depth as i32 * 30) {
                    self.stats.see_prunes += 1;
                    continue;
                }
            }

            let is_killer = ply < 64 && (self.heuristics.killer_moves[ply][0] == Some(mv) || self.heuristics.killer_moves[ply][1] == Some(mv));
            let is_counter = prev_move.map_or(false, |pm| self.heuristics.counter_moves[pm.from as usize][pm.to as usize] == Some(mv));

            // LMR Exemption Criteria: No LMR if in_check, gives_check, TT move, killer move, countermove, or under high king danger (adjusted_eval < -100)
            let can_reduce = self.heuristics.use_lmr
                && current_depth >= 3
                && i >= 2
                && is_quiet
                && !in_check
                && !gives_check
                && !is_tt_move
                && !is_killer
                && !is_counter
                && adjusted_eval >= -100;

            let score = if i == 0 {
                // Full window search for first move (PV candidate)
                -self.alpha_beta_with_prev(&mut next_board, current_depth - 1, ply + 1, -beta, -alpha, Some(mv), None)
            } else if can_reduce {
                // Logarithmic Precomputed Late Move Reduction (LMR)
                self.stats.lmr_searches += 1;
                let base_r = LMR_TABLE[current_depth.min(63) as usize][i.min(63)];
                let hist_score = self.heuristics.history_table[mv.from as usize][mv.to as usize];
                let cont_hist = self.heuristics.get_continuation_history(prev_move, mv);
                let hist_adj = ((hist_score + cont_hist) / 5000).clamp(-2, 3) as i8;
                let r = (base_r as i8 - hist_adj).max(1) as usize;
                let reduced_depth = current_depth.saturating_sub(r).max(1);

                let lmr_score = -self.alpha_beta_with_prev(&mut next_board, reduced_depth, ply + 1, -alpha - 1, -alpha, Some(mv), None);
                if lmr_score > alpha {
                    // LMR failed high: PVS null-window re-search at full depth first
                    let pvs_score = -self.alpha_beta_with_prev(&mut next_board, current_depth - 1, ply + 1, -alpha - 1, -alpha, Some(mv), None);
                    if pvs_score > alpha && pvs_score < beta {
                        // PVS failed high within window: full-window re-search
                        -self.alpha_beta_with_prev(&mut next_board, current_depth - 1, ply + 1, -beta, -alpha, Some(mv), None)
                    } else {
                        pvs_score
                    }
                } else {
                    lmr_score
                }
            } else {
                // Zero window search (PVS)
                let pvs_score = -self.alpha_beta_with_prev(&mut next_board, current_depth - 1, ply + 1, -alpha - 1, -alpha, Some(mv), None);
                if pvs_score > alpha && pvs_score < beta {
                    // Re-search with full window
                    -self.alpha_beta_with_prev(&mut next_board, current_depth - 1, ply + 1, -beta, -alpha, Some(mv), None)
                } else {
                    pvs_score
                }
            };

            if self.aborted {
                return 0;
            }

            if score > best_score {
                best_score = score;
                best_move_found = Some(mv);
            }

            if score > alpha {
                alpha = score;
                node_type = NodeType::Exact;

                if score >= beta {
                    node_type = NodeType::Beta;

                    if is_quiet {
                        if ply < 64 {
                            self.heuristics.killer_moves[ply][1] = self.heuristics.killer_moves[ply][0];
                            self.heuristics.killer_moves[ply][0] = Some(mv);
                        }
                        if self.features.use_countermove_history {
                            if let Some(pm) = prev_move {
                                self.heuristics.counter_moves[pm.from as usize][pm.to as usize] = Some(mv);
                            }
                        }
                        let bonus = (depth * depth) as i32 * 32;
                        self.heuristics.update_continuation_history(prev_move, mv, bonus);
                        for &quiet_mv in &searched_quiets {
                            if quiet_mv != mv {
                                self.heuristics.update_continuation_history(prev_move, quiet_mv, -bonus / 2);
                            }
                        }
                        if self.features.use_history_gravity {
                            self.heuristics.update_history_gravity(mv.from as usize, mv.to as usize, bonus);
                            for quiet_mv in searched_quiets {
                                if quiet_mv != mv {
                                    self.heuristics.update_history_gravity(quiet_mv.from as usize, quiet_mv.to as usize, -bonus / 2);
                                }
                            }
                        } else {
                            self.heuristics.history_table[mv.from as usize][mv.to as usize] += bonus;
                            for quiet_mv in searched_quiets {
                                if quiet_mv != mv {
                                    self.heuristics.history_table[quiet_mv.from as usize][quiet_mv.to as usize] -= bonus / 2;
                                }
                            }
                        }
                    } else if let Some(cap) = mv.captured {
                        let bonus = (depth * depth * 16) as i32;
                        self.heuristics.update_capture_history(mv.piece, cap, mv.to as usize, bonus);
                    }

                    let tt_beta = score_to_tt(beta, ply);
                    self.tt.store(zobrist_key, depth as u8, tt_beta, NodeType::Beta, Some(mv_u16));
                    return beta;
                }
            }
        }

        // Correction History Update: Smooth static evaluation based on search deltas
        if !in_check && best_score.abs() < MATE_SCORE - 100 {
            let delta = (best_score - adjusted_eval).clamp(-400, 400);
            self.heuristics.update_correction(board.side_to_move, pawn_hash, delta);
            self.heuristics.update_non_pawn_correction(board.side_to_move, non_pawn_hash, delta);
        }

        if !self.aborted {
            let best_mv_u16 = best_move_found.map(|m| ((m.from as u16) << 6) | (m.to as u16));
            let tt_best_score = score_to_tt(best_score, ply);
            self.tt.store(zobrist_key, depth as u8, tt_best_score, node_type, best_mv_u16);
        }
        best_score
    }

    fn score_move_mvv_lva(&self, _board: &Board, mv: Move) -> i32 {
        if let Some(cap) = mv.captured {
            let victim_val = match cap {
                PieceType::Pawn => 100,
                PieceType::Knight => 320,
                PieceType::Bishop => 330,
                PieceType::Rook => 500,
                PieceType::Queen => 900,
                PieceType::King => 20000,
            };
            let attacker_val = match mv.piece {
                PieceType::Pawn => 100,
                PieceType::Knight => 320,
                PieceType::Bishop => 330,
                PieceType::Rook => 500,
                PieceType::Queen => 900,
                PieceType::King => 20000,
            };
            10000 + victim_val * 10 - attacker_val
        } else {
            0
        }
    }
}