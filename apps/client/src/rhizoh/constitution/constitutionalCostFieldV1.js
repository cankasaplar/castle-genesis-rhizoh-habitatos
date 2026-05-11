/**
 * R2 — Constitutional cost field — göreli yürütme maliyeti (ölçeklenebilirlik ipuçları).
 * Mutlak milisaniye yerine birim maliyet birimi; gerçek profiler üst katmana bırakılır.
 */

import { RHIZOH_PHASE_SPACE_OPERATOR_IDS_V1 } from "./constitutionalPhaseSpaceAlgebraV1.js";
import { RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1 } from "./constitutionalCompilerIRv1.js";

export const RHIZOH_CONSTITUTIONAL_COST_FIELD_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** IR opcode göreli maliyet (birim: soyut “cost unit”). */
export const RHIZOH_CONSTITUTIONAL_IR_INSTRUCTION_COST_V1 = Object.freeze({
  NOP: 0.2,
  HALT: 0.2,
  SET_THETA: 0.6,
  SET_STRESS: 0.6,
  SET_ADAPTATION_DISABLED: 0.8,
  ADAPT_STEP: 4,
  ATTRACTOR_BLEND: 6,
  JOINT_FIXED_POINT: 14,
  PHASE_SPACE_OP: 5,
  META_COMPILE_DSL: 8,
  EMIT_OPS: 2,
  RUN_CHILD_IR: 22
});

/** Faz-uzayı operatörü göreli maliyet. */
export const RHIZOH_PHASE_SPACE_OPERATOR_COST_V1 = Object.freeze({
  identity: 0.5,
  adapt_once: 4,
  attractor_step: 6,
  elastic_projection: 3,
  balanced_projection: 3,
  immune_projection: 4,
  theta_shift: 2,
  lift_phase_readout: 1
});

/**
 * @param {string} op IR opcode
 */
export function estimateRhizohIrInstructionCost(op) {
  const k = String(op || "NOP");
  const c =
    /** @type {Record<string, number>} */ (RHIZOH_CONSTITUTIONAL_IR_INSTRUCTION_COST_V1)[k];
  return Math.round((c ?? 3) * 1000) / 1000;
}

/**
 * @param {string} operatorId
 */
export function estimateRhizohPhaseSpaceOperatorCost(operatorId) {
  const k = String(operatorId || "identity");
  const c =
    /** @type {Record<string, number>} */ (RHIZOH_PHASE_SPACE_OPERATOR_COST_V1)[k];
  if (c != null) return Math.round(c * 1000) / 1000;
  return 4;
}

/**
 * θ güncelleme maliyeti — büyük sıçrama ve bağışıklık fazı ek yük.
 */
export function computeRhizohThetaUpdateCost(thetaPrev, thetaNext, phaseHint) {
  const a = clamp01(thetaPrev);
  const b = clamp01(thetaNext);
  const d = Math.abs(b - a);
  let cost = 6 * d + 1.2 * d * d * 40;
  if (phaseHint === "immune_aggression") cost *= 1.15;
  return Math.round(cost * 1000) / 1000;
}

/**
 * Bellek dizisi için kabaca entropi maliyeti (faz çeşitliliği).
 * @param {number} sampleCount
 * @param {number} phaseTransitionCount
 */
export function estimateRhizohMemoryEntropyCost(sampleCount, phaseTransitionCount) {
  const n = Math.max(1, Math.floor(sampleCount || 1));
  const t = Math.max(0, Math.floor(phaseTransitionCount || 0));
  const p = clamp01(t / n);
  const binaryEntropy =
    p <= 0 || p >= 1 ? 0 : -(p * Math.log(p) + (1 - p) * Math.log(1 - p));
  const scaled = (binaryEntropy / Math.log(2)) * Math.log1p(n);
  return Math.round(scaled * 1000) / 1000;
}

/**
 * @param {{ ops?: ReadonlyArray<{ op?: string }> }} irProgram
 */
export function summarizeRhizohIrProgramCost(irProgram) {
  const ops = irProgram?.ops || [];
  /** @type {Record<string, number>} */
  const breakdown = {};
  let total = 0;
  for (const insn of ops) {
    const name = String(insn?.op || "NOP");
    const c = estimateRhizohIrInstructionCost(name);
    total += c;
    breakdown[name] = (breakdown[name] || 0) + c;
  }
  return {
    totalRelativeCost: Math.round(total * 1000) / 1000,
    instructionCount: ops.length,
    breakdown
  };
}

/**
 * Bir maliyet özeti üzerinden “hangi path daha ucuz?” karşılaştırması.
 */
export function compareRhizohConstitutionalCostPaths(costA, costB) {
  const a = costA?.totalRelativeCost ?? costA ?? 0;
  const b = costB?.totalRelativeCost ?? costB ?? 0;
  return {
    cheaper: a <= b ? "A" : "B",
    delta: Math.round(Math.abs(a - b) * 1000) / 1000,
    ratio: b > 1e-9 ? Math.round((a / b) * 1000) / 1000 : null
  };
}

/** Şema — hangi opcode / operatör kimleri için maliyet tanımlı (ürün API için). */
export function listRhizohConstitutionalCostCoverage() {
  return {
    irOpcodesCovered: [...RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1],
    phaseOperatorsCovered: [...RHIZOH_PHASE_SPACE_OPERATOR_IDS_V1],
    costFieldVersion: RHIZOH_CONSTITUTIONAL_COST_FIELD_VERSION
  };
}
