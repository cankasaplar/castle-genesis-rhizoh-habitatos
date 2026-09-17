// NNUE Neural Network Evaluator
// Architecture: HalfKA-style 45,056 → 512x2 → 1 with dual perspective accumulators
// Quantization: INT16 weights (i16), INT32 accumulation
// Format: RHNNUEV6 binary format (aligned with Python HalfKA trainer)

use crate::board::Board;
use crate::types::{Color, PieceType};

/// Feature dimension: HalfKP 40,960 inputs (64 King Squares * 640 Piece-Square Features per King)
pub const INPUT_DIM: usize = 40960;
/// Hidden layer size — 512 for expanded architecture (~41MB binary)
pub const HIDDEN_DIM: usize = 512;
/// Quantization scale factor (weights stored as i16 * QUANT_SCALE)
const QUANT_SCALE: i32 = 64;

/// Binary format magic header
const MAGIC_V6: &[u8; 8] = b"RHNNUEV6";
const MAGIC_V5: &[u8; 8] = b"RHNNUEV5";

pub struct NnueEvaluator {
    /// Stockfish CC0 open-source network evaluator (MIT runtime)
    stockfish_net: Option<nnue_rs::Network>,
    /// Feature → hidden weights: [INPUT_DIM][HIDDEN_DIM] as i16
    feature_weights: Box<[[i16; HIDDEN_DIM]; INPUT_DIM]>,
    /// Hidden layer biases as i16
    feature_biases: [i16; HIDDEN_DIM],
    /// Output layer weights as i16 (White and Black perspective)
    output_weights_w: [i16; HIDDEN_DIM],
    output_weights_b: [i16; HIDDEN_DIM],
    /// Output bias as i32
    output_bias: i32,
    /// Whether a valid network file was loaded
    enabled: bool,
}

impl NnueEvaluator {
    pub fn new() -> Self {
        let feature_weights_vec = vec![[0i16; HIDDEN_DIM]; INPUT_DIM];
        let feature_biases = [10i16; HIDDEN_DIM];
        let output_weights_w = [1i16; HIDDEN_DIM];
        let output_weights_b = [1i16; HIDDEN_DIM];
        let output_bias = 0i32;
        let mut loaded = false;

        let mut sf_net: Option<nnue_rs::Network> = None;
        let mut sf_candidate_paths = vec![
            std::path::PathBuf::from("config/stockfish_cc0.nnue"),
            std::path::PathBuf::from("../config/stockfish_cc0.nnue"),
            std::path::PathBuf::from("../../config/stockfish_cc0.nnue"),
        ];

        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                sf_candidate_paths.push(exe_dir.join("config/stockfish_cc0.nnue"));
                sf_candidate_paths.push(exe_dir.join("../config/stockfish_cc0.nnue"));
                sf_candidate_paths.push(exe_dir.join("stockfish_cc0.nnue"));
                sf_candidate_paths.push(exe_dir.join("bin/stockfish_cc0.nnue"));
            }
        }

        for path in &sf_candidate_paths {
            if path.exists() {
                if let Some(p_str) = path.to_str() {
                    match nnue_rs::Network::from_file(p_str) {
                        Ok(net) => {
                            println!("info string [NNUE Stockfish CC0] Loaded {:?} architecture from {:?}", net.arch(), path);
                            sf_net = Some(net);
                            loaded = true;
                            break;
                        }
                        Err(e) => {
                            eprintln!("[NNUE DEBUG] Failed to load Stockfish net from {:?}: {:?}", path, e);
                        }
                    }
                }
            }
        }

        let mut candidate_paths = vec![
            std::path::PathBuf::from("config/rhizoh_nnue.bin"),
            std::path::PathBuf::from("../config/rhizoh_nnue.bin"),
            std::path::PathBuf::from("../../config/rhizoh_nnue.bin"),
        ];

        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                candidate_paths.push(exe_dir.join("config/rhizoh_nnue.bin"));
                candidate_paths.push(exe_dir.join("../config/rhizoh_nnue.bin"));
            }
        }

        let mut loaded_fw = feature_weights_vec;
        let mut loaded_fb = feature_biases;
        let mut loaded_ow_w = output_weights_w;
        let mut loaded_ow_b = output_weights_b;
        let mut loaded_ob = output_bias;

        if !loaded {
            'outer: for path in &candidate_paths {
                if let Ok(data) = std::fs::read(path) {
                    if data.len() >= 16 {
                        let magic = &data[..8];
                        let file_input = u32::from_le_bytes([data[8], data[9], data[10], data[11]]) as usize;
                        let file_hidden = u32::from_le_bytes([data[12], data[13], data[14], data[15]]) as usize;

                        if (magic == MAGIC_V6 || magic == MAGIC_V5) && file_input == INPUT_DIM && file_hidden == HIDDEN_DIM {
                            let expected_size = 16
                                + INPUT_DIM * HIDDEN_DIM * 2
                                + HIDDEN_DIM * 2
                                + HIDDEN_DIM * 2
                                + HIDDEN_DIM * 2
                                + 4;

                            if data.len() >= expected_size {
                                let mut pos = 16;
                                for i in 0..INPUT_DIM {
                                    for j in 0..HIDDEN_DIM {
                                        loaded_fw[i][j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                        pos += 2;
                                    }
                                }
                                for j in 0..HIDDEN_DIM {
                                    loaded_fb[j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                    pos += 2;
                                }
                                for j in 0..HIDDEN_DIM {
                                    loaded_ow_w[j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                    pos += 2;
                                }
                                for j in 0..HIDDEN_DIM {
                                    loaded_ow_b[j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                    pos += 2;
                                }
                                loaded_ob = i32::from_le_bytes([data[pos], data[pos+1], data[pos+2], data[pos+3]]);
                                loaded = true;
                                println!("info string [NNUE V5 HalfKP 512] Loaded {INPUT_DIM}→{HIDDEN_DIM}x2→1 from {:?}", path);
                                break 'outer;
                            } else {
                                eprintln!("[NNUE DEBUG] File size mismatch: {} < expected {}", data.len(), expected_size);
                            }
                        } else {
                            eprintln!("[NNUE DEBUG] Magic/Dim mismatch: magic={:?}, input={}, hidden={}", magic, file_input, file_hidden);
                        }
                    }
                }
            }
        }

        let boxed_slice = loaded_fw.into_boxed_slice();
        let ptr = Box::into_raw(boxed_slice) as *mut [[i16; HIDDEN_DIM]; INPUT_DIM];
        let boxed_weights: Box<[[i16; HIDDEN_DIM]; INPUT_DIM]> = unsafe { Box::from_raw(ptr) };

        Self {
            stockfish_net: sf_net,
            feature_weights: boxed_weights,
            feature_biases: loaded_fb,
            output_weights_w: loaded_ow_w,
            output_weights_b: loaded_ow_b,
            output_bias: loaded_ob,
            enabled: loaded,
        }
    }

    #[inline(always)]
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Build HalfKA dual-perspective accumulators from scratch for a board position
    pub fn compute_accumulator(&self, board: &Board) -> Accumulator {
        let mut acc = Accumulator::new(&self.feature_biases);
        let w_king_sq = (board.pieces[Color::White as usize][PieceType::King as usize]).trailing_zeros() as u8;
        let b_king_sq = (board.pieces[Color::Black as usize][PieceType::King as usize]).trailing_zeros() as u8;

        let w_k_idx = w_king_sq as usize;
        let b_k_flipped = (b_king_sq ^ 56) as usize;



        // Non-king pieces for both perspectives
        for c_idx in 0..2 {
            let color = if c_idx == 0 { Color::White } else { Color::Black };
            for p_idx in 0..5 {
                let piece_type = match p_idx {
                    0 => PieceType::Pawn,
                    1 => PieceType::Knight,
                    2 => PieceType::Bishop,
                    3 => PieceType::Rook,
                    _ => PieceType::Queen,
                };
                let mut bb = board.pieces[c_idx][p_idx];
                while bb != 0 {
                    let sq = bb.trailing_zeros() as u8;

                    // White perspective feature
                    let p_idx_w = if color == Color::White { p_idx } else { p_idx + 5 };
                    let f_w = w_k_idx * 640 + p_idx_w * 64 + (sq as usize);
                    if f_w < INPUT_DIM {
                        acc.add_feature_white(&self.feature_weights[f_w]);
                    }

                    // Black perspective feature
                    let p_idx_b = if color == Color::Black { p_idx } else { p_idx + 5 };
                    let f_b = b_k_flipped * 640 + p_idx_b * 64 + ((sq ^ 56) as usize);
                    if f_b < INPUT_DIM {
                        acc.add_feature_black(&self.feature_weights[f_b]);
                    }

                    bb &= bb - 1;
                }
            }
        }
        acc
    }

    /// Evaluate a position using dual-perspective accumulators
    #[inline(always)]
    pub fn evaluate_accumulator(&self, acc: &Accumulator, board: &Board) -> i32 {
        if !self.enabled {
            return 0;
        }

        let (own_acc, opp_acc) = if board.side_to_move == Color::White {
            (&acc.white, &acc.black)
        } else {
            (&acc.black, &acc.white)
        };

        let own_weights = &self.output_weights_w;
        let opp_weights = &self.output_weights_b;

        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                let score = unsafe {
                    evaluate_accumulator_avx2(
                        own_acc,
                        opp_acc,
                        own_weights,
                        opp_weights,
                        self.output_bias,
                    )
                };
                let final_cp = (score / QUANT_SCALE).clamp(-4000, 4000);
                return final_cp;
            }
        }

        let mut score: i32 = self.output_bias;

        let mut i = 0;
        let mut sum0: i32 = 0;
        let mut sum1: i32 = 0;

        while i + 32 <= HIDDEN_DIM {
            for k in 0..16 {
                let idx0 = i + k;
                let val_own0 = own_acc[idx0];
                let act_own0 = if val_own0 > 0 { (val_own0 as i32).min(127) } else { 0 };
                let val_opp0 = opp_acc[idx0];
                let act_opp0 = if val_opp0 > 0 { (val_opp0 as i32).min(127) } else { 0 };
                sum0 += act_own0 * (own_weights[idx0] as i32) + act_opp0 * (opp_weights[idx0] as i32);

                let idx1 = i + 16 + k;
                let val_own1 = own_acc[idx1];
                let act_own1 = if val_own1 > 0 { (val_own1 as i32).min(127) } else { 0 };
                let val_opp1 = opp_acc[idx1];
                let act_opp1 = if val_opp1 > 0 { (val_opp1 as i32).min(127) } else { 0 };
                sum1 += act_own1 * (own_weights[idx1] as i32) + act_opp1 * (opp_weights[idx1] as i32);
            }
            i += 32;
        }

        while i < HIDDEN_DIM {
            let val_own = own_acc[i];
            let act_own = if val_own > 0 { (val_own as i32).min(127) } else { 0 };
            let val_opp = opp_acc[i];
            let act_opp = if val_opp > 0 { (val_opp as i32).min(127) } else { 0 };
            sum0 += act_own * (own_weights[i] as i32) + act_opp * (opp_weights[i] as i32);
            i += 1;
        }

        score += sum0 + sum1;

        let final_cp = (score / QUANT_SCALE).clamp(-4000, 4000);
        final_cp
    }

    /// Evaluate a board position (using Stockfish CC0 network if available, else legacy accumulator)
    pub fn evaluate(&self, board: &Board) -> i32 {
        if !self.enabled {
            return 0;
        }

        if let Some(ref net) = self.stockfish_net {
            return net.evaluate(board);
        }

        if let Some(ref acc) = board.accumulator {
            self.evaluate_accumulator(acc, board)
        } else {
            let acc = self.compute_accumulator(board);
            self.evaluate_accumulator(&acc, board)
        }
    }

    /// Incrementally update accumulator after a non-king move
    pub fn update_accumulator_move(
        &self,
        acc: &mut Accumulator,
        piece: PieceType,
        color: Color,
        from_sq: u8,
        to_sq: u8,
        captured: Option<(PieceType, Color, u8)>,
        promo: Option<PieceType>,
        is_castling: bool,
        w_king_sq: u8,
        b_king_sq: u8,
    ) {
        if piece == PieceType::King {
            return;
        }

        let w_k_idx = w_king_sq as usize;
        let b_k_flipped = (b_king_sq ^ 56) as usize;

        let p_type_val = match piece {
            PieceType::Pawn => 0,
            PieceType::Knight => 1,
            PieceType::Bishop => 2,
            PieceType::Rook => 3,
            PieceType::Queen => 4,
            PieceType::King => return,
        };

        let p_idx_w = if color == Color::White { p_type_val } else { p_type_val + 5 };
        let p_idx_b = if color == Color::Black { p_type_val } else { p_type_val + 5 };

        // 1. Remove piece from source square
        let f_from_w = w_k_idx * 640 + p_idx_w * 64 + (from_sq as usize);
        let f_from_b = b_k_flipped * 640 + p_idx_b * 64 + ((from_sq ^ 56) as usize);

        if f_from_w < INPUT_DIM { acc.remove_feature_white(&self.feature_weights[f_from_w]); }
        if f_from_b < INPUT_DIM { acc.remove_feature_black(&self.feature_weights[f_from_b]); }

        // 2. Remove captured piece if any
        if let Some((c_piece, c_color, c_sq)) = captured {
            let c_type_val = match c_piece {
                PieceType::Pawn => 0,
                PieceType::Knight => 1,
                PieceType::Bishop => 2,
                PieceType::Rook => 3,
                PieceType::Queen => 4,
                PieceType::King => 0,
            };
            let c_idx_w = if c_color == Color::White { c_type_val } else { c_type_val + 5 };
            let c_idx_b = if c_color == Color::Black { c_type_val } else { c_type_val + 5 };

            let f_cap_w = w_k_idx * 640 + c_idx_w * 64 + (c_sq as usize);
            let f_cap_b = b_k_flipped * 640 + c_idx_b * 64 + ((c_sq ^ 56) as usize);

            if f_cap_w < INPUT_DIM { acc.remove_feature_white(&self.feature_weights[f_cap_w]); }
            if f_cap_b < INPUT_DIM { acc.remove_feature_black(&self.feature_weights[f_cap_b]); }
        }

        // 3. Add piece to destination (handle promotion)
        let p_placed = promo.unwrap_or(piece);
        let placed_type_val = match p_placed {
            PieceType::Pawn => 0,
            PieceType::Knight => 1,
            PieceType::Bishop => 2,
            PieceType::Rook => 3,
            PieceType::Queen => 4,
            PieceType::King => 0,
        };
        let placed_idx_w = if color == Color::White { placed_type_val } else { placed_type_val + 5 };
        let placed_idx_b = if color == Color::Black { placed_type_val } else { placed_type_val + 5 };

        let f_to_w = w_k_idx * 640 + placed_idx_w * 64 + (to_sq as usize);
        let f_to_b = b_k_flipped * 640 + placed_idx_b * 64 + ((to_sq ^ 56) as usize);

        if f_to_w < INPUT_DIM { acc.add_feature_white(&self.feature_weights[f_to_w]); }
        if f_to_b < INPUT_DIM { acc.add_feature_black(&self.feature_weights[f_to_b]); }

        // 4. Handle castling rook move
        if is_castling {
            let (r_from, r_to) = match to_sq {
                6  => (7u8,  5u8),  // White kingside
                2  => (0u8,  3u8),  // White queenside
                62 => (63u8, 61u8), // Black kingside
                58 => (56u8, 59u8), // Black queenside
                _  => (0u8,  0u8),
            };
            if r_from != r_to {
                let r_idx_w = if color == Color::White { 3 } else { 8 };
                let r_idx_b = if color == Color::Black { 3 } else { 8 };

                let f_rf_w = w_k_idx * 640 + r_idx_w * 64 + (r_from as usize);
                let f_rf_b = b_k_flipped * 640 + r_idx_b * 64 + ((r_from ^ 56) as usize);

                let f_rt_w = w_k_idx * 640 + r_idx_w * 64 + (r_to as usize);
                let f_rt_b = b_k_flipped * 640 + r_idx_b * 64 + ((r_to ^ 56) as usize);

                if f_rf_w < INPUT_DIM { acc.remove_feature_white(&self.feature_weights[f_rf_w]); }
                if f_rf_b < INPUT_DIM { acc.remove_feature_black(&self.feature_weights[f_rf_b]); }
                if f_rt_w < INPUT_DIM { acc.add_feature_white(&self.feature_weights[f_rt_w]); }
                if f_rt_b < INPUT_DIM { acc.add_feature_black(&self.feature_weights[f_rt_b]); }
            }
        }
    }
}

/// NNUE position accumulator — stores hidden layer values for White and Black perspectives
#[derive(Clone, Copy, Debug)]
pub struct Accumulator {
    pub white: [i16; HIDDEN_DIM],
    pub black: [i16; HIDDEN_DIM],
}

impl Accumulator {
    pub fn new(biases: &[i16; HIDDEN_DIM]) -> Self {
        Self {
            white: *biases,
            black: *biases,
        }
    }

    #[inline(always)]
    pub fn add_feature_white(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe { add_feature_avx2(&mut self.white, weights); }
                return;
            }
        }
        for i in 0..HIDDEN_DIM {
            self.white[i] = self.white[i].saturating_add(weights[i]);
        }
    }

    #[inline(always)]
    pub fn remove_feature_white(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe { remove_feature_avx2(&mut self.white, weights); }
                return;
            }
        }
        for i in 0..HIDDEN_DIM {
            self.white[i] = self.white[i].saturating_sub(weights[i]);
        }
    }

    #[inline(always)]
    pub fn add_feature_black(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe { add_feature_avx2(&mut self.black, weights); }
                return;
            }
        }
        for i in 0..HIDDEN_DIM {
            self.black[i] = self.black[i].saturating_add(weights[i]);
        }
    }

    #[inline(always)]
    pub fn remove_feature_black(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe { remove_feature_avx2(&mut self.black, weights); }
                return;
            }
        }
        for i in 0..HIDDEN_DIM {
            self.black[i] = self.black[i].saturating_sub(weights[i]);
        }
    }
}

// ── SIMD AVX2 Intrinsics Vectorized Helpers ─────────────────────────────────
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2")]
unsafe fn add_feature_avx2(values: &mut [i16; HIDDEN_DIM], weights: &[i16; HIDDEN_DIM]) {
    let mut i = 0;
    while i + 16 <= HIDDEN_DIM {
        unsafe {
            let v = _mm256_loadu_si256(values.as_ptr().add(i) as *const __m256i);
            let w = _mm256_loadu_si256(weights.as_ptr().add(i) as *const __m256i);
            let res = _mm256_adds_epi16(v, w);
            _mm256_storeu_si256(values.as_mut_ptr().add(i) as *mut __m256i, res);
        }
        i += 16;
    }
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2")]
unsafe fn remove_feature_avx2(values: &mut [i16; HIDDEN_DIM], weights: &[i16; HIDDEN_DIM]) {
    let mut i = 0;
    while i + 16 <= HIDDEN_DIM {
        unsafe {
            let v = _mm256_loadu_si256(values.as_ptr().add(i) as *const __m256i);
            let w = _mm256_loadu_si256(weights.as_ptr().add(i) as *const __m256i);
            let res = _mm256_subs_epi16(v, w);
            _mm256_storeu_si256(values.as_mut_ptr().add(i) as *mut __m256i, res);
        }
        i += 16;
    }
}

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2")]
unsafe fn evaluate_accumulator_avx2(
    own_acc: &[i16; HIDDEN_DIM],
    opp_acc: &[i16; HIDDEN_DIM],
    own_weights: &[i16; HIDDEN_DIM],
    opp_weights: &[i16; HIDDEN_DIM],
    output_bias: i32,
) -> i32 {
    let mut temp = [0i32; 8];
    unsafe {
        let zero = _mm256_setzero_si256();
        let max_clip = _mm256_set1_epi16(127);
        let mut acc_sum = _mm256_setzero_si256();

        let mut i = 0;
        while i + 16 <= HIDDEN_DIM {
            let val_own = _mm256_loadu_si256(own_acc.as_ptr().add(i) as *const __m256i);
            let act_own = _mm256_min_epi16(_mm256_max_epi16(val_own, zero), max_clip);

            let val_opp = _mm256_loadu_si256(opp_acc.as_ptr().add(i) as *const __m256i);
            let act_opp = _mm256_min_epi16(_mm256_max_epi16(val_opp, zero), max_clip);

            let w_own = _mm256_loadu_si256(own_weights.as_ptr().add(i) as *const __m256i);
            let w_opp = _mm256_loadu_si256(opp_weights.as_ptr().add(i) as *const __m256i);

            let prod_own = _mm256_madd_epi16(act_own, w_own);
            let prod_opp = _mm256_madd_epi16(act_opp, w_opp);

            acc_sum = _mm256_add_epi32(acc_sum, _mm256_add_epi32(prod_own, prod_opp));
            i += 16;
        }

        _mm256_storeu_si256(temp.as_mut_ptr() as *mut __m256i, acc_sum);
    }

    let mut total: i32 = output_bias;
    for &t in &temp {
        total += t;
    }
    total
}

/// Global NNUE instance (thread-safe, loaded once at startup)
use std::sync::OnceLock;
static GLOBAL_NNUE: OnceLock<NnueEvaluator> = OnceLock::new();

pub fn get_global_nnue() -> &'static NnueEvaluator {
    GLOBAL_NNUE.get_or_init(NnueEvaluator::new)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nnue_fen_parity() {
        let evaluator = get_global_nnue();
        if let Some(ref net) = evaluator.stockfish_net {
            let test_fens = [
                "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                "r1bqk2r/ppp2ppp/2n5/1B1pp3/4n3/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
                "4k3/8/8/8/8/8/8/4K2Q w - - 0 1",
                "4k2q/8/8/8/8/8/8/4K3 b - - 0 1",
                "4k2q/8/8/8/8/8/8/4K3 w - - 0 1",
            ];
            for fen in test_fens {
                let fen_score = net.evaluate_fen(fen).expect("evaluate_fen failed");
                let board = Board::from_fen(fen);
                let board_score = net.evaluate(&board);
                println!("FEN {fen}: fen_score={fen_score}, board_score={board_score}");
                assert_eq!(fen_score, board_score, "Parity mismatch on FEN {fen}: fen={fen_score}, board={board_score}");
            }
        }
    }
}
