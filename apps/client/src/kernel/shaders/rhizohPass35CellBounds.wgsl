// RHIZOH Pass 3.5 — cellEnd + cellCount from cellStart (GPU resident; unique count = atomicLoad).

struct CellBoundsUniform {
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

@group(0) @binding(0) var<uniform> bounds_u: CellBoundsUniform;
@group(0) @binding(1) var<storage, read_write> cells: array<CellEntry>;
@group(0) @binding(2) var<storage, read_write> cell_unique_count: array<atomic<u32>, 1>;

@compute @workgroup_size(256)
fn cell_bounds(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  let u = atomicLoad(&cell_unique_count[0]);
  if (i >= u) { return; }
  let s = cells[i].start;
  let end = select(bounds_u.n, cells[i + 1u].start, (i + 1u) < u);
  cells[i].end = end;
  cells[i].count = end - s;
}
