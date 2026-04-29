/**
 * Render / sim ayrımı — 5M ölçeğinde instance matrix CPU upload bottleneck.
 *
 * Hedef (Phase B): vertex pulling — instance transform buffer GPU’da üretilir ve vertex shader’da okunur.
 * Kaçınılacak: her kare binlerce InstancedMesh.setMatrixAt (CPU → PCIe).
 */

export const GPU_RENDER_STRATEGY = {
  instanceDataSource: "gpu_written_instance_buffer",
  vertexPath: "vertex_pulling_read_transform_buffer",
  /** SoA örnek tampon: pos(3) + quat(4) + scale(3) + color(4) ≈ 14 float; matris VS’de kurulur; SIMD/pack ile daha az. */
  instanceSoA: {
    channels: ["pos_f32x3", "quat_f32x4", "scale_f32x3", "color_f32x4"],
    matrixCompose: "vertex_shader_from_quat_scale_translation",
    note: "16 float 4x4 yerine SoA + VS compose; dönüşüm istenirse quat→matris compute’ta bir kez veya VS’de."
  },
  couplingToSim: "indirect_dispatch_or_shared_timeline_only",
  antiPatterns: ["per_entity_setMatrixAt_each_frame", "full_matrix_buffer_staging_upload"]
};

export function describeRenderSimSplit() {
  return GPU_RENDER_STRATEGY;
}
