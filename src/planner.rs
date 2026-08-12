use crate::board::Board;
use crate::types::{CandidateMove, Color, Move, PieceType, SearchFeatures};
use crate::eval::Evaluator;

#[derive(Debug, Clone)]
pub struct StrategicExplanation {
    pub best_move: String,
    pub score_cp: i32,
    pub strategic_theme: String,
    pub material_balance: i32,
    pub king_safety_assessment: String,
    pub center_control_assessment: String,
    pub refuted_moves: Vec<String>,
}

pub struct RhizohPlanner;

impl RhizohPlanner {
    pub fn explain(board: &Board, candidates: &[CandidateMove], _features: &SearchFeatures) -> StrategicExplanation {
        let best_cand = candidates.first();
        let best_move_str = best_cand.map_or("None".to_string(), |c| c.mv.to_uci());
        let score_cp = best_cand.map_or(0, |c| c.score);

        // 1. Positional Factor Extraction
        let white_mat = Evaluator::count_material(board, Color::White);
        let black_mat = Evaluator::count_material(board, Color::Black);
        let mat_diff = if board.side_to_move == Color::White { white_mat - black_mat } else { black_mat - white_mat };

        let white_king_sq = board.pieces[Color::White as usize][PieceType::King as usize].trailing_zeros() as u8;
        let black_king_sq = board.pieces[Color::Black as usize][PieceType::King as usize].trailing_zeros() as u8;

        let side_king_sq = if board.side_to_move == Color::White { white_king_sq } else { black_king_sq };
        let enemy_king_sq = if board.side_to_move == Color::White { black_king_sq } else { white_king_sq };

        let is_side_castled = side_king_sq == 1 || side_king_sq == 2 || side_king_sq == 6 || side_king_sq == 57 || side_king_sq == 58 || side_king_sq == 62;
        let is_enemy_castled = enemy_king_sq == 1 || enemy_king_sq == 2 || enemy_king_sq == 6 || enemy_king_sq == 57 || enemy_king_sq == 58 || enemy_king_sq == 62;

        let king_safety_assessment = if !is_side_castled {
            "King remains in uncastled center; king safety shield vulnerable to open file attacks.".to_string()
        } else {
            "King is safely castled behind intact pawn shield.".to_string()
        };

        // 2. Center Control Assessment
        let center_squares = [27, 28, 35, 36]; // d4, e4, d5, e5
        let mut side_center_pawns = 0;
        let mut enemy_center_pawns = 0;

        for &sq in &center_squares {
            if board.get_piece_at(sq, board.side_to_move) == Some(PieceType::Pawn) {
                side_center_pawns += 1;
            }
            if board.get_piece_at(sq, board.side_to_move.opposite()) == Some(PieceType::Pawn) {
                enemy_center_pawns += 1;
            }
        }

        let center_control_assessment = if side_center_pawns > enemy_center_pawns {
            format!("Dominant central pawn structure (+{} central pawns).", side_center_pawns - enemy_center_pawns)
        } else if enemy_center_pawns > side_center_pawns {
            format!("Opponent holds central pawn space (+{} central pawns).", enemy_center_pawns - side_center_pawns)
        } else {
            "Balanced central pawn control.".to_string()
        };

        // 3. Strategic Theme Classification
        let strategic_theme = if score_cp > 200 {
            "Decisive Tactical Advantage & Material Conversion".to_string()
        } else if score_cp < -200 {
            "Defensive Consolidation & Counterplay Seeking".to_string()
        } else if !is_side_castled && !is_enemy_castled {
            "Opening Development & Central Pawn Expansion".to_string()
        } else if is_side_castled && !is_enemy_castled {
            "Pawn Storm Attack Against Uncastled King".to_string()
        } else {
            "Middlegame Positional Maneuvering & Piece Activation".to_string()
        };

        // 4. Refuted Alternatives Explanation
        let mut refuted_moves = Vec::new();
        for cand in candidates.iter().skip(1).take(3) {
            let mv_str = cand.mv.to_uci();
            let delta = score_cp - cand.score;
            let explanation = if cand.mv.captured.is_some() && delta > 150 {
                format!("Alternative candidate {} refuted: Bad tactical capture losing material (-{} cp delta).", mv_str, delta)
            } else if delta > 80 {
                format!("Alternative candidate {} deprioritized: Positional concession (-{} cp delta).", mv_str, delta)
            } else {
                format!("Alternative candidate {} sub-optimal: Lower search evaluation (-{} cp delta).", mv_str, delta)
            };
            refuted_moves.push(explanation);
        }

        StrategicExplanation {
            best_move: best_move_str,
            score_cp,
            strategic_theme,
            material_balance: mat_diff,
            king_safety_assessment,
            center_control_assessment,
            refuted_moves,
        }
    }
}
