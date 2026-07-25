// src/magic.rs

// Yön kaydırma yardımcıları
pub fn shift_north(bb: u64) -> u64 { bb << 8 }
pub fn shift_south(bb: u64) -> u64 { bb >> 8 }
pub fn shift_east(bb: u64) -> u64 { (bb << 1) & 0xFEFEFEFEFEFEFEFE }
pub fn shift_west(bb: u64) -> u64 { (bb >> 1) & 0x7F7F7F7F7F7F7F7F }

// Klasik ışın (ray) oluşturma - Non-sliding taşlar için (At ve Şah) maskeler
pub fn get_knight_attacks(square: u8) -> u64 {
    let bb = 1u64 << square;
    let mut attacks = 0;
    
    // Atın 8 olası hareketi
    attacks |= (bb << 17) & 0xFEFEFEFEFEFEFEFE; // 2 Kuzey, 1 Doğu
    attacks |= (bb << 15) & 0x7F7F7F7F7F7F7F7F; // 2 Kuzey, 1 Batı
    attacks |= (bb << 10) & 0xFCFCFCFCFCFCFCFC; // 1 Kuzey, 2 Doğu
    attacks |= (bb << 6)  & 0x3F3F3F3F3F3F3F3F; // 1 Kuzey, 2 Batı
    attacks |= (bb >> 17) & 0x7F7F7F7F7F7F7F7F; // 2 Güney, 1 Batı
    attacks |= (bb >> 15) & 0xFEFEFEFEFEFEFEFE; // 2 Güney, 1 Doğu
    attacks |= (bb >> 10) & 0x3F3F3F3F3F3F3F3F; // 1 Güney, 2 Batı
    attacks |= (bb >> 6)  & 0xFCFCFCFCFCFCFCFC; // 1 Güney, 2 Doğu
    
    attacks
}

pub fn get_king_attacks(square: u8) -> u64 {
    let bb = 1u64 << square;
    let mut attacks = 0;
    
    attacks |= shift_north(bb) | shift_south(bb);
    let east_west = shift_east(bb) | shift_west(bb);
    attacks |= east_west | shift_north(east_west) | shift_south(east_west);
    
    attacks
}

// Sliding piece (Fil ve Kale) maskeleri (Kenar kareler blokör maskesine dahil edilmez)
pub fn get_bishop_mask(square: u8) -> u64 {
    let mut mask = 0u64;
    let tr = (square / 8) as i8;
    let tf = (square % 8) as i8;
    
    // Kuzey-Doğu
    let (mut r, mut f) = (tr + 1, tf + 1);
    while r < 7 && f < 7 { mask |= 1u64 << (r * 8 + f); r += 1; f += 1; }
    // Kuzey-Batı
    let (mut r, mut f) = (tr + 1, tf - 1);
    while r < 7 && f > 0 { mask |= 1u64 << (r * 8 + f); r += 1; f -= 1; }
    // Güney-Doğu
    let (mut r, mut f) = (tr - 1, tf + 1);
    while r > 0 && f < 7 { mask |= 1u64 << (r * 8 + f); r -= 1; f += 1; }
    // Güney-Batı
    let (mut r, mut f) = (tr - 1, tf - 1);
    while r > 0 && f > 0 { mask |= 1u64 << (r * 8 + f); r -= 1; f -= 1; }
    
    mask
}

pub fn get_rook_mask(square: u8) -> u64 {
    let mut mask = 0u64;
    let tr = (square / 8) as i8;
    let tf = (square % 8) as i8;
    
    // Kuzey
    for r in (tr + 1)..7 { mask |= 1u64 << (r * 8 + tf); }
    // Güney
    for r in 1..tr { mask |= 1u64 << (r * 8 + tf); }
    // Doğu
    for f in (tf + 1)..7 { mask |= 1u64 << (tr * 8 + f); }
    // Batı
    for f in 1..tf { mask |= 1u64 << (tr * 8 + f); }
    
    mask
}