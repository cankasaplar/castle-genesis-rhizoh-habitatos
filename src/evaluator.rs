// src/eval.rs

pub struct Evaluator;

impl Evaluator {
    // Klasik materyal değerleri
    const PAWN_VAL: i32 = 100;
    const KNIGHT_VAL: i32 = 320;
    const BISHOP_VAL: i32 = 330;
    const ROOK_VAL: i32 = 500;
    const QUEEN_VAL: i32 = 900;

    pub fn evaluate(board: &ChessBoard) -> i32 {
        let mut score = 0;

        // 1. Materyal ve Pozisyonel Tablolar (PST benzeri temel ağırlıklar)
        score += Self::material_and_position(board);

        // 2. Gelişim ve Merkez Kontrolü
        score += Self::development_and_center(board);

        // 3. Şah Güvenliği ve Hareketlilik
        score += Self::king_safety_and_mobility(board);

        // Beyaz veya Siyah perspektifine göre döndür
        if board.turn == Color::White { score } else { -score }
    }

    fn material_and_position(board: &ChessBoard) -> i32 {
        let mut score = 0;
        // Basitçe tahtadaki taşları tarayıp hesaplama
        for r in 0..8 {
            for c in 0..8 {
                if let Some(piece) = board.piece_at(r, c) {
                    let mut val = match piece.piece_type {
                        PieceType::Pawn => Self::PAWN_VAL,
                        PieceType::Knight => Self::KNIGHT_VAL,
                        PieceType::Bishop => Self::BISHOP_VAL,
                        PieceType::Rook => Self::ROOK_VAL,
                        PieceType::Queen => Self::QUEEN_VAL,
                        PieceType::King => 20000,
                    };

                    // Merkez kare bonusları (e4, d4, e5, d5)
                    if (r == 3 || r == 4) && (c == 3 || c == 4) {
                        match piece.piece_type {
                            PieceType::Pawn => val += 20,
                            PieceType::Knight => val += 15,
                            _ => {}
                        }
                    }

                    if piece.color == Color::White {
                        score += val;
                    } else {
                        score -= val;
                    }
                }
            }
        }
        score
    }

    fn development_and_center(board: &ChessBoard) -> i32 {
        let mut bonus = 0;
        
        // Gelişmemiş taş cezaları (Örn: Başlangıç karesinde kalan at ve filler)
        // Beyaz atlar b1 ve g1'de mi?
        if let Some(p) = board.piece_at(7, 1) { if p.piece_type == PieceType::Knight && p.color == Color::White { bonus -= 30; } }
        if let Some(p) = board.piece_at(7, 6) { if p.piece_type == PieceType::Knight && p.color == Color::White { bonus -= 30; } }
        
        // Siyah atlar b8 ve g8'de mi?
        if let Some(p) = board.piece_at(0, 1) { if p.piece_type == PieceType::Knight && p.color == Color::Black { bonus += 30; } }
        if let Some(p) = board.piece_at(0, 6) { if p.piece_type == PieceType::Black && p.color == Color::Black { bonus += 30; } }

        bonus
    }

    fn king_safety_and_mobility(board: &ChessBoard) -> i32 {
        // Şah güvenliği ve hareketlilik için temel terimler
        // Rok yapılmamış şahlar için ceza mekanizması
        0
    }
}