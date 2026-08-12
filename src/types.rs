#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Color {
    White = 0,
    Black = 1,
}

impl Color {
    pub fn opposite(&self) -> Self {
        match self {
            Color::White => Color::Black,
            Color::Black => Color::White,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PieceType {
    Pawn = 0,
    Knight = 1,
    Bishop = 2,
    Rook = 3,
    Queen = 4,
    King = 5,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameResult {
    Ongoing,
    Checkmate(Color),
    Stalemate,
    Draw50Move,
    DrawRepetition,
    DrawInsufficientMaterial,
    DrawMaxPlies,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Move {
    pub from: u8,
    pub to: u8,
    pub piece: PieceType,
    pub captured: Option<PieceType>,
    pub promotion: Option<PieceType>,
    pub is_en_passant: bool,
    pub is_castling: bool,
    pub is_double_pawn_push: bool,
}

impl Move {
    pub fn to_uci(&self) -> String {
        let files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        let ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

        let f1 = files[(self.from % 8) as usize];
        let r1 = ranks[(self.from / 8) as usize];
        let f2 = files[(self.to % 8) as usize];
        let r2 = ranks[(self.to / 8) as usize];

        let mut promo_str = String::new();
        if let Some(promo) = self.promotion {
            let ch = match promo {
                PieceType::Queen => 'q',
                PieceType::Rook => 'r',
                PieceType::Bishop => 'b',
                PieceType::Knight => 'n',
                _ => 'q',
            };
            promo_str.push(ch);
        }

        format!("{}{}{}{}{}", f1, r1, f2, r2, promo_str)
    }

    pub fn len(&self) -> usize {
        1
    }
}

#[derive(Debug, Clone)]
pub struct CandidateMove {
    pub mv: Move,
    pub score: i32,
    pub depth: u8,
    pub pv: Vec<Move>,
}

#[derive(Debug, Clone, Copy)]
pub struct SearchFeatures {
    pub use_see_ordering: bool,
    pub use_see_pruning: bool,
    pub use_iir: bool,
    pub use_singular_ext: bool,
    pub use_countermove_history: bool,
    pub use_correction_history: bool,
    pub use_null_verification: bool,
    pub use_history_gravity: bool,
    pub use_loss_memory: bool,
    pub use_opening_antiblunder: bool,
    pub use_nnue: bool,
}

impl Default for SearchFeatures {
    fn default() -> Self {
        Self {
            use_see_ordering: true,
            use_see_pruning: true,
            use_iir: true,
            use_singular_ext: true,
            use_countermove_history: true,
            use_correction_history: true,
            use_null_verification: false,
            use_history_gravity: true,
            use_loss_memory: true,
            use_opening_antiblunder: true,
            use_nnue: true,
        }
    }
}

/// Pawn hash table entry for caching pawn structure evaluation
#[derive(Debug, Clone, Copy)]
pub struct PawnHashEntry {
    pub key: u64,
    pub mg_score: i32,
    pub eg_score: i32,
}

impl Default for PawnHashEntry {
    fn default() -> Self {
        Self { key: 0, mg_score: 0, eg_score: 0 }
    }
}

/// Pawn hash table — caches pawn structure evaluation results
pub const PAWN_HASH_SIZE: usize = 16384;

pub struct PawnHashTable {
    pub entries: Box<[PawnHashEntry; PAWN_HASH_SIZE]>,
}

impl PawnHashTable {
    pub fn new() -> Self {
        Self {
            entries: Box::new([PawnHashEntry::default(); PAWN_HASH_SIZE]),
        }
    }

    #[inline(always)]
    pub fn probe(&self, key: u64) -> Option<&PawnHashEntry> {
        let idx = (key as usize) & (PAWN_HASH_SIZE - 1);
        let entry = &self.entries[idx];
        if entry.key == key {
            Some(entry)
        } else {
            None
        }
    }

    #[inline(always)]
    pub fn store(&mut self, key: u64, mg_score: i32, eg_score: i32) {
        let idx = (key as usize) & (PAWN_HASH_SIZE - 1);
        self.entries[idx] = PawnHashEntry { key, mg_score, eg_score };
    }

    pub fn clear(&mut self) {
        for entry in self.entries.iter_mut() {
            *entry = PawnHashEntry::default();
        }
    }
}

impl std::fmt::Debug for PawnHashTable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "PawnHashTable({})", PAWN_HASH_SIZE)
    }
}

impl Clone for PawnHashTable {
    fn clone(&self) -> Self {
        let mut new_entries = Box::new([PawnHashEntry::default(); PAWN_HASH_SIZE]);
        new_entries.copy_from_slice(&*self.entries);
        Self { entries: new_entries }
    }
}

#[derive(Debug, Clone)]
pub struct SearchHeuristics {
    pub use_nmp: bool,
    pub use_lmr: bool,
    pub killer_moves: [[Option<Move>; 2]; 64],
    pub history_table: [[i32; 64]; 64],
    pub counter_moves: [[Option<Move>; 64]; 64],
    pub continuation_history: Box<[[[[i32; 64]; 6]; 64]; 6]>,
    pub capture_history: Box<[[[i32; 64]; 6]; 6]>,
    pub correction_history: Box<[[i32; 16384]; 2]>,
    pub non_pawn_correction_history: Box<[[i32; 16384]; 2]>,
}

impl SearchHeuristics {
    pub fn new() -> Self {
        Self {
            use_nmp: true,
            use_lmr: true,
            killer_moves: [[None; 2]; 64],
            history_table: [[0; 64]; 64],
            counter_moves: [[None; 64]; 64],
            continuation_history: Box::new([[[[0; 64]; 6]; 64]; 6]),
            capture_history: Box::new([[[0; 64]; 6]; 6]),
            correction_history: Box::new([[0; 16384]; 2]),
            non_pawn_correction_history: Box::new([[0; 16384]; 2]),
        }
    }

    pub fn update_history_gravity(&mut self, from: usize, to: usize, bonus: i32) {
        let current = self.history_table[from][to];
        let clamped_bonus = bonus.clamp(-16384, 16384);
        let decay = current * clamped_bonus.abs() / 16384;
        self.history_table[from][to] = (current + clamped_bonus - decay).clamp(-16384, 16384);
    }

    pub fn clear(&mut self) {
        self.killer_moves = [[None; 2]; 64];
        self.history_table = [[0; 64]; 64];
        self.counter_moves = [[None; 64]; 64];
        self.continuation_history = Box::new([[[[0; 64]; 6]; 64]; 6]);
        self.capture_history = Box::new([[[0; 64]; 6]; 6]);
        self.correction_history = Box::new([[0; 16384]; 2]);
        self.non_pawn_correction_history = Box::new([[0; 16384]; 2]);
    }

    pub fn get_correction(&self, color: Color, pawn_hash: u64) -> i32 {
        let color_idx = color as usize;
        let idx = (pawn_hash as usize) & 16383;
        self.correction_history[color_idx][idx] / 256
    }

    pub fn update_correction(&mut self, color: Color, pawn_hash: u64, delta: i32) {
        let color_idx = color as usize;
        let idx = (pawn_hash as usize) & 16383;
        let current = self.correction_history[color_idx][idx];
        let scaled_delta = (delta * 16).clamp(-1024, 1024);
        self.correction_history[color_idx][idx] = (current + scaled_delta).clamp(-16000, 16000);
    }

    pub fn get_non_pawn_correction(&self, color: Color, non_pawn_hash: u64) -> i32 {
        let color_idx = color as usize;
        let idx = (non_pawn_hash as usize) & 16383;
        self.non_pawn_correction_history[color_idx][idx] / 256
    }

    pub fn update_non_pawn_correction(&mut self, color: Color, non_pawn_hash: u64, delta: i32) {
        let color_idx = color as usize;
        let idx = (non_pawn_hash as usize) & 16383;
        let current = self.non_pawn_correction_history[color_idx][idx];
        let scaled_delta = (delta * 16).clamp(-1024, 1024);
        self.non_pawn_correction_history[color_idx][idx] = (current + scaled_delta).clamp(-16000, 16000);
    }

    pub fn get_continuation_history(&self, prev_move: Option<Move>, curr_move: Move) -> i32 {
        if let Some(pm) = prev_move {
            let p_piece = pm.piece as usize;
            let p_to = pm.to as usize;
            let c_piece = curr_move.piece as usize;
            let c_to = curr_move.to as usize;
            self.continuation_history[p_piece][p_to][c_piece][c_to]
        } else {
            0
        }
    }

    pub fn update_continuation_history(&mut self, prev_move: Option<Move>, curr_move: Move, bonus: i32) {
        if let Some(pm) = prev_move {
            let p_piece = pm.piece as usize;
            let p_to = pm.to as usize;
            let c_piece = curr_move.piece as usize;
            let c_to = curr_move.to as usize;
            let current = self.continuation_history[p_piece][p_to][c_piece][c_to];
            let clamped_bonus = bonus.clamp(-16384, 16384);
            let decay = current * clamped_bonus.abs() / 16384;
            self.continuation_history[p_piece][p_to][c_piece][c_to] = (current + clamped_bonus - decay).clamp(-16384, 16384);
        }
    }

    pub fn age_history(&mut self) {
        for from in 0..64 {
            for to in 0..64 {
                self.history_table[from][to] /= 2;
            }
        }
    }

    pub fn update_history(&mut self, mv: Move, depth: usize, is_good: bool) {
        let delta = (depth * depth * 16) as i32;
        let from = mv.from as usize;
        let to = mv.to as usize;
        let current = self.history_table[from][to];

        if is_good {
            let clamped_delta = delta.min(2000);
            self.history_table[from][to] = (current + clamped_delta - (current * clamped_delta) / 16384).clamp(-16000, 16000);
        } else {
            let clamped_delta = delta.min(2000);
            self.history_table[from][to] = (current - clamped_delta - (current * clamped_delta) / 16384).clamp(-16000, 16000);
        }
    }

    pub fn get_capture_history(&self, piece: PieceType, captured: PieceType, to: usize) -> i32 {
        self.capture_history[piece as usize][captured as usize][to]
    }

    pub fn update_capture_history(&mut self, piece: PieceType, captured: PieceType, to: usize, bonus: i32) {
        let current = self.capture_history[piece as usize][captured as usize][to];
        let clamped_bonus = bonus.clamp(-8192, 8192);
        let decay = current * clamped_bonus.abs() / 8192;
        self.capture_history[piece as usize][captured as usize][to] = (current + clamped_bonus - decay).clamp(-8192, 8192);
    }
}

#[derive(Debug, Clone)]
pub struct CalibrationRecord {
    pub expected_cp: i32,
    pub realized_cp: i32,
    pub error: f32,
    pub confidence: f32,
    pub intent: String,
    pub zobrist_hash: u64,
    pub trace_id: u64,
    pub evaluation_error: i32,
    pub calibration_error: f32,
    pub game_phase: String,
    pub depth: u8,
    pub timestamp: String,
    pub primary_intent: String,
}

#[derive(Debug, Clone)]
pub struct ConfidenceSummary {
    pub average_confidence: f32,
    pub maximum_confidence: f32,
    pub collapse_count: usize,
    pub confidence_collapse_count: usize,
    pub largest_collapse_ply: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CounterfactualReason {
    MarginalScoreDifference,
    None,
}

#[derive(Debug, Clone)]
pub struct CriticalTurningPoint {
    pub ply: usize,
    pub description: String,
    pub event_type: String,
}

#[derive(Debug, Clone)]
pub struct DceOutput {
    pub stability_score: f32,
    pub confidence: f32,
    pub raw_confidence: f32,
    pub stability_component: f32,
    pub tt_component: f32,
    pub margin_component: f32,
    pub depth_component: f32,
    pub delta_zero_penalty_applied: bool,
}

#[derive(Debug, Clone)]
pub struct DecisionTrace {
    pub trace_id: String,
    pub candidate_count: usize,
    pub selected_move: Move,
    pub confidence: f32,
    pub uncertainty: f32,
    pub outcome: TraceOutcome,
    pub expectation_error: Option<f32>,
}

#[derive(Debug, Clone)]
pub struct DmiPayload {
    pub data: String,
    pub evaluation_cp: i32,
    pub score_delta: i32,
    pub depth: u8,
    pub tt_hit_rate: f32,
    pub pv_stability: f32,
}

#[derive(Debug, Clone)]
pub struct EieOutput {
    pub confidence: f32,
    pub uncertainty: f32,
    pub pv_drift: f32,
    pub score_volatility: f32,
    pub candidate_ambiguity: f32,
}

#[derive(Debug, Clone)]
pub struct GameDecisionReport {
    pub game_id: String,
    pub opening: String,
    pub total_moves: usize,
    pub average_calibration_error: f32,
    pub median_calibration_error: f32,
    pub percentile_95_error: f32,
    pub std_dev_error: f32,
    pub maximum_error_cp: i32,
    pub maximum_error: i32,
    pub intent_stability: f32,
    pub confidence_summary: ConfidenceSummary,
    pub critical_turning_points: Vec<CriticalTurningPoint>,
    pub strategic_drift_timeline: Vec<StrategicDriftStep>,
    pub winner: String,
}

#[derive(Debug, Clone)]
pub struct IntentDistribution {
    pub primary_intent: String,
    pub center_expansion: f32,
    pub piece_activity: f32,
    pub solid_consolidation: f32,
}

#[derive(Debug, Clone)]
pub struct OpeningEpistemicProfile {
    pub opening_name: String,
    pub multiplier: f32,
    pub epistemic_confidence_multiplier: f32,
}

impl OpeningEpistemicProfile {
    pub fn new(name: &str) -> Self {
        Self {
            opening_name: name.to_string(),
            multiplier: 1.0,
            epistemic_confidence_multiplier: 1.0,
        }
    }

    pub fn update(&mut self, _avg_err: f32) {}
}

#[derive(Debug, Clone)]
pub struct RhizohDecision {
    pub best_move: Move,
    pub trace: DecisionTrace,
    pub dmi: DmiPayload,
    pub eie: EieOutput,
    pub dce: DceOutput,
    pub intent_distribution: IntentDistribution,
    pub counterfactual_rejection: CounterfactualReason,
    pub rejected_alternative: Option<CandidateMove>,
    pub all_candidates: Vec<CandidateMove>,
}

#[derive(Debug, Clone)]
pub struct StrategicDriftStep {
    pub ply: usize,
    pub intent: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TraceOutcome {
    Pending,
    Success,
    Failure,
}