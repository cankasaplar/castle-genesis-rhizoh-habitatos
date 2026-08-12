use crate::board::Board;
use crate::types::{Color, Move, PieceType};
use crate::magic::{get_knight_attacks, get_king_attacks};

const PIECE_VALUES: [i32; 6] = [100, 320, 330, 500, 900, 20000];

pub fn get_piece_value(piece: PieceType) -> i32 {
    PIECE_VALUES[piece as usize]
}

/// Compute pawn attacks from a single square for a given color
#[inline(always)]
fn pawn_attacks_from(sq: u8, color: Color) -> u64 {
    let bb = 1u64 << sq;
    match color {
        Color::White => {
            ((bb << 7) & 0x7F7F7F7F7F7F7F7F) | ((bb << 9) & 0xFEFEFEFEFEFEFEFE)
        }
        Color::Black => {
            ((bb >> 7) & 0xFEFEFEFEFEFEFEFE) | ((bb >> 9) & 0x7F7F7F7F7F7F7F7F)
        }
    }
}

/// Compute bishop attacks from a square with given occupancy (classical approach)
#[inline(always)]
fn bishop_attacks(sq: u8, occ: u64) -> u64 {
    let mut attacks = 0u64;
    let rank = (sq / 8) as i8;
    let file = (sq % 8) as i8;

    // NE
    let (mut r, mut f) = (rank + 1, file + 1);
    while r < 8 && f < 8 {
        let bit = 1u64 << (r * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
        r += 1; f += 1;
    }
    // NW
    let (mut r, mut f) = (rank + 1, file - 1);
    while r < 8 && f >= 0 {
        let bit = 1u64 << (r * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
        r += 1; f -= 1;
    }
    // SE
    let (mut r, mut f) = (rank - 1, file + 1);
    while r >= 0 && f < 8 {
        let bit = 1u64 << (r * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
        r -= 1; f += 1;
    }
    // SW
    let (mut r, mut f) = (rank - 1, file - 1);
    while r >= 0 && f >= 0 {
        let bit = 1u64 << (r * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
        r -= 1; f -= 1;
    }
    attacks
}

/// Compute rook attacks from a square with given occupancy (classical approach)
#[inline(always)]
fn rook_attacks(sq: u8, occ: u64) -> u64 {
    let mut attacks = 0u64;
    let rank = (sq / 8) as i8;
    let file = (sq % 8) as i8;

    // North
    for r in (rank + 1)..8 {
        let bit = 1u64 << (r * 8 + file);
        attacks |= bit;
        if occ & bit != 0 { break; }
    }
    // South
    for r in (0..rank).rev() {
        let bit = 1u64 << (r * 8 + file);
        attacks |= bit;
        if occ & bit != 0 { break; }
    }
    // East
    for f in (file + 1)..8 {
        let bit = 1u64 << (rank * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
    }
    // West
    for f in (0..file).rev() {
        let bit = 1u64 << (rank * 8 + f);
        attacks |= bit;
        if occ & bit != 0 { break; }
    }
    attacks
}

/// Get all attackers (both colors) to a given square with occupancy
#[inline]
fn attackers_to(board: &Board, sq: u8, occ: u64) -> u64 {
    let sq_bb = 1u64 << sq;
    let _ = sq_bb;

    let white_pawns = board.pieces[0][PieceType::Pawn as usize];
    let black_pawns = board.pieces[1][PieceType::Pawn as usize];
    let knights = board.pieces[0][PieceType::Knight as usize] | board.pieces[1][PieceType::Knight as usize];
    let bishops = board.pieces[0][PieceType::Bishop as usize] | board.pieces[1][PieceType::Bishop as usize];
    let rooks = board.pieces[0][PieceType::Rook as usize] | board.pieces[1][PieceType::Rook as usize];
    let queens = board.pieces[0][PieceType::Queen as usize] | board.pieces[1][PieceType::Queen as usize];
    let kings = board.pieces[0][PieceType::King as usize] | board.pieces[1][PieceType::King as usize];

    let bishop_like = bishops | queens;
    let rook_like = rooks | queens;

    // Pawn attacks: a white pawn attacks squares diagonally above it
    // So if sq is attacked by white pawns, the pawn is below-left or below-right of sq
    let w_pawn_att = pawn_attacks_from(sq, Color::Black) & white_pawns; // reverse direction
    let b_pawn_att = pawn_attacks_from(sq, Color::White) & black_pawns; // reverse direction

    let knight_att = get_knight_attacks(sq) & knights;
    let king_att = get_king_attacks(sq) & kings;
    let bishop_att = bishop_attacks(sq, occ) & bishop_like;
    let rook_att = rook_attacks(sq, occ) & rook_like;

    w_pawn_att | b_pawn_att | knight_att | bishop_att | rook_att | king_att
}

/// Get the least valuable piece from `attacker_set & color_occ` and return (piece_type, piece_bit)
#[inline]
fn least_valuable_attacker(board: &Board, attacker_set: u64, color: Color) -> Option<(PieceType, u64)> {
    let c = color as usize;
    // Check pieces from least valuable to most valuable
    let piece_order = [
        PieceType::Pawn,
        PieceType::Knight,
        PieceType::Bishop,
        PieceType::Rook,
        PieceType::Queen,
        PieceType::King,
    ];

    for &pt in &piece_order {
        let candidates = board.pieces[c][pt as usize] & attacker_set;
        if candidates != 0 {
            // Pick the least significant bit
            let lsb = candidates & candidates.wrapping_neg();
            return Some((pt, lsb));
        }
    }
    None
}

/// Static Exchange Evaluation (SEE) — bitboard-based with X-ray discovery
/// Returns the net material gain (positive = good for side making the initial capture)
pub fn see_eval(board: &Board, mv: Move) -> i32 {
    let target_sq = mv.to;
    let mut occ = board.combined_occupancy;

    // Initial captured value
    let initial_value = match mv.captured {
        Some(piece) => PIECE_VALUES[piece as usize],
        None => {
            if mv.is_en_passant {
                100 // pawn value
            } else {
                return 0; // not a capture
            }
        }
    };

    // Handle en passant: remove the captured pawn from occupancy
    if mv.is_en_passant {
        let ep_pawn_sq = if board.side_to_move == Color::White {
            mv.to.wrapping_sub(8)
        } else {
            mv.to + 8
        };
        occ &= !(1u64 << ep_pawn_sq);
    }

    // Remove the initial attacker from occupancy
    occ &= !(1u64 << mv.from);
    // Place it on target square (it's now there)
    occ |= 1u64 << target_sq;

    // Get all attackers to the target square after removing initial piece
    let mut attacker_set = attackers_to(board, target_sq, occ) & occ;

    let mut gain = [0i32; 32];
    let mut depth = 0;
    gain[depth] = initial_value;

    let mut current_piece_value = PIECE_VALUES[mv.piece as usize];
    let mut side = board.side_to_move.opposite();

    loop {
        depth += 1;
        // Gain for current side = value of piece on target - previous side's gain
        gain[depth] = current_piece_value - gain[depth - 1];

        // Pruning: if even capturing the piece can't improve the score, bail early
        if (-gain[depth - 1]).max(gain[depth]) < 0 {
            break;
        }

        // Get side-to-move's attackers
        let side_occ = board.color_occupancy[side as usize];
        let side_attackers = attacker_set & side_occ;

        if side_attackers == 0 {
            break;
        }

        // Find least valuable attacker
        if let Some((lva_piece, lva_bit)) = least_valuable_attacker(board, side_attackers, side) {
            current_piece_value = PIECE_VALUES[lva_piece as usize];

            // Remove attacker from occupancy to reveal X-ray attackers
            occ &= !lva_bit;

            // Re-compute sliding attackers (X-ray discovery)
            // Only re-check bishop-like and rook-like since those can be discovered
            let bishop_like = (board.pieces[0][PieceType::Bishop as usize] | board.pieces[1][PieceType::Bishop as usize]
                | board.pieces[0][PieceType::Queen as usize] | board.pieces[1][PieceType::Queen as usize]) & occ;
            let rook_like = (board.pieces[0][PieceType::Rook as usize] | board.pieces[1][PieceType::Rook as usize]
                | board.pieces[0][PieceType::Queen as usize] | board.pieces[1][PieceType::Queen as usize]) & occ;

            // Update attacker set with newly discovered sliders
            attacker_set = (attacker_set & !lva_bit)
                | (bishop_attacks(target_sq, occ) & bishop_like)
                | (rook_attacks(target_sq, occ) & rook_like);
            attacker_set &= occ;

            // Don't capture with king if opponent has remaining attackers
            if lva_piece == PieceType::King {
                let opp_side_attackers = attacker_set & board.color_occupancy[side.opposite() as usize] & occ;
                if opp_side_attackers != 0 {
                    break;
                }
            }

            side = side.opposite();
        } else {
            break;
        }
    }

    // Negamax minimax from the end
    while depth > 0 {
        gain[depth - 1] = gain[depth - 1].min(-gain[depth]);
        depth -= 1;
    }

    gain[0]
}

/// Fast check whether SEE evaluation is >= threshold
pub fn see_ge(board: &Board, mv: Move, threshold: i32) -> bool {
    see_eval(board, mv) >= threshold
}
