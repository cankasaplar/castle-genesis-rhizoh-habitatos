// RHIZOH shadow Pass 3 — cell start indices from sorted keys.

struct KeyIndex {
  key: u32,
  idx: u32,
}

struct CellUniform {
  n: u32,
  _p0: u32,
  _p1: u32,
  _p2: u32,
}

struct CellEntry {
  key: u32,
  start: u32,
  end: u32,
  count: u32,
}

@group(0) @binding(0) var<uniform> cell_u: CellUniform;
@group(0) @binding(1) var<storage, read> cell_pairs: array<KeyIndex>;
@group(0) @binding(2) var<storage, read_write> cell_out: array<CellEntry>;
@group(0) @binding(3) var<storage, read_write> cell_atomic_count: array<atomic<u32>, 1>;

@compute @workgroup_size(256)
fn cell_offsets(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  let n = cell_u.n;
  if (i >= n) { return; }
  let is_start = i == 0u || cell_pairs[i].key != cell_pairs[i - 1u].key;
  if (is_start) {
    let slot = atomicAdd(&cell_atomic_count[0], 1u);
    if (slot < n) {
      cell_out[slot].key = cell_pairs[i].key;
      cell_out[slot].start = i;
      cell_out[slot].end = 0u;
      cell_out[slot].count = 0u;
    }
  }
}
