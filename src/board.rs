use crate::types::{Color, Move, PieceType, GameResult};
use crate::magic::{get_king_attacks, get_knight_attacks};

#[derive(Debug, Clone)]
pub struct Board {
    pub pieces: [[u64; 6]; 2],
    pub color_occupancy: [u64; 2],
    pub combined_occupancy: u64,
    pub side_to_move: Color,
    pub en_passant_square: Option<u8>,
    pub castling_rights: u8,
    pub halfmove_clock: u8,
    pub fullmove_number: u16,
    pub accumulator: Option<crate::nnue::Accumulator>,
}

impl Board {
    pub fn new() -> Self {
        let mut board = Board {
            pieces: [[0; 6]; 2],
            color_occupancy: [0; 2],
            combined_occupancy: 0,
            side_to_move: Color::White,
            en_passant_square: None,
            castling_rights: 0b1111,
            halfmove_clock: 0,
            fullmove_number: 1,
            accumulator: None,
        };
        board.setup_start_position();
        board.accumulator = Some(crate::nnue::get_global_nnue().compute_accumulator(&board));
        board
    }

    pub fn setup_start_position(&mut self) {
        self.pieces[Color::White as usize][PieceType::Pawn as usize]   = 0x000000000000FF00;
        self.pieces[Color::White as usize][PieceType::Rook as usize]   = 0x0000000000000081;
        self.pieces[Color::White as usize][PieceType::Knight as usize] = 0x0000000000000042;
        self.pieces[Color::White as usize][PieceType::Bishop as usize] = 0x0000000000000024;
        self.pieces[Color::White as usize][PieceType::Queen as usize]  = 0x0000000000000008;
        self.pieces[Color::White as usize][PieceType::King as usize]   = 0x0000000000000010;

        self.pieces[Color::Black as usize][PieceType::Pawn as usize]   = 0x00FF000000000000;
        self.pieces[Color::Black as usize][PieceType::Rook as usize]   = 0x8100000000000000;
        self.pieces[Color::Black as usize][PieceType::Knight as usize] = 0x4200000000000000;
        self.pieces[Color::Black as usize][PieceType::Bishop as usize] = 0x2400000000000000;
        self.pieces[Color::Black as usize][PieceType::Queen as usize]  = 0x0800000000000000;
        self.pieces[Color::Black as usize][PieceType::King as usize]   = 0x1000000000000000;

        self.update_occupancies();
    }

    #[inline(always)]
    pub fn update_occupancies(&mut self) {
        self.color_occupancy[Color::White as usize] = 0;
        for piece_bb in self.pieces[Color::White as usize].iter() {
            self.color_occupancy[Color::White as usize] |= piece_bb;
        }

        self.color_occupancy[Color::Black as usize] = 0;
        for piece_bb in self.pieces[Color::Black as usize].iter() {
            self.color_occupancy[Color::Black as usize] |= piece_bb;
        }

        self.combined_occupancy = self.color_occupancy[Color::White as usize] 
                                | self.color_occupancy[Color::Black as usize];
    }

    /// Açılış kitabı (OpeningBook) sorguları için Zobrist anahtarını döndürür
    #[inline(always)]
    pub fn get_zobrist_key(&self) -> u64 {
        crate::zobrist::get_zobrist_instance().generate_hash(self)
    }

    /// Polyglot (.bin) açılış kitapları için standart Polyglot Zobrist anahtarını döndürür
    #[inline(always)]
    pub fn get_polyglot_key(&self) -> u64 {
        crate::zobrist::get_polyglot_hash(self)
    }

    #[inline(always)]
    pub fn is_legal(&self, mv: &Move) -> bool {
        let legal_moves = self.generate_moves();
        legal_moves.contains(mv)
    }

    #[inline(always)]
    pub fn is_legal_u16(&self, mv_u16: u16) -> Option<Move> {
        let legal_moves = self.generate_moves();
        legal_moves.into_iter().find(|m| {
            let u16_val = ((m.from as u16) << 6) | (m.to as u16);
            u16_val == mv_u16
        })
    }

    pub fn to_fen(&self) -> String {
        let mut fen = String::new();
        for r in (0..8).rev() {
            let mut empty_cnt = 0;
            for f in 0..8 {
                let sq = r * 8 + f;
                let mut found_piece = None;
                for c_idx in 0..2 {
                    let color = if c_idx == 0 { Color::White } else { Color::Black };
                    if let Some(p_type) = self.get_piece_at(sq, color) {
                        found_piece = Some((p_type, color));
                        break;
                    }
                }
                if let Some((p_type, color)) = found_piece {
                    if empty_cnt > 0 {
                        fen.push_str(&empty_cnt.to_string());
                        empty_cnt = 0;
                    }
                    let ch = match p_type {
                        PieceType::Pawn => 'p',
                        PieceType::Knight => 'n',
                        PieceType::Bishop => 'b',
                        PieceType::Rook => 'r',
                        PieceType::Queen => 'q',
                        PieceType::King => 'k',
                    };
                    let char_c = if color == Color::White { ch.to_ascii_uppercase() } else { ch };
                    fen.push(char_c);
                } else {
                    empty_cnt += 1;
                }
            }
            if empty_cnt > 0 {
                fen.push_str(&empty_cnt.to_string());
            }
            if r > 0 {
                fen.push('/');
            }
        }
        let stm = if self.side_to_move == Color::White { "w" } else { "b" };
        let mut castling = String::new();
        if (self.castling_rights & 0b0001) != 0 { castling.push('K'); }
        if (self.castling_rights & 0b0010) != 0 { castling.push('Q'); }
        if (self.castling_rights & 0b0100) != 0 { castling.push('k'); }
        if (self.castling_rights & 0b1000) != 0 { castling.push('q'); }
        if castling.is_empty() { castling.push('-'); }

        let ep = if let Some(sq) = self.en_passant_square {
            let files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            let ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
            format!("{}{}", files[(sq % 8) as usize], ranks[(sq / 8) as usize])
        } else {
            "-".to_string()
        };

        format!("{} {} {} {} {} {}", fen, stm, castling, ep, self.halfmove_clock, self.fullmove_number)
    }

    pub fn get_piece_at(&self, square: u8, color: Color) -> Option<PieceType> {
        let bit = 1u64 << square;
        let c_idx = color as usize;
        for p_idx in 0..6 {
            if (self.pieces[c_idx][p_idx] & bit) != 0 {
                return match p_idx {
                    0 => Some(PieceType::Pawn),
                    1 => Some(PieceType::Knight),
                    2 => Some(PieceType::Bishop),
                    3 => Some(PieceType::Rook),
                    4 => Some(PieceType::Queen),
                    5 => Some(PieceType::King),
                    _ => None,
                };
            }
        }
        None
    }

    pub fn from_fen(fen: &str) -> Self {
        let mut board = Board {
            pieces: [[0; 6]; 2],
            color_occupancy: [0; 2],
            combined_occupancy: 0,
            side_to_move: Color::White,
            en_passant_square: None,
            castling_rights: 0,
            halfmove_clock: 0,
            fullmove_number: 1,
            accumulator: None,
        };

        let parts: Vec<&str> = fen.split_whitespace().collect();
        if parts.is_empty() { return board; }

        let rows: Vec<&str> = parts[0].split('/').collect();
        for (r, row_str) in rows.iter().enumerate() {
            let rank = 7 - r;
            let mut file = 0;
            for ch in row_str.chars() {
                if let Some(digit) = ch.to_digit(10) {
                    file += digit as usize;
                } else {
                    let color = if ch.is_uppercase() { Color::White } else { Color::Black };
                    let piece_type = match ch.to_ascii_lowercase() {
                        'p' => PieceType::Pawn,
                        'n' => PieceType::Knight,
                        'b' => PieceType::Bishop,
                        'r' => PieceType::Rook,
                        'q' => PieceType::Queen,
                        'k' => PieceType::King,
                        _ => continue,
                    };
                    let square = rank * 8 + file;
                    board.pieces[color as usize][piece_type as usize] |= 1u64 << square;
                    file += 1;
                }
            }
        }

        if parts.len() > 1 {
            board.side_to_move = if parts[1] == "w" { Color::White } else { Color::Black };
        }

        if parts.len() > 2 {
            let castling_str = parts[2];
            let mut rights = 0;
            if castling_str.contains('K') { rights |= 0b0001; }
            if castling_str.contains('Q') { rights |= 0b0010; }
            if castling_str.contains('k') { rights |= 0b0100; }
            if castling_str.contains('q') { rights |= 0b1000; }
            board.castling_rights = rights;
        }

        if parts.len() > 3 && parts[3] != "-" {
            let ep_file = parts[3].chars().next().unwrap() as u8 - b'a';
            let ep_rank = parts[3].chars().nth(1).unwrap() as u8 - b'1';
            board.en_passant_square = Some(ep_rank * 8 + ep_file);
        }

        board.update_occupancies();
        board.accumulator = Some(crate::nnue::get_global_nnue().compute_accumulator(&board));
        board
    }

    pub fn generate_moves(&self) -> Vec<Move> {
        let mut pseudo_moves = Vec::new();
        let us = self.side_to_move;
        let us_idx = us as usize;
        let enemy = us.opposite();
        let our_pieces = self.color_occupancy[us_idx];
        let empty = !self.combined_occupancy;
        let enemy_pieces = self.color_occupancy[enemy as usize];

        // 1. Piyonlar
        let pawns = self.pieces[us_idx][PieceType::Pawn as usize];
        if us == Color::White {
            let single_push = (pawns << 8) & empty;
            let mut temp = single_push;
            while temp != 0 {
                let to = temp.trailing_zeros() as u8;
                let from = to - 8;
                if to >= 56 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp &= temp - 1;
            }

            let double_push = (((pawns & 0x000000000000FF00) << 8) & empty) << 8 & empty;
            let mut temp_double = double_push;
            while temp_double != 0 {
                let to = temp_double.trailing_zeros() as u8;
                let from = to - 16;
                pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: true });
                temp_double &= temp_double - 1;
            }

            let attacks_left = (pawns << 7) & enemy_pieces & !0x8080808080808080;
            let mut temp_left = attacks_left;
            while temp_left != 0 {
                let to = temp_left.trailing_zeros() as u8;
                let from = to - 7;
                let captured = self.get_piece_at(to, enemy);
                if to >= 56 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp_left &= temp_left - 1;
            }

            let attacks_right = (pawns << 9) & enemy_pieces & !0x0101010101010101;
            let mut temp_right = attacks_right;
            while temp_right != 0 {
                let to = temp_right.trailing_zeros() as u8;
                let from = to - 9;
                let captured = self.get_piece_at(to, enemy);
                if to >= 56 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp_right &= temp_right - 1;
            }
        } else {
            let single_push = (pawns >> 8) & empty;
            let mut temp = single_push;
            while temp != 0 {
                let to = temp.trailing_zeros() as u8;
                let from = to + 8;
                if to <= 7 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp &= temp - 1;
            }

            let double_push = (((pawns & 0x00FF000000000000) >> 8) & empty) >> 8 & empty;
            let mut temp_double = double_push;
            while temp_double != 0 {
                let to = temp_double.trailing_zeros() as u8;
                let from = to + 16;
                pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: true });
                temp_double &= temp_double - 1;
            }

            let attacks_left = (pawns >> 9) & enemy_pieces & !0x8080808080808080;
            let mut temp_left = attacks_left;
            while temp_left != 0 {
                let to = temp_left.trailing_zeros() as u8;
                let from = to + 9;
                let captured = self.get_piece_at(to, enemy);
                if to <= 7 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp_left &= temp_left - 1;
            }

            let attacks_right = (pawns >> 7) & enemy_pieces & !0x0101010101010101;
            let mut temp_right = attacks_right;
            while temp_right != 0 {
                let to = temp_right.trailing_zeros() as u8;
                let from = to + 7;
                let captured = self.get_piece_at(to, enemy);
                if to <= 7 {
                    for promo in &[PieceType::Queen, PieceType::Rook, PieceType::Bishop, PieceType::Knight] {
                        pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: Some(*promo), is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    }
                } else {
                    pseudo_moves.push(Move { from, to, piece: PieceType::Pawn, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                }
                temp_right &= temp_right - 1;
            }
        }

        // En Passant captures
        if let Some(ep_sq) = self.en_passant_square {
            let pawns = self.pieces[us_idx][PieceType::Pawn as usize];
            if us == Color::White {
                if ep_sq % 8 != 0 && ep_sq >= 9 {
                    let from = ep_sq - 9;
                    if (pawns & (1u64 << from)) != 0 && (from % 8 < ep_sq % 8) {
                        pseudo_moves.push(Move { from, to: ep_sq, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: true, is_castling: false, is_double_pawn_push: false });
                    }
                }
                if ep_sq % 8 != 7 && ep_sq >= 7 {
                    let from = ep_sq - 7;
                    if (pawns & (1u64 << from)) != 0 && (from % 8 > ep_sq % 8) {
                        pseudo_moves.push(Move { from, to: ep_sq, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: true, is_castling: false, is_double_pawn_push: false });
                    }
                }
            } else {
                if ep_sq % 8 != 7 && ep_sq + 9 < 64 {
                    let from = ep_sq + 9;
                    if (pawns & (1u64 << from)) != 0 && (from % 8 > ep_sq % 8) {
                        pseudo_moves.push(Move { from, to: ep_sq, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: true, is_castling: false, is_double_pawn_push: false });
                    }
                }
                if ep_sq % 8 != 0 && ep_sq + 7 < 64 {
                    let from = ep_sq + 7;
                    if (pawns & (1u64 << from)) != 0 && (from % 8 < ep_sq % 8) {
                        pseudo_moves.push(Move { from, to: ep_sq, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: true, is_castling: false, is_double_pawn_push: false });
                    }
                }
            }
        }

        // 2. Atlar
        let knights = self.pieces[us_idx][PieceType::Knight as usize];
        let mut temp_knights = knights;
        while temp_knights != 0 {
            let from = temp_knights.trailing_zeros() as u8;
            let attacks = get_knight_attacks(from) & !our_pieces;
            let mut temp_attacks = attacks;
            while temp_attacks != 0 {
                let to = temp_attacks.trailing_zeros() as u8;
                let captured = self.get_piece_at(to, enemy);
                pseudo_moves.push(Move { from, to, piece: PieceType::Knight, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_attacks &= temp_attacks - 1;
            }
            temp_knights &= temp_knights - 1;
        }

        // 3. Şah ve Rok Hamleleri
        let king = self.pieces[us_idx][PieceType::King as usize];
        if king != 0 {
            let from = king.trailing_zeros() as u8;
            let attacks = get_king_attacks(from) & !our_pieces;
            let mut temp_attacks = attacks;
            while temp_attacks != 0 {
                let to = temp_attacks.trailing_zeros() as u8;
                let captured = self.get_piece_at(to, enemy);
                pseudo_moves.push(Move { from, to, piece: PieceType::King, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_attacks &= temp_attacks - 1;
            }

            // Rok Kontrolleri
            if !self.is_king_in_check(us) {
                if us == Color::White {
                    // Beyaz Kısa Rok (K)
                    if (self.castling_rights & 0b0001) != 0 
                        && (self.combined_occupancy & ((1u64 << 5) | (1u64 << 6))) == 0 
                        && !self.is_square_attacked(5, Color::Black) 
                        && !self.is_square_attacked(6, Color::Black) {
                        pseudo_moves.push(Move { from: 4, to: 6, piece: PieceType::King, captured: None, promotion: None, is_en_passant: false, is_castling: true, is_double_pawn_push: false });
                    }
                    // Beyaz Uzun Rok (Q)
                    if (self.castling_rights & 0b0010) != 0 
                        && (self.combined_occupancy & ((1u64 << 1) | (1u64 << 2) | (1u64 << 3))) == 0 
                        && !self.is_square_attacked(3, Color::Black) 
                        && !self.is_square_attacked(2, Color::Black) {
                        pseudo_moves.push(Move { from: 4, to: 2, piece: PieceType::King, captured: None, promotion: None, is_en_passant: false, is_castling: true, is_double_pawn_push: false });
                    }
                } else {
                    // Siyah Kısa Rok (k)
                    if (self.castling_rights & 0b0100) != 0 
                        && (self.combined_occupancy & ((1u64 << 61) | (1u64 << 62))) == 0 
                        && !self.is_square_attacked(61, Color::White) 
                        && !self.is_square_attacked(62, Color::White) {
                        pseudo_moves.push(Move { from: 60, to: 62, piece: PieceType::King, captured: None, promotion: None, is_en_passant: false, is_castling: true, is_double_pawn_push: false });
                    }
                    // Siyah Uzun Rok (q)
                    if (self.castling_rights & 0b1000) != 0 
                        && (self.combined_occupancy & ((1u64 << 57) | (1u64 << 58) | (1u64 << 59))) == 0 
                        && !self.is_square_attacked(59, Color::White) 
                        && !self.is_square_attacked(58, Color::White) {
                        pseudo_moves.push(Move { from: 60, to: 58, piece: PieceType::King, captured: None, promotion: None, is_en_passant: false, is_castling: true, is_double_pawn_push: false });
                    }
                }
            }
        }

        // 4. Kaleler
        let rooks = self.pieces[us_idx][PieceType::Rook as usize];
        let mut temp_rooks = rooks;
        while temp_rooks != 0 {
            let from = temp_rooks.trailing_zeros() as u8;
            for &step in &[8, -8, 1, -1] {
                let mut to = from as i32 + step;
                while to >= 0 && to < 64 {
                    if (step == 1 || step == -1) && (to / 8 != (to - step) / 8) { break; }
                    let to_u8 = to as u8;
                    let target_bit = 1u64 << to_u8;
                    if (our_pieces & target_bit) != 0 { break; }
                    let captured = self.get_piece_at(to_u8, enemy);
                    pseudo_moves.push(Move { from, to: to_u8, piece: PieceType::Rook, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    if captured.is_some() { break; }
                    to += step;
                }
            }
            temp_rooks &= temp_rooks - 1;
        }

        // 5. Filler
        let bishops = self.pieces[us_idx][PieceType::Bishop as usize];
        let mut temp_bishops = bishops;
        while temp_bishops != 0 {
            let from = temp_bishops.trailing_zeros() as u8;
            for &step in &[9, -9, 7, -7] {
                let mut to = from as i32 + step;
                while to >= 0 && to < 64 {
                    let prev_file = (to - step) % 8;
                    let curr_file = to % 8;
                    if (prev_file - curr_file).abs() > 1 { break; }
                    let to_u8 = to as u8;
                    let target_bit = 1u64 << to_u8;
                    if (our_pieces & target_bit) != 0 { break; }
                    let captured = self.get_piece_at(to_u8, enemy);
                    pseudo_moves.push(Move { from, to: to_u8, piece: PieceType::Bishop, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    if captured.is_some() { break; }
                    to += step;
                }
            }
            temp_bishops &= temp_bishops - 1;
        }

        // 6. Vezirler
        let queens = self.pieces[us_idx][PieceType::Queen as usize];
        let mut temp_queens = queens;
        while temp_queens != 0 {
            let from = temp_queens.trailing_zeros() as u8;
            for &step in &[8_i32, -8, 1, -1, 9, -9, 7, -7] {
                let mut to = from as i32 + step;
                while to >= 0 && to < 64 {
                    if (step == 1 || step == -1) && (to / 8 != (to - step) / 8) { break; }
                    let prev_file = (to - step) % 8;
                    let curr_file = to % 8;
                    if (step.abs() == 7 || step.abs() == 9) && (prev_file - curr_file).abs() > 1 { break; }
                    let to_u8 = to as u8;
                    let target_bit = 1u64 << to_u8;
                    if (our_pieces & target_bit) != 0 { break; }
                    let captured = self.get_piece_at(to_u8, enemy);
                    pseudo_moves.push(Move { from, to: to_u8, piece: PieceType::Queen, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    if captured.is_some() { break; }
                    to += step;
                }
            }
            temp_queens &= temp_queens - 1;
        }

        // Legal filtre
        pseudo_moves.into_iter().filter(|mv| {
            let mut test_board = self.clone();
            test_board.make_move(*mv);
            !test_board.is_king_in_check(us)
        }).collect()
    }

    pub fn is_square_attacked(&self, square: u8, attacker_color: Color) -> bool {
        let att_idx = attacker_color as usize;
        let sq_bit = 1u64 << square;

        if (get_knight_attacks(square) & self.pieces[att_idx][PieceType::Knight as usize]) != 0 { return true; }
        if (get_king_attacks(square) & self.pieces[att_idx][PieceType::King as usize]) != 0 { return true; }

        let pawns = self.pieces[att_idx][PieceType::Pawn as usize];
        let pawn_attacks = if attacker_color == Color::White {
            ((pawns << 7) & !0x8080808080808080) | ((pawns << 9) & !0x0101010101010101)
        } else {
            ((pawns >> 7) & !0x0101010101010101) | ((pawns >> 9) & !0x8080808080808080)
        };
        if (pawn_attacks & sq_bit) != 0 { return true; }

        let rooks_queens = self.pieces[att_idx][PieceType::Rook as usize] | self.pieces[att_idx][PieceType::Queen as usize];
        if rooks_queens != 0 {
            for &step in &[8, -8, 1, -1] {
                let mut to = square as i32 + step;
                while to >= 0 && to < 64 {
                    if (step == 1 || step == -1) && (to / 8 != (to - step) / 8) { break; }
                    let bit = 1u64 << to;
                    if (rooks_queens & bit) != 0 { return true; }
                    if (self.combined_occupancy & bit) != 0 { break; }
                    to += step;
                }
            }
        }

        let bishops_queens = self.pieces[att_idx][PieceType::Bishop as usize] | self.pieces[att_idx][PieceType::Queen as usize];
        if bishops_queens != 0 {
            for &step in &[9, -9, 7, -7] {
                let mut to = square as i32 + step;
                while to >= 0 && to < 64 {
                    let prev_file = (to - step) % 8;
                    let curr_file = to % 8;
                    if (prev_file - curr_file).abs() > 1 { break; }
                    let bit = 1u64 << to;
                    if (bishops_queens & bit) != 0 { return true; }
                    if (self.combined_occupancy & bit) != 0 { break; }
                    to += step;
                }
            }
        }

        false
    }

    pub fn is_king_in_check(&self, color: Color) -> bool {
        let king_bb = self.pieces[color as usize][PieceType::King as usize];
        if king_bb == 0 { return false; }
        let king_sq = king_bb.trailing_zeros() as u8;
        self.is_square_attacked(king_sq, color.opposite())
    }

    pub fn make_move(&mut self, mv: Move) {
        let us = self.side_to_move as usize;
        let them = self.side_to_move.opposite() as usize;
        let from_bit = 1u64 << mv.from;
        let to_bit = 1u64 << mv.to;

        self.pieces[us][mv.piece as usize] &= !from_bit;
        
        if let Some(promo) = mv.promotion {
            self.pieces[us][promo as usize] |= to_bit;
        } else {
            self.pieces[us][mv.piece as usize] |= to_bit;
        }

        if mv.is_en_passant {
            let ep_cap_sq = if self.side_to_move == Color::White { mv.to - 8 } else { mv.to + 8 };
            self.pieces[them][PieceType::Pawn as usize] &= !(1u64 << ep_cap_sq);
        } else if let Some(captured_type) = mv.captured {
            self.pieces[them][captured_type as usize] &= !to_bit;
        }

        if mv.is_double_pawn_push {
            self.en_passant_square = Some(if self.side_to_move == Color::White { mv.from + 8 } else { mv.from - 8 });
        } else {
            self.en_passant_square = None;
        }

        // Rok durumunda kaleyi hareket ettir
        if mv.is_castling {
            match mv.to {
                6 => { // Beyaz Kısa Rok
                    self.pieces[us][PieceType::Rook as usize] &= !(1u64 << 7);
                    self.pieces[us][PieceType::Rook as usize] |= 1u64 << 5;
                }
                2 => { // Beyaz Uzun Rok
                    self.pieces[us][PieceType::Rook as usize] &= !(1u64 << 0);
                    self.pieces[us][PieceType::Rook as usize] |= 1u64 << 3;
                }
                62 => { // Siyah Kısa Rok
                    self.pieces[us][PieceType::Rook as usize] &= !(1u64 << 63);
                    self.pieces[us][PieceType::Rook as usize] |= 1u64 << 61;
                }
                58 => { // Siyah Uzun Rok
                    self.pieces[us][PieceType::Rook as usize] &= !(1u64 << 56);
                    self.pieces[us][PieceType::Rook as usize] |= 1u64 << 59;
                }
                _ => {}
            }
        }

        // Rok haklarını güncelle
        if mv.piece == PieceType::King {
            if self.side_to_move == Color::White {
                self.castling_rights &= !0b0011;
            } else {
                self.castling_rights &= !0b1100;
            }
        }
        if mv.from == 0 || mv.to == 0 { self.castling_rights &= !0b0010; }
        if mv.from == 7 || mv.to == 7 { self.castling_rights &= !0b0001; }
        if mv.from == 56 || mv.to == 56 { self.castling_rights &= !0b1000; }
        if mv.from == 63 || mv.to == 63 { self.castling_rights &= !0b0100; }

        if mv.piece == PieceType::King {
            self.accumulator = None;
        } else if let Some(ref mut acc) = self.accumulator {
            let captured_info = if mv.is_en_passant {
                let ep_sq = if self.side_to_move == Color::White { mv.to - 8 } else { mv.to + 8 };
                Some((PieceType::Pawn, self.side_to_move.opposite(), ep_sq))
            } else {
                mv.captured.map(|cap| (cap, self.side_to_move.opposite(), mv.to))
            };
            let w_king_sq = (self.pieces[Color::White as usize][PieceType::King as usize]).trailing_zeros() as u8;
            let nnue = crate::nnue::get_global_nnue();
            nnue.update_accumulator_move(acc, mv.piece, self.side_to_move, mv.from, mv.to, captured_info, mv.promotion, mv.is_castling, w_king_sq);
        }

        self.side_to_move = self.side_to_move.opposite();
        self.update_occupancies();
    }

    pub fn game_result(&self) -> GameResult {
        let legal_moves = self.generate_moves();
        
        if legal_moves.is_empty() {
            if self.is_king_in_check(self.side_to_move) {
                return GameResult::Checkmate(self.side_to_move.opposite());
            } else {
                return GameResult::Stalemate;
            }
        }
        
        if self.halfmove_clock >= 100 {
            return GameResult::Draw50Move;
        }

        GameResult::Ongoing
    }

    pub fn perft(&self, depth: u8) -> u64 {
        if depth == 0 { return 1; }
        let moves = self.generate_moves();
        if depth == 1 { return moves.len() as u64; }
        let mut nodes = 0;
        for mv in moves {
            let mut next_board = self.clone();
            next_board.make_move(mv);
            nodes += next_board.perft(depth - 1);
        }
        nodes
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_board_make_unmake_integrity() {
        let board = Board::new();
        let moves = board.generate_moves();
        for mv in moves {
            let mut test_board = board.clone();
            let original_hash = test_board.get_zobrist_key();
            test_board.make_move(mv);
            let next_hash = test_board.get_zobrist_key();
            assert_ne!(original_hash, next_hash, "Zobrist hash must change after move");
        }
    }

    #[test]
    fn test_side_to_move_eval_perspective() {
        let board = Board::new();
        let features = crate::types::SearchFeatures::default();
        let eval_w = crate::eval::Evaluator::evaluate(&board, &features);
        let mut board_b = board.clone();
        board_b.side_to_move = Color::Black;
        let eval_b = crate::eval::Evaluator::evaluate(&board_b, &features);
        assert_eq!(eval_w, -eval_b, "Evaluation must flip sign for opposite side to move");
    }
}