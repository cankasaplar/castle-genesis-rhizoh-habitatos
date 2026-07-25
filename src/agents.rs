use crate::board::Board;
use crate::types::{Color, PieceType};
use crate::evaluator::{PositionEvaluator, EvaluationResult, TimeBudget};
use std::time::Instant;
use std::process::Command;

pub struct StaticEvaluator;

impl StaticEvaluator {
    fn get_piece_value(piece: PieceType) -> i32 {
        match piece {
            PieceType::Pawn => 100,
            PieceType::Knight => 320,
            PieceType::Bishop => 330,
            PieceType::Rook => 500,
            PieceType::Queen => 900,
            PieceType::King => 20000,
        }
    }
}

impl PositionEvaluator for StaticEvaluator {
    fn evaluate(&self, board: &Board, _budget: &TimeBudget) -> EvaluationResult {
        let start = Instant::now();
        let mut score = 0;

        for color_idx in 0..2 {
            let color = if color_idx == 0 { Color::White } else { Color::Black };
            let sign = if color == board.side_to_move { 1 } else { -1 };

            for piece_idx in 0..6 {
                let piece_type = match piece_idx {
                    0 => PieceType::Pawn,
                    1 => PieceType::Knight,
                    2 => PieceType::Bishop,
                    3 => PieceType::Rook,
                    4 => PieceType::Queen,
                    5 => PieceType::King,
                    _ => unreachable!(),
                };

                let bb = board.pieces[color_idx][piece_idx];
                let count = bb.count_ones() as i32;
                score += count * Self::get_piece_value(piece_type) * sign;
            }
        }

        EvaluationResult {
            score,
            confidence: 1.0,
            uncertainty: 0.0,
            expected_gain: 0.0,
            elapsed_time: start.elapsed(),
            explanation: Some(format!("Material score: {}", score)),
        }
    }
}

pub struct OllamaEvaluator {
    pub model_name: String,
}

impl OllamaEvaluator {
    pub fn new(model_name: &str) -> Self {
        OllamaEvaluator {
            model_name: model_name.to_string(),
        }
    }
}

impl PositionEvaluator for OllamaEvaluator {
    fn evaluate(&self, board: &Board, _budget: &TimeBudget) -> EvaluationResult {
        let start = Instant::now();
        let side_str = if board.side_to_move == Color::White { "White" } else { "Black" };
        
        let prompt = format!(
            "Analyze chess state for side to move: {}. \
             Format: SCORE: [int], CONFIDENCE: [float], UNCERTAINTY: [float], EXPLANATION: [text]",
            side_str
        );

        // Rust format! makrosu için dış süslü parantezler çiftlenerek ({{ ve }}) kaçış sağlanmıştır
        let raw_json = format!(
            "{{ \"model\": \"{}\", \"prompt\": \"{}\", \"stream\": false }}",
            self.model_name, prompt
        );

        let output = Command::new("curl")
            .arg("-s")
            .arg("-X")
            .arg("POST")
            .arg("http://localhost:11434/api/generate")
            .arg("-d")
            .arg(&raw_json)
            .output();

        let mut score = 0;
        let mut confidence = 0.5;
        let mut uncertainty = 0.5;
        let mut explanation = Some("Ollama fallback".to_string());

        if let Ok(out) = output {
            let response_str = String::from_utf8_lossy(&out.stdout);
            if let Some(res_index) = response_str.find("\"response\":\"") {
                let sub = &response_str[res_index + 12..];
                if let Some(end_index) = sub.find("\"") {
                    let text_response = &sub[..end_index].replace("\\n", "\n").replace("\\\"", "\"");
                    explanation = Some(text_response.clone());

                    for line in text_response.lines() {
                        if line.starts_with("SCORE:") {
                            score = line.replace("SCORE:", "").trim().parse().unwrap_or(0);
                        } else if line.starts_with("CONFIDENCE:") {
                            confidence = line.replace("CONFIDENCE:", "").trim().parse().unwrap_or(0.5);
                        } else if line.starts_with("UNCERTAINTY:") {
                            uncertainty = line.replace("UNCERTAINTY:", "").trim().parse().unwrap_or(0.5);
                        }
                    }
                }
            }
        }

        EvaluationResult {
            score,
            confidence,
            uncertainty,
            expected_gain: (confidence - uncertainty).abs(),
            elapsed_time: start.elapsed(),
            explanation,
        }
    }
}