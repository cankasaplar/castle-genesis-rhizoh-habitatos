/**
 * RHIZOH IR bootstrapping — IR içinden DSL/IR üretimi, EMIT_OPS biriktirme ve çok tur sabitleşme döngüsü.
 */

import {
  appendRhizohConstitutionalIrOps,
  compileRhizohConstitutionalDslToIr,
  executeRhizohConstitutionalIr,
  parseRhizohConstitutionalIrJson,
  RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1
} from "./constitutionalCompilerIRv1.js";

export const RHIZOH_CONSTITUTIONAL_IR_BOOTSTRAPPING_VERSION = "1.0.0";

/**
 * META_COMPILE_DSL op’larını statik olarak DSL → IR genişletir (ön işlem).
 * @param {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrProgram} program
 */
export function expandRhizohIrMetaCompileOps(program) {
  /** @type {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrOp[]} */
  const out = [];
  for (const insn of program.ops || []) {
    if (insn.op === "META_COMPILE_DSL") {
      const src = String(
        insn.arg && typeof insn.arg === "object" && "source" in insn.arg
          ? /** @type {{ source?: string }} */ (insn.arg).source ?? ""
          : ""
      );
      const inner = compileRhizohConstitutionalDslToIr(src);
      out.push(...(inner.ops || []));
    } else {
      out.push(insn);
    }
  }
  return {
    ...program,
    ops: out,
    meta: {
      ...(program.meta || {}),
      metaCompileExpanded: true,
      expandedOpCount: out.length
    }
  };
}

/**
 * IR → IR sabitleşmesi: emitlenen op’lar programın sonuna güvenli eklenir; değişmezse durur.
 * @param {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrProgram} program
 * @param {{
 *   rounds?: number,
 *   initial?: Partial<import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrVmState>,
 *   appendOpts?: Parameters<typeof appendRhizohConstitutionalIrOps>[2],
 *   preexpandMetaCompile?: boolean
 * }} [opts]
 */
export function runRhizohIrBootstrapFixedPoint(program, opts = {}) {
  const rounds = Math.min(24, Math.max(1, Math.floor(opts.rounds ?? 6)));
  let cur = opts.preexpandMetaCompile === false ? program : expandRhizohIrMetaCompileOps(program);
  /** @type {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrProgram[]} */
  const programTrace = [cur];
  /** @type {ReturnType<typeof executeRhizohConstitutionalIr>[]} */
  const vmTrace = [];

  const accumulator = /** @type {import('./constitutionalCompilerIRv1.js').RhizohConstitutionalIrOp[]} */ ([]);

  for (let r = 0; r < rounds; r++) {
    accumulator.length = 0;
    const vm = executeRhizohConstitutionalIr(cur, {
      ...(opts.initial || {}),
      bootstrapEmittedOps: accumulator
    });
    vmTrace.push(vm);

    if (!accumulator.length) {
      return {
        converged: true,
        roundsUsed: r + 1,
        reason: "no_emit",
        finalProgram: cur,
        programTrace,
        vmTrace
      };
    }

    const next = appendRhizohConstitutionalIrOps(cur, accumulator, {
      allowedOps: RHIZOH_CONSTITUTIONAL_IR_OPCODES_V1,
      ...(opts.appendOpts || {})
    });

    const sameLen = (next.ops || []).length === (cur.ops || []).length;
    const sameJson = JSON.stringify(next.ops) === JSON.stringify(cur.ops);
    if (sameLen && sameJson) {
      return {
        converged: true,
        roundsUsed: r + 1,
        reason: "emit_filtered_no_change",
        finalProgram: cur,
        programTrace,
        vmTrace
      };
    }

    cur = next;
    programTrace.push(cur);
  }

  return {
    converged: false,
    roundsUsed: rounds,
    reason: "max_rounds",
    finalProgram: cur,
    programTrace,
    vmTrace
  };
}

/**
 * Seed DSL → IR → yürüt → emit birleştirme döngüsü (tek giriş bootstrap).
 * @param {string} dslSeed
 * @param {Parameters<typeof runRhizohIrBootstrapFixedPoint>[1]} [opts]
 */
export function bootstrapRhizohIrCompilerFromDslSeed(dslSeed, opts) {
  const seedIr = compileRhizohConstitutionalDslToIr(dslSeed);
  return runRhizohIrBootstrapFixedPoint(seedIr, opts);
}

/**
 * JSON IR programına doğrudan sabitleşme (persist öncesi).
 * @param {unknown} json
 * @param {Parameters<typeof runRhizohIrBootstrapFixedPoint>[1]} [opts]
 */
export function bootstrapRhizohIrCompilerFromJson(json, opts) {
  return runRhizohIrBootstrapFixedPoint(parseRhizohConstitutionalIrJson(json), opts);
}
