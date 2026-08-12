use crate::board::Board;

#[derive(Debug, Clone)]
pub struct TexelTuneConfig {
    pub pawn_weight: f32,
    pub knight_weight: f32,
    pub bishop_weight: f32,
    pub rook_weight: f32,
    pub queen_weight: f32,
    pub k_precision: f32,
}

impl TexelTuneConfig {
    pub fn default_config() -> Self {
        Self {
            pawn_weight: 1.0,
            knight_weight: 3.2,
            bishop_weight: 3.3,
            rook_weight: 5.0,
            queen_weight: 9.0,
            k_precision: 1.13,
        }
    }

    pub fn sigmoid(&self, score_cp: f32) -> f32 {
        1.0 / (1.0 + 10.0f32.powf(-self.k_precision * score_cp / 400.0))
    }

    pub fn calculate_mse(&self, eval_scores: &[f32], result_outcomes: &[f32]) -> f32 {
        if eval_scores.is_empty() {
            return 0.0;
        }
        let mut total_sq_err = 0.0;
        for (score, result) in eval_scores.iter().zip(result_outcomes.iter()) {
            let pred = self.sigmoid(*score);
            let diff = pred - result;
            total_sq_err += diff * diff;
        }
        total_sq_err / eval_scores.len() as f32
    }
}
