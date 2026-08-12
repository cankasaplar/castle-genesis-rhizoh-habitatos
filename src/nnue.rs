// NNUE Neural Network Evaluator
// Architecture: HalfKP-style 768→1024x2→1 with dual perspective accumulators
// Quantization: INT16 weights (i16), INT32 accumulation
// Format: RHIZOH_NNUE_V3 binary format (aligned with Python trainer)

use crate::board::Board;
use crate::types::{Color, PieceType};

/// Feature dimension: HalfKP 40,960 inputs (64 King Squares * 10 Piece Types * 64 Squares)
pub const INPUT_DIM: usize = 40960;
/// Hidden layer size — 256 for high-speed compact HalfKP architecture (~20MB binary)
pub const HIDDEN_DIM: usize = 256;
/// Quantization scale factor (weights stored as i16 * QUANT_SCALE)
const QUANT_SCALE: i32 = 64;
/// Output scale factor
const OUTPUT_SCALE: i32 = 400;

/// Binary format magic header
const MAGIC_V4: &[u8; 8] = b"RHNNUEV4";

pub struct NnueEvaluator {
    /// Feature → hidden weights: [INPUT_DIM][HIDDEN_DIM] as i16
    feature_weights: Box<[[i16; HIDDEN_DIM]; INPUT_DIM]>,
    /// Hidden layer biases as i16
    feature_biases: [i16; HIDDEN_DIM],
    /// Output layer weights as i16 (both perspectives concatenated: HIDDEN_DIM*2)
    output_weights_w: [i16; HIDDEN_DIM],
    output_weights_b: [i16; HIDDEN_DIM],
    /// Output bias as i32
    output_bias: i32,
    /// Whether a valid network file was loaded
    enabled: bool,
}

impl NnueEvaluator {
    pub fn new() -> Self {
        // Initialize with small random weights (fallback if no .bin file)
        let mut feature_weights_vec = vec![[0i16; HIDDEN_DIM]; INPUT_DIM];
        let feature_biases = [10i16; HIDDEN_DIM];
        let output_weights_w = [1i16; HIDDEN_DIM];
        let output_weights_b = [1i16; HIDDEN_DIM];
        let output_bias = 0i32;
        let mut loaded = false;

        // Search for NNUE binary in multiple locations
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

        'outer: for path in &candidate_paths {
            if let Ok(data) = std::fs::read(path) {
                // Try V4 format (i16 quantized HalfKP, HIDDEN_DIM=1024, INPUT_DIM=40960)
                // Header: 8 magic + 4 input_dim + 4 hidden_dim = 16 bytes
                let expected_v4 = 16
                    + INPUT_DIM * HIDDEN_DIM * 2
                    + HIDDEN_DIM * 2
                    + HIDDEN_DIM * 2
                    + HIDDEN_DIM * 2
                    + 4;

                if data.len() >= expected_v4 && &data[..8] == MAGIC_V4 {
                    let mut pos = 16; // Skip header (magic + dims)
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
                    println!("info string [NNUE V4 HalfKP] Loaded {INPUT_DIM}→{HIDDEN_DIM}x2→1 from {:?}", path);
                    break 'outer;
                }

                // Fallback: Try legacy V2 format (i16, HIDDEN_DIM=256 or other)
                // Header: 8 magic + 4 input + 4 hidden = 16 bytes
                // We attempt to load if input_dim matches and file is large enough
                if data.len() >= 16 {
                    let file_input = u32::from_le_bytes([data[8], data[9], data[10], data[11]]) as usize;
                    let file_hidden = u32::from_le_bytes([data[12], data[13], data[14], data[15]]) as usize;
                    if file_input == INPUT_DIM && file_hidden <= HIDDEN_DIM && file_hidden > 0 {
                        // Partial load with upsampling
                        let hd = file_hidden;
                        let expected_v2 = 16 + INPUT_DIM * hd * 2 + hd * 2 + hd * 2 + 4;
                        if data.len() >= expected_v2 {
                            let mut pos = 16;
                            for i in 0..INPUT_DIM {
                                for j in 0..hd {
                                    loaded_fw[i][j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                    pos += 2;
                                }
                            }
                            for j in 0..hd {
                                loaded_fb[j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                pos += 2;
                            }
                            for j in 0..hd {
                                loaded_ow_w[j] = i16::from_le_bytes([data[pos], data[pos + 1]]);
                                pos += 2;
                            }
                            loaded_ob = i32::from_le_bytes([data[pos], data[pos+1], data[pos+2], data[pos+3]]);
                            // Copy white weights to black perspective
                            loaded_ow_b = loaded_ow_w;
                            loaded = true;
                            println!("info string [NNUE Legacy] Loaded {file_input}→{file_hidden} from {:?} (upsampled to {HIDDEN_DIM})", path);
                            break 'outer;
                        }
                    }
                }
            }
        }

        if !loaded {
            // Use pseudo-random fallback weights (deterministic)
            for i in 0..INPUT_DIM {
                for j in 0..HIDDEN_DIM {
                    loaded_fw[i][j] = (((i * 17 + j * 31) % 40) as i16) - 20;
                }
            }
            for j in 0..HIDDEN_DIM {
                loaded_ow_w[j] = (((j * 13) % 20) as i16) - 10;
                loaded_ow_b[j] = (((j * 7) % 20) as i16) - 10;
            }
            // NNUE disabled without a proper .bin file
        }

        let boxed_weights: Box<[[i16; HIDDEN_DIM]; INPUT_DIM]> = match loaded_fw.try_into() {
            Ok(b) => b,
            Err(_) => panic!("[NNUE] Failed to allocate feature weight matrix ({} KB)",
                INPUT_DIM * HIDDEN_DIM * 2 / 1024),
        };

        Self {
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

    /// Compute HalfKP feature index for a piece on a square given the friendly King square
    /// Layout: 64 King Squares * 10 Piece Types (5 white + 5 black) * 64 Squares = 40,960
    #[inline(always)]
    pub fn feature_index_halfkp(king_sq: u8, piece: PieceType, color: Color, square: u8, is_friendly_view: bool) -> usize {
        let k_sq = king_sq as usize;
        let p_type_val = match piece {
            PieceType::Pawn => 0,
            PieceType::Knight => 1,
            PieceType::Bishop => 2,
            PieceType::Rook => 3,
            PieceType::Queen => 4,
            PieceType::King => return usize::MAX, // Skip Kings as features
        };
        let p_idx = if (color == Color::White) == is_friendly_view {
            p_type_val
        } else {
            p_type_val + 5
        };
        let sq = square as usize;
        (k_sq * 640 + p_idx * 64 + sq).min(INPUT_DIM - 1)
    }

    /// Build HalfKP accumulator from scratch for a board position
    pub fn compute_accumulator(&self, board: &Board) -> Accumulator {
        let mut acc = Accumulator::new(&self.feature_biases);
        let w_king_sq = (board.pieces[Color::White as usize][PieceType::King as usize]).trailing_zeros() as u8;

        for c_idx in 0..2 {
            let color = if c_idx == 0 { Color::White } else { Color::Black };
            for p_idx in 0..5 { // Non-king pieces
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
                    let f_idx = Self::feature_index_halfkp(w_king_sq, piece_type, color, sq, true);
                    if f_idx < INPUT_DIM {
                        acc.add_feature(&self.feature_weights[f_idx]);
                    }
                    bb &= bb - 1;
                }
            }
        }
        acc
    }

    /// Evaluate a position using dual-perspective accumulators
    /// White perspective uses output_weights_w, Black uses output_weights_b
    #[inline(always)]
    #[inline(always)]
    pub fn evaluate_accumulator(&self, acc: &Accumulator, board: &Board) -> i32 {
        if !self.enabled {
            return 0;
        }

        let (own_weights, opp_weights) = if board.side_to_move == Color::White {
            (&self.output_weights_w, &self.output_weights_b)
        } else {
            (&self.output_weights_b, &self.output_weights_w)
        };

        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                let score = unsafe {
                    evaluate_accumulator_avx2(
                        &acc.values,
                        own_weights,
                        opp_weights,
                        self.output_bias,
                    )
                };
                let final_cp = (score / QUANT_SCALE).clamp(-4000, 4000);
                return if board.side_to_move == Color::White {
                    final_cp
                } else {
                    -final_cp
                };
            }
        }

        // ClippedReLU(0, 127) activation + SIMD/AVX2-optimized 32-way unrolled dot product
        let mut score: i32 = self.output_bias;

        let mut i = 0;
        let mut sum0: i32 = 0;
        let mut sum1: i32 = 0;

        while i + 32 <= HIDDEN_DIM {
            for k in 0..16 {
                let idx0 = i + k;
                let val0 = acc.values[idx0];
                let act0 = if val0 > 0 { (val0 as i32).min(127) } else { 0 };
                sum0 += act0 * (own_weights[idx0] as i32) + act0 * (opp_weights[idx0] as i32);

                let idx1 = i + 16 + k;
                let val1 = acc.values[idx1];
                let act1 = if val1 > 0 { (val1 as i32).min(127) } else { 0 };
                sum1 += act1 * (own_weights[idx1] as i32) + act1 * (opp_weights[idx1] as i32);
            }
            i += 32;
        }

        while i < HIDDEN_DIM {
            let val = acc.values[i];
            let act = if val > 0 { (val as i32).min(127) } else { 0 };
            sum0 += act * (own_weights[i] as i32) + act * (opp_weights[i] as i32);
            i += 1;
        }

        score += sum0 + sum1;

        // Scale to centipawns
        let final_cp = (score / QUANT_SCALE).clamp(-4000, 4000);
        if board.side_to_move == Color::White {
            final_cp
        } else {
            -final_cp
        }
    }

    /// Evaluate a board position (recompute accumulator if needed)
    pub fn evaluate(&self, board: &Board) -> i32 {
        if !self.enabled {
            return 0;
        }

        if let Some(ref acc) = board.accumulator {
            self.evaluate_accumulator(acc, board)
        } else {
            let acc = self.compute_accumulator(board);
            self.evaluate_accumulator(&acc, board)
        }
    }

    /// Incrementally update accumulator after a move
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
    ) {
        if piece == PieceType::King {
            // Recompute accumulator on King moves (Handled by caller)
            return;
        }

        // Remove piece from source square
        let f_from = Self::feature_index_halfkp(w_king_sq, piece, color, from_sq, true);
        if f_from < INPUT_DIM {
            acc.remove_feature(&self.feature_weights[f_from]);
        }

        // Remove captured piece if any
        if let Some((c_piece, c_color, c_sq)) = captured {
            let f_cap = Self::feature_index_halfkp(w_king_sq, c_piece, c_color, c_sq, true);
            if f_cap < INPUT_DIM {
                acc.remove_feature(&self.feature_weights[f_cap]);
            }
        }

        // Add piece to destination (handle promotion)
        let p_placed = promo.unwrap_or(piece);
        let f_to = Self::feature_index_halfkp(w_king_sq, p_placed, color, to_sq, true);
        if f_to < INPUT_DIM {
            acc.add_feature(&self.feature_weights[f_to]);
        }

        // Handle castling rook move
        if is_castling {
            let (r_from, r_to) = match to_sq {
                6  => (7u8,  5u8),  // White kingside
                2  => (0u8,  3u8),  // White queenside
                62 => (63u8, 61u8), // Black kingside
                58 => (56u8, 59u8), // Black queenside
                _  => (0u8,  0u8),
            };
            if r_from != r_to {
                let f_rfrom = Self::feature_index_halfkp(w_king_sq, PieceType::Rook, color, r_from, true);
                let f_rto   = Self::feature_index_halfkp(w_king_sq, PieceType::Rook, color, r_to, true);
                if f_rfrom < INPUT_DIM { acc.remove_feature(&self.feature_weights[f_rfrom]); }
                if f_rto < INPUT_DIM { acc.add_feature(&self.feature_weights[f_rto]); }
            }
        }
    }
}

/// NNUE position accumulator — stores hidden layer values after feature addition
#[derive(Clone, Copy, Debug)]
pub struct Accumulator {
    pub values: [i16; HIDDEN_DIM],
}

impl Accumulator {
    pub fn new(biases: &[i16; HIDDEN_DIM]) -> Self {
        Self { values: *biases }
    }

    /// Add a feature's weights to accumulator (SIMD-friendly 16-way unrolled loop)
    #[inline(always)]
    pub fn add_feature(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe {
                    add_feature_avx2(&mut self.values, weights);
                }
                return;
            }
        }
        let mut i = 0;
        while i + 16 <= HIDDEN_DIM {
            self.values[i]      = self.values[i].saturating_add(weights[i]);
            self.values[i + 1]  = self.values[i + 1].saturating_add(weights[i + 1]);
            self.values[i + 2]  = self.values[i + 2].saturating_add(weights[i + 2]);
            self.values[i + 3]  = self.values[i + 3].saturating_add(weights[i + 3]);
            self.values[i + 4]  = self.values[i + 4].saturating_add(weights[i + 4]);
            self.values[i + 5]  = self.values[i + 5].saturating_add(weights[i + 5]);
            self.values[i + 6]  = self.values[i + 6].saturating_add(weights[i + 6]);
            self.values[i + 7]  = self.values[i + 7].saturating_add(weights[i + 7]);
            self.values[i + 8]  = self.values[i + 8].saturating_add(weights[i + 8]);
            self.values[i + 9]  = self.values[i + 9].saturating_add(weights[i + 9]);
            self.values[i + 10] = self.values[i + 10].saturating_add(weights[i + 10]);
            self.values[i + 11] = self.values[i + 11].saturating_add(weights[i + 11]);
            self.values[i + 12] = self.values[i + 12].saturating_add(weights[i + 12]);
            self.values[i + 13] = self.values[i + 13].saturating_add(weights[i + 13]);
            self.values[i + 14] = self.values[i + 14].saturating_add(weights[i + 14]);
            self.values[i + 15] = self.values[i + 15].saturating_add(weights[i + 15]);
            i += 16;
        }
    }

    /// Remove a feature's weights from accumulator (SIMD-friendly 16-way unrolled loop)
    #[inline(always)]
    pub fn remove_feature(&mut self, weights: &[i16; HIDDEN_DIM]) {
        #[cfg(target_arch = "x86_64")]
        {
            if is_x86_feature_detected!("avx2") {
                unsafe {
                    remove_feature_avx2(&mut self.values, weights);
                }
                return;
            }
        }
        let mut i = 0;
        while i + 16 <= HIDDEN_DIM {
            self.values[i]      = self.values[i].saturating_sub(weights[i]);
            self.values[i + 1]  = self.values[i + 1].saturating_sub(weights[i + 1]);
            self.values[i + 2]  = self.values[i + 2].saturating_sub(weights[i + 2]);
            self.values[i + 3]  = self.values[i + 3].saturating_sub(weights[i + 3]);
            self.values[i + 4]  = self.values[i + 4].saturating_sub(weights[i + 4]);
            self.values[i + 5]  = self.values[i + 5].saturating_sub(weights[i + 5]);
            self.values[i + 6]  = self.values[i + 6].saturating_sub(weights[i + 6]);
            self.values[i + 7]  = self.values[i + 7].saturating_sub(weights[i + 7]);
            self.values[i + 8]  = self.values[i + 8].saturating_sub(weights[i + 8]);
            self.values[i + 9]  = self.values[i + 9].saturating_sub(weights[i + 9]);
            self.values[i + 10] = self.values[i + 10].saturating_sub(weights[i + 10]);
            self.values[i + 11] = self.values[i + 11].saturating_sub(weights[i + 11]);
            self.values[i + 12] = self.values[i + 12].saturating_sub(weights[i + 12]);
            self.values[i + 13] = self.values[i + 13].saturating_sub(weights[i + 13]);
            self.values[i + 14] = self.values[i + 14].saturating_sub(weights[i + 14]);
            self.values[i + 15] = self.values[i + 15].saturating_sub(weights[i + 15]);
            i += 16;
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
    values: &[i16; HIDDEN_DIM],
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
            let val = _mm256_loadu_si256(values.as_ptr().add(i) as *const __m256i);
            let act = _mm256_min_epi16(_mm256_max_epi16(val, zero), max_clip);

            let w_own = _mm256_loadu_si256(own_weights.as_ptr().add(i) as *const __m256i);
            let w_opp = _mm256_loadu_si256(opp_weights.as_ptr().add(i) as *const __m256i);

            let prod_own = _mm256_madd_epi16(act, w_own);
            let prod_opp = _mm256_madd_epi16(act, w_opp);

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
