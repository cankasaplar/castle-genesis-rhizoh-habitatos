use std::sync::{Arc, LazyLock};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::thread;
use crate::board::Board;
use crate::eval::Evaluator;
use crate::time_mgr::TimeLimits;
use crate::tt::{NodeType, TranspositionTable};
use crate::types::{CandidateMove, Color, Move, PieceType, SearchFeatures, SearchHeuristics, LmrMode};
use crate::magic::get_knight_attacks;

static LMR_TABLE: LazyLock<[[usize; 64]; 64]> = LazyLock::new(|| {
    // Conservative LMR: retain more depth for late moves with tactical potential.
    let mut table = [[0usize; 64]; 64];
    for d in 1..64 {
        for m in 1..64 {
            let r = 0.70 + (d as f64).ln() * (m as f64).ln() / 2.5;
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
    pub singular_extensions: u64,
    pub singular_probes: u64,
    pub ksc_root: bool,
    pub ksc_nodes: u64,
    pub ksc_actual_pruned: u64,
    pub ksc_shadow_protected: u64,
    pub ksc_actual_not_pruned: u64,
    pub zcb_nodes: u64,
    pub c3_guard_triggers: u64,
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
    pub game_history: Vec<u64>,
    pub search_stack: Vec<u64>,
}

#[inline(always)]
pub fn is_regime_a_locked_tension(board: &Board) -> bool {
    let w_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
    let b_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];

    const CENTER_FILES_MASK: u64 = 0x3C3C3C3C3C3C3C3Cu64;
    let center_pawns = (w_pawns | b_pawns) & CENTER_FILES_MASK;
    let total_center = center_pawns.count_ones();

    // Regime C (Open): if central pawn mass is depleted (<= 3 pawns on C, D, E, F)
    if total_center <= 3 {
        return false;
    }

    // Locked pawn pairs in extended center (White pawn on sq, Black pawn on sq + 8)
    let locked_center_pairs = ((w_pawns & (b_pawns >> 8)) & CENTER_FILES_MASK).count_ones();

    // Blocked pawns (pawns whose forward square is occupied by any piece)
    let w_blocked = (w_pawns & (board.combined_occupancy >> 8)).count_ones();
    let b_blocked = (b_pawns & (board.combined_occupancy << 8)).count_ones();
    let total_blocked = w_blocked + b_blocked;

    // Direct mutual pawn tension in the center
    let direct_tension = {
        let left = (w_pawns & !0x0101010101010101u64) << 7;
        let right = (w_pawns & !0x8080808080808080u64) << 9;
        ((left | right) & b_pawns & CENTER_FILES_MASK).count_ones()
    };

    // Levers / pawn breaks available for the side to move
    let color = board.side_to_move;
    let my_pawns = board.pieces[color as usize][PieceType::Pawn as usize];
    let opp_pawns = board.pieces[color.opposite() as usize][PieceType::Pawn as usize];

    let break_captures = match color {
        Color::White => {
            let left = (my_pawns & !0x0101010101010101u64) << 7;
            let right = (my_pawns & !0x8080808080808080u64) << 9;
            ((left | right) & opp_pawns & CENTER_FILES_MASK).count_ones()
        }
        Color::Black => {
            let left = (my_pawns & !0x8080808080808080u64) >> 7;
            let right = (my_pawns & !0x0101010101010101u64) >> 9;
            ((left | right) & opp_pawns & CENTER_FILES_MASK).count_ones()
        }
    };

    let empty = !board.combined_occupancy;
    let single_pushes = match color {
        Color::White => (my_pawns << 8) & empty & CENTER_FILES_MASK,
        Color::Black => (my_pawns >> 8) & empty & CENTER_FILES_MASK,
    };
    let push_attacks = match color {
        Color::White => {
            let left = (single_pushes & !0x0101010101010101u64) << 7;
            let right = (single_pushes & !0x8080808080808080u64) << 9;
            ((left | right) & opp_pawns).count_ones()
        }
        Color::Black => {
            let left = (single_pushes & !0x8080808080808080u64) >> 7;
            let right = (single_pushes & !0x0101010101010101u64) >> 9;
            ((left | right) & opp_pawns).count_ones()
        }
    };

    let available_breaks = break_captures + (if push_attacks != 0 { 1 } else { 0 });

    // Regime A: high central mass (>=4), structure present (locked pairs >= 1 or blocked >= 3 or direct tension >= 1 or break >= 1)
    // AND break availability is low (available_breaks <= 1)
    if (locked_center_pairs >= 1 || total_blocked >= 3 || direct_tension >= 1 || available_breaks >= 1) && available_breaks <= 1 {
        return true;
    }

    false
}

pub fn is_king_safe_in_locked_center(board: &Board, color: Color) -> bool {
    let k_bb = board.pieces[color as usize][PieceType::King as usize];
    if k_bb == 0 { return false; }
    let k_sq = k_bb.trailing_zeros() as u8;
    let k_file = k_sq % 8;
    let k_rank = k_sq / 8;

    let is_central_king = match color {
        Color::White => (k_rank <= 1) && (k_file >= 2 && k_file <= 4),
        Color::Black => (k_rank >= 6) && (k_file >= 2 && k_file <= 4),
    };
    if !is_central_king {
        return false;
    }

    let w_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
    let b_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];
    const CENTER_FILES_MASK: u64 = 0x3C3C3C3C3C3C3C3Cu64;
    let locked_pawns = (w_pawns & (b_pawns >> 8)) & CENTER_FILES_MASK;
    if locked_pawns == 0 {
        return false;
    }

    let min_f = if k_file == 0 { 0 } else { k_file - 1 };
    let max_f = if k_file == 7 { 7 } else { k_file + 1 };
    let opp_color = match color { Color::White => Color::Black, Color::Black => Color::White };
    let opp_pawns = board.pieces[opp_color as usize][PieceType::Pawn as usize];

    for f in min_f..=max_f {
        let file_mask = 0x0101010101010101u64 << f;
        if (opp_pawns & file_mask) == 0 {
            return false;
        }
    }
    true
}

#[inline(always)]
pub fn has_zero_central_breaks(board: &Board, color: Color) -> bool {
    let w_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
    let b_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];
    const CENTER_FILES_MASK: u64 = 0x3C3C3C3C3C3C3C3Cu64;
    let locked_pawns = (w_pawns & (b_pawns >> 8)) & CENTER_FILES_MASK;
    if locked_pawns == 0 {
        return false;
    }

    // Check if side has pawn moves in central files
    let my_pawns = board.pieces[color as usize][PieceType::Pawn as usize] & CENTER_FILES_MASK;
    if my_pawns == 0 {
        return true;
    }

    // Single step push into empty square
    let empty = !board.combined_occupancy;
    let single_push = match color {
        Color::White => (my_pawns << 8) & empty & CENTER_FILES_MASK,
        Color::Black => (my_pawns >> 8) & empty & CENTER_FILES_MASK,
    };
    if single_push == 0 {
        return true;
    }
    false
}

fn has_non_pawn_material(board: &Board, color: Color) -> bool {
    let c_idx = color as usize;
    (board.pieces[c_idx][PieceType::Knight as usize]
        | board.pieces[c_idx][PieceType::Bishop as usize]
        | board.pieces[c_idx][PieceType::Rook as usize]
        | board.pieces[c_idx][PieceType::Queen as usize])
        != 0
}

#[inline]
fn can_reduce_root_move(
    board: &Board,
    next_board: &Board,
    mv: Move,
    depth: u8,
    move_index: usize,
    use_lmr: bool,
    mode: LmrMode,
) -> bool {
    if !use_lmr || depth < 3 || move_index < 2 {
        return false;
    }
    if mv.captured.is_some() || mv.is_en_passant || mv.promotion.is_some() {
        return false;
    }
    if board.is_king_in_check(board.side_to_move) || next_board.is_king_in_check(next_board.side_to_move) {
        return false;
    }
    match mode {
        LmrMode::Baseline => true,
        LmrMode::Conservative => crate::see::see_eval(board, mv) < 0,
        LmrMode::TacticalGuard => crate::see::see_eval(board, mv) < 0,
    }
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
            game_history: Vec::new(),
            search_stack: Vec::with_capacity(128),
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

    pub fn set_game_history(&mut self, history: Vec<u64>) {
        self.game_history = history;
    }

    pub fn clear_game_history(&mut self) {
        self.game_history.clear();
        self.search_stack.clear();
    }

    #[inline(always)]
    pub fn is_repetition(&self, zobrist_key: u64, ply: usize, halfmove_clock: u8) -> bool {
        if halfmove_clock < 2 || self.game_history.len() <= 1 {
            return false;
        }

        let max_dist = halfmove_clock as usize;

        // 1. Search stack (ancestor positions on the current search path)
        // In chess, a position cannot repeat in fewer than 4 plies (2 full moves).
        let stack_len = self.search_stack.len();
        if stack_len >= 4 && max_dist >= 4 {
            let mut d = 4;
            while d <= ply && d <= max_dist && d <= stack_len {
                if self.search_stack[stack_len - d] == zobrist_key {
                    return true;
                }
                d += 2;
            }
        }

        // 2. Game history (positions played in the game prior to search root)
        if !self.game_history.is_empty() && max_dist >= 2 {
            let hist_len = self.game_history.len();
            for k in (0..hist_len).rev() {
                let dist_before_root = hist_len - 1 - k;
                let total_dist = ply + dist_before_root;
                if total_dist > max_dist {
                    break;
                }
                if total_dist >= 2 && total_dist % 2 == 0 {
                    if self.game_history[k] == zobrist_key {
                        return true;
                    }
                }
            }
        }

        false
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
        if self.features.use_c2_shadow_probe {
            self.stats.ksc_root = is_king_safe_in_locked_center(board, board.side_to_move);
        }
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

            let history_clone = self.game_history.clone();
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
                    game_history: history_clone,
                    search_stack: Vec::with_capacity(128),
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

        // Syzygy Endgame Tablebase Root Probe (DTZ-Optimal):
        let probe_limit = self.features.syzygy_probe_limit as usize;
        if probe_limit >= 3 && board.combined_occupancy.count_ones() <= probe_limit as u32 {
            if let Some((tb_move, tb_score)) = crate::syzygy::SyzygyProber::probe_root(board, &legal_moves, probe_limit) {
                let score_str = if tb_score > MATE_SCORE - 1000 {
                    let mate_in_moves = (MATE_SCORE - tb_score + 1) / 2;
                    format!("mate {}", mate_in_moves)
                } else if tb_score < -MATE_SCORE + 1000 {
                    let mate_in_moves = (MATE_SCORE + tb_score + 1) / 2;
                    format!("mate -{}", mate_in_moves)
                } else {
                    format!("cp {}", tb_score)
                };
                println!("info depth 64 score {} nodes 1 tbhits 1 pv {}", score_str, tb_move.to_uci());
                use std::io::Write;
                let _ = std::io::stdout().flush();

                candidates.push(CandidateMove {
                    mv: tb_move,
                    score: tb_score,
                    depth: 64,
                    pv: vec![tb_move],
                });
                return candidates;
            }
        }

        if self.features.use_nnue && board.accumulator.is_none() {
            let nnue = crate::nnue::get_global_nnue();
            if nnue.is_enabled() {
                board.accumulator = Some(nnue.compute_accumulator(board));
            }
        }

        let mut move_scores: Vec<(Move, i32)> = Vec::new();
        self.search_stack.clear();

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
            let tt_move = raw_tt_move.filter(|&m_u16| legal_moves.iter().any(|m| ((m.from as u16) << 6 | m.to as u16) == m_u16));

            // Order root moves
            self.order_moves(board, &mut searched_moves, 0, tt_move, None);

            // Prioritize previous iteration best move at root
            if let Some((best_mv, _)) = prev_best_at_root {
                if let Some(pos) = searched_moves.iter().position(|&m| m == best_mv) {
                    searched_moves.swap(0, pos);
                }
            }

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
                            if limits.is_hard_limit_exceeded() {
                                self.aborted = true;
                                break;
                            }
                        }
                    }

                    let mut next_board = board.clone();
                    next_board.make_move(mv);

                    let can_reduce_root = can_reduce_root_move(
                        board,
                        &next_board,
                        mv,
                        current_depth,
                        i,
                        self.heuristics.use_lmr,
                        self.features.lmr_mode,
                    );

                    let root_key = board.get_zobrist_key();
                    self.search_stack.push(root_key);

                    let mut score = if i == 0 {
                        // Principal Variation (PV) move: full window
                        -self.alpha_beta(&mut next_board, (current_depth as usize).saturating_sub(1), 1, -beta, -search_alpha)
                    } else if can_reduce_root {
                        // Root Late Move Reduction (Root LMR)
                        let base_r = LMR_TABLE[current_depth.min(63) as usize][i.min(63)];
                        let mut r = base_r;
                        if self.features.use_c3_lmr_horizon_guard {
                            let is_pawn_move = mv.piece == PieceType::Pawn;
                            let opp_king_bb = board.pieces[board.side_to_move.opposite() as usize][PieceType::King as usize];
                            let is_king_zone = opp_king_bb != 0 && {
                                let opp_king_sq = opp_king_bb.trailing_zeros() as u8;
                                (crate::magic::get_king_attacks(opp_king_sq) & (1u64 << mv.to)) != 0
                            };
                            if search_alpha.abs() >= 80 && (is_pawn_move || is_king_zone) {
                                r = r.saturating_sub(1).max(1);
                                self.stats.c3_guard_triggers += 1;
                            }
                        } else if self.features.use_c3_regime_gated_guard {
                            let is_pawn_move = mv.piece == PieceType::Pawn;
                            let opp_king_bb = board.pieces[board.side_to_move.opposite() as usize][PieceType::King as usize];
                            let is_king_zone = opp_king_bb != 0 && {
                                let opp_king_sq = opp_king_bb.trailing_zeros() as u8;
                                (crate::magic::get_king_attacks(opp_king_sq) & (1u64 << mv.to)) != 0
                            };
                            if search_alpha.abs() >= 80 && (is_pawn_move || is_king_zone) && is_regime_a_locked_tension(board) {
                                r = r.saturating_sub(1).max(1);
                                self.stats.c3_guard_triggers += 1;
                            }
                        }
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

                    self.search_stack.pop();



                    // Root Move Inertia Stabilizer: Apply small stability hysteresis bonus (+6cp) to previous PV move
                    if let Some((prev_mv, _)) = prev_best_at_root {
                        if mv == prev_mv && current_depth >= 6 {
                            score += 6;
                        }
                    }

                    // Threefold Repetition Awareness Penalty:
                    // If a root move repeats a position from the actual game history,
                    // evaluate repetition as a draw (0cp) when winning, so the engine never perpetually repeats checks when ahead!
                    if self.game_history.len() > 1 && next_board.halfmove_clock >= 2 {
                        let next_key = next_board.get_zobrist_key();
                        let hist_len = self.game_history.len();
                        for k in (0..hist_len).rev() {
                            let dist = hist_len - 1 - k + 1; // +1 for the root move
                            if dist > next_board.halfmove_clock as usize {
                                break;
                            }
                            if dist >= 2 && dist % 2 == 0 {
                                if self.game_history[k] == next_key {
                                    if score > 0 {
                                        score = 0; // Evaluate repetition as draw (0cp)
                                    }
                                    break;
                                }
                            }
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
                    let best_u16 = ((best_mv.from as u16) << 6) | (best_mv.to as u16);
                    let tt_score = score_to_tt(best_score, 0);
                    self.tt.store(zobrist_key, current_depth as u8, tt_score, NodeType::Exact, Some(best_u16));

                    // Dynamic Time Management: Extend search time on root move instability, score collapse, or tactical moves
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
                    if current_depth >= 4 && (best_mv.captured.is_some() || board.is_king_in_check(board.side_to_move)) {
                        if let Some(ref mut limits) = self.time_limits {
                            limits.extend_time_for_panic(1.2);
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
                    if self.shared_abort.is_none() {
                        println!(
                            "info depth {} score {} nodes {} nps {} time {} hashfull {} pv {}",
                            current_depth, score_str, self.nodes, nps, elapsed_ms, hashfull, final_pv
                        );
                        if self.features.use_c2_shadow_probe {
                            println!(
                                "info string C2_SHADOW ksc_root {} ksc_nodes {} ksc_actual_pruned {} ksc_shadow_protected {} ksc_actual_not_pruned {} zcb_nodes {}",
                                self.stats.ksc_root, self.stats.ksc_nodes, self.stats.ksc_actual_pruned,
                                self.stats.ksc_shadow_protected, self.stats.ksc_nodes.saturating_sub(self.stats.ksc_actual_pruned),
                                self.stats.zcb_nodes
                            );
                        }
                        use std::io::Write;
                        let _ = std::io::stdout().flush();
                    }
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

            let mut struct_cap_bonus = 0;
            if self.features.use_structural_search_bridge {
                let (c, s) = self.classify_structural_move(board, mv);
                if c == "TENSION_CAPTURE" {
                    struct_cap_bonus = s;
                }
            }

            if self.features.use_see_ordering {
                let see_val = crate::see::see_eval(board, mv);
                if see_val >= 0 {
                    // Winning or equal capture: top priority above quiet moves
                    return 1_000_000_000 + mvv_lva + cap_hist + struct_cap_bonus;
                } else {
                    // Losing capture: demoted below quiet moves, but preserved with negative offset
                    return -500_000 + see_val;
                }
            } else {
                return 1_000_000_000 + mvv_lva + cap_hist;
            }
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
                if k0 == mv {
                    return 800_000;
                }
            }
            if let Some(k1) = self.heuristics.killer_moves[ply][1] {
                if k1 == mv {
                    return 700_000;
                }
            }
        }

        // Countermove Heuristic
        if self.features.use_countermove_history {
            if let Some(pm) = prev_move {
                if let Some(cm) = self.heuristics.counter_moves[pm.from as usize][pm.to as usize] {
                    if cm == mv {
                        return 650_000;
                    }
                }
            }
        }

        let is_quiet = mv.captured.is_none() && !mv.is_en_passant && mv.promotion.is_none();
        if is_quiet {
            let enemy_color = board.side_to_move.opposite();
            let enemy_king_bb = board.pieces[enemy_color as usize][PieceType::King as usize];
            if enemy_king_bb != 0 {
                let k_sq = enemy_king_bb.trailing_zeros() as u8;
                let clear_slider_ray = |from: u8, to: u8, target: u8| {
                    let target_rank = target as i8 / 8;
                    let target_file = target as i8 % 8;
                    let to_rank = to as i8 / 8;
                    let to_file = to as i8 % 8;
                    let rank_delta = target_rank - to_rank;
                    let file_delta = target_file - to_file;
                    let mut rank = to_rank + rank_delta.signum();
                    let mut file = to_file + file_delta.signum();

                    while rank != target_rank || file != target_file {
                        let square = (rank * 8 + file) as u8;
                        if square != from && board.combined_occupancy & (1u64 << square) != 0 {
                            return false;
                        }
                        rank += rank_delta.signum();
                        file += file_delta.signum();
                    }
                    true
                };
                let gives_check = match mv.piece {
                    PieceType::Knight => (get_knight_attacks(k_sq) & (1u64 << mv.to)) != 0,
                    PieceType::Pawn => {
                        let att = if board.side_to_move == Color::White {
                            ((1u64 << mv.to) << 7 & !0x8080808080808080) | ((1u64 << mv.to) << 9 & !0x0101010101010101)
                        } else {
                            ((1u64 << mv.to) >> 7 & !0x0101010101010101) | ((1u64 << mv.to) >> 9 & !0x8080808080808080)
                        };
                        (att & enemy_king_bb) != 0
                    }
                    PieceType::Bishop => {
                        let k_rank = k_sq as i8 / 8;
                        let k_file = k_sq as i8 % 8;
                        let to_rank = mv.to as i8 / 8;
                        let to_file = mv.to as i8 % 8;
                        let aligned = (k_rank - to_rank).abs() == (k_file - to_file).abs();
                        aligned && clear_slider_ray(mv.from, mv.to, k_sq)
                    }
                    PieceType::Rook => {
                        let k_rank = k_sq / 8;
                        let k_file = k_sq % 8;
                        let to_rank = mv.to / 8;
                        let to_file = mv.to % 8;
                        (k_rank == to_rank || k_file == to_file)
                            && clear_slider_ray(mv.from, mv.to, k_sq)
                    }
                    PieceType::Queen => {
                        let k_rank = k_sq as i8 / 8;
                        let k_file = k_sq as i8 % 8;
                        let to_rank = mv.to as i8 / 8;
                        let to_file = mv.to as i8 % 8;
                        let aligned = k_rank == to_rank
                            || k_file == to_file
                            || (k_rank - to_rank).abs() == (k_file - to_file).abs();
                        aligned && clear_slider_ray(mv.from, mv.to, k_sq)
                    }
                    PieceType::King => false,
                };
                if gives_check {
                    return 620_000;
                }
            }

            // Penalty for quiet non-pawn moves that step into enemy pawn attacks without capture
            if mv.piece != PieceType::Pawn {
                let enemy_pawns = board.pieces[enemy_color as usize][PieceType::Pawn as usize];
                let pawn_att = if enemy_color == Color::White {
                    ((enemy_pawns << 7) & !0x8080808080808080) | ((enemy_pawns << 9) & !0x0101010101010101)
                } else {
                    ((enemy_pawns >> 7) & !0x0101010101010101) | ((enemy_pawns >> 9) & !0x8080808080808080)
                };
                if (pawn_att & (1u64 << mv.to)) != 0 {
                    return -200_000;
                }
                // Evasion priority: piece is currently attacked by enemy pawn and retreats to a safe square
                if (pawn_att & (1u64 << mv.from)) != 0 {
                    return 550_000;
                }
            } else {
                // Opening anti-blunder: prevent suicidal uncastled early f-pawn pushes
                if self.features.use_opening_antiblunder && board.fullmove_number <= 8 {
                    if board.side_to_move == Color::Black && mv.from == 53 && (mv.to == 37 || mv.to == 45) {
                        let k_bb = board.pieces[Color::Black as usize][PieceType::King as usize];
                        if k_bb != 0 && (k_bb.trailing_zeros() as u8) == 60 {
                            return -800_000;
                        }
                    } else if board.side_to_move == Color::White && mv.from == 13 && (mv.to == 29 || mv.to == 21) {
                        let k_bb = board.pieces[Color::White as usize][PieceType::King as usize];
                        if k_bb != 0 && (k_bb.trailing_zeros() as u8) == 4 {
                            return -800_000;
                        }
                    }
                }

                // Central Pawn Push Bonus (d4, e4, d5, e5) - Experimental Heuristic (Default: False)
                if self.features.use_central_pawn_bonus && (mv.to == 27 || mv.to == 28 || mv.to == 35 || mv.to == 36) {
                    return 50_000;
                }
            }

            // Candidate 2: Structural Priority (Structural Search Bridge)
            // Sits between checks/countermoves/killers (620k-800k) and normal quiet history (max 32k)
            if self.features.use_structural_search_bridge {
                let (_s_class, s_score) = self.classify_structural_move(board, mv);
                if s_score > 0 {
                    return 500_000 + s_score;
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
    pub fn quiescence(&mut self, board: &mut Board, ply: usize, qply: usize, mut alpha: i32, beta: i32) -> i32 {
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

        // Standing Pat (only if not in check; in check we must resolve the check)
        let stand_pat = if in_check {
            -MATE_SCORE + ply as i32
        } else {
            let sp = Evaluator::evaluate(board, &self.features);
            if sp >= beta {
                return beta;
            }
            if sp > alpha {
                alpha = sp;
            }
            sp
        };

        // Generate legal moves: fast capture-only generation when not in check, full generation only when in check
        let captures: Vec<Move> = if in_check {
            board.generate_moves()
        } else {
            board.generate_captures()
        };

        if captures.is_empty() {
            if in_check {
                return -MATE_SCORE + ply as i32;
            }
            return alpha;
        }

        // Sort captures by MVV-LVA
        let mut sorted_captures = captures;
        sorted_captures.sort_by_key(|mv| -self.score_qsearch_move(board, *mv));

        let orig_alpha = alpha;
        for mv in sorted_captures {
            let captured_val = match mv.captured {
                Some(p) => crate::see::get_piece_value(p),
                None => if mv.is_en_passant { 100 } else { 0 },
            };

            // 1. Delta Pruning: If even capturing piece (+ margin) cannot raise alpha, prune capture
            if !in_check && mv.promotion.is_none() {
                if stand_pat + captured_val + 800 < alpha {
                    self.stats.delta_prunes += 1;
                    continue;
                }
            }

            // 2. SEE Pruning: Skip losing capture sequences in quiescence (SEE < 0)
            if !in_check && mv.promotion.is_none() && (mv.captured.is_some() || mv.is_en_passant) {
                if crate::see::see_eval(board, mv) < -150 {
                    self.stats.see_prunes += 1;
                    continue;
                }
            }

            let mut next_board = board.clone();
            next_board.make_move(mv);
            let score = -self.quiescence(&mut next_board, ply + 1, qply + 1, -beta, -alpha);

            if self.aborted {
                return 0;
            }

            if score >= beta {
                if !self.aborted {
                    let tt_score = score_to_tt(beta, ply);
                    self.tt.store(zobrist_key, 0, tt_score, NodeType::Beta, None);
                }
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

        // Syzygy Endgame Tablebase Probing (Exact WDL cutoff)
        let probe_limit = self.features.syzygy_probe_limit as usize;
        if excluded_move.is_none() && ply > 0 && probe_limit >= 3 && board.combined_occupancy.count_ones() <= probe_limit as u32 {
            if let Some(tb_score) = crate::syzygy::SyzygyProber::probe_wdl(board, ply, probe_limit) {
                return tb_score;
            }
        }

        let zobrist_key = board.get_zobrist_key();

        // 50-move rule and repetition detection
        if ply > 0 && board.halfmove_clock >= 2 {
            if board.halfmove_clock >= 100 || self.is_repetition(zobrist_key, ply, board.halfmove_clock) {
                return 0;
            }
        }

        let mut tt_move = None;

        self.stats.tt_probes += 1;
        if let Some(entry) = self.tt.probe(zobrist_key) {
            if let Some(m_u16) = entry.best_move {
                if excluded_move.map_or(true, |mv| ((mv.from as u16) << 6 | mv.to as u16) != m_u16) {
                    tt_move = Some(m_u16);
                }
            }
            if excluded_move.is_none() && entry.depth >= depth as u8 {
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
            return self.quiescence(board, ply, 0, alpha, beta);
        }
        
        // Internal Iterative Reduction (IIR): Reduce depth by 1 if no TT move available at non-PV node
        let depth = if tt_move.is_none() && depth >= 6 && !in_check {
            depth - 1
        } else {
            depth
        };

        let (_static_eval, adjusted_eval) = if in_check {
            (0, 0)
        } else {
            let se = Evaluator::evaluate(board, &self.features);
            let pawn_hash = board.pieces[board.side_to_move as usize][PieceType::Pawn as usize];
            let non_pawn_hash = board.color_occupancy[board.side_to_move as usize] ^ pawn_hash;
            let p_corr = self.heuristics.get_correction(board.side_to_move, pawn_hash);
            let np_corr = self.heuristics.get_non_pawn_correction(board.side_to_move, non_pawn_hash);
            (se, se + p_corr + np_corr)
        };

        let (is_ksc_node, _is_zcb_node) = if self.features.use_c2_shadow_probe && !in_check {
            let ksc = is_king_safe_in_locked_center(board, board.side_to_move);
            let zcb = has_zero_central_breaks(board, board.side_to_move);
            if ksc { self.stats.ksc_nodes += 1; }
            if zcb { self.stats.zcb_nodes += 1; }
            (ksc, zcb)
        } else {
            (false, false)
        };

        // Razoring: At shallow depths, if static eval is far below alpha, drop to quiescence
        if !in_check && ply > 0 && depth <= 3 && alpha.abs() < MATE_SCORE - 1000 {
            let razor_margin = RAZORING_MARGIN[depth];
            if adjusted_eval + razor_margin <= alpha {
                if depth <= 1 {
                    return self.quiescence(board, ply, 0, alpha, beta);
                }
                let qs_score = self.quiescence(board, ply, 0, alpha, beta);
                if qs_score <= alpha {
                    if is_ksc_node {
                        self.stats.ksc_actual_pruned += 1;
                        if adjusted_eval < -50 { self.stats.ksc_shadow_protected += 1; }
                    }
                    return qs_score;
                }
            }
        }

        // 1. Reverse Futility Pruning (RFP / Static Null Move Pruning)
        if depth <= 6 && !in_check && ply > 0 && beta.abs() < MATE_SCORE - 1000 {
            let rfp_margin = depth as i32 * 90;
            if adjusted_eval - rfp_margin >= beta {
                if is_ksc_node {
                    self.stats.ksc_actual_pruned += 1;
                }
                return adjusted_eval;
            }
        }

        let mut cached_moves: Option<Vec<Move>> = None;

        // 2. Multi-ProbCut (ProbCut): Shallow high-beta pruning
        // Margin reduced to 150cp (was 200cp) to avoid false cutoffs
        if depth >= 5 && !in_check && ply > 0 && beta.abs() < MATE_SCORE - 1000 && adjusted_eval >= beta + 80 {
            let probcut_beta = (beta + 150).min(MATE_SCORE - 1000);
            let probcut_depth = depth.saturating_sub(4).max(1);
            // Only try ProbCut on captures (avoid expensive quiet searches)
            let moves_ref = cached_moves.get_or_insert_with(|| board.generate_moves());
            let pc_captures: Vec<_> = moves_ref.iter().filter(|m| {
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
            let moves_ref = cached_moves.get_or_insert_with(|| board.generate_moves());
            let mut mc_sorted = moves_ref.clone();
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

        let mut moves = cached_moves.unwrap_or_else(|| board.generate_moves());
        if let Some(excluded) = excluded_move {
            moves.retain(|mv| *mv != excluded);
        }

        if moves.is_empty() {
            if excluded_move.is_some() {
                return beta;
            }
            if in_check {
                return -MATE_SCORE + ply as i32;
            } else {
                return 0; // Stalemate
            }
        }

        let mut sorted_moves = moves;
        self.order_moves(board, &mut sorted_moves, ply, tt_move, prev_move);
        let has_singular_alternatives = sorted_moves.len() > 1;

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

            // 2. Futility Pruning: Prune quiet moves at low depth if static eval + margin <= alpha
            if i > 0 && is_quiet && !in_check && !is_tt_move && depth <= 3 {
                let futility_margin = depth as i32 * 95 + 30;
                if adjusted_eval + futility_margin <= alpha {
                    self.stats.futility_prunes += 1;
                    if is_ksc_node {
                        self.stats.ksc_actual_pruned += 1;
                        if adjusted_eval < -50 { self.stats.ksc_shadow_protected += 1; }
                    }
                    continue;
                }
            }

            let mut next_board = board.clone();
            next_board.make_move(mv);
            let gives_check = next_board.is_king_in_check(next_board.side_to_move);

            if is_quiet {
                searched_quiets.push(mv);
            }

            // Verify the TT move against a same-position search that excludes it.
            let singular_probe_eligible = self.features.use_singular_ext
                && is_tt_move
                && depth >= 6
                && ply > 0
                && excluded_move.is_none()
                && beta - alpha == 1;
            if singular_probe_eligible {
                self.stats.singular_probes += 1;
            }
            let singular_extension = if singular_probe_eligible {
                if let Some(entry) = self.tt.probe(zobrist_key) {
                    let tt_score = score_from_tt(entry.score, ply);
                    if (entry.node_type == NodeType::Exact || entry.node_type == NodeType::Beta)
                        && entry.depth >= (depth as u8).saturating_sub(3)
                        && has_singular_alternatives
                    {
                        let singular_margin = (depth as i32) * 3;
                        let singular_beta = tt_score - singular_margin;
                        let singular_depth = (depth - 1) / 2;

                        let singular_score = self.alpha_beta_with_prev(board, singular_depth, ply, singular_beta - 1, singular_beta, prev_move, Some(mv));
                        if !self.aborted && singular_score < singular_beta {
                            if singular_score < singular_beta - 60 && depth >= 8 {
                                2
                            } else {
                                1
                            }
                        } else { 0 }
                    } else { 0 }
                } else { 0 }
            } else { 0 };

            if singular_extension > 0 {
                self.stats.singular_extensions += 1;
            }
            let extension = singular_extension;
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
            let mut can_reduce = self.heuristics.use_lmr
                && current_depth >= 3
                && i >= 2
                && is_quiet
                && !in_check
                && !gives_check
                && !is_tt_move
                && !is_killer
                && !is_counter
                && adjusted_eval >= -100;

            if can_reduce && self.features.lmr_mode == LmrMode::TacticalGuard {
                let see_val = crate::see::see_eval(board, mv);
                let hist_score = self.heuristics.history_table[mv.from as usize][mv.to as usize];
                let cont_hist = self.heuristics.get_continuation_history(prev_move, mv);
                let is_tactical_candidate = gives_check
                    || is_killer
                    || is_counter
                    || (see_val >= 0 && (hist_score + cont_hist > 15_000 || adjusted_eval >= alpha));
                if is_tactical_candidate && i < 3 {
                    can_reduce = false;
                }
            }

            self.search_stack.push(zobrist_key);

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
                let mut r = (base_r as i8 - hist_adj).max(1) as usize;

                if self.features.lmr_mode == LmrMode::Conservative {
                    let see_val = crate::see::see_eval(board, mv);
                    if see_val >= 0 && adjusted_eval >= alpha - 50 {
                        r = (r.saturating_sub(1)).max(1);
                    }
                } else if self.features.lmr_mode == LmrMode::TacticalGuard {
                    r = 1; // Tactical candidates reaching here receive minimal LMR
                }

                if self.features.use_c3_lmr_horizon_guard {
                    let is_pawn_move = mv.piece == PieceType::Pawn;
                    let opp_king_bb = board.pieces[board.side_to_move.opposite() as usize][PieceType::King as usize];
                    let is_king_zone = opp_king_bb != 0 && {
                        let opp_king_sq = opp_king_bb.trailing_zeros() as u8;
                        (crate::magic::get_king_attacks(opp_king_sq) & (1u64 << mv.to)) != 0
                    };
                    if adjusted_eval.abs() >= 80 && (is_pawn_move || is_king_zone) {
                        r = r.saturating_sub(1).max(1);
                        self.stats.c3_guard_triggers += 1;
                    }
                } else if self.features.use_c3_regime_gated_guard {
                    let is_pawn_move = mv.piece == PieceType::Pawn;
                    let opp_king_bb = board.pieces[board.side_to_move.opposite() as usize][PieceType::King as usize];
                    let is_king_zone = opp_king_bb != 0 && {
                        let opp_king_sq = opp_king_bb.trailing_zeros() as u8;
                        (crate::magic::get_king_attacks(opp_king_sq) & (1u64 << mv.to)) != 0
                    };
                    if adjusted_eval.abs() >= 80 && (is_pawn_move || is_king_zone) && is_regime_a_locked_tension(board) {
                        r = r.saturating_sub(1).max(1);
                        self.stats.c3_guard_triggers += 1;
                    }
                }

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

            self.search_stack.pop();

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
                    if !self.aborted && excluded_move.is_none() {
                        self.tt.store(zobrist_key, depth as u8, tt_beta, NodeType::Beta, Some(mv_u16));
                    }
                    return beta;
                }
            }
        }

        // Correction History Update: Smooth static evaluation based on search deltas
        if !in_check && best_score.abs() < MATE_SCORE - 100 {
            let pawn_hash = board.pieces[board.side_to_move as usize][PieceType::Pawn as usize];
            let non_pawn_hash = board.color_occupancy[board.side_to_move as usize] ^ pawn_hash;
            let delta = (best_score - adjusted_eval).clamp(-400, 400);
            self.heuristics.update_correction(board.side_to_move, pawn_hash, delta);
            self.heuristics.update_non_pawn_correction(board.side_to_move, non_pawn_hash, delta);
        }

        if !self.aborted && excluded_move.is_none() {
            let best_mv_u16 = best_move_found.map(|m| ((m.from as u16) << 6) | (m.to as u16));
            let tt_best_score = score_to_tt(best_score, ply);
            self.tt.store(zobrist_key, depth as u8, tt_best_score, node_type, best_mv_u16);
        }
        best_score
    }

    /// E4-B: Selective Quiet Check Evaluation
    /// Evaluates if a quiet check at qply==0 possesses sufficient tactical urgency,
    /// safe escape geometry, and non-losing SEE context.
    pub fn is_promising_quiet_check(&self, board: &Board, mv: Move) -> bool {
        let opp_color = board.side_to_move.opposite();
        let enemy_king_bb = board.pieces[opp_color as usize][PieceType::King as usize];
        if enemy_king_bb == 0 { return false; }
        let k_sq = enemy_king_bb.trailing_zeros() as u8;

        // 1. King Distance & Geometry Filter (fast O(1) early reject before raytracing)
        let k_rank = (k_sq / 8) as i8;
        let k_file = (k_sq % 8) as i8;
        let to_rank = (mv.to / 8) as i8;
        let to_file = (mv.to % 8) as i8;
        let dist = (k_rank - to_rank).abs().max((k_file - to_file).abs());

        let is_edge_king = k_rank == 0 || k_rank == 7 || k_file == 0 || k_file == 7;
        if dist > 3 && !(is_edge_king && (mv.piece == PieceType::Rook || mv.piece == PieceType::Queen)) {
            return false; // Far away check against open king: creates useless branches
        }

        if !self.gives_direct_check(board, mv) {
            return false;
        }

        // 2. Hanging / Safe Context Filter
        let opp_att = board.is_square_attacked(mv.to, opp_color);
        if opp_att {
            let our_def = board.is_square_attacked(mv.to, board.side_to_move);
            if !our_def {
                // Suicidal Queen Contact Check: immediate O(1) reject (guards Game 1 Qh2+ blunder)
                if mv.piece == PieceType::Queen && dist <= 1 {
                    return false;
                }
                // If undefended, only permit if the attacker is pinned to enemy king (e.g. Game 1 Qg3+)
                let mut test_board = board.clone_for_legality();
                test_board.make_move(mv);
                let opp_moves = test_board.generate_moves();
                if opp_moves.iter().any(|m| m.to == mv.to) {
                    return false; // Real legal hanging piece!
                }
            } else if mv.piece != PieceType::Pawn {
                // Defended, but check if attacked by a pawn (losing exchange)
                let pawns = board.pieces[opp_color as usize][PieceType::Pawn as usize];
                let pawn_att = if opp_color == Color::White {
                    ((pawns << 7) & !0x8080808080808080) | ((pawns << 9) & !0x0101010101010101)
                } else {
                    ((pawns >> 7) & !0x0101010101010101) | ((pawns >> 9) & !0x8080808080808080)
                };
                if (pawn_att & (1u64 << mv.to)) != 0 {
                    let mut test_board = board.clone_for_legality();
                    test_board.make_move(mv);
                    let opp_moves = test_board.generate_moves();
                    if opp_moves.iter().any(|m| m.to == mv.to && m.piece == PieceType::Pawn) {
                        return false; // Defended pawn can legally capture: losing exchange!
                    }
                }
            }
        }

        // 3. Tactical Urgency
        // Contact checks (dist <= 1) and Pawn checks are always urgent
        if dist <= 1 || mv.piece == PieceType::Pawn {
            return true;
        }

        // Queen / Rook checks within distance <= 3 against castled shelter / edge king
        if (mv.piece == PieceType::Queen || mv.piece == PieceType::Rook) && dist <= 3 {
            return true;
        }

        // Minor piece checks: Bishop allowed at dist <= 3 (diagonal pins/skewers), Knight at dist <= 2
        if mv.piece == PieceType::Bishop && dist <= 3 {
            return true;
        }
        if mv.piece == PieceType::Knight && dist <= 2 {
            return true;
        }

        false
    }

    pub fn gives_direct_check(&self, board: &Board, mv: Move) -> bool {
        let opp_color = board.side_to_move.opposite();
        let enemy_king_bb = board.pieces[opp_color as usize][PieceType::King as usize];
        if enemy_king_bb == 0 { return false; }
        let k_sq = enemy_king_bb.trailing_zeros() as u8;
        let enemy_king_bb = 1u64 << k_sq;

        let clear_slider_ray = |from: u8, to: u8, target: u8| -> bool {
            let from_rank = from as i8 / 8;
            let from_file = from as i8 % 8;
            let to_rank = to as i8 / 8;
            let to_file = to as i8 % 8;
            let target_rank = target as i8 / 8;
            let target_file = target as i8 % 8;

            let rank_delta = target_rank - to_rank;
            let file_delta = target_file - to_file;

            let step_rank = rank_delta.signum();
            let step_file = file_delta.signum();

            let mut rank = to_rank + step_rank;
            let mut file = to_file + step_file;

            while rank != target_rank || file != target_file {
                let sq = (rank * 8 + file) as u8;
                if sq != from && (board.combined_occupancy & (1u64 << sq)) != 0 {
                    return false;
                }
                rank += step_rank;
                file += step_file;
            }
            true
        };

        match mv.piece {
            PieceType::Knight => (crate::magic::get_knight_attacks(k_sq) & (1u64 << mv.to)) != 0,
            PieceType::Pawn => {
                let att = if board.side_to_move == Color::White {
                    ((1u64 << mv.to) << 7 & !0x8080808080808080) | ((1u64 << mv.to) << 9 & !0x0101010101010101)
                } else {
                    ((1u64 << mv.to) >> 7 & !0x0101010101010101) | ((1u64 << mv.to) >> 9 & !0x8080808080808080)
                };
                (att & enemy_king_bb) != 0
            }
            PieceType::Bishop => {
                let k_rank = k_sq as i8 / 8;
                let k_file = k_sq as i8 % 8;
                let to_rank = mv.to as i8 / 8;
                let to_file = mv.to as i8 % 8;
                let aligned = (k_rank - to_rank).abs() == (k_file - to_file).abs();
                aligned && clear_slider_ray(mv.from, mv.to, k_sq)
            }
            PieceType::Rook => {
                let k_rank = k_sq / 8;
                let k_file = k_sq % 8;
                let to_rank = mv.to / 8;
                let to_file = mv.to % 8;
                (k_rank == to_rank || k_file == to_file)
                    && clear_slider_ray(mv.from, mv.to, k_sq)
            }
            PieceType::Queen => {
                let k_rank = k_sq as i8 / 8;
                let k_file = k_sq as i8 % 8;
                let to_rank = mv.to as i8 / 8;
                let to_file = mv.to as i8 % 8;
                let aligned = k_rank == to_rank
                    || k_file == to_file
                    || (k_rank - to_rank).abs() == (k_file - to_file).abs();
                aligned && clear_slider_ray(mv.from, mv.to, k_sq)
            }
            PieceType::King => false,
        }
    }

    fn score_qsearch_move(&self, board: &Board, mv: Move) -> i32 {
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
        } else if mv.promotion.is_some() {
            9000
        } else if self.gives_direct_check(board, mv) {
            8000
        } else {
            0
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tt::NodeType;

    #[test]
    fn singular_extension_searches_alternatives_without_tt_cutoff() {
        let mut searcher = Searcher::new();
        searcher.features.use_nnue = false;
        searcher.features.use_singular_ext = true;
        searcher.heuristics.use_nmp = false;
        searcher.heuristics.use_lmr = false;

        let mut board = Board::from_fen("4k3/8/8/8/8/8/PP6/R3K2Q b - - 0 1");
        let tt_move = board.generate_moves()[0];
        let tt_move_u16 = ((tt_move.from as u16) << 6) | tt_move.to as u16;
        searcher.tt.store(board.get_zobrist_key(), 4, 1200, NodeType::Exact, Some(tt_move_u16));

        let _ = searcher.alpha_beta_with_prev(&mut board, 7, 1, 1000, 1001, None, None);

        assert!(
            searcher.stats.singular_extensions > 0,
            "probes={}, extensions={}, nodes={}",
            searcher.stats.singular_probes,
            searcher.stats.singular_extensions,
            searcher.nodes
        );
    }

    #[test]
    fn excluded_move_search_bypasses_and_preserves_transposition_entry() {
        let mut searcher = Searcher::new();
        searcher.features.use_nnue = false;
        searcher.heuristics.use_nmp = false;
        searcher.heuristics.use_lmr = false;

        let mut board = Board::from_fen("4k3/8/8/8/8/8/PP6/R3K2Q b - - 0 1");
        let excluded = board.generate_moves()[0];
        let excluded_u16 = ((excluded.from as u16) << 6) | excluded.to as u16;
        let key = board.get_zobrist_key();
        searcher.tt.store(key, 6, 1200, NodeType::Exact, Some(excluded_u16));

        let _ = searcher.alpha_beta_with_prev(
            &mut board,
            2,
            1,
            1000,
            1001,
            None,
            Some(excluded),
        );

        assert!(searcher.nodes > 1, "excluded search must evaluate alternative moves");
        let entry = searcher.tt.probe(key).expect("original TT entry must remain");
        assert_eq!(entry.score, 1200);
        assert_eq!(entry.best_move, Some(excluded_u16));
    }

    #[test]
    fn blocked_slider_ray_does_not_receive_quiet_check_bonus() {
        let mut searcher = Searcher::new();
        searcher.features.use_nnue = false;
        let board = Board::from_fen("r1bqk1nr/pppp1ppp/2n5/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1");
        let bishop_move = board
            .generate_moves()
            .into_iter()
            .find(|mv| mv.from == 5 && mv.to == 33)
            .expect("WAC 011 bishop move f1b5 should be legal");

        assert_ne!(searcher.score_move(&board, bishop_move, 0, None, None), 620_000);
    }

    #[test]
    fn clear_slider_ray_receives_quiet_check_bonus() {
        let mut searcher = Searcher::new();
        searcher.features.use_nnue = false;
        let board = Board::from_fen("4k3/8/8/1B6/8/8/8/4K3 w - - 0 1");
        let bishop_move = board
            .generate_moves()
            .into_iter()
            .find(|mv| mv.from == 33 && mv.to == 51)
            .expect("bishop move b5d7 should be legal");

        assert_eq!(searcher.score_move(&board, bishop_move, 0, None, None), 620_000);
    }

    #[test]
    fn root_lmr_does_not_reduce_quiet_checking_moves() {
        let board = Board::from_fen("4k3/8/8/1B6/8/8/8/K7 w - - 0 1");
        let moves = board.generate_moves();
        let checking_move = moves
            .iter()
            .copied()
            .find(|mv| mv.from == 33 && mv.to == 51)
            .expect("bishop move b5d7 should be legal");
        let quiet_move = moves
            .iter()
            .copied()
            .find(|mv| mv.from == 33 && mv.to == 40)
            .expect("bishop move b5a6 should be legal");
        let mut checking_position = board.clone();
        checking_position.make_move(checking_move);
        let mut quiet_position = board.clone();
        quiet_position.make_move(quiet_move);

        assert!(!can_reduce_root_move(&board, &checking_position, checking_move, 3, 2, true, crate::types::LmrMode::Baseline));
        assert!(can_reduce_root_move(&board, &quiet_position, quiet_move, 3, 2, true, crate::types::LmrMode::Baseline));
    }
}
#[derive(Debug, Clone, serde::Serialize)]
pub struct MoveAnatomy {
    pub uci: String,
    pub rank: usize,
    pub total_moves: usize,
    pub order_score: i32,
    pub see: i32,
    pub history: i32,
    pub is_killer: bool,
    pub is_capture: bool,
    pub is_quiet: bool,
    pub gives_check: bool,
    pub lmr_eligible: bool,
    pub lmr_reduction: usize,
    pub static_eval_before: i32,
    pub static_eval_after: i32,
    pub delta_nnue: i32,
}

impl Searcher {
    pub fn inspect_move_anatomy(&mut self, board: &Board, target_uci: &str) -> Option<MoveAnatomy> {
        let mut legal_moves = board.generate_moves();
        if legal_moves.is_empty() {
            return None;
        }
        let total_moves = legal_moves.len();
        let zobrist_key = board.get_zobrist_key();
        let raw_tt_move = self.tt.probe(zobrist_key).and_then(|e| e.best_move);
        let tt_move = raw_tt_move.filter(|&m_u16| board.is_legal_u16(m_u16).is_some());

        self.order_moves(board, &mut legal_moves, 0, tt_move, None);

        let target_pos = legal_moves.iter().position(|m| m.to_uci() == target_uci)?;
        let mv = legal_moves[target_pos];
        let rank = target_pos + 1; // 1-based

        let order_score = self.score_move(board, mv, 0, tt_move, None);
        let see = crate::see::see_eval(board, mv);
        let history = self.heuristics.history_table[mv.from as usize][mv.to as usize];
        let is_killer = self.heuristics.killer_moves[0].contains(&Some(mv));
        let is_capture = mv.captured.is_some() || mv.is_en_passant;
        let is_quiet = mv.captured.is_none() && !mv.is_en_passant && mv.promotion.is_none();

        let mut next_board = board.clone();
        next_board.make_move(mv);
        let gives_check = next_board.is_king_in_check(next_board.side_to_move);
        let in_check = board.is_king_in_check(board.side_to_move);

        let lmr_eligible = self.heuristics.use_lmr && is_quiet && !in_check && !gives_check && !is_killer;
        let base_r = if rank >= 2 { LMR_TABLE[6.min(63)][rank.min(63)] } else { 0 };

        let static_eval_before = crate::eval::Evaluator::evaluate(board, &self.features);
        let static_eval_after = -crate::eval::Evaluator::evaluate(&next_board, &self.features);
        let delta_nnue = static_eval_after - static_eval_before;

        Some(MoveAnatomy {
            uci: target_uci.to_string(),
            rank,
            total_moves,
            order_score,
            see,
            history,
            is_killer,
            is_capture,
            is_quiet,
            gives_check,
            lmr_eligible,
            lmr_reduction: if lmr_eligible { base_r } else { 0 },
            static_eval_before,
            static_eval_after,
            delta_nnue,
        })
    }
}

impl Searcher {
    #[inline]
    pub fn is_regime_a(&self, board: &Board) -> bool {
        let white_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
        let black_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];
        
        const CENTER_FILES_MASK: u64 = 0x3C3C3C3C3C3C3C3C;
        let center_pawns = (white_pawns | black_pawns) & CENTER_FILES_MASK;
        if center_pawns.count_ones() <= 3 {
            return false;
        }

        let locked_pairs = ((white_pawns << 8) & black_pawns & CENTER_FILES_MASK).count_ones();
        let w_blocked = ((white_pawns << 8) & board.combined_occupancy).count_ones();
        let b_blocked = ((black_pawns >> 8) & board.combined_occupancy).count_ones();
        let total_blocked = w_blocked + b_blocked;

        if locked_pairs >= 1 || total_blocked >= 3 {
            let (stm_pawns, opp_pawns) = if board.side_to_move == Color::White {
                (white_pawns, black_pawns)
            } else {
                (black_pawns, white_pawns)
            };
            
            let empty = !board.combined_occupancy;
            let single_pushes = if board.side_to_move == Color::White {
                (stm_pawns << 8) & empty & CENTER_FILES_MASK
            } else {
                (stm_pawns >> 8) & empty & CENTER_FILES_MASK
            };
            
            let mut breaks = 0;
            let mut temp = single_pushes;
            while temp != 0 {
                let to_sq = temp.trailing_zeros() as u8;
                let att = if board.side_to_move == Color::White {
                    let bb = 1u64 << to_sq;
                    ((bb << 7) & !0x8080808080808080) | ((bb << 9) & !0x0101010101010101)
                } else {
                    let bb = 1u64 << to_sq;
                    ((bb >> 7) & !0x0101010101010101) | ((bb >> 9) & !0x8080808080808080)
                };
                if (att & opp_pawns) != 0 {
                    breaks += 1;
                }
                temp &= temp - 1;
            }
            
            return breaks <= 1;
        }

        false
    }

    pub fn classify_structural_move(&self, board: &Board, mv: Move) -> (&'static str, i32) {
        if !self.is_regime_a(board) {
            return ("NONE", 0);
        }

        const CENTER_FILES_MASK: u64 = 0x3C3C3C3C3C3C3C3C;
        let to_bb = 1u64 << mv.to;
        let is_center_dest = (to_bb & CENTER_FILES_MASK) != 0;

        let us = board.side_to_move;
        let them = us.opposite();
        let my_pawns = board.pieces[us as usize][PieceType::Pawn as usize];
        let opp_pawns = board.pieces[them as usize][PieceType::Pawn as usize];

        // 4. Tension-Changing Capture
        if (mv.captured.is_some() || mv.is_en_passant) && mv.piece == PieceType::Pawn && is_center_dest {
            return ("TENSION_CAPTURE", self.features.structural_bonus_tension_capture);
        }

        // 1. Direct Pawn Break
        if mv.piece == PieceType::Pawn && is_center_dest {
            let att = if us == Color::White {
                ((to_bb << 7) & !0x8080808080808080) | ((to_bb << 9) & !0x0101010101010101)
            } else {
                ((to_bb >> 7) & !0x0101010101010101) | ((to_bb >> 9) & !0x8080808080808080)
            };
            if (att & opp_pawns) != 0 {
                return ("DIRECT_BREAK", self.features.structural_bonus_direct_break);
            }
            let opp_pawn_attacks = if them == Color::White {
                ((opp_pawns << 7) & !0x8080808080808080) | ((opp_pawns << 9) & !0x0101010101010101)
            } else {
                ((opp_pawns >> 7) & !0x0101010101010101) | ((opp_pawns >> 9) & !0x8080808080808080)
            };
            if (opp_pawn_attacks & to_bb) != 0 {
                return ("DIRECT_BREAK", self.features.structural_bonus_direct_break);
            }
        }

        // 2. Break Enabler: Pawn move defending a future break square
        if mv.piece == PieceType::Pawn {
            let new_att = if us == Color::White {
                ((to_bb << 7) & !0x8080808080808080) | ((to_bb << 9) & !0x0101010101010101)
            } else {
                ((to_bb >> 7) & !0x0101010101010101) | ((to_bb >> 9) & !0x8080808080808080)
            };
            let mut p_temp = my_pawns & !(1u64 << mv.from);
            while p_temp != 0 {
                let p_sq = p_temp.trailing_zeros() as u8;
                let dest = if us == Color::White { p_sq as i8 + 8 } else { p_sq as i8 - 8 };
                if (0..64).contains(&dest) {
                    let dest_bb = 1u64 << dest;
                    if (new_att & dest_bb) != 0 && (dest_bb & CENTER_FILES_MASK) != 0 {
                        let dest_att = if us == Color::White {
                            ((dest_bb << 7) & !0x8080808080808080) | ((dest_bb << 9) & !0x0101010101010101)
                        } else {
                            ((dest_bb >> 7) & !0x0101010101010101) | ((dest_bb >> 9) & !0x8080808080808080)
                        };
                        if (dest_att & opp_pawns) != 0 {
                            return ("BREAK_ENABLER", self.features.structural_bonus_break_enabler);
                        }
                    }
                }
                p_temp &= p_temp - 1;
            }
        }

        // 3. Anti-Break Defense: Occupying opponent's break square in center
        if is_center_dest {
            let mut opp_temp = opp_pawns;
            while opp_temp != 0 {
                let opp_sq = opp_temp.trailing_zeros() as u8;
                let opp_dest = if them == Color::White { opp_sq as i8 + 8 } else { opp_sq as i8 - 8 };
                if (0..64).contains(&opp_dest) {
                    let opp_dest_bb = 1u64 << opp_dest;
                    if (opp_dest_bb & CENTER_FILES_MASK) != 0 {
                        let opp_dest_att = if them == Color::White {
                            ((opp_dest_bb << 7) & !0x8080808080808080) | ((opp_dest_bb << 9) & !0x0101010101010101)
                        } else {
                            ((opp_dest_bb >> 7) & !0x0101010101010101) | ((opp_dest_bb >> 9) & !0x8080808080808080)
                        };
                        if (opp_dest_att & my_pawns) != 0 && mv.to == opp_dest as u8 {
                            return ("ANTI_BREAK", self.features.structural_bonus_anti_break);
                        }
                    }
                }
                opp_temp &= opp_temp - 1;
            }
        }

        ("NONE", 0)
    }
}
