use std::sync::LazyLock;

pub static KNIGHT_ATTACKS: LazyLock<[u64; 64]> = LazyLock::new(|| {
    let mut table = [0u64; 64];
    for sq in 0..64 {
        let bb = 1u64 << sq;
        let mut attacks = 0u64;
        attacks |= (bb << 17) & 0xFEFEFEFEFEFEFEFE;
        attacks |= (bb << 15) & 0x7F7F7F7F7F7F7F7F;
        attacks |= (bb << 10) & 0xFCFCFCFCFCFCFCFC;
        attacks |= (bb << 6)  & 0x3F3F3F3F3F3F3F3F;
        attacks |= (bb >> 17) & 0x7F7F7F7F7F7F7F7F;
        attacks |= (bb >> 15) & 0xFEFEFEFEFEFEFEFE;
        attacks |= (bb >> 10) & 0x3F3F3F3F3F3F3F3F;
        attacks |= (bb >> 6)  & 0xFCFCFCFCFCFCFCFC;
        table[sq] = attacks;
    }
    table
});

pub static KING_ATTACKS: LazyLock<[u64; 64]> = LazyLock::new(|| {
    let mut table = [0u64; 64];
    for sq in 0..64 {
        let bb = 1u64 << sq;
        let n = bb << 8;
        let s = bb >> 8;
        let e = (bb << 1) & 0xFEFEFEFEFEFEFEFE;
        let w = (bb >> 1) & 0x7F7F7F7F7F7F7F7F;
        let ne = (n << 1) & 0xFEFEFEFEFEFEFEFE;
        let nw = (n >> 1) & 0x7F7F7F7F7F7F7F7F;
        let se = (s << 1) & 0xFEFEFEFEFEFEFEFE;
        let sw = (s >> 1) & 0x7F7F7F7F7F7F7F7F;
        table[sq] = n | s | e | w | ne | nw | se | sw;
    }
    table
});

#[inline(always)]
pub fn get_knight_attacks(square: u8) -> u64 {
    KNIGHT_ATTACKS[square as usize]
}

#[inline(always)]
pub fn get_king_attacks(square: u8) -> u64 {
    KING_ATTACKS[square as usize]
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