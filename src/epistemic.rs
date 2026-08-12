use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::types::CandidateMove;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpectationRecord {
    pub expected_cp: i32,
    pub realized_cp: i32,
    pub delta_error: i32,
    pub confidence_modifier: f32,
    pub tactical_motif: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameDecisionReport {
    pub game_id: String,
    pub opening: String,
    pub termination: String,
    pub total_plies: usize,
    pub average_calibration_error: f32,
    pub records: Vec<ExpectationRecord>,
}

pub struct CalibrationMemory {
    records: Vec<ExpectationRecord>,
    opening_multipliers: HashMap<String, f32>,
}

impl CalibrationMemory {
    pub fn new() -> Self {
        let mut opening_multipliers = HashMap::new();
        opening_multipliers.insert("Sicilian Defense".to_string(), 1.15);
        opening_multipliers.insert("Italian Game".to_string(), 1.00);
        opening_multipliers.insert("Queen's Gambit".to_string(), 1.10);
        opening_multipliers.insert("French Defense".to_string(), 0.95);
        opening_multipliers.insert("King's Indian Defense".to_string(), 1.20);
        opening_multipliers.insert("Ruy Lopez".to_string(), 1.05);

        let mut instance = Self {
            records: Vec::new(),
            opening_multipliers,
        };
        instance.load_archive_history();
        instance
    }

    pub fn load_archive_history(&mut self) -> usize {
        let archive_dir = "data/gdr_archive/2026/07";
        let mut loaded = 0;
        if let Ok(entries) = std::fs::read_dir(archive_dir) {
            for entry in entries.flatten() {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                    if let Ok(content) = std::fs::read_to_string(entry.path()) {
                        if let Ok(gdr) = serde_json::from_str::<GameDecisionReport>(&content) {
                            for rec in gdr.records {
                                self.records.push(rec);
                                loaded += 1;
                            }
                            self.register_game_to_opening(&gdr.opening, gdr.average_calibration_error);
                        }
                    }
                }
            }
        }
        loaded
    }

    pub fn store(&mut self, record: ExpectationRecord) {
        self.records.push(record);
    }

    pub fn average_calibration_error(&self) -> f32 {
        if self.records.is_empty() {
            return 0.0;
        }
        let sum: i32 = self.records.iter().map(|r| r.delta_error.abs()).sum();
        sum as f32 / self.records.len() as f32
    }

    pub fn get_time_budget_multiplier(&self, opening: &str) -> f32 {
        *self.opening_multipliers.get(opening).unwrap_or(&1.0)
    }

    /// STRICTLY ONLINE ADAPTATION: Adjusts search depth & time allocation bijections without mutating evaluation weights
    pub fn adapt_online_search_budget(&mut self, opening: &str, expected_cp: i32, realized_score: f32) {
        let entry = self.opening_multipliers.entry(opening.to_string()).or_insert(1.0);
        let error = (expected_cp as f32 - (realized_score * 200.0 - 100.0)).abs();
        if realized_score < 0.5 && expected_cp > 100 {
            // Unexpected loss: expand search depth budget on this line (+15% time)
            *entry *= 1.15;
        } else if realized_score > 0.5 && expected_cp < -100 {
            // Unexpected win: preserve standard time budget
            *entry *= 1.00;
        } else if error > 50.0 {
            *entry *= 1.05;
        } else {
            *entry *= 0.98;
        }
        *entry = entry.clamp(0.8, 1.5);
    }

    pub fn register_game_to_opening(&mut self, opening: &str, error: f32) {
        let entry = self.opening_multipliers.entry(opening.to_string()).or_insert(1.0);
        if error > 50.0 {
            *entry *= 0.95;
        } else {
            *entry *= 1.02;
        }
    }

    pub fn generate_gdr(&self, game_id: &str, opening: &str, termination: &str) -> GameDecisionReport {
        GameDecisionReport {
            game_id: game_id.to_string(),
            opening: opening.to_string(),
            termination: termination.to_string(),
            total_plies: self.records.len(),
            average_calibration_error: self.average_calibration_error(),
            records: self.records.clone(),
        }
    }

    pub fn to_gdr_json(&self, gdr: &GameDecisionReport) -> String {
        serde_json::to_string_pretty(gdr).unwrap_or_else(|_| "{}".to_string())
    }
}

pub struct ExpectationEngine;

impl ExpectationEngine {
    pub fn evaluate_expectation(exp_cp: i32, realized_cp: i32, confidence: f32, motif: &str) -> ExpectationRecord {
        let delta_error = (exp_cp - realized_cp).abs();
        ExpectationRecord {
            expected_cp: exp_cp,
            realized_cp,
            delta_error,
            confidence_modifier: confidence,
            tactical_motif: motif.to_string(),
        }
    }
}

pub struct SearchBudgetController;

impl SearchBudgetController {
    pub fn adjust_depth(base_depth: u8, opening: &str, avg_error: f32) -> u8 {
        let mut depth = base_depth;
        if opening == "King's Indian Defense" || opening == "Sicilian Defense" {
            depth += 1;
        }
        if avg_error > 40.0 {
            depth += 1;
        }
        depth
    }
}

pub struct RdilEngine;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IllegalMoveDebugArtifact {
    pub fen: String,
    pub selected_move: String,
    pub source: String,
    pub is_legal: bool,
    pub generated_legal_moves: Vec<String>,
}

impl RdilEngine {
    pub fn process_decision(candidates: &[CandidateMove], _confidence: f32, _trace: u64, _weight: f32) -> Option<CandidateMove> {
        candidates.first().cloned()
    }

    pub fn classify_motif(mv: &crate::types::Move) -> String {
        if mv.captured.is_some() || mv.is_en_passant {
            "TacticalExchange".to_string()
        } else if mv.promotion.is_some() {
            "PawnPromotion".to_string()
        } else if mv.is_castling {
            "KingSafetyCastling".to_string()
        } else if mv.piece == crate::types::PieceType::Knight && [26, 27, 28, 29, 34, 35, 36, 37].contains(&mv.to) {
            "KnightOutpost".to_string()
        } else if mv.piece == crate::types::PieceType::Pawn && (mv.to / 8 == 6 || mv.to / 8 == 1) {
            "PassedPawnPush".to_string()
        } else {
            let to_sq = mv.to;
            if to_sq == 27 || to_sq == 28 || to_sq == 35 || to_sq == 36 {
                "CenterControl".to_string()
            } else {
                "PositionalDevelopment".to_string()
            }
        }
    }

    pub fn to_rda_json(dec: &CandidateMove, fen: &str, ply: usize, motif: &str) -> String {
        format!(
            r#"{{"ply": {}, "selected_move": "{}", "score_cp": {}, "depth": {}, "motif": "{}", "fen": "{}"}}"#,
            ply, dec.mv.to_uci(), dec.score, dec.depth, motif, fen
        )
    }

    pub fn log_illegal_attempt(board: &crate::board::Board, selected_move: &str, source: &str) {
        let legal_moves = board.generate_moves().into_iter().map(|m| m.to_uci()).collect::<Vec<_>>();
        let artifact = IllegalMoveDebugArtifact {
            fen: board.to_fen(),
            selected_move: selected_move.to_string(),
            source: source.to_string(),
            is_legal: false,
            generated_legal_moves: legal_moves,
        };

        let archive_dir = "data/gdr_archive/illegal_debug";
        if let Ok(_) = std::fs::create_dir_all(archive_dir) {
            let json_str = serde_json::to_string_pretty(&artifact).unwrap_or_default();
            let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
            let file_path = format!("{}/illegal_attempt_{}.json", archive_dir, timestamp);
            let _ = std::fs::write(&file_path, json_str);
        }
    }
}