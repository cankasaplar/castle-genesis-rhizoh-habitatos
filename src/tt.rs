use std::sync::atomic::{AtomicU64, AtomicU8, Ordering};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum NodeType {
    Exact = 0,
    Alpha = 1,
    Beta = 2,
}

impl NodeType {
    #[inline(always)]
    pub fn from_u8(v: u8) -> Self {
        match v {
            0 => NodeType::Exact,
            1 => NodeType::Alpha,
            _ => NodeType::Beta,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct TTEntry {
    pub key: u64,
    pub depth: u8,
    pub score: i32,
    pub node_type: NodeType,
    pub best_move: Option<u16>,
    pub age: u8,
}

pub struct AtomicTTSlot {
    pub key: AtomicU64,
    pub data: AtomicU64,
}

impl Default for AtomicTTSlot {
    fn default() -> Self {
        Self {
            key: AtomicU64::new(0),
            data: AtomicU64::new(0),
        }
    }
}

pub struct TranspositionTable {
    pub slots: Vec<AtomicTTSlot>,
    pub size: usize,
    pub age: AtomicU8,
}

impl TranspositionTable {
    pub fn new(mb_size: usize) -> Self {
        let count = ((mb_size * 1024 * 1024) / std::mem::size_of::<AtomicTTSlot>()).max(1024);
        let mut slots = Vec::with_capacity(count);
        for _ in 0..count {
            slots.push(AtomicTTSlot::default());
        }
        TranspositionTable {
            slots,
            size: count,
            age: AtomicU8::new(0),
        }
    }

    pub fn resize(&mut self, mb_size: usize) {
        let count = ((mb_size * 1024 * 1024) / std::mem::size_of::<AtomicTTSlot>()).max(1024);
        let mut slots = Vec::with_capacity(count);
        for _ in 0..count {
            slots.push(AtomicTTSlot::default());
        }
        self.slots = slots;
        self.size = count;
        self.age.store(0, Ordering::Relaxed);
    }

    pub fn new_search(&self) {
        self.age.fetch_add(1, Ordering::Relaxed);
    }

    pub fn clear(&self) {
        for slot in &self.slots {
            slot.key.store(0, Ordering::Relaxed);
            slot.data.store(0, Ordering::Relaxed);
        }
        self.age.store(0, Ordering::Relaxed);
    }

    #[inline(always)]
    pub fn store(
        &self,
        key: u64,
        depth: u8,
        score: i32,
        node_type: NodeType,
        best_move: Option<u16>,
    ) {
        let index = (key as usize) % self.size;
        let slot = &self.slots[index];

        let current_age = self.age.load(Ordering::Relaxed);

        // Depth-preferred replacement policy:
        // - Always replace if the slot is empty (key == 0)
        // - Always replace if ages differ (stale entry)
        // - Replace if new depth >= existing depth (deeper = better)
        // - Always replace if the same key (update with fresher info)
        let existing_key = slot.key.load(Ordering::Acquire);
        if existing_key != 0 && existing_key != key {
            // Collision: check if existing entry is worth keeping
            let existing_data = slot.data.load(Ordering::Acquire);
            let existing_depth = ((existing_data >> 32) & 0xFF) as u8;
            let existing_age = ((existing_data >> 58) & 0xF) as u8;

            // Keep existing if it's same generation AND has significantly greater depth
            // The 3-ply advantage threshold prevents churning good deep entries
            if existing_age == (current_age & 0xF) && existing_depth > depth + 3 {
                return; // Preserve the deeper entry
            }
        }

        let packed_data = (score as u32 as u64)
            | ((depth as u64 & 0xFF) << 32)
            | (((node_type as u8) as u64 & 0x3) << 40)
            | ((best_move.unwrap_or(0) as u64 & 0xFFFF) << 42)
            | (((current_age & 0xF) as u64) << 58);

        slot.data.store(packed_data, Ordering::Release);
        slot.key.store(key, Ordering::Release);
    }

    #[inline(always)]
    pub fn probe(&self, key: u64) -> Option<TTEntry> {
        let index = (key as usize) % self.size;
        let slot = &self.slots[index];

        let k = slot.key.load(Ordering::Acquire);
        if k != key {
            return None;
        }

        let d = slot.data.load(Ordering::Acquire);
        let score = (d & 0xFFFFFFFF) as u32 as i32;
        let depth = ((d >> 32) & 0xFF) as u8;
        let node_type = NodeType::from_u8(((d >> 40) & 0x3) as u8);
        let mv_u16 = ((d >> 42) & 0xFFFF) as u16;
        let best_move = if mv_u16 != 0 { Some(mv_u16) } else { None };
        let age = ((d >> 58) & 0xF) as u8;

        Some(TTEntry {
            key: k,
            depth,
            score,
            node_type,
            best_move,
            age,
        })
    }

    pub fn hashfull_per_mille(&self) -> usize {
        let sample_size = self.size.min(1000);
        if sample_size == 0 {
            return 0;
        }
        let mut occupied = 0;
        for slot in &self.slots[..sample_size] {
            if slot.key.load(Ordering::Relaxed) != 0 {
                occupied += 1;
            }
        }
        (occupied * 1000) / sample_size
    }
}