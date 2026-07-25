use crate::board::Board;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct TimeBudget {
    pub allocated: Duration,
    pub soft_limit: Duration,
}

#[derive(Debug, Clone)]
pub struct EvaluationResult {
    pub score: i32,
    pub confidence: f32,
    pub uncertainty: f32,
    pub expected_gain: f32,
    pub elapsed_time: Duration,
    pub explanation: Option<String>,
}

pub trait PositionEvaluator {
    fn evaluate(
        &self,
        board: &Board,
        budget: &TimeBudget,
    ) -> EvaluationResult;
}