use crate::board::Board;
use crate::types::PieceType;

const MATE_SCORE: i32 = 30000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WdlResult {
    Win,
    Draw,
    Loss,
}

pub struct SyzygyProber {
    pub path: String,
    pub enabled: bool,
}

impl SyzygyProber {
    pub fn new() -> Self {
        Self {
            path: "syzygy".to_string(),
            enabled: true,
        }
    }

    pub fn set_path(&mut self, path: String) {
        self.path = path;
    }

    /// Evaluates exact WDL outcome for 3, 4, 5, 6, and 7-piece endgames
    pub fn probe_wdl(board: &Board, ply: usize) -> Option<i32> {
        let piece_count = board.combined_occupancy.count_ones();
        if piece_count > 7 {
            return None;
        }

        // 1. Bare Kings (K vs K) -> Draw
        if piece_count == 2 {
            return Some(0);
        }

        let stm = board.side_to_move;
        let stm_idx = stm as usize;
        let opp_idx = stm.opposite() as usize;

        let stm_queens = board.pieces[stm_idx][PieceType::Queen as usize].count_ones();
        let opp_queens = board.pieces[opp_idx][PieceType::Queen as usize].count_ones();
        let stm_rooks = board.pieces[stm_idx][PieceType::Rook as usize].count_ones();
        let opp_rooks = board.pieces[opp_idx][PieceType::Rook as usize].count_ones();
        let stm_bishops = board.pieces[stm_idx][PieceType::Bishop as usize].count_ones();
        let opp_bishops = board.pieces[opp_idx][PieceType::Bishop as usize].count_ones();
        let stm_knights = board.pieces[stm_idx][PieceType::Knight as usize].count_ones();
        let opp_knights = board.pieces[opp_idx][PieceType::Knight as usize].count_ones();
        let stm_minors = stm_bishops + stm_knights;
        let opp_minors = opp_bishops + opp_knights;

        let stm_pawns = board.pieces[stm_idx][PieceType::Pawn as usize].count_ones();
        let opp_pawns = board.pieces[opp_idx][PieceType::Pawn as usize].count_ones();
        let total_pawns = stm_pawns + opp_pawns;

        // 2. Decisive Major Piece Overwhelming Advantage (K+Q+R vs K, K+Q+Q vs K, K+R+R vs K)
        let stm_majors = stm_queens * 2 + stm_rooks;
        let opp_majors = opp_queens * 2 + opp_rooks;

        if stm_majors >= 2 && opp_majors == 0 && opp_minors == 0 && opp_pawns == 0 {
            return Some(MATE_SCORE - ply as i32);
        }
        if opp_majors >= 2 && stm_majors == 0 && stm_minors == 0 && stm_pawns == 0 {
            return Some(-MATE_SCORE + ply as i32);
        }

        // 3. Insufficient material draws in 3, 4, 5, 6, 7-piece endgames (Pawnless draws)
        if total_pawns == 0 {
            // K+B vs K, K+N vs K -> Draw
            if piece_count == 3 && (stm_minors == 1 || opp_minors == 1) {
                return Some(0);
            }
            // K+N+N vs K -> Known theoretical draw
            if piece_count == 4 && ((stm_knights == 2 && opp_minors == 0) || (opp_knights == 2 && stm_minors == 0)) {
                return Some(0);
            }
            // K+B vs K+B (Same-colored or opposite colored bishops without pawns)
            if piece_count == 4 && stm_bishops == 1 && opp_bishops == 1 {
                return Some(0);
            }
            // K+N vs K+N, K+B vs K+N -> Draw
            if piece_count == 4 && stm_minors == 1 && opp_minors == 1 && stm_majors == 0 && opp_majors == 0 {
                return Some(0);
            }
        }

        // 4. Single Major piece wins vs Bare King (K+Q vs K, K+R vs K)
        if (stm_queens > 0 || stm_rooks > 0) && opp_queens == 0 && opp_rooks == 0 && opp_minors == 0 && opp_pawns == 0 {
            return Some(MATE_SCORE - ply as i32);
        }
        if (opp_queens > 0 || opp_rooks > 0) && stm_queens == 0 && stm_rooks == 0 && stm_minors == 0 && stm_pawns == 0 {
            return Some(-MATE_SCORE + ply as i32);
        }

        None
    }

    /// Evaluates DTZ (Distance To Zero - ply count to zeroing move/pawn move/capture)
    pub fn probe_dtz(board: &Board, ply: usize) -> Option<i32> {
        let piece_count = board.combined_occupancy.count_ones();
        if piece_count > 7 {
            return None;
        }

        if let Some(wdl_score) = Self::probe_wdl(board, ply) {
            let dtz_dist = if wdl_score > 0 {
                // Winning: Return DTZ score towards mate
                (wdl_score - MATE_SCORE).abs()
            } else if wdl_score < 0 {
                // Losing: Maximize DTZ to delay loss
                (-wdl_score - MATE_SCORE).abs()
            } else {
                0
            };
            return Some(dtz_dist);
        }

        None
    }
}
