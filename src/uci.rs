use crate::board::Board;
use crate::search::Searcher;
use std::io::{self, BufRead};

pub struct Uci {
    board: Board,
    searcher: Searcher,
}

impl Uci {
    pub fn new() -> Self {
        Uci {
            board: Board::new(),
            searcher: Searcher::new(),
        }
    }

    pub fn loop_communication(&mut self) {
        let stdin = io::stdin();
        for line in stdin.lock().lines() {
            let line = line.unwrap_or_default();
            let tokens: Vec<&str> = line.split_whitespace().collect();
            if tokens.is_empty() { continue; }

            match tokens[0] {
                "uci" => {
                    println!("id name Rhizoh Castle");
                    println!("id author Can Kasaplar");
                    println!("uciok");
                }
                "isready" => {
                    println!("readyok");
                }
                "position" => {
                    if tokens.len() > 1 {
                        if tokens[1] == "startpos" {
                            self.board = Board::new();
                        } else if tokens[1] == "fen" {
                            let fen_parts = &tokens[2..];
                            let mut fen_len = fen_parts.len();
                            for (idx, token) in fen_parts.iter().enumerate() {
                                if *token == "moves" {
                                    fen_len = idx;
                                    break;
                                }
                            }
                            let fen_string = fen_parts[..fen_len].join(" ");
                            self.board = Board::from_fen(&fen_string);
                        }
                    }
                }
                "go" => {
                    let score = self.searcher.search(&self.board, 5);
                    println!("info depth 5 score cp {}", score);
                    println!("bestmove e2e4");
                }
                "perft" => {
                    let depth = if tokens.len() > 1 {
                        tokens[1].parse().unwrap_or(1)
                    } else {
                        1
                    };
                    println!("Running perft depth {}...", depth);
                    
                    // Hata ayıklama hattı: Üretilen hamleleri koordinat (kare numarası) bazlı ekrana basıyoruz
                    let moves = self.board.generate_moves();
                    for mv in &moves {
                        println!("Move found: from {} to {}", mv.from, mv.to);
                    }
                    
                    let start = std::time::Instant::now();
                    let nodes = self.board.perft(depth);
                    let elapsed = start.elapsed();
                    println!("Nodes searched: {}", nodes);
                    println!("Time taken: {:?}", elapsed);
                }
                "quit" => {
                    break;
                }
                _ => {}
            }
        }
    }
}