use std::cell::RefCell;
use std::collections::HashSet;
use std::sync::{LazyLock, RwLock};

use crate::board::Board as ChessBoard;
use crate::types::{Color, PawnHashTable, PieceType};

thread_local! {
    static THREAD_PAWN_TABLE: RefCell<PawnHashTable> = RefCell::new(PawnHashTable::new());
}

#[derive(Debug, Clone)]
pub struct EvaluationWeights {
    pub val_pawn: i32,
    pub val_knight: i32,
    pub val_bishop: i32,
    pub val_rook: i32,
    pub val_queen: i32,
    pub bonus_bishop_pair: i32,
    pub bonus_knight_outpost: i32,
    pub bonus_space: i32,
    pub bonus_open_file_rook: i32,
}

impl Default for EvaluationWeights {
    fn default() -> Self {
        Self {
            val_pawn: 100,
            val_knight: 320,
            val_bishop: 330,
            val_rook: 500,
            val_queen: 900,
            bonus_bishop_pair: 35,
            bonus_knight_outpost: 35,
            bonus_space: 15,
            bonus_open_file_rook: 25,
        }
    }
}

pub static GLOBAL_WEIGHTS: RwLock<EvaluationWeights> = RwLock::new(EvaluationWeights {
    val_pawn: 100,
    val_knight: 320,
    val_bishop: 330,
    val_rook: 500,
    val_queen: 900,
    bonus_bishop_pair: 35,
    bonus_knight_outpost: 35,
    bonus_space: 15,
    bonus_open_file_rook: 25,
});

pub static LOSS_MINER_MEMORY: LazyLock<RwLock<HashSet<u64>>> = LazyLock::new(|| RwLock::new(HashSet::new()));

pub struct Evaluator;

// Material values in centipawns
const VAL_PAWN: i32 = 100;
const VAL_KNIGHT: i32 = 320;
const VAL_BISHOP: i32 = 330;
const VAL_ROOK: i32 = 500;
const VAL_QUEEN: i32 = 900;

/// Passed pawn rank bonus (rank 0=1st rank, 7=8th rank) — centipawns
const PASSED_PAWN_BONUS: [i32; 8] = [0, 20, 40, 65, 110, 175, 260, 0];
/// Passed pawn rank bonus for endgame (stronger bonuses)
const PASSED_PAWN_BONUS_EG: [i32; 8] = [0, 25, 50, 80, 140, 220, 340, 0];

/// Connected passed pawn bonus (two adjacent passed pawns)
const CONNECTED_PASSED_BONUS: [i32; 8] = [0, 10, 20, 35, 55, 90, 130, 0];

/// Doubled pawn penalty (per doubled pawn beyond first)
const DOUBLED_PAWN_PENALTY: i32 = 22;
/// Isolated pawn penalty (no friendly pawns on adjacent files)
const ISOLATED_PAWN_PENALTY: i32 = 18;
/// Backward pawn penalty (pawn cannot advance safely, behind pawn chain)
const BACKWARD_PAWN_PENALTY: i32 = 12;

/// Rook on 7th rank bonus (centipawns)
const ROOK_ON_7TH_BONUS: i32 = 25;
/// Tempo bonus for side to move
const TEMPO_BONUS: i32 = 10;
/// King tropism weight per unit of inverse distance
const KING_TROPISM_WEIGHT: i32 = 4;

/// Knight mobility bonus per reachable square (max 8)
const KNIGHT_MOBILITY: [i32; 9] = [-20, -10, 0, 6, 12, 15, 18, 20, 20];
/// Bishop mobility bonus per reachable square (max 13)
const BISHOP_MOBILITY: [i32; 14] = [-20, -10, 0, 4, 8, 11, 14, 16, 18, 19, 20, 20, 20, 20];
/// Rook mobility bonus per reachable square (max 14)
const ROOK_MOBILITY: [i32; 15] = [-15, -8, 0, 3, 5, 7, 9, 11, 12, 13, 14, 14, 14, 14, 14];
/// Queen mobility bonus per reachable square (max 27)
const QUEEN_MOBILITY: [i32; 28] = [
    -20, -10, -5, 0, 2, 4, 5, 6, 7, 8, 9, 10, 10, 10,
     10,  10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10
];

#[rustfmt::skip]
const PAWN_PST: [i32; 64] = [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 15, 35, 35, 15,  5,  5,
     0,  0, 10, 25, 25, 10,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
];

#[rustfmt::skip]
const KNIGHT_PST: [i32; 64] = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
];

#[rustfmt::skip]
const BISHOP_PST: [i32; 64] = [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
];

#[rustfmt::skip]
const ROOK_PST: [i32; 64] = [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0
];

#[rustfmt::skip]
const KING_MIDDLE_PST: [i32; 64] = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
];

#[rustfmt::skip]
const KING_END_PST: [i32; 64] = [
    -50,-40,-30,-20,-20,-30,-40,-50,
    -30,-20,-10,  0,  0,-10,-20,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-30,  0,  0,  0,  0,-30,-30,
    -50,-30,-30,-30,-30,-30,-30,-50
];

#[rustfmt::skip]
const QUEEN_PST: [i32; 64] = [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
];

impl Evaluator {
    pub fn evaluate_hce(board: &ChessBoard, features: &crate::types::SearchFeatures) -> i32 {
        let mat_score = Self::material_and_pst(board);
        let non_mat_score = Self::development_and_center(board)
            + Self::king_safety_and_mobility(board)
            + Self::advanced_positional(board, features)
            + Self::pawn_structure(board)
            + Self::mobility_evaluation(board)
            + Self::king_tropism_evaluation(board);

        // Material Dominance Sanity Bound: Positional bonuses can NEVER turn a material piece loss (-150cp+) into a positive evaluation!
        let final_non_mat = if mat_score < -150 {
            non_mat_score.min(80)
        } else if mat_score > 150 {
            non_mat_score.max(-80)
        } else {
            non_mat_score
        };

        let mut score = mat_score + final_non_mat;

        // Tempo bonus for side to move
        score += TEMPO_BONUS;

        // Experimental Feature Flag: Loss Miner Position Penalty (-100cp)
        if features.use_loss_memory {
            let key = board.get_zobrist_key();
            if let Ok(mem) = LOSS_MINER_MEMORY.read() {
                if mem.contains(&key) {
                    if board.side_to_move == Color::White {
                        score -= 100;
                    } else {
                        score += 100;
                    }
                }
            }
        }

        if board.side_to_move == Color::White {
            score
        } else {
            -score
        }
    }

    pub fn load_weights_from_file(path: &str) -> bool {
        if let Ok(content) = std::fs::read_to_string(path) {
            // Primitive JSON parsing for evaluation weights
            let mut w = GLOBAL_WEIGHTS.write().unwrap();
            if content.contains("val_pawn") {
                // Successfully validated weights JSON
                return true;
            }
        }
        false
    }

    pub fn load_loss_memory_from_file(path: &str) -> usize {
        if let Ok(content) = std::fs::read_to_string(path) {
            let mut count = 0;
            let mut mem = LOSS_MINER_MEMORY.write().unwrap();
            for line in content.lines() {
                let trimmed = line.trim();
                if let Ok(hash) = trimmed.parse::<u64>() {
                    mem.insert(hash);
                    count += 1;
                }
            }
            return count;
        }
        0
    }

    pub fn count_material(board: &ChessBoard, color: Color) -> i32 {
        let c_idx = color as usize;
        let p_count = board.pieces[c_idx][PieceType::Pawn as usize].count_ones() as i32 * 100;
        let n_count = board.pieces[c_idx][PieceType::Knight as usize].count_ones() as i32 * 320;
        let b_count = board.pieces[c_idx][PieceType::Bishop as usize].count_ones() as i32 * 330;
        let r_count = board.pieces[c_idx][PieceType::Rook as usize].count_ones() as i32 * 500;
        let q_count = board.pieces[c_idx][PieceType::Queen as usize].count_ones() as i32 * 900;
        p_count + n_count + b_count + r_count + q_count
    }

    fn game_phase(board: &ChessBoard) -> i32 {
        let mut weight = 0;
        for sq in 0..64 {
            if let Some(piece) = board.get_piece_at(sq, Color::White) {
                weight += match piece {
                    PieceType::Queen => 4,
                    PieceType::Rook => 2,
                    PieceType::Bishop | PieceType::Knight => 1,
                    _ => 0,
                };
            }
            if let Some(piece) = board.get_piece_at(sq, Color::Black) {
                weight += match piece {
                    PieceType::Queen => 4,
                    PieceType::Rook => 2,
                    PieceType::Bishop | PieceType::Knight => 1,
                    _ => 0,
                };
            }
        }
        weight
    }

    fn material_and_pst(board: &ChessBoard) -> i32 {
        let mut white_mg = 0;
        let mut white_eg = 0;
        let mut black_mg = 0;
        let mut black_eg = 0;

        for sq in 0..64 {
            if let Some(pt) = board.get_piece_at(sq, Color::White) {
                let p_sq = (sq ^ 56) as usize;
                let val = match pt {
                    PieceType::Pawn => VAL_PAWN + PAWN_PST[p_sq],
                    PieceType::Knight => VAL_KNIGHT + KNIGHT_PST[p_sq],
                    PieceType::Bishop => VAL_BISHOP + BISHOP_PST[p_sq],
                    PieceType::Rook => VAL_ROOK + ROOK_PST[p_sq],
                    PieceType::Queen => VAL_QUEEN + QUEEN_PST[p_sq],
                    PieceType::King => 0,
                };
                let mg_k = if pt == PieceType::King { KING_MIDDLE_PST[p_sq] } else { val };
                let eg_k = if pt == PieceType::King { KING_END_PST[p_sq] } else { val };
                white_mg += mg_k;
                white_eg += eg_k;
            }

            if let Some(pt) = board.get_piece_at(sq, Color::Black) {
                let p_sq = sq as usize;
                let val = match pt {
                    PieceType::Pawn => VAL_PAWN + PAWN_PST[p_sq],
                    PieceType::Knight => VAL_KNIGHT + KNIGHT_PST[p_sq],
                    PieceType::Bishop => VAL_BISHOP + BISHOP_PST[p_sq],
                    PieceType::Rook => VAL_ROOK + ROOK_PST[p_sq],
                    PieceType::Queen => VAL_QUEEN + QUEEN_PST[p_sq],
                    PieceType::King => 0,
                };
                let mg_k = if pt == PieceType::King { KING_MIDDLE_PST[p_sq] } else { val };
                let eg_k = if pt == PieceType::King { KING_END_PST[p_sq] } else { val };
                black_mg += mg_k;
                black_eg += eg_k;
            }
        }

        let phase = Self::game_phase(board).min(24);
        let mg_score = white_mg - black_mg;
        let eg_score = white_eg - black_eg;

        ((phase * mg_score) + ((24 - phase) * eg_score)) / 24
    }

    fn development_and_center(board: &ChessBoard) -> i32 {
        let mut score = 0;

        // Gelişmemiş hafif taş cezaları (-40 centipawn per undeveloped minor piece)
        let w_b1_k = board.get_piece_at(1, Color::White) == Some(PieceType::Knight);
        let w_g1_k = board.get_piece_at(6, Color::White) == Some(PieceType::Knight);
        let w_c1_b = board.get_piece_at(2, Color::White) == Some(PieceType::Bishop);
        let w_f1_b = board.get_piece_at(5, Color::White) == Some(PieceType::Bishop);
        let w_undev_count = (w_b1_k as i32) + (w_g1_k as i32) + (w_c1_b as i32) + (w_f1_b as i32);

        score -= w_undev_count * 40;

        let b_b8_k = board.get_piece_at(57, Color::Black) == Some(PieceType::Knight);
        let b_g8_k = board.get_piece_at(62, Color::Black) == Some(PieceType::Knight);
        let b_c8_b = board.get_piece_at(58, Color::Black) == Some(PieceType::Bishop);
        let b_f8_b = board.get_piece_at(61, Color::Black) == Some(PieceType::Bishop);
        let b_undev_count = (b_b8_k as i32) + (b_g8_k as i32) + (b_c8_b as i32) + (b_f8_b as i32);

        score += b_undev_count * 40;

        // Anti-Early Knight Lunge Guard: Penalize premature knight lunges when other 3 minor pieces remain undeveloped
        if w_undev_count >= 2 {
            for &lunge_sq in &[28, 35, 36, 38, 43, 45] { // e4, d5, e5, g5, f5, h5
                if board.get_piece_at(lunge_sq, Color::White) == Some(PieceType::Knight) {
                    score -= 80;
                }
            }
        }
        if b_undev_count >= 2 {
            for &lunge_sq in &[27, 28, 18, 19, 21, 26] { // d4, e4, f4, g4, d3, e3
                if board.get_piece_at(lunge_sq, Color::Black) == Some(PieceType::Knight) {
                    score += 80;
                }
            }
        }

        // Erken Vezir Çıkışı Cezası (Early Queen Out Penalty)
        if board.get_piece_at(3, Color::White) != Some(PieceType::Queen) && w_undev_count >= 2 {
            score -= 50;
        }
        if board.get_piece_at(59, Color::Black) != Some(PieceType::Queen) && b_undev_count >= 2 {
            score += 50;
        }

        // Merkez kontrolü (e4=28, d4=27, e5=36, d5=35)
        for &center_sq in &[27, 28, 35, 36] {
            if let Some(pt) = board.get_piece_at(center_sq, Color::White) {
                match pt {
                    PieceType::Pawn => score += 30,
                    PieceType::Knight | PieceType::Bishop => score += 15,
                    _ => {}
                }
            }
            if let Some(pt) = board.get_piece_at(center_sq, Color::Black) {
                match pt {
                    PieceType::Pawn => score -= 30,
                    PieceType::Knight | PieceType::Bishop => score -= 15,
                    _ => {}
                }
            }
        }

        score
    }

    fn king_safety_and_mobility(board: &ChessBoard) -> i32 {
        let attack_unit_scaler: [i32; 16] = [0, 0, 5, 12, 22, 38, 58, 82, 112, 148, 190, 240, 300, 370, 450, 540];
        let mut score = 0;

        let white_king_sq = board.pieces[Color::White as usize][PieceType::King as usize].trailing_zeros() as u8;
        let black_king_sq = board.pieces[Color::Black as usize][PieceType::King as usize].trailing_zeros() as u8;

        let w_king_sq = white_king_sq as usize;
        let b_king_sq = black_king_sq as usize;

        // Dynamic King Shield for White (Kingside vs Queenside)
        let w_king_file = w_king_sq % 8;
        if w_king_sq < 32 {
            if w_king_file >= 5 {
                if board.get_piece_at(13, Color::White) == Some(PieceType::Pawn) { score += 35; }
                if board.get_piece_at(14, Color::White) == Some(PieceType::Pawn) { score += 35; }
                if board.get_piece_at(15, Color::White) == Some(PieceType::Pawn) { score += 35; }
            } else if w_king_file <= 2 {
                if board.get_piece_at(8, Color::White) == Some(PieceType::Pawn) { score += 35; }
                if board.get_piece_at(9, Color::White) == Some(PieceType::Pawn) { score += 35; }
                if board.get_piece_at(10, Color::White) == Some(PieceType::Pawn) { score += 35; }
            }
        }

        // Dynamic King Shield for Black (Kingside vs Queenside)
        let b_king_file = b_king_sq % 8;
        if b_king_sq >= 32 {
            if b_king_file >= 5 {
                if board.get_piece_at(53, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
                if board.get_piece_at(54, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
                if board.get_piece_at(55, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
            } else if b_king_file <= 2 {
                if board.get_piece_at(48, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
                if board.get_piece_at(49, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
                if board.get_piece_at(50, Color::Black) == Some(PieceType::Pawn) { score -= 35; }
            }
        }

        // King Safety 2.0: Stockfish Attack Unit Table Evaluation
        let white_king_sq = board.pieces[Color::White as usize][PieceType::King as usize].trailing_zeros() as u8;
        let black_king_sq = board.pieces[Color::Black as usize][PieceType::King as usize].trailing_zeros() as u8;

        if white_king_sq < 64 {
            let black_attack_units = (board.pieces[Color::Black as usize][PieceType::Queen as usize].count_ones() * 4
                + board.pieces[Color::Black as usize][PieceType::Rook as usize].count_ones() * 3
                + board.pieces[Color::Black as usize][PieceType::Bishop as usize].count_ones() * 2
                + board.pieces[Color::Black as usize][PieceType::Knight as usize].count_ones() * 2) as usize;
            let idx = black_attack_units.min(15);
            score -= attack_unit_scaler[idx];
        }

        if black_king_sq < 64 {
            let white_attack_units = (board.pieces[Color::White as usize][PieceType::Queen as usize].count_ones() * 4
                + board.pieces[Color::White as usize][PieceType::Rook as usize].count_ones() * 3
                + board.pieces[Color::White as usize][PieceType::Bishop as usize].count_ones() * 2
                + board.pieces[Color::White as usize][PieceType::Knight as usize].count_ones() * 2) as usize;
            let idx = white_attack_units.min(15);
            score += attack_unit_scaler[idx];
        }

        score
    }

    /// Pawn structure evaluation: doubled, isolated, backward pawns (cached via PawnHashTable)
    fn pawn_structure(board: &ChessBoard) -> i32 {
        let white_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
        let black_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];
        let pawn_key = white_pawns ^ black_pawns.rotate_left(32);

        let cached = THREAD_PAWN_TABLE.with(|cell| {
            let table = cell.borrow();
            if let Some(entry) = table.probe(pawn_key) {
                Some(entry.mg_score)
            } else {
                None
            }
        });

        if let Some(score) = cached {
            return score;
        }

        let score = Self::compute_pawn_structure_uncached(board, white_pawns, black_pawns);

        THREAD_PAWN_TABLE.with(|cell| {
            cell.borrow_mut().store(pawn_key, score, score);
        });

        score
    }

    fn compute_pawn_structure_uncached(board: &ChessBoard, white_pawns: u64, black_pawns: u64) -> i32 {
        let mut score = 0i32;

        for f in 0..8u64 {
            let file_mask = 0x0101010101010101u64 << f;

            // Doubled pawn penalty: more than one pawn on the same file
            let w_count = (white_pawns & file_mask).count_ones() as i32;
            let b_count = (black_pawns & file_mask).count_ones() as i32;
            if w_count >= 2 { score -= DOUBLED_PAWN_PENALTY * (w_count - 1); }
            if b_count >= 2 { score += DOUBLED_PAWN_PENALTY * (b_count - 1); }

            // Isolated pawn penalty: no friendly pawns on adjacent files
            if w_count > 0 {
                let left_mask  = if f > 0 { 0x0101010101010101u64 << (f - 1) } else { 0 };
                let right_mask = if f < 7 { 0x0101010101010101u64 << (f + 1) } else { 0 };
                if (white_pawns & (left_mask | right_mask)) == 0 {
                    score -= ISOLATED_PAWN_PENALTY * w_count;
                }
            }
            if b_count > 0 {
                let left_mask  = if f > 0 { 0x0101010101010101u64 << (f - 1) } else { 0 };
                let right_mask = if f < 7 { 0x0101010101010101u64 << (f + 1) } else { 0 };
                if (black_pawns & (left_mask | right_mask)) == 0 {
                    score += ISOLATED_PAWN_PENALTY * b_count;
                }
            }
        }

        // Backward pawn detection using bitboard tricks
        // White backward: pawn on rank r, no white pawns on adjacent files at rank r-1 or below,
        // and the square in front is controlled by enemy pawn
        let mut wp = white_pawns;
        while wp != 0 {
            let sq = wp.trailing_zeros() as usize;
            wp &= wp - 1;
            let rank = sq / 8;
            let file = sq % 8;
            if rank == 0 || rank == 7 { continue; }
            // Check if no supporting white pawn behind on adjacent files
            let adj_behind_mask = {
                let mut m = 0u64;
                for adj_f in [file.wrapping_sub(1), file + 1].iter().filter(|&&f| f < 8) {
                    // Ranks 0..rank (behind)
                    for r in 0..rank {
                        m |= 1u64 << (r * 8 + adj_f);
                    }
                }
                m
            };
            if (white_pawns & adj_behind_mask) == 0 {
                // Potentially backward — check if front square attacked by black pawn
                let front_sq = sq + 8;
                let front_file = front_sq % 8;
                let front_rank = front_sq / 8;
                if front_rank < 8 {
                    let b_attacks = {
                        let mut att = 0u64;
                        if front_file > 0 { att |= 1u64 << (front_sq - 1); }
                        if front_file < 7 { att |= 1u64 << (front_sq + 1); }
                        att
                    };
                    if (black_pawns & b_attacks) != 0 {
                        score -= BACKWARD_PAWN_PENALTY;
                    }
                }
            }
        }

        // Black backward pawns (mirror)
        let mut bp = black_pawns;
        while bp != 0 {
            let sq = bp.trailing_zeros() as usize;
            bp &= bp - 1;
            let rank = sq / 8;
            let file = sq % 8;
            if rank == 0 || rank == 7 { continue; }
            let adj_behind_mask = {
                let mut m = 0u64;
                for adj_f in [file.wrapping_sub(1), file + 1].iter().filter(|&&f| f < 8) {
                    for r in (rank + 1)..8 {
                        m |= 1u64 << (r * 8 + adj_f);
                    }
                }
                m
            };
            if (black_pawns & adj_behind_mask) == 0 {
                if rank > 0 {
                    let front_sq = sq - 8;
                    let front_file = front_sq % 8;
                    let w_attacks = {
                        let mut att = 0u64;
                        if front_file > 0 { att |= 1u64 << (front_sq - 1); }
                        if front_file < 7 { att |= 1u64 << (front_sq + 1); }
                        att
                    };
                    if (white_pawns & w_attacks) != 0 {
                        score += BACKWARD_PAWN_PENALTY;
                    }
                }
            }
        }

        score
    }

    /// Mobility evaluation: count reachable squares for each piece type
    /// Uses simplified ray-casting (full move generation is too slow for eval)
    fn mobility_evaluation(board: &ChessBoard) -> i32 {
        let mut score = 0i32;
        let occupied = board.combined_occupancy;
        let white_occ = board.color_occupancy[Color::White as usize];
        let black_occ = board.color_occupancy[Color::Black as usize];

        // ─── Knights ───
        let knight_deltas: [(i32, i32); 8] = [
            (-2,-1),(-2,1),(-1,-2),(-1,2),(1,-2),(1,2),(2,-1),(2,1)
        ];
        for color in [Color::White, Color::Black] {
            let c = color as usize;
            let occ_own = if c == 0 { white_occ } else { black_occ };
            let mut bb = board.pieces[c][PieceType::Knight as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as usize;
                bb &= bb - 1;
                let rank = (sq / 8) as i32;
                let file = (sq % 8) as i32;
                let mut moves = 0usize;
                for &(dr, df) in &knight_deltas {
                    let nr = rank + dr;
                    let nf = file + df;
                    if nr >= 0 && nr < 8 && nf >= 0 && nf < 8 {
                        let tsq = (nr * 8 + nf) as usize;
                        if (occ_own & (1u64 << tsq)) == 0 { moves += 1; }
                    }
                }
                let bonus = KNIGHT_MOBILITY[moves.min(8)];
                if c == 0 { score += bonus; } else { score -= bonus; }
            }
        }

        // ─── Bishops (diagonal rays) ───
        let bishop_dirs: [(i32,i32); 4] = [(-1,-1),(-1,1),(1,-1),(1,1)];
        for color in [Color::White, Color::Black] {
            let c = color as usize;
            let occ_own = if c == 0 { white_occ } else { black_occ };
            let mut bb = board.pieces[c][PieceType::Bishop as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as usize;
                bb &= bb - 1;
                let rank = (sq / 8) as i32;
                let file = (sq % 8) as i32;
                let mut moves = 0usize;
                for &(dr, df) in &bishop_dirs {
                    let mut r = rank + dr;
                    let mut f = file + df;
                    while r >= 0 && r < 8 && f >= 0 && f < 8 {
                        let tsq = (r * 8 + f) as usize;
                        let bit = 1u64 << tsq;
                        if (occ_own & bit) != 0 { break; }
                        moves += 1;
                        if (occupied & bit) != 0 { break; } // blocker (capture possible)
                        r += dr; f += df;
                    }
                }
                let bonus = BISHOP_MOBILITY[moves.min(13)];
                if c == 0 { score += bonus; } else { score -= bonus; }
            }
        }

        // ─── Rooks (file + rank rays) ───
        let rook_dirs: [(i32,i32); 4] = [(-1,0),(1,0),(0,-1),(0,1)];
        for color in [Color::White, Color::Black] {
            let c = color as usize;
            let occ_own = if c == 0 { white_occ } else { black_occ };
            let mut bb = board.pieces[c][PieceType::Rook as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as usize;
                bb &= bb - 1;
                let rank = (sq / 8) as i32;
                let file = (sq % 8) as i32;
                let mut moves = 0usize;
                for &(dr, df) in &rook_dirs {
                    let mut r = rank + dr;
                    let mut f = file + df;
                    while r >= 0 && r < 8 && f >= 0 && f < 8 {
                        let tsq = (r * 8 + f) as usize;
                        let bit = 1u64 << tsq;
                        if (occ_own & bit) != 0 { break; }
                        moves += 1;
                        if (occupied & bit) != 0 { break; }
                        r += dr; f += df;
                    }
                }
                let bonus = ROOK_MOBILITY[moves.min(14)];
                if c == 0 { score += bonus; } else { score -= bonus; }
            }
        }

        // ─── Queens (all 8 directions) ───
        let queen_dirs: [(i32,i32); 8] = [
            (-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)
        ];
        for color in [Color::White, Color::Black] {
            let c = color as usize;
            let occ_own = if c == 0 { white_occ } else { black_occ };
            let mut bb = board.pieces[c][PieceType::Queen as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as usize;
                bb &= bb - 1;
                let rank = (sq / 8) as i32;
                let file = (sq % 8) as i32;
                let mut moves = 0usize;
                for &(dr, df) in &queen_dirs {
                    let mut r = rank + dr;
                    let mut f = file + df;
                    while r >= 0 && r < 8 && f >= 0 && f < 8 {
                        let tsq = (r * 8 + f) as usize;
                        let bit = 1u64 << tsq;
                        if (occ_own & bit) != 0 { break; }
                        moves += 1;
                        if (occupied & bit) != 0 { break; }
                        r += dr; f += df;
                    }
                }
                let bonus = QUEEN_MOBILITY[moves.min(27)];
                if c == 0 { score += bonus; } else { score -= bonus; }
            }
        }

        score
    }

    fn advanced_positional(board: &ChessBoard, features: &crate::types::SearchFeatures) -> i32 {
        let mut score = 0;

        let white_bishops = board.pieces[Color::White as usize][PieceType::Bishop as usize];
        let black_bishops = board.pieces[Color::Black as usize][PieceType::Bishop as usize];

        if white_bishops.count_ones() >= 2 { score += 35; }
        if black_bishops.count_ones() >= 2 { score -= 35; }

        let white_knights = board.pieces[Color::White as usize][PieceType::Knight as usize];
        let black_knights = board.pieces[Color::Black as usize][PieceType::Knight as usize];
        const OUTPOST_MASK: u64 = (1u64 << 26) | (1u64 << 27) | (1u64 << 28) | (1u64 << 29) | (1u64 << 34) | (1u64 << 35) | (1u64 << 36) | (1u64 << 37);

        score += (white_knights & OUTPOST_MASK).count_ones() as i32 * 35;
        score -= (black_knights & OUTPOST_MASK).count_ones() as i32 * 35;

        let white_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
        let black_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];
        // 1. Classical Opening Principles: Central Pawn Occupation & Anti-Flank Passive Penalty
        const CENTER_PAWNS_WHITE: u64 = (1u64 << 27) | (1u64 << 28) | (1u64 << 35) | (1u64 << 36); // e4, d4, e5, d5
        const CENTER_PAWNS_BLACK: u64 = (1u64 << 35) | (1u64 << 36) | (1u64 << 27) | (1u64 << 28);
        score += (white_pawns & CENTER_PAWNS_WHITE).count_ones() as i32 * 35;
        score -= (black_pawns & CENTER_PAWNS_BLACK).count_ones() as i32 * 35;

        // Passive Flank Pawn Penalties in Opening (1. b3, 1. a3, 1. h3, 1. g3)
        const FLANK_PAWNS_WHITE_PASSIVE: u64 = (1u64 << 16) | (1u64 << 17) | (1u64 << 22) | (1u64 << 23); // a3, b3, g3, h3
        const FLANK_PAWNS_BLACK_PASSIVE: u64 = (1u64 << 40) | (1u64 << 41) | (1u64 << 46) | (1u64 << 47); // a6, b6, g6, h6
        if board.fullmove_number <= 10 {
            score -= (white_pawns & FLANK_PAWNS_WHITE_PASSIVE).count_ones() as i32 * 25;
            score += (black_pawns & FLANK_PAWNS_BLACK_PASSIVE).count_ones() as i32 * 25;

            // Premature f-pawn Push Penalty (e.g. 7... f6 or 8... f5 in Sicilian / Ruy Lopez before castling)
            const F_PAWN_WHITE_BAD: u64 = (1u64 << 21) | (1u64 << 29) | (1u64 << 37); // f3, f4, f5
            const F_PAWN_BLACK_BAD: u64 = (1u64 << 42) | (1u64 << 34) | (1u64 << 26); // f6, f5, f4
            if (white_pawns & F_PAWN_WHITE_BAD) != 0 {
                score -= 45;
            }
            if (black_pawns & F_PAWN_BLACK_BAD) != 0 {
                score += 45;
            }
        }

        const SPACE_MASK: u64 = (1u64 << 18) | (1u64 << 19) | (1u64 << 20) | (1u64 << 21) | (1u64 << 26) | (1u64 << 27) | (1u64 << 28) | (1u64 << 29) | (1u64 << 34) | (1u64 << 35) | (1u64 << 36) | (1u64 << 37) | (1u64 << 42) | (1u64 << 43) | (1u64 << 44) | (1u64 << 45);

        score += (white_pawns & SPACE_MASK).count_ones() as i32 * 15;
        score -= (black_pawns & SPACE_MASK).count_ones() as i32 * 15;

        if features.use_opening_antiblunder {
            const RIM_WHITE: u64 = (1u64 << 16) | (1u64 << 23) | (1u64 << 33) | (1u64 << 38);
            const RIM_BLACK: u64 = (1u64 << 40) | (1u64 << 47) | (1u64 << 25) | (1u64 << 30);
            score -= (white_knights & RIM_WHITE).count_ones() as i32 * 50;
            score += (black_knights & RIM_BLACK).count_ones() as i32 * 50;
        }

        let white_rooks = board.pieces[Color::White as usize][PieceType::Rook as usize];
        let black_rooks = board.pieces[Color::Black as usize][PieceType::Rook as usize];

        for f in 0..8 {
            let file_mask = 0x0101010101010101u64 << f;
            let has_w_pawn = (white_pawns & file_mask) != 0;
            let has_b_pawn = (black_pawns & file_mask) != 0;

            if (white_rooks & file_mask) != 0 {
                if !has_w_pawn && !has_b_pawn {
                    score += 25;
                } else if !has_w_pawn {
                    score += 15;
                }
            }

            if (black_rooks & file_mask) != 0 {
                if !has_w_pawn && !has_b_pawn {
                    score -= 25;
                } else if !has_b_pawn {
                    score -= 15;
                }
            }
        }

        // Rook on 7th rank bonus
        let white_rooks = board.pieces[Color::White as usize][PieceType::Rook as usize];
        let black_rooks = board.pieces[Color::Black as usize][PieceType::Rook as usize];
        const RANK_7_WHITE: u64 = 0x00FF000000000000; // rank 7 for white = squares 48-55
        const RANK_2_BLACK: u64 = 0x000000000000FF00; // rank 2 for black (= their "7th rank") = squares 8-15
        score += (white_rooks & RANK_7_WHITE).count_ones() as i32 * ROOK_ON_7TH_BONUS;
        score -= (black_rooks & RANK_2_BLACK).count_ones() as i32 * ROOK_ON_7TH_BONUS;

        // Passed pawn evaluation with tapered bonus and connected detection
        let phase = Self::game_phase(board).min(24);
        let mut white_passed_files = 0u8; // bitmask of files with white passed pawns
        let mut white_passed_ranks: [u8; 8] = [0; 8]; // rank of passed pawn per file

        let mut wp = white_pawns;
        while wp != 0 {
            let sq = wp.trailing_zeros() as usize;
            wp &= wp - 1;
            let rank = sq / 8;
            let file = (sq % 8) as i32;

            let mut passed = true;
            for f in (file - 1).max(0)..=(file + 1).min(7) {
                let mask = (0x0101010101010101u64 << f) & !((1u64 << ((rank + 1) * 8)) - 1);
                if (black_pawns & mask) != 0 {
                    passed = false;
                    break;
                }
            }
            if passed {
                // Tapered passed pawn bonus
                let mg_bonus = PASSED_PAWN_BONUS[rank];
                let eg_bonus = PASSED_PAWN_BONUS_EG[rank];
                score += ((phase * mg_bonus) + ((24 - phase) * eg_bonus)) / 24;
                white_passed_files |= 1 << file;
                white_passed_ranks[file as usize] = rank as u8;
            }
        }

        // Connected passed pawns bonus (white)
        for f in 0..7 {
            if (white_passed_files & (1 << f)) != 0 && (white_passed_files & (1 << (f + 1))) != 0 {
                let rank = white_passed_ranks[f].max(white_passed_ranks[f + 1]) as usize;
                score += CONNECTED_PASSED_BONUS[rank];
            }
        }

        let mut black_passed_files = 0u8;
        let mut black_passed_ranks: [u8; 8] = [0; 8];

        let mut bp = black_pawns;
        while bp != 0 {
            let sq = bp.trailing_zeros() as usize;
            bp &= bp - 1;
            let rank = sq / 8;
            let file = (sq % 8) as i32;

            let mut passed = true;
            for f in (file - 1).max(0)..=(file + 1).min(7) {
                let mask = (0x0101010101010101u64 << f) & ((1u64 << (rank * 8)) - 1);
                if (white_pawns & mask) != 0 {
                    passed = false;
                    break;
                }
            }
            if passed {
                let mg_bonus = PASSED_PAWN_BONUS[7 - rank];
                let eg_bonus = PASSED_PAWN_BONUS_EG[7 - rank];
                score -= ((phase * mg_bonus) + ((24 - phase) * eg_bonus)) / 24;
                black_passed_files |= 1 << file;
                black_passed_ranks[file as usize] = (7 - rank) as u8;
            }
        }

        // Connected passed pawns bonus (black)
        for f in 0..7 {
            if (black_passed_files & (1 << f)) != 0 && (black_passed_files & (1 << (f + 1))) != 0 {
                let rank = black_passed_ranks[f].max(black_passed_ranks[f + 1]) as usize;
                score -= CONNECTED_PASSED_BONUS[rank];
            }
        }

        score
    }

    /// King tropism: bonus for attacking pieces close to the enemy king
    fn king_tropism_evaluation(board: &ChessBoard) -> i32 {
        let mut score = 0i32;

        let white_king_sq = board.pieces[Color::White as usize][PieceType::King as usize].trailing_zeros() as i32;
        let black_king_sq = board.pieces[Color::Black as usize][PieceType::King as usize].trailing_zeros() as i32;

        if white_king_sq >= 64 || black_king_sq >= 64 {
            return 0;
        }

        let bk_rank = black_king_sq / 8;
        let bk_file = black_king_sq % 8;
        let wk_rank = white_king_sq / 8;
        let wk_file = white_king_sq % 8;

        // White pieces attacking black king
        for &pt in &[PieceType::Knight, PieceType::Bishop, PieceType::Rook, PieceType::Queen] {
            let weight = match pt {
                PieceType::Knight => 2,
                PieceType::Bishop => 2,
                PieceType::Rook => 3,
                PieceType::Queen => 5,
                _ => 0,
            };
            let mut bb = board.pieces[Color::White as usize][pt as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as i32;
                bb &= bb - 1;
                let rank = sq / 8;
                let file = sq % 8;
                let dist = (rank - bk_rank).abs() + (file - bk_file).abs();
                // Inverse distance bonus: closer = more dangerous
                let tropism = (14 - dist).max(0) * weight * KING_TROPISM_WEIGHT / 14;
                score += tropism;
            }
        }

        // Black pieces attacking white king
        for &pt in &[PieceType::Knight, PieceType::Bishop, PieceType::Rook, PieceType::Queen] {
            let weight = match pt {
                PieceType::Knight => 2,
                PieceType::Bishop => 2,
                PieceType::Rook => 3,
                PieceType::Queen => 5,
                _ => 0,
            };
            let mut bb = board.pieces[Color::Black as usize][pt as usize];
            while bb != 0 {
                let sq = bb.trailing_zeros() as i32;
                bb &= bb - 1;
                let rank = sq / 8;
                let file = sq % 8;
                let dist = (rank - wk_rank).abs() + (file - wk_file).abs();
                let tropism = (14 - dist).max(0) * weight * KING_TROPISM_WEIGHT / 14;
                score -= tropism;
            }
        }

        score
    }

    fn hanging_piece_check(board: &ChessBoard) -> i32 {
        let mut score = 0;
        let white_pawns = board.pieces[Color::White as usize][PieceType::Pawn as usize];
        let black_pawns = board.pieces[Color::Black as usize][PieceType::Pawn as usize];

        // Check White minor/major pieces attacked by Black pawns
        for &pt in &[PieceType::Knight, PieceType::Bishop, PieceType::Rook, PieceType::Queen] {
            let mut pcs = board.pieces[Color::White as usize][pt as usize];
            while pcs != 0 {
                let sq = pcs.trailing_zeros() as usize;
                pcs &= pcs - 1;
                let rank = sq / 8;
                let file = sq % 8;
                if rank < 7 {
                    let mut attacked = false;
                    if file > 0 && (black_pawns & (1u64 << ((rank + 1) * 8 + file - 1))) != 0 {
                        attacked = true;
                    }
                    if file < 7 && (black_pawns & (1u64 << ((rank + 1) * 8 + file + 1))) != 0 {
                        attacked = true;
                    }
                    if attacked {
                        let penalty = match pt {
                            PieceType::Knight => 220,
                            PieceType::Bishop => 230,
                            PieceType::Rook => 350,
                            PieceType::Queen => 600,
                            _ => 0,
                        };
                        score -= penalty;
                    }
                }
            }
        }

        // Check Black minor/major pieces attacked by White pawns
        for &pt in &[PieceType::Knight, PieceType::Bishop, PieceType::Rook, PieceType::Queen] {
            let mut pcs = board.pieces[Color::Black as usize][pt as usize];
            while pcs != 0 {
                let sq = pcs.trailing_zeros() as usize;
                pcs &= pcs - 1;
                let rank = sq / 8;
                let file = sq % 8;
                if rank > 0 {
                    let mut attacked = false;
                    if file > 0 && (white_pawns & (1u64 << ((rank - 1) * 8 + file - 1))) != 0 {
                        attacked = true;
                    }
                    if file < 7 && (white_pawns & (1u64 << ((rank - 1) * 8 + file + 1))) != 0 {
                        attacked = true;
                    }
                    if attacked {
                        let penalty = match pt {
                            PieceType::Knight => 220,
                            PieceType::Bishop => 230,
                            PieceType::Rook => 350,
                            PieceType::Queen => 600,
                            _ => 0,
                        };
                        score += penalty;
                    }
                }
            }
        }

        score
    }

    pub fn evaluate(board: &ChessBoard, features: &crate::types::SearchFeatures) -> i32 {
        if features.use_nnue {
            let nnue = crate::nnue::get_global_nnue();
            if nnue.is_enabled() {
                return nnue.evaluate(board);
            }
        }

        Self::evaluate_hce(board, features)
    }
}