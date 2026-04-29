// RHIZOH Phase A — çekirdek yardımcılar: Morton 3D (10-bit/hücre bileşeni).
// Tam pipeline: ayrı modüllerde pass 0–6; burada yalnız paylaşılan encode.

fn rhizoh_expand_bits(v: u32) -> u32 {
  var x = v & 0x3ffu;
  x = (x | (x << 16u)) & 0x30000ffu;
  x = (x | (x << 8u)) & 0x300f00fu;
  x = (x | (x << 4u)) & 0x30c30c3u;
  x = (x | (x << 2u)) & 0x49249249u;
  return x;
}

fn rhizoh_morton3d_10(cx: u32, cy: u32, cz: u32) -> u32 {
  let x = rhizoh_expand_bits(cx);
  let y = rhizoh_expand_bits(cy);
  let z = rhizoh_expand_bits(cz);
  return x | (y << 1u) | (z << 2u);
}

// Örnek: dünya biriminden hücre indeksine (uniform’lardan cellInvSize, bias gelecek).
// fn world_to_cell_morton(...) -> u32 { ... }
