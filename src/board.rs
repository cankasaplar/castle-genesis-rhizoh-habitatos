use crate::types::{Color, PieceType, Move};
use crate::magic::{get_knight_attacks, get_king_attacks};

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
        };
        board.setup_start_position();
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
            let rights_str = parts[2];
            if rights_str != "-" {
                if rights_str.contains('K') { board.castling_rights |= 1 << 0; }
                if rights_str.contains('Q') { board.castling_rights |= 1 << 1; }
                if rights_str.contains('k') { board.castling_rights |= 1 << 2; }
                if rights_str.contains('q') { board.castling_rights |= 1 << 3; }
            }
        }

        if parts.len() > 3 {
            let ep_str = parts[3];
            if ep_str != "-" && ep_str.len() == 2 {
                let bytes = ep_str.as_bytes();
                let file = (bytes[0] - b'a') as u8;
                let rank = (bytes[1] - b'1') as u8;
                board.en_passant_square = Some(rank * 8 + file);
            }
        }

        board.update_occupancies();
        board
    }

    pub fn generate_moves(&self) -> Vec<Move> {
        let mut moves = Vec::new();
        let us = self.side_to_move;
        let us_idx = us as usize;
        let our_pieces = self.color_occupancy[us_idx];
        let empty = !self.combined_occupancy;
        let enemy_pieces = self.color_occupancy[us.opposite() as usize];

        // 1. Piyonlar
        let pawns = self.pieces[us_idx][PieceType::Pawn as usize];
        if us == Color::White {
            // Tek kare push
            let single_push = (pawns << 8) & empty;
            let mut temp = single_push;
            while temp != 0 {
                let to = temp.trailing_zeros() as u8;
                let from = to - 8;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp &= temp - 1;
            }

            // Çift kare push
            let double_push = (((pawns & 0x000000000000FF00) << 8) & empty) << 8 & empty;
            let mut temp_double = double_push;
            while temp_double != 0 {
                let to = temp_double.trailing_zeros() as u8;
                let from = to - 16;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: true });
                temp_double &= temp_double - 1;
            }

            // Çapraz Taş Alma (Beyaz sağ-sol ataklar, taş taşmasını önlemek için A ve H dikey maskeleri hariç)
            let attacks_left = (pawns << 7) & enemy_pieces & !0x8080808080808080;
            let mut temp_left = attacks_left;
            while temp_left != 0 {
                let to = temp_left.trailing_zeros() as u8;
                let from = to - 7;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_left &= temp_left - 1;
            }

            let attacks_right = (pawns << 9) & enemy_pieces & !0x0101010101010101;
            let mut temp_right = attacks_right;
            while temp_right != 0 {
                let to = temp_right.trailing_zeros() as u8;
                let from = to - 9;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_right &= temp_right - 1;
            }
        } else {
            // Siyah Piyon: Tek kare aşağı push
            let single_push = (pawns >> 8) & empty;
            let mut temp = single_push;
            while temp != 0 {
                let to = temp.trailing_zeros() as u8;
                let from = to + 8;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp &= temp - 1;
            }

            // Siyah Piyon: Çift kare aşağı push
            let double_push = (((pawns & 0x00FF000000000000) >> 8) & empty) >> 8 & empty;
            let mut temp_double = double_push;
            while temp_double != 0 {
                let to = temp_double.trailing_zeros() as u8;
                let from = to + 16;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: None, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: true });
                temp_double &= temp_double - 1;
            }

            // Siyah Çapraz Taş Alma
            let attacks_left = (pawns >> 9) & enemy_pieces & !0x8080808080808080;
            let mut temp_left = attacks_left;
            while temp_left != 0 {
                let to = temp_left.trailing_zeros() as u8;
                let from = to + 9;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_left &= temp_left - 1;
            }

            let attacks_right = (pawns >> 7) & enemy_pieces & !0x0101010101010101;
            let mut temp_right = attacks_right;
            while temp_right != 0 {
                let to = temp_right.trailing_zeros() as u8;
                let from = to + 7;
                moves.push(Move { from, to, piece: PieceType::Pawn, captured: Some(PieceType::Pawn), promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_right &= temp_right - 1;
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
                let captured = if (enemy_pieces & (1u64 << to)) != 0 { Some(PieceType::Pawn) } else { None };
                moves.push(Move { from, to, piece: PieceType::Knight, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_attacks &= temp_attacks - 1;
            }
            temp_knights &= temp_knights - 1;
        }

        // 3. Şah
        let king = self.pieces[us_idx][PieceType::King as usize];
        if king != 0 {
            let from = king.trailing_zeros() as u8;
            let attacks = get_king_attacks(from) & !our_pieces;
            let mut temp_attacks = attacks;
            while temp_attacks != 0 {
                let to = temp_attacks.trailing_zeros() as u8;
                let captured = if (enemy_pieces & (1u64 << to)) != 0 { Some(PieceType::Pawn) } else { None };
                moves.push(Move { from, to, piece: PieceType::King, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                temp_attacks &= temp_attacks - 1;// 4. Miller / Kayan Taşlar (Rooks, Bishops, Queens)
        // Not: Şimdilik kural motorunun çökmemesi ve hızı izole etmek için 
        // kendi taşlarımızı basitleştirilmiş bir bitboard kaydırma veya boş kare kontrolüyle simüle ediyoruz.
        // Tam magic entegrasyonu öncesi iskeleti bozmamak adına boş kareleri tarayalım:
        
        let rooks = self.pieces[us_idx][PieceType::Rook as usize];
        let mut temp_rooks = rooks;
        while temp_rooks != 0 {
            let from = temp_rooks.trailing_zeros() as u8;
            // Basit doğrusal tarama (Dört yön: +8, -8, +1, -1)
            for &step in &[8, -8, 1, -1] {
                let mut to = from as i32 + step;
                while to >= 0 && to < 64 {
                    // Tahta kenarı taşma kontrolü (Yatay hareketlerde rank değişimi engeli)
                    if (step == 1 || step == -1) && (to / 8 != from as i32 / 8) { break; }
                    
                    let to_u8 = to as u8;
                    let target_bit = 1u64 << to_u8;
                    
                    if (our_pieces & target_bit) != 0 { break; } // Kendi taşımız yolu kapattı
                    
                    let captured = if (enemy_pieces & target_bit) != 0 { Some(PieceType::Pawn) } else { None };
                    moves.push(Move { from, to: to_u8, piece: PieceType::Rook, captured, promotion: None, is_en_passant: false, is_castling: false, is_double_pawn_push: false });
                    
                    if captured.is_some() { break; } // Rakip taşı aldık, ilerleme durdu
                    to += step;
                }
            }
            temp_rooks &= temp_rooks - 1;
        }
            }
        }

        moves
    }

    pub fn make_move(&mut self, mv: Move) {
        let us = self.side_to_move as usize;
        let from_bit = 1u64 << mv.from;
        let to_bit = 1u64 << mv.to;

        self.pieces[us][mv.piece as usize] &= !from_bit;
        self.pieces[us][mv.piece as usize] |= to_bit;

        if let Some(captured_type) = mv.captured {
            let them = self.side_to_move.opposite() as usize;
            self.pieces[them][captured_type as usize] &= !to_bit;
        }

        self.en_passant_square = None;
        if mv.is_double_pawn_push {
            let ep_rank = if self.side_to_move == Color::White { mv.from + 8 } else { mv.from - 8 };
            self.en_passant_square = Some(ep_rank);
        }

        self.update_occupancies();
    }

    pub fn is_legal(&self, _mv: Move) -> bool { true }

    pub fn perft(&self, depth: u8) -> u64 {
        if depth == 0 { return 1; }
        let moves = self.generate_moves();
        if depth == 1 { return moves.len() as u64; }
        let mut nodes = 0;
        for mv in moves {
            let mut next_board = self.clone();
            next_board.make_move(mv);
            next_board.side_to_move = next_board.side_to_move.opposite();
            next_board.update_occupancies();
            nodes += next_board.perft(depth - 1);
        }
        nodes
    }
}