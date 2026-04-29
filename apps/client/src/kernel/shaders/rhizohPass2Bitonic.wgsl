// RHIZOH shadow Pass 2 — Bitonic sort step (dispatch loop from JS).

struct KeyIndex {
  key: u32,
  idx: u32,
}

struct BitonicUniform {
  n: u32,
  j: u32,
  k: u32,
  _pb: u32,
}

@group(0) @binding(0) var<uniform> bitonic_u: BitonicUniform;
@group(0) @binding(1) var<storage, read_write> bitonic_pairs: array<KeyIndex>;

@compute @workgroup_size(256)
fn bitonic_step(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  let j = bitonic_u.j;
  let k = bitonic_u.k;
  let n = bitonic_u.n;
  if (i >= n) { return; }
  let ixj = i ^ j;
  if (ixj <= i) { return; }
  if (ixj >= n) { return; }
  let ascending = (i & k) == 0u;
  let a = bitonic_pairs[i];
  let b = bitonic_pairs[ixj];
  let swap = (ascending && a.key > b.key) || (!ascending && a.key < b.key);
  if (swap) {
    bitonic_pairs[i] = b;
    bitonic_pairs[ixj] = a;
  }
}
