/**
 * RHIZOH constitutional compiler IR — metin DSL → yürütülebilir ara temsil + küçük VM.
 * Kendini genişletme: beyaz listeden IR op eklemek için appendRhizohConstitutionalIrOps.
 */

import { stepRhizohConstitutionalAdaptation } from "./constitutionalDynamicsV1.js";
import { computeRhizohThetaAttractorField } from "./thetaAttractorFieldV1.js";
import { discoverRhizohThetaLongTermAttractor } from "./thetaFixedPointConvergenceV1.js";
import { applyRhizohPhaseSpaceOperator } from "./constitutionalPhaseSpaceAlgebraV1.js";

export const RHIZOH_CONSTITUTIONAL_IR_VERSION = "rhizoh-const-ir-v1";

/** Katman paket sürümü (semver); şema kimliği için RHIZOH_CONSTITUTIONAL_IR_VERSION. */
export const RHIZOH_CONSTITUTIONAL_COMPILER_IR_LAYER_VERSION = "1.0.0";

/** VM tarafından bilinen tüm opcode'lar (self-write doğrulaması). */
export const RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1 = Object.freeze([
  "NOP",
  "SET_THETA",
  "SET_STRESS",
  "SET_ADAPTATION_DISABLED",
  "ADAPT_STEP",
  "ATTRACTOR_BLEND",
  "JOINT_FIXED_POINT",
  "PHASE_SPACE_OP",
  "META_COMPILE_DSL",
  "EMIT_OPS",
  "RUN_CHILD_IR",
  "HALT"
]);

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   op: string,
 *   arg?: Record<string, unknown> | number | boolean | null
 * }} RhizohConstitutionalIrOp
 */

/**
 * @typedef {{
 *   irVersion: string,
 *   ops: RhizohConstitutionalIrOp[],
 *   meta?: Record<string, unknown>
 * }} RhizohConstitutionalIrProgram
 */

/**
 * @typedef {{
 *   theta: number,
 *   stressIndex: number,
 *   thetaPrev: number,
 *   adaptation?: { disabled?: boolean },
 *   halted: boolean,
 *   trace: Array<{ op: string, theta: number, stressIndex: number, note?: string }>,
 *   regs: Record<string, number>,
 *   bootstrapEmittedOps: RhizohConstitutionalIrOp[],
 *   instructionStepsExecuted: number,
 *   queueTruncated: boolean
 * }} RhizohConstitutionalIrVmState
 */

/**
 * Basit satır DSL:
 *   # yorum
 *   theta 0.42
 *   stress 0.38
 *   adapt
 *   attractor 0.1
 *   fixedpoint 48 0.14
 *   phase_op adapt_once
 *   adaptation_disabled 1
 *   halt
 *
 * @param {string} source
 */
export function parseRhizohConstitutionalDsl(source) {
  const lines = String(source || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);

  /** @type {{ cmd: string, args: string[] }[]} */
  const stmts = [];
  for (const line of lines) {
    const parts = line.split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    stmts.push({ cmd: parts[0].toLowerCase(), args: parts.slice(1) });
  }
  return { kind: "program", stmts };
}

/**
 * @param {ReturnType<typeof parseRhizohConstitutionalDsl>} ast
 * @returns {RhizohConstitutionalIrProgram}
 */
export function lowerRhizohConstitutionalAstToIr(ast) {
  /** @type {RhizohConstitutionalIrOp[]} */
  const ops = [];

  for (const s of ast.stmts || []) {
    switch (s.cmd) {
      case "theta":
      case "set_theta":
        ops.push({ op: "SET_THETA", arg: Number(s.args[0]) });
        break;
      case "stress":
      case "set_stress":
        ops.push({ op: "SET_STRESS", arg: Number(s.args[0]) });
        break;
      case "adapt":
      case "adapt_step":
        ops.push({ op: "ADAPT_STEP", arg: {} });
        break;
      case "attractor":
      case "attractor_blend":
        ops.push({
          op: "ATTRACTOR_BLEND",
          arg: { eta: Number(s.args[0]) || 0.1 }
        });
        break;
      case "fixedpoint":
      case "joint_fixed_point":
        ops.push({
          op: "JOINT_FIXED_POINT",
          arg: {
            maxSteps: Math.floor(Number(s.args[0]) || 48),
            attractorBlend: s.args[1] != null ? Number(s.args[1]) : undefined
          }
        });
        break;
      case "phase_op": {
        const id = s.args[0] || "identity";
        ops.push({
          op: "PHASE_SPACE_OP",
          arg: { operatorId: id, operatorArgs: {} }
        });
        break;
      }
      case "adaptation_disabled":
      case "adapt_disabled":
        ops.push({ op: "SET_ADAPTATION_DISABLED", arg: Number(s.args[0]) !== 0 });
        break;
      case "nop":
        ops.push({ op: "NOP" });
        break;
      case "halt":
        ops.push({ op: "HALT" });
        break;
      default:
        ops.push({ op: "NOP", arg: { unknownDsl: s.cmd } });
    }
  }

  return { irVersion: RHIZOH_CONSTITUTIONAL_IR_VERSION, ops, meta: { loweredFrom: "dsl" } };
}

/**
 * @param {string} dslSource
 */
export function compileRhizohConstitutionalDslToIr(dslSource) {
  return lowerRhizohConstitutionalAstToIr(parseRhizohConstitutionalDsl(dslSource));
}

/**
 * JSON program: { ops: [{ op, arg? }] } veya tam IR şeması.
 * @param {unknown} json
 */
export function parseRhizohConstitutionalIrJson(json) {
  if (!json || typeof json !== "object") {
    return { irVersion: RHIZOH_CONSTITUTIONAL_IR_VERSION, ops: [], meta: { error: "invalid_json" } };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const ops = Array.isArray(o.ops) ? o.ops : [];
  return {
    irVersion: String(o.irVersion || RHIZOH_CONSTITUTIONAL_IR_VERSION),
    ops: /** @type {RhizohConstitutionalIrOp[]} */ (ops),
    meta: typeof o.meta === "object" && o.meta ? /** @type {Record<string, unknown>} */ (o.meta) : {}
  };
}

/**
 * @param {RhizohConstitutionalIrProgram} program
 * @param {Partial<RhizohConstitutionalIrVmState>} [initial]
 */
export function executeRhizohConstitutionalIr(program, initial = {}) {
  const emittedRef = Array.isArray(initial.bootstrapEmittedOps)
    ? initial.bootstrapEmittedOps
    : [];

  /** @type {RhizohConstitutionalIrVmState} */
  const ctx = {
    theta: clamp01(initial.theta ?? 0),
    stressIndex: clamp01(initial.stressIndex ?? 0.4),
    thetaPrev: clamp01(initial.thetaPrev ?? initial.theta ?? 0),
    adaptation: initial.adaptation && typeof initial.adaptation === "object" ? initial.adaptation : {},
    halted: false,
    trace: [],
    regs: { ...(initial.regs || {}) },
    bootstrapEmittedOps: emittedRef,
    instructionStepsExecuted: 0,
    queueTruncated: false
  };

  const queue = [...(program.ops || [])];
  const maxInsn = Math.min(
    16384,
    Math.max(32, Math.floor(Number(initial.maxInsnSteps ?? initial.maxSteps ?? 4096)))
  );
  let safety = 0;

  while (queue.length && !ctx.halted && safety < maxInsn) {
    const insn = /** @type {RhizohConstitutionalIrOp} */ (queue.shift());
    safety += 1;
    const op = insn.op;
    const rawArg = insn.arg;

    if (op === "NOP") continue;

    if (op === "HALT") {
      ctx.halted = true;
      ctx.trace.push({ op, theta: ctx.theta, stressIndex: ctx.stressIndex });
      break;
    }

    if (op === "META_COMPILE_DSL") {
      const inner = compileRhizohConstitutionalDslToIr(
        String(rawArg && typeof rawArg === "object" && rawArg && "source" in rawArg ? rawArg.source : "")
      );
      queue.unshift(...(inner.ops || []));
      ctx.trace.push({ op, theta: ctx.theta, stressIndex: ctx.stressIndex, note: "meta_queued" });
      continue;
    }

    if (op === "EMIT_OPS") {
      const a = rawArg && typeof rawArg === "object" ? rawArg : {};
      const emitted = Array.isArray(a.ops) ? a.ops : [];
      ctx.bootstrapEmittedOps.push(...emitted);
      ctx.trace.push({ op, theta: ctx.theta, stressIndex: ctx.stressIndex });
      continue;
    }

    if (op === "RUN_CHILD_IR") {
      const a = rawArg && typeof rawArg === "object" ? rawArg : {};
      const depth = Number(ctx.regs._irNest ?? 0);
      const maxDepth = Math.min(16, Math.max(0, Number(a.maxDepth ?? 4)));
      if (depth >= maxDepth) {
        ctx.trace.push({
          op: "RUN_CHILD_IR_BLOCKED",
          theta: ctx.theta,
          stressIndex: ctx.stressIndex,
          note: "max_depth"
        });
      } else {
        const childProg = parseRhizohConstitutionalIrJson(a.program ?? {});
        const childVm = executeRhizohConstitutionalIr(childProg, {
          theta: ctx.theta,
          stressIndex: ctx.stressIndex,
          thetaPrev: ctx.thetaPrev,
          adaptation: ctx.adaptation,
          regs: { ...ctx.regs, _irNest: depth + 1 },
          bootstrapEmittedOps: ctx.bootstrapEmittedOps,
          maxInsnSteps: Number(a.maxInsnSteps ?? 2048)
        });
        ctx.theta = childVm.theta;
        ctx.thetaPrev = childVm.thetaPrev;
        ctx.stressIndex = childVm.stressIndex;
        ctx.adaptation = childVm.adaptation;
        ctx.trace.push({ op, theta: ctx.theta, stressIndex: ctx.stressIndex, note: "child_return" });
      }
      continue;
    }

    if (op === "SET_THETA") {
      ctx.thetaPrev = ctx.theta;
      ctx.theta = clamp01(Number(rawArg));
    } else if (op === "SET_STRESS") {
      ctx.stressIndex = clamp01(Number(rawArg));
    } else if (op === "SET_ADAPTATION_DISABLED") {
      ctx.adaptation = { ...ctx.adaptation, disabled: Boolean(rawArg) };
    } else if (op === "ADAPT_STEP") {
      const a = rawArg && typeof rawArg === "object" && !Array.isArray(rawArg) ? rawArg : {};
      const mergedAdapt =
        a.adaptation && typeof a.adaptation === "object"
          ? { ...ctx.adaptation, .../** @type {object} */ (a.adaptation) }
          : ctx.adaptation;
      const step = stepRhizohConstitutionalAdaptation({
        thetaPrev: ctx.theta,
        stressIndex: ctx.stressIndex,
        adaptation: mergedAdapt,
        targetStress: a.targetStress != null ? Number(a.targetStress) : undefined,
        alpha: a.alpha != null ? Number(a.alpha) : undefined,
        thetaMin: a.thetaMin != null ? Number(a.thetaMin) : undefined,
        thetaMax: a.thetaMax != null ? Number(a.thetaMax) : undefined
      });
      ctx.thetaPrev = ctx.theta;
      ctx.theta = clamp01(step.thetaNext);
    } else if (op === "ATTRACTOR_BLEND") {
      const a = rawArg && typeof rawArg === "object" && !Array.isArray(rawArg) ? rawArg : {};
      const eta = a.eta != null ? clamp01(Number(a.eta)) : 0.1;
      const field = computeRhizohThetaAttractorField(ctx.theta, a.fieldOpts || {});
      ctx.thetaPrev = ctx.theta;
      ctx.theta = clamp01((1 - eta) * ctx.theta + eta * field.compositeAttractorTheta);
    } else if (op === "JOINT_FIXED_POINT") {
      const a = rawArg && typeof rawArg === "object" && !Array.isArray(rawArg) ? rawArg : {};
      const r = discoverRhizohThetaLongTermAttractor({
        theta0: ctx.theta,
        stressIndex: ctx.stressIndex,
        maxSteps: a.maxSteps != null ? Number(a.maxSteps) : 56,
        attractorBlend: a.attractorBlend != null ? Number(a.attractorBlend) : undefined,
        adaptation: ctx.adaptation
      });
      ctx.thetaPrev = ctx.theta;
      ctx.theta = clamp01(r.thetaStar);
    } else if (op === "PHASE_SPACE_OP") {
      const a = rawArg && typeof rawArg === "object" && !Array.isArray(rawArg) ? rawArg : {};
      const operatorId = String(a.operatorId || "identity");
      const operatorArgs =
        a.operatorArgs && typeof a.operatorArgs === "object"
          ? /** @type {Record<string, unknown>} */ (a.operatorArgs)
          : {};
      const next = applyRhizohPhaseSpaceOperator(
        operatorId,
        {
          theta: ctx.theta,
          stressIndex: ctx.stressIndex,
          thetaPrev: ctx.thetaPrev,
          adaptation: ctx.adaptation
        },
        operatorArgs
      );
      ctx.thetaPrev = ctx.theta;
      ctx.theta = clamp01(next.theta);
      ctx.stressIndex = clamp01(next.stressIndex ?? ctx.stressIndex);
      if (next.adaptation && typeof next.adaptation === "object") {
        ctx.adaptation = { ...ctx.adaptation, ...next.adaptation };
      }
    }

    ctx.trace.push({ op, theta: ctx.theta, stressIndex: ctx.stressIndex });
  }

  if (!ctx.halted && safety >= maxInsn && queue.length > 0) {
    ctx.queueTruncated = true;
  }
  ctx.instructionStepsExecuted = safety;

  return ctx;
}

/**
 * Beyaz liste ile güvenli IR genişletmesi (self-writing compiler pipeline).
 * @param {RhizohConstitutionalIrProgram} program
 * @param {RhizohConstitutionalIrOp[]} extraOps
 * @param {{ allowedOps?: ReadonlyArray<string> }} [opts]
 */
export function appendRhizohConstitutionalIrOps(program, extraOps, opts = {}) {
  const allowed = new Set(opts.allowedOps?.length ? opts.allowedOps : RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1);
  const safe = (extraOps || []).filter((o) => allowed.has(o.op));
  return {
    ...program,
    ops: [...(program.ops || []), ...safe],
    meta: {
      ...(program.meta || {}),
      selfWritten: true,
      appendedCount: safe.length,
      droppedOps: (extraOps || []).length - safe.length
    }
  };
}

/**
 * @param {RhizohConstitutionalIrProgram} program
 */
export function serializeRhizohConstitutionalIr(program) {
  return JSON.stringify({
    irVersion: program.irVersion,
    ops: program.ops,
    meta: program.meta || {}
  });
}
