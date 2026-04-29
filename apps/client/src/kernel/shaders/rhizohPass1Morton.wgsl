// RHIZOH shadow Pass 1 — MortonEncode.

struct GlobalUniform {
  n: u32,
  morton_bits: u32,
  inv_cell: f32,
  _pad0: f32,
  origin: vec3<f32>,
  _pad1: f32,
}

struct Particle {
  pos: vec3<f32>,
  _p: f32,
}

struct KeyIndex {
  key: u32,
  idx: u32,
}

fn expand_bits_10(v: u32) -> u32 {
  var x = v & 0x3ffu;
  x = (x | (x << 16u)) & 0x30000ffu;
  x = (x | (x << 8u)) & 0x300f00fu;
  x = (x | (x << 4u)) & 0x30c30c3u;
  x = (x | (x << 2u)) & 0x49249249u;
  return x;
}

fn expand_bits_8(v: u32) -> u32 {
  var x = v & 0xffu;
  x = (x | (x << 8u)) & 0x00f00fu;
  x = (x | (x << 4u)) & 0x0c30c3u;
  x = (x | (x << 2u)) & 0x222222u;
  return x;
}

fn morton3d_adaptive(cx: u32, cy: u32, cz: u32, bits: u32) -> u32 {
  let mask = (1u << bits) - 1u;
  let x0 = cx & mask;
  let y0 = cy & mask;
  let z0 = cz & mask;
  if (bits <= 8u) {
    let x = expand_bits_8(x0);
    let y = expand_bits_8(y0);
    let z = expand_bits_8(z0);
    return x | (y << 1u) | (z << 2u);
  }
  let x = expand_bits_10(x0);
  let y = expand_bits_10(y0);
  let z = expand_bits_10(z0);
  return x | (y << 1u) | (z << 2u);
}

@group(0) @binding(0) var<uniform> morton_global: GlobalUniform;
@group(0) @binding(1) var<storage, read> morton_particles: array<Particle>;
@group(0) @binding(2) var<storage, read_write> morton_pairs: array<KeyIndex>;

@compute @workgroup_size(256)
fn morton_encode(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= morton_global.n) { return; }
  let p = morton_particles[i].pos;
  let o = morton_global.origin;
  let ic = morton_global.inv_cell;
  let cap = (1u << min(morton_global.morton_bits, 10u)) - 1u;
  let cx = u32(clamp(floor((p.x - o.x) * ic), 0.0, f32(cap)));
  let cy = u32(clamp(floor((p.y - o.y) * ic), 0.0, f32(cap)));
  let cz = u32(clamp(floor((p.z - o.z) * ic), 0.0, f32(cap)));
  morton_pairs[i].key = morton3d_adaptive(cx, cy, cz, min(morton_global.morton_bits, 10u));
  morton_pairs[i].idx = i;
}
