use std::time::{Duration, Instant};
use crate::types::Color;

#[derive(Debug, Clone, Copy)]
pub struct TimeLimits {
    pub start_time: Instant,
    pub soft_limit: Option<Duration>,
    pub hard_limit: Option<Duration>,
}

impl TimeLimits {
    pub fn infinite() -> Self {
        Self {
            start_time: Instant::now(),
            soft_limit: None,
            hard_limit: None,
        }
    }

    pub fn fixed_movetime(ms: u64) -> Self {
        let soft_ms = ms.saturating_sub(100).max(10);
        let hard_ms = ms.saturating_sub(40).max(10);
        Self {
            start_time: Instant::now(),
            soft_limit: Some(Duration::from_millis(soft_ms)),
            hard_limit: Some(Duration::from_millis(hard_ms)),
        }
    }

    pub fn calculate(
        side: Color,
        wtime: Option<u64>,
        btime: Option<u64>,
        winc: Option<u64>,
        binc: Option<u64>,
        movestogo: Option<u64>,
    ) -> Self {
        let (time, inc) = match side {
            Color::White => (wtime, winc.unwrap_or(0)),
            Color::Black => (btime, binc.unwrap_or(0)),
        };

        if let Some(t) = time {
            let (soft_ms, hard_ms) = if t <= 1000 {
                let soft = (t / 10).max(5);
                let hard = (t / 5).max(10);
                (soft, hard)
            } else if t <= 3000 {
                let soft = (t / 20).max(15);
                let hard = (t / 8).max(30);
                (soft, hard)
            } else {
                let moves = movestogo.unwrap_or(40).max(1);
                let base_alloc = (t / moves) + (inc * 4 / 5);
                let alloc_ms = base_alloc;
                let safety_buffer = if t < 5000 { 50 } else { 20 };
                let max_avail = t.saturating_sub(safety_buffer);
                let soft = alloc_ms.min(max_avail / 2).max(10);
                let hard = ((alloc_ms * 3) / 2).min(max_avail).max(20);
                (soft, hard)
            };

            Self {
                start_time: Instant::now(),
                soft_limit: Some(Duration::from_millis(soft_ms)),
                hard_limit: Some(Duration::from_millis(hard_ms)),
            }
        } else {
            Self::infinite()
        }
    }

    /// Extends soft time limit during panic situations (e.g. score collapse or fail-low)
    pub fn extend_time_for_panic(&mut self, multiplier: f32) {
        if let Some(soft) = self.soft_limit {
            let new_soft_ms = (soft.as_millis() as f32 * multiplier) as u64;
            if let Some(hard) = self.hard_limit {
                let bounded_soft = new_soft_ms.min(hard.as_millis() as u64);
                self.soft_limit = Some(Duration::from_millis(bounded_soft));
            } else {
                self.soft_limit = Some(Duration::from_millis(new_soft_ms));
            }
        }
    }

    pub fn is_soft_limit_exceeded(&self) -> bool {
        if let Some(soft) = self.soft_limit {
            self.start_time.elapsed() >= soft
        } else {
            false
        }
    }

    pub fn is_hard_limit_exceeded(&self) -> bool {
        if let Some(hard) = self.hard_limit {
            self.start_time.elapsed() >= hard
        } else {
            false
        }
    }

    pub fn elapsed_ms(&self) -> u64 {
        self.start_time.elapsed().as_millis() as u64
    }

    pub fn is_emergency_stop(&self) -> bool {
        if let Some(hard) = self.hard_limit {
            self.start_time.elapsed() >= hard
        } else {
            false
        }
    }
}
