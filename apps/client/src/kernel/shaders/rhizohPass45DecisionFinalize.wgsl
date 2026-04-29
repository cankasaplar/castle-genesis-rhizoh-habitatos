// RHIZOH Pass 4.5 v1 — GPU semantic finalize (minimal): cell occupancy → compact intent quanta.
// Host doğrulaması: magic + maxCellCount + uniqueCells + modeQuanta (CPU ile eşleşmeli).

struct CellEntry {
  key: u32,
  start: u32,
  end: u32,
  count: u32,
}

@group(0) @binding(0) var<storage, read> cells: array<CellEntry>;
@group(0) @binding(1) var<storage, read_write> cell_unique_count: array<atomic<u32>, 1>;
@group(0) @binding(2) var<storage, read_write> decision_out: array<u32, 4>;

// JS ile aynı: RHIZOH_DECISION_MAGIC_V1
const MAGIC_V1: u32 = 0x52484f31u;

fn mode_quanta_from_max_count(max_c: u32) -> u32 {
  if (max_c >= 64u) { return 3u; }
  if (max_c >= 24u) { return 2u; }
  return 1u;
}

@compute @workgroup_size(1, 1, 1)
fn decision_finalize_v1() {
  let u = atomicLoad(&cell_unique_count[0]);
  var max_c = 0u;
  for (var i = 0u; i < u; i++) {
    max_c = max(max_c, cells[i].count);
  }
  decision_out[0] = MAGIC_V1;
  decision_out[1] = max_c;
  decision_out[2] = u;
  decision_out[3] = mode_quanta_from_max_count(max_c);
}
