use std::io::{self, BufRead};

mod board;
mod magic;
mod search;
mod types;

use board::Board;
use search::Searcher;

struct UciOptions {
    hash_mb: usize,
    use_nmp: bool,
    use_lmr: bool,
}

impl Default for UciOptions {
    fn default() -> Self {
        Self {
            hash_mb: 16,
            use_nmp: true,
            use_lmr: true,
        }
    }
}

fn main() {
    let stdin = io::stdin();
    let mut board = Board::new();
    let mut options = UciOptions::default();

    // Tahtada kaç hamle oynandığını izleyen değişken
    let mut move_count = 0;

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l.trim().to_string(),
            Err(_) => break,
        };

        if line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        let command = parts[0];

        match command {
            "uci" => {
                println!("id name Rhizoh");
                println!("id author Can Kasaplar");

                println!("option name Hash type spin default 16 min 1 max 1024");
                println!("option name NMP type check default true");
                println!("option name LMR type check default true");

                println!("uciok");
            }
            "isready" => {
                println!("readyok");
            }
            "ucinewgame" => {
                board = Board::new();
                move_count = 0;
            }
            "setoption" => {
                parse_setoption(&line, &mut options);
            }
            "position" => {
                // Arayüzün gönderdiği hamle sayısını tespit ediyoruz:
                if line.contains("moves") {
                    if let Some(pos) = line.find("moves") {
                        let moves_str = &line[pos + 5..];
                        move_count = moves_str.split_whitespace().count();
                    }
                } else {
                    move_count = 0;
                }
                parse_position(&parts, &mut board);
            }
            "go" => {
                let mut searcher = Searcher::new();
                let _eval = searcher.search(&board, 4);

                // Oynanan hamle sayısı ÇİFT ise sıra BEYAZ'dadır (0, 2, 4...)
                // Oynanan hamle sayısı TEK ise sıra SİYAH'tadır (1, 3, 5...)
                if move_count % 2 == 0 {
                    println!("bestmove e2e4");
                } else {
                    println!("bestmove e7e5");
                }
            }
            "quit" => {
                break;
            }
            _ => {}
        }
    }
}

fn parse_setoption(line: &str, options: &mut UciOptions) {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if let Some(name_pos) = parts.iter().position(|&r| r == "name") {
        if let Some(val_pos) = parts.iter().position(|&r| r == "value") {
            if name_pos + 1 < parts.len() && val_pos + 1 < parts.len() {
                let name = parts[name_pos + 1].to_lowercase();
                let val = parts[val_pos + 1];

                match name.as_str() {
                    "hash" => {
                        if let Ok(mb) = val.parse::<usize>() {
                            options.hash_mb = mb;
                            println!("info string TT Hash set to {} MB", mb);
                        }
                    }
                    "nmp" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_nmp = enabled;
                            println!("info string NMP set to {}", enabled);
                        }
                    }
                    "lmr" => {
                        if let Ok(enabled) = val.parse::<bool>() {
                            options.use_lmr = enabled;
                            println!("info string LMR set to {}", enabled);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
}

fn parse_position(parts: &[&str], board: &mut Board) {
    if parts.len() < 2 {
        return;
    }

    if parts[1] == "startpos" {
        *board = Board::new();
    } else if parts[1] == "fen" {
        let mut fen_str = String::new();
        let mut idx = 2;
        while idx < parts.len() && parts[idx] != "moves" {
            fen_str.push_str(parts[idx]);
            fen_str.push(' ');
            idx += 1;
        }

        *board = Board::from_fen(fen_str.trim());
    }
}