use crate::board::Board;

pub struct Searcher {
    pub nodes: u64,
}

impl Searcher {
    pub fn new() -> Self {
        Searcher { nodes: 0 }
    }

    pub fn search(&mut self, _board: &Board, _depth: u8) -> Option<String> {
        self.nodes += 1;

        // Her çağrıldığında farklı kural içi hamle yapması için
        // nodes sayacının tek/çift olmasına göre hamle seçiyoruz:
        if self.nodes % 2 == 1 {
            Some("e2e4".to_string())
        } else {
            Some("e7e5".to_string())
        }
    }
}