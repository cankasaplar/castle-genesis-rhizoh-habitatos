// vNext-539 — Constitutional field pass (storage buffer: stride 8 floats / cell).
// truth, contradiction, legitimacy, novelty, memory, entropy, branch_entropy, conflict_severity

struct FieldCellPacked {
  truth: f32,
  contradiction: f32,
  legitimacy: f32,
  novelty: f32,
  memory: f32,
  entropy: f32,
  branch_entropy: f32,
  conflict_severity: f32,
}

struct WeatherOut {
  density: f32,
  emission: f32,
  turbulence: f32,
  phase_shift: f32,
}

@group(0) @binding(0) var<storage, read> field_atlas: array<FieldCellPacked>;

fn constitutional_weather(c: FieldCellPacked) -> WeatherOut {
  let glow = c.truth * 0.85 + (1.0 - c.entropy) * 0.15;
  let turb = c.contradiction * 0.9 + c.entropy * 0.35 + c.conflict_severity * 0.25;
  let crystal = c.legitimacy * (1.0 - c.contradiction * 0.4) * (1.0 - c.branch_entropy * 0.15);
  let sparks = c.novelty * 0.95;
  let echo = c.memory * 0.8 + c.entropy * 0.15;
  var w: WeatherOut;
  w.density = clamp(glow * 0.6 + crystal * 0.35 + echo * 0.25, 0.0, 1.0);
  w.emission = clamp(sparks * 0.7 + glow * 0.35, 0.0, 1.0);
  w.turbulence = clamp(turb, 0.0, 1.0);
  w.phase_shift = clamp(c.branch_entropy * 0.5 + c.conflict_severity * 0.35 + c.novelty * 0.25, 0.0, 1.0);
  return w;
}
