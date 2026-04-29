// RHIZOH shadow Pass 0 — SpawnInit (N power of 2).

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

@group(0) @binding(0) var<uniform> global_u: GlobalUniform;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(256)
fn spawn_init(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= global_u.n) { return; }
  let f = f32(i) * 0.017;
  particles[i].pos = vec3<f32>(cos(f) * 1200.0, sin(f * 0.7) * 400.0, sin(f) * 1200.0);
  particles[i]._p = 0.0;
}
