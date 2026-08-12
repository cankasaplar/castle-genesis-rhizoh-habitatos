use crate::board::Board;

pub struct Perft;

impl Perft {
    pub fn divide(board: &Board, depth: u8) {
        if depth == 0 {
            println!("Total Nodes: 1\n");
            return;
        }

        let moves = board.generate_moves();
        let mut total_nodes = 0;

        println!("\n--- PERFT DIVIDE (Depth {}) ---", depth);
        for mv in &moves {
            let mut next_board = board.clone();
            next_board.make_move(*mv);

            let count = next_board.perft(depth - 1);
            total_nodes += count;
            println!("{}: {}", mv.to_uci(), count);
        }
        println!("Total Nodes: {}\n", total_nodes);
    }
}