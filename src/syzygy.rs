use std::sync::{LazyLock, RwLock};
use shakmaty::{Chess, CastlingMode, fen::Fen};
use shakmaty_syzygy::{Tablebase, Wdl};
use crate::board::Board;
use crate::types::Move;

const MATE_SCORE: i32 = 30000;
const TB_WIN_SCORE: i32 = 20000;

static TABLEBASE: LazyLock<RwLock<Tablebase<Chess>>> = LazyLock::new(|| {
    let mut tb = Tablebase::new();
    let default_path = std::path::Path::new("syzygy");
    if default_path.is_dir() {
        let _ = tb.add_directory(default_path);
    }
    RwLock::new(tb)
});

pub struct SyzygyProber;

impl SyzygyProber {
    pub fn set_path(path: &str) -> usize {
        if let Ok(mut tb) = TABLEBASE.write() {
            *tb = Tablebase::new();
            let _ = tb.add_directory(path);
            tb.max_pieces()
        } else {
            0
        }
    }

    pub fn max_pieces() -> usize {
        TABLEBASE.read().map(|tb| tb.max_pieces()).unwrap_or(0)
    }

    /// Evaluates exact WDL outcome for positions up to max_pieces
    /// Returns Some(score) ONLY when a genuine tablebase file yields an exact outcome.
    /// Otherwise returns None so the search falls back naturally to normal NNUE/search.
    pub fn probe_wdl(board: &Board, ply: usize, max_pieces: usize) -> Option<i32> {
        let piece_count = board.combined_occupancy.count_ones() as usize;
        if piece_count > max_pieces || piece_count < 2 {
            return None;
        }

        // Bare Kings (K vs K) is universally a theoretical draw
        if piece_count == 2 {
            return Some(0);
        }

        let tb_guard = TABLEBASE.read().ok()?;
        if tb_guard.max_pieces() < piece_count {
            return None;
        }

        let fen_str = board.to_fen();
        let fen = fen_str.parse::<Fen>().ok()?;
        let pos: Chess = fen.into_position(CastlingMode::Standard).ok()?;

        let wdl = tb_guard.probe_wdl_after_zeroing(&pos).ok()?;
        Some(match wdl {
            Wdl::Win => TB_WIN_SCORE - ply as i32,
            Wdl::Loss => -TB_WIN_SCORE + ply as i32,
            Wdl::Draw => 0,
            Wdl::BlessedLoss => 0,
            Wdl::CursedWin => 0,
        })
    }

    /// Probes root moves for optimal tablebase play (DTZ-guided)
    /// Returns Some((best_move, score)) ONLY when genuine tablebases resolve the root.
    pub fn probe_root(board: &Board, legal_moves: &[Move], max_pieces: usize) -> Option<(Move, i32)> {
        let piece_count = board.combined_occupancy.count_ones() as usize;
        if piece_count > max_pieces || piece_count < 2 || legal_moves.is_empty() {
            return None;
        }

        let tb_guard = TABLEBASE.read().ok()?;
        if tb_guard.max_pieces() < piece_count {
            return None;
        }

        let fen_str = board.to_fen();
        let fen = fen_str.parse::<Fen>().ok()?;
        let pos: Chess = fen.into_position(CastlingMode::Standard).ok()?;

        if let Some((shak_mv, dtz_res)) = tb_guard.best_move(&pos).ok().flatten() {
            let from_sq = shak_mv.from().map(|s| s as u8).unwrap_or(0);
            let to_sq = shak_mv.to() as u8;
            if let Some(&mv) = legal_moves.iter().find(|m| m.from == from_sq && m.to == to_sq) {
                let dtz_val = dtz_res.ignore_rounding().0;
                let score = if dtz_val > 0 {
                    TB_WIN_SCORE - dtz_val
                } else if dtz_val < 0 {
                    -TB_WIN_SCORE - dtz_val
                } else {
                    0
                };
                return Some((mv, score));
            }
        }

        None
    }

    /// Evaluates DTZ (Distance To Zero)
    pub fn probe_dtz(board: &Board, max_pieces: usize) -> Option<i32> {
        let piece_count = board.combined_occupancy.count_ones() as usize;
        if piece_count > max_pieces || piece_count < 2 {
            return None;
        }

        let tb_guard = TABLEBASE.read().ok()?;
        if tb_guard.max_pieces() < piece_count {
            return None;
        }

        let fen_str = board.to_fen();
        let fen = fen_str.parse::<Fen>().ok()?;
        let pos: Chess = fen.into_position(CastlingMode::Standard).ok()?;

        let dtz = tb_guard.probe_dtz(&pos).ok()?;
        Some(dtz.ignore_rounding().0)
    }
}
