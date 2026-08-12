use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use rand::seq::SliceRandom;

#[derive(Debug, Clone, Copy)]
pub struct PolyglotEntry {
    pub key: u64,
    pub mps: u16,
    pub weight: u16,
    pub learn: u32,
}

pub struct OpeningBook {
    entries: Vec<PolyglotEntry>,
}

impl OpeningBook {
    pub fn new() -> Self {
        OpeningBook { entries: Vec::new() }
    }

    pub fn load_bin_file<P: AsRef<Path>>(&mut self, path: P) -> io::Result<()> {
        let mut file = File::open(path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;

        let entry_size = 16;
        let num_entries = buffer.len() / entry_size;

        self.entries.clear();
        self.entries.reserve(num_entries);

        for i in 0..num_entries {
            let offset = i * entry_size;
            let key = u64::from_be_bytes(buffer[offset..offset + 8].try_into().unwrap());
            let mps = u16::from_be_bytes(buffer[offset + 8..offset + 10].try_into().unwrap());
            let weight = u16::from_be_bytes(buffer[offset + 10..offset + 12].try_into().unwrap());
            let learn = u32::from_be_bytes(buffer[offset + 12..offset + 16].try_into().unwrap());

            self.entries.push(PolyglotEntry { key, mps, weight, learn });
        }

        self.entries.sort_by(|a, b| a.key.cmp(&b.key));
        Ok(())
    }

    pub fn get_book_move(&self, zobrist_key: u64) -> Option<u16> {
        // Standart binary_search ile eşleşen ilk indeksi buluyoruz
        let idx = self.entries.binary_search_by(|entry| entry.key.cmp(&zobrist_key)).ok()?;

        // Aynı key değerine sahip diğer girişleri de (çakışmalar veya birden fazla hamle için) aralık olarak topluyoruz
        let mut start = idx;
        while start > 0 && self.entries[start - 1].key == zobrist_key {
            start -= 1;
        }

        let mut end = idx;
        while end + 1 < self.entries.len() && self.entries[end + 1].key == zobrist_key {
            end += 1;
        }

        let matching_entries = &self.entries[start..=end];
        if matching_entries.is_empty() {
            return None;
        }

        let total_weight: u32 = matching_entries.iter().map(|e| e.weight as u32).sum();
        if total_weight == 0 {
            let mut rng = rand::thread_rng();
            return matching_entries.choose(&mut rng).map(|e| e.mps);
        }

        let mut rng_weight = rand::random::<u32>() % total_weight;
        for entry in matching_entries {
            if rng_weight < entry.weight as u32 {
                return Some(entry.mps);
            }
            rng_weight -= entry.weight as u32;
        }

        matching_entries.first().map(|e| e.mps)
    }
}