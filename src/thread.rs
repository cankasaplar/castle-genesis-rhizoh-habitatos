use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use crate::board::Board;
use crate::search::Searcher;
use crate::time_mgr::TimeLimits;
use crate::tt::TranspositionTable;
use crate::types::CandidateMove;

pub struct ThreadPool {
    threads: usize,
}

impl ThreadPool {
    pub fn new(threads: usize) -> Self {
        Self {
            threads: threads.max(1),
        }
    }

    pub fn search(
        &mut self,
        board: &Board,
        limits: Option<TimeLimits>,
        tt: Arc<TranspositionTable>,
    ) -> Vec<CandidateMove> {
        let num_threads = self.threads;
        let shared_abort = Arc::new(AtomicBool::new(false));

        if num_threads <= 1 {
            let mut searcher = Searcher::new();
            if let Some(lim) = limits {
                searcher.set_time_limits(lim);
            }
            searcher.set_shared_abort(shared_abort);
            searcher.tt = tt;
            let mut board_mut = board.clone();
            return searcher.search_single_thread(&mut board_mut, 18, 5);
        }

        let mut handles: Vec<JoinHandle<Vec<CandidateMove>>> = Vec::new();

        for i in 0..num_threads {
            let mut board_clone = board.clone();
            let limits_clone = limits.clone();
            let tt_clone = Arc::clone(&tt);
            let abort_clone = Arc::clone(&shared_abort);

            let handle = thread::spawn(move || {
                let mut searcher = Searcher::new();
                if let Some(lim) = limits_clone {
                    searcher.set_time_limits(lim);
                }
                searcher.set_shared_abort(abort_clone);
                searcher.tt = tt_clone;
                let target_depth = if i == 0 { 18 } else { 18 + (i as u8 % 2) };
                searcher.search_single_thread(&mut board_clone, target_depth, 5)
            });

            handles.push(handle);
        }

        let mut best_moves = Vec::new();
        for (idx, handle) in handles.into_iter().enumerate() {
            if let Ok(res) = handle.join() {
                if idx == 0 {
                    best_moves = res;
                    // Thread 0 completed — signal all other worker threads to stop immediately
                    shared_abort.store(true, Ordering::Relaxed);
                }
            }
        }

        best_moves
    }
}
