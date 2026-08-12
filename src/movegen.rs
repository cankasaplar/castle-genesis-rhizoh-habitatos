use crate::board::Board;
use crate::types::Move;

pub struct MoveGenerator;

impl MoveGenerator {
    /// Board üzerindeki bitboard hamle üretecini çağırır
    pub fn generate_moves(board: &Board) -> Vec<Move> {
        board.generate_moves()
    }
}