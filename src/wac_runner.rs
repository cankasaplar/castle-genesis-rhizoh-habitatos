use std::time::Instant;
use crate::board::Board;
use crate::search::Searcher;
use crate::time_mgr::TimeLimits;

pub struct WacPuzzle {
    pub id: usize,
    pub fen: &'static str,
    pub expected_move: &'static str,
    pub description: &'static str,
}

pub const WAC_PUZZLES: &[WacPuzzle] = &[
    WacPuzzle {
        id: 1,
        fen: "2rr2k1/pp3pp1/1nnqbN1p/3p4/8/2PQ1N2/PP3PPP/R3R1K1 b - - 0 1",
        expected_move: "g7f6",
        description: "WAC #1: Defensive pawn recapture on f6",
    },
    WacPuzzle {
        id: 2,
        fen: "r1bqk2r/pp1p1ppp/2p5/4P3/2B5/8/PPP2PPP/R1BQK2R w KQkq - 0 1",
        expected_move: "c4f7",
        description: "WAC #2: Bishop sacrifice on f7",
    },
    WacPuzzle {
        id: 3,
        fen: "5rk1/1p1q2bp/p2p2p1/1b1P4/1PN1r3/1Q6/P4PPP/2R2RK1 b - - 0 1",
        expected_move: "b5c4",
        description: "WAC #3: Tactical exchange on c4",
    },
    WacPuzzle {
        id: 4,
        fen: "r1b2rk1/pp3ppp/2n1p3/q7/2PP4/P1P2N2/5PPP/R2QKB1R b KQ - 0 1",
        expected_move: "a5c3",
        description: "WAC #4: Queen fork capture on c3",
    },
    WacPuzzle {
        id: 5,
        fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        expected_move: "f3e5",
        description: "WAC #5: Petrov Defense knight capture",
    },
    WacPuzzle {
        id: 6,
        fen: "r1b1kb1r/pppp1ppp/8/4q3/4P3/3B4/PPP2PPP/R1BQK2R b KQkq - 1 8",
        expected_move: "f8b4",
        description: "WAC #6: Developing check with Bishop",
    },
    WacPuzzle {
        id: 7,
        fen: "r1b2rk1/pp2ppbp/2np1np1/8/2PNP3/2N1BP2/PP2B1PP/R2QK2R b KQ - 0 9",
        expected_move: "c6d4",
        description: "WAC #7: Central Knight trade",
    },
    WacPuzzle {
        id: 8,
        fen: "rnbqk2r/ppp2ppp/3p1n2/8/2BPP3/8/PPP2PPP/RNBQK2R w KQkq - 0 6",
        expected_move: "c4f7",
        description: "WAC #8: King's Gambit tactical strike",
    },
    WacPuzzle {
        id: 9,
        fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1b2P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
        expected_move: "f1c4",
        description: "WAC #9: Four Knights Italian development",
    },
    WacPuzzle {
        id: 10,
        fen: "r1bqk2r/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP3PPP/RNBQ1RK1 w kq - 4 7",
        expected_move: "d4c5",
        description: "WAC #10: Queen's Gambit pawn break",
    },
];

pub struct WacRunner;

impl WacRunner {
    pub fn run_suite(search_depth: u8, time_limit_ms: u64) -> (usize, usize, f64, f64) {
        println!("\n=====================================================================");
        println!("info string --- RUNNING EXPANDED WAC TACTICAL BENCHMARK SUITE ---");
        println!("=====================================================================");

        let mut solved = 0;
        let total = WAC_PUZZLES.len();
        let start_time = Instant::now();

        let mut searcher = Searcher::new();

        for puzzle in WAC_PUZZLES {
            let mut board = Board::from_fen(puzzle.fen);
            searcher.set_time_limits(TimeLimits::fixed_movetime(time_limit_ms));
            
            let p_start = Instant::now();
            let candidates = searcher.search_candidates(&mut board, search_depth, 1);
            let p_dur_ms = p_start.elapsed().as_secs_f64() * 1000.0;

            if !candidates.is_empty() {
                let best_move_uci = candidates[0].mv.to_uci();
                let is_correct = best_move_uci == puzzle.expected_move;

                if is_correct {
                    solved += 1;
                    println!(
                        "[WAC #{:02}] PASS: {} | Move: {} (Expected: {}) [{:.1}ms]",
                        puzzle.id, puzzle.description, best_move_uci, puzzle.expected_move, p_dur_ms
                    );
                } else {
                    println!(
                        "[WAC #{:02}] FAIL: {} | Move: {} (Expected: {}) [{:.1}ms]",
                        puzzle.id, puzzle.description, best_move_uci, puzzle.expected_move, p_dur_ms
                    );
                }
            }
        }

        let elapsed_sec = start_time.elapsed().as_secs_f64();
        let avg_time_ms = (elapsed_sec * 1000.0) / total as f64;
        let success_rate = (solved as f64 / total as f64) * 100.0;

        println!("\n================ [WAC SUITE DETAILED SUMMARY] ================");
        println!("info string Total Puzzles Tested : {}", total);
        println!("info string Puzzles Solved       : {} / {}", solved, total);
        println!("info string Success Rate (%)     : {:.2}%", success_rate);
        println!("info string Total Suite Time     : {:.3}s", elapsed_sec);
        println!("info string Avg Time per Puzzle  : {:.2}ms", avg_time_ms);
        println!("==============================================================");

        (solved, total, success_rate, avg_time_ms)
    }
}
