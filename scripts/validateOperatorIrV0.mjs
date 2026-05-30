/**
 * Operator IR V0 — inference rules from SSOT JSON + Γ (A1–A3) + proof tree seed (C).
 * Atlas: docs/RHIZOH_UI_INTENT_ATLAS_V0.md — A ⟹ B ⟹ C chain; validator = spec interpreter seed.
 *
 * Run: node scripts/validateOperatorIrV0.mjs
 * Run: node scripts/validateOperatorIrV0.mjs path/to/ir.json
 * Run: node scripts/validateOperatorIrV0.mjs --trace path/to/ir.json
 * Run: node scripts/validateOperatorIrV0.mjs --proof path/to/ir.json
 * Run: node scripts/validateOperatorIrV0.mjs --canonical path/to/ir.json
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const IR_SCHEMA_VERSION = "operator-ir/0.1.0";
const RULES_PATH = join(ROOT, "docs", "schemas", "operator-inference-v0.rules.json");

const REGIONS = new Set(["governance", "world"]);
const INTENT_LAYERS = new Set(["ui", "voice", "system", "system_internal", "replay", "inferred"]);
const OPS = new Set(["EMIT", "BIND", "FORK", "EVAL", "DIFF", "RANK", "WALK"]);
const EFFECTS = new Set(["pure", "readGraph", "readIO", "writeWorld"]);
const EDGE_KINDS = new Set([
  "derived_from_cid",
  "replay_of_snapshot",
  "diff_against_baseline",
  "override_lineage",
  "time_travel_fork",
  "supersedes",
  "bundle_composes"
]);

/** @typedef {{ irSchemaVersion: string, region: string, handles?: Record<string, string>, policyBindings?: Record<string, unknown> }} OperatorGammaV0 */

/**
 * @param {Record<string, unknown>} doc
 * @returns {OperatorGammaV0 | null}
 */
export function buildOperatorGammaV0(doc) {
  const region = typeof doc.region === "string" ? doc.region : "";
  if (!REGIONS.has(region)) return null;
  return {
    irSchemaVersion: IR_SCHEMA_VERSION,
    region,
    handles: typeof doc.handles === "object" && doc.handles !== null ? /** @type {Record<string, string>} */ (doc.handles) : {},
    policyBindings:
      typeof doc.policyBindings === "object" && doc.policyBindings !== null
        ? /** @type {Record<string, unknown>} */ (doc.policyBindings)
        : {}
  };
}

/**
 * @param {string} name
 * @param {{ doc: Record<string, unknown>, region: string, step?: Record<string, unknown>, stepIndex?: number }} ctx
 * @returns {{ ok: boolean, detail?: string }}
 */
function runEvaluator(name, ctx) {
  const { doc, region, step, stepIndex } = ctx;
  switch (name) {
    case "docSchemaVersion":
      return doc.schemaVersion === IR_SCHEMA_VERSION
        ? { ok: true }
        : {
            ok: false,
            detail: `expected schemaVersion "${IR_SCHEMA_VERSION}", got ${JSON.stringify(doc.schemaVersion)}`
          };
    case "docRegion":
      return typeof doc.region === "string" && REGIONS.has(doc.region)
        ? { ok: true }
        : { ok: false, detail: `region must be governance|world, got ${JSON.stringify(doc.region)}` };
    case "docStepsIsArray":
      return Array.isArray(doc.steps) ? { ok: true } : { ok: false, detail: "steps must be an array" };
    case "stepIsObject":
      return step && typeof step === "object"
        ? { ok: true }
        : { ok: false, detail: `steps[${stepIndex}] must be an object` };
    case "stepOpKnown": {
      const op = step && typeof step.op === "string" ? step.op : "";
      return OPS.has(op) ? { ok: true } : { ok: false, detail: `unknown op ${JSON.stringify(step?.op)}` };
    }
    case "stepEffectKnown": {
      const eff = step?.effect != null ? String(step.effect) : "pure";
      return EFFECTS.has(eff) ? { ok: true } : { ok: false, detail: `invalid effect ${JSON.stringify(eff)}` };
    }
    case "governanceNoWriteWorld": {
      const eff = step?.effect != null ? String(step.effect) : "pure";
      if (region === "governance" && eff === "writeWorld") {
        return { ok: false, detail: 'governance region forbids effect "writeWorld"' };
      }
      return { ok: true };
    }
    case "emitIntentNonEmpty":
      return typeof step?.intent === "string" && step.intent.trim()
        ? { ok: true }
        : { ok: false, detail: "EMIT requires non-empty intent" };
    case "emitIntentLayerMember": {
      const layer = step?.intentLayer;
      return typeof layer === "string" && INTENT_LAYERS.has(layer)
        ? { ok: true }
        : {
            ok: false,
            detail: `EMIT intentLayer must be one of ${[...INTENT_LAYERS].join(", ")}; got ${JSON.stringify(layer)}`
          };
    }
    case "bindHandleNonEmpty":
      return typeof step?.handle === "string" && step.handle.trim()
        ? { ok: true }
        : { ok: false, detail: "BIND requires non-empty handle" };
    case "forkSnapshotRef":
      return typeof step?.snapshotRef === "string" && step.snapshotRef.trim()
        ? { ok: true }
        : { ok: false, detail: "FORK requires snapshotRef" };
    case "forkSandboxCap":
      return typeof step?.sandboxCap === "string" && step.sandboxCap.trim()
        ? { ok: true }
        : { ok: false, detail: "FORK requires sandboxCap" };
    case "evalForkCtxRef":
      return typeof step?.forkCtxRef === "string" && step.forkCtxRef.trim()
        ? { ok: true }
        : { ok: false, detail: "EVAL requires forkCtxRef" };
    case "evalPolicyBundleHandle": {
      const pb = step?.policyBundleHandle;
      if (!pb || typeof pb !== "object") return { ok: false, detail: "EVAL requires policyBundleHandle object" };
      const h = /** @type {Record<string, unknown>} */ (pb);
      if (typeof h.policyId !== "string" || !h.policyId.trim()) return { ok: false, detail: "EVAL policyId required" };
      if (h.policyRevision == null || String(h.policyRevision).trim() === "")
        return { ok: false, detail: "EVAL policyRevision required" };
      return { ok: true };
    }
    case "evalSnapshotSchemaHintOptional":
      if (step?.snapshotSchemaHint == null) return { ok: true };
      return typeof step.snapshotSchemaHint === "string"
        ? { ok: true }
        : { ok: false, detail: "snapshotSchemaHint must be string if present" };
    case "diffLeftExplainRef":
      return typeof step?.leftExplainRef === "string" && step.leftExplainRef.trim()
        ? { ok: true }
        : { ok: false, detail: "DIFF requires leftExplainRef" };
    case "diffRightExplainRef":
      return typeof step?.rightExplainRef === "string" && step.rightExplainRef.trim()
        ? { ok: true }
        : { ok: false, detail: "DIFF requires rightExplainRef" };
    case "rankPolicyId":
      return typeof step?.rankPolicyId === "string" && step.rankPolicyId.trim()
        ? { ok: true }
        : { ok: false, detail: "RANK requires rankPolicyId" };
    case "walkNodeRef":
      return typeof step?.nodeRef === "string" && step.nodeRef.trim()
        ? { ok: true }
        : { ok: false, detail: "WALK requires nodeRef" };
    case "walkEdgeKindsIsArray":
      return Array.isArray(step?.edgeKinds) ? { ok: true } : { ok: false, detail: "WALK requires edgeKinds array" };
    case "walkEachEdgeKindMember": {
      if (!Array.isArray(step?.edgeKinds)) return { ok: false, detail: "edgeKinds not array" };
      for (let k = 0; k < step.edgeKinds.length; k += 1) {
        const ek = step.edgeKinds[k];
        if (typeof ek !== "string" || !EDGE_KINDS.has(ek)) {
          return {
            ok: false,
            detail: `edgeKinds[${k}] must be in atlas set; got ${JSON.stringify(ek)}`
          };
        }
      }
      return { ok: true };
    }
    default:
      return { ok: false, detail: `unknown evaluator "${name}"` };
  }
}

let _rulesCache = null;
function loadRulesRegistry() {
  if (_rulesCache) return _rulesCache;
  const raw = readFileSync(RULES_PATH, "utf8");
  _rulesCache = JSON.parse(raw);
  return _rulesCache;
}

/**
 * @typedef {{ rule_id: string, ok: boolean, evaluator: string, stepIndex?: number, detail?: string, formal?: { gamma?: string, iff?: string } }} EvaluationTraceEntryV0
 */

/**
 * @param {unknown} ir
 * @returns {{ errors: string[], evaluationTrace: EvaluationTraceEntryV0[], gamma: OperatorGammaV0 | null }}
 */
export function evaluateOperatorIrV0(ir) {
  /** @type {string[]} */
  const errors = [];
  /** @type {EvaluationTraceEntryV0[]} */
  const evaluationTrace = [];

  if (!ir || typeof ir !== "object") {
    return { errors: ["IR must be a non-null object"], evaluationTrace, gamma: null };
  }
  const doc = /** @type {Record<string, unknown>} */ (ir);
  const rules = loadRulesRegistry();
  const region = typeof doc.region === "string" ? doc.region : "";
  const gamma = buildOperatorGammaV0(doc);

  /**
   * @param {Record<string, unknown>} rule
   * @param {Record<string, unknown>} [step]
   * @param {number} [stepIndex]
   */
  function applyRule(rule, step, stepIndex) {
    const id = String(rule.id || "");
    const evaluator = String(rule.evaluator || "");
    const formal = rule.formal && typeof rule.formal === "object" ? /** @type {{ gamma?: string, iff?: string }} */ (rule.formal) : {};
    const res = runEvaluator(evaluator, { doc, region, step, stepIndex });
    evaluationTrace.push({
      rule_id: id,
      ok: res.ok,
      evaluator,
      ...(stepIndex !== undefined ? { stepIndex } : {}),
      ...(res.detail ? { detail: res.detail } : {}),
      formal: { ...formal }
    });
    if (!res.ok) {
      const loc = stepIndex !== undefined ? `steps[${stepIndex}]` : "document";
      errors.push(`${loc} [${id}]: ${res.detail || "failed"}`);
    }
    return res.ok;
  }

  for (const rule of rules.documentEvaluationOrder || []) {
    applyRule(rule, undefined, undefined);
  }

  if (!Array.isArray(doc.steps)) {
    return { errors, evaluationTrace, gamma };
  }

  doc.steps.forEach((rawStep, stepIndex) => {
    const step = rawStep && typeof rawStep === "object" ? /** @type {Record<string, unknown>} */ (rawStep) : {};
    const op = typeof step.op === "string" ? step.op : "";
    let abortStep = false;

    for (const rule of rules.perStepEvaluationOrder || []) {
      if (abortStep) break;
      const whenOp = rule.whenOp != null ? String(rule.whenOp) : "";
      if (whenOp && whenOp !== op) continue;
      const ok = applyRule(rule, step, stepIndex);
      if (!ok && (rule.evaluator === "stepIsObject" || rule.evaluator === "stepOpKnown")) {
        abortStep = true;
      }
    }
  });

  return { errors, evaluationTrace, gamma };
}

/**
 * @param {unknown} ir
 * @returns {string[]}
 */
export function validateOperatorIrV0(ir) {
  return evaluateOperatorIrV0(ir).errors;
}

const PROOF_TREE_SCHEMA_VERSION = "operator-proof-tree/0.1.0";

/**
 * Trace → proof tree AST (C): structural certificate skeleton, not narrative.
 * Evaluator strings remain procedural fallback until versioned evaluator_registry (atlas note).
 *
 * @param {unknown} ir
 * @param {{ errors: string[], evaluationTrace: EvaluationTraceEntryV0[], gamma: OperatorGammaV0 | null }} result
 * @returns {Record<string, unknown>}
 */
export function buildOperatorProofTreeV0(ir, result) {
  const rules = loadRulesRegistry();
  const rulesSchemaVersion = String(rules.schemaVersion || "operator-inference-rules/unknown");

  const traceLeaf = (t) => ({
    kind: "rule_judgment",
    rule_id: t.rule_id,
    ok: t.ok,
    evaluator: t.evaluator,
    evaluator_binding: "procedural_fallback_v0",
    ...(Object.prototype.hasOwnProperty.call(t, "stepIndex") ? { stepIndex: t.stepIndex } : {}),
    ...(t.detail ? { detail: t.detail } : {}),
    formal: t.formal && typeof t.formal === "object" ? t.formal : {}
  });

  const documentLeaves = [];
  const stepBlocks = [];
  for (const t of result.evaluationTrace) {
    if (!Object.prototype.hasOwnProperty.call(t, "stepIndex")) {
      documentLeaves.push(traceLeaf(t));
    }
  }
  const stepIndexSet = new Set();
  for (const t of result.evaluationTrace) {
    if (Object.prototype.hasOwnProperty.call(t, "stepIndex") && typeof t.stepIndex === "number") {
      stepIndexSet.add(t.stepIndex);
    }
  }
  const sortedSteps = [...stepIndexSet].sort((a, b) => a - b);
  for (const si of sortedSteps) {
    const leaves = result.evaluationTrace
      .filter((t) => Object.prototype.hasOwnProperty.call(t, "stepIndex") && t.stepIndex === si)
      .map(traceLeaf);
    stepBlocks.push({
      kind: "step_block",
      id: `block.step.${si}`,
      stepIndex: si,
      children: leaves
    });
  }

  const verdict = result.errors.length === 0 ? "valid" : "invalid";

  return {
    schemaVersion: PROOF_TREE_SCHEMA_VERSION,
    certificate: true,
    semantics: "evaluation_trace_as_derivation_skeleton",
    verdict,
    inputs: {
      irSchemaVersion: IR_SCHEMA_VERSION,
      rulesSchemaVersion
    },
    meta: {
      roadmap_evaluator_registry: "rule_id → versioned evaluator_registry (replace procedural_fallback_v0)"
    },
    root: {
      kind: "derivation",
      id: "operator_ir.v0",
      children: [
        {
          kind: "document_block",
          id: "block.document",
          children: documentLeaves
        },
        ...stepBlocks
      ]
    },
    gamma: result.gamma,
    error_count: result.errors.length
  };
}

/**
 * Deterministic key order for canonical JSON (proof tree normalization).
 * @param {unknown} value
 * @returns {unknown}
 */
export function sortKeysDeep(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((x) => sortKeysDeep(x));
  }
  const o = /** @type {Record<string, unknown>} */ (value);
  const out = {};
  for (const k of Object.keys(o).sort()) {
    out[k] = sortKeysDeep(o[k]);
  }
  return out;
}

/**
 * Payload included in canonical digest (semantics only; exclude meta, error_count).
 * @param {Record<string, unknown>} tree
 * @returns {Record<string, unknown>}
 */
export function proofTreeCanonicalBodyV0(tree) {
  const pick = {
    schemaVersion: tree.schemaVersion,
    certificate: tree.certificate,
    semantics: tree.semantics,
    verdict: tree.verdict,
    inputs: tree.inputs,
    root: tree.root,
    ...(tree.gamma != null ? { gamma: tree.gamma } : {})
  };
  return /** @type {Record<string, unknown>} */ (sortKeysDeep(pick));
}

/**
 * @param {Record<string, unknown>} tree
 * @returns {{ canonical_body: Record<string, unknown>, canonical_json: string, canonical_sha256: string }}
 */
export function operatorProofTreeCanonicalDigestV0(tree) {
  const canonical_body = proofTreeCanonicalBodyV0(tree);
  const canonical_json = JSON.stringify(canonical_body);
  const canonical_sha256 = createHash("sha256").update(canonical_json, "utf8").digest("hex");
  return { canonical_body, canonical_json, canonical_sha256 };
}

/**
 * Attach normalization fingerprint to proof tree (canonical form fixed for V0).
 * @param {Record<string, unknown>} tree
 * @returns {Record<string, unknown>}
 */
export function attachCanonicalProofNormalizationV0(tree) {
  const { canonical_body, canonical_json, canonical_sha256 } = operatorProofTreeCanonicalDigestV0(tree);
  return {
    ...tree,
    canonical: {
      schemaVersion: "operator-proof-canonical/0.1.0",
      body: canonical_body,
      sha256: canonical_sha256,
      json_byte_length: Buffer.byteLength(canonical_json, "utf8")
    }
  };
}

function loadJson(path) {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
}

function main() {
  const args = process.argv.slice(2);
  let trace = false;
  let proof = false;
  let canonical = false;
  const paths = [];
  for (const a of args) {
    if (a === "--trace") trace = true;
    else if (a === "--proof") proof = true;
    else if (a === "--canonical") {
      canonical = true;
      proof = true;
    } else paths.push(a);
  }
  const arg = paths[0];

  if (arg) {
    const p = resolve(process.cwd(), arg);
    if (!existsSync(p)) {
      console.error(`validateOperatorIrV0: file not found: ${p}`);
      process.exit(1);
    }
    const ir = loadJson(p);
    const evaluated = evaluateOperatorIrV0(ir);
    if (trace) {
      console.log(
        JSON.stringify({ schemaVersion: "operator-ir-evaluation-trace/0.1.0", evaluationTrace: evaluated.evaluationTrace }, null, 2)
      );
    }
    if (proof) {
      let tree = buildOperatorProofTreeV0(ir, evaluated);
      if (canonical) tree = attachCanonicalProofNormalizationV0(tree);
      console.log(JSON.stringify(tree, null, 2));
    }
    if (evaluated.errors.length) {
      console.error(`validateOperatorIrV0: ${evaluated.errors.length} error(s) in ${p}`);
      for (const e of evaluated.errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    const bits = [];
    if (trace) bits.push("trace");
    if (proof) bits.push(canonical ? "proof+canonical" : "proof");
    console.log(`validateOperatorIrV0: OK (${p})${bits.length ? ` (${bits.join(", ")})` : ""}`);
    return;
  }

  const validPath = join(ROOT, "scripts", "fixtures", "operator-ir-v0-valid.json");
  const invalidLayer = join(ROOT, "scripts", "fixtures", "operator-ir-v0-invalid-layer.json");
  const invalidGov = join(ROOT, "scripts", "fixtures", "operator-ir-v0-invalid-governance-write.json");

  const v = evaluateOperatorIrV0(loadJson(validPath));
  if (v.errors.length) {
    console.error("validateOperatorIrV0: expected valid fixture to pass");
    for (const e of v.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const mustHave = new Set(["IR.DOC.001", "IR.EMIT.002", "IR.WALK.003"]);
  for (const id of mustHave) {
    if (!v.evaluationTrace.some((t) => t.rule_id === id && t.ok)) {
      console.error(`validateOperatorIrV0: expected trace to include passing rule ${id}`);
      process.exit(1);
    }
  }
  console.log(`validateOperatorIrV0: OK (${validPath}) trace_entries=${v.evaluationTrace.length}`);

  const badLayer = evaluateOperatorIrV0(loadJson(invalidLayer));
  if (badLayer.errors.length === 0) {
    console.error("validateOperatorIrV0: expected invalid-layer fixture to fail");
    process.exit(1);
  }
  const emit002 = badLayer.evaluationTrace.filter((t) => t.rule_id === "IR.EMIT.002");
  if (!emit002.some((t) => !t.ok)) {
    console.error("validateOperatorIrV0: expected IR.EMIT.002 to fail in trace");
    process.exit(1);
  }
  console.log(`validateOperatorIrV0: OK (invalid-layer: IR.EMIT.002 failed as expected)`);

  const badGov = evaluateOperatorIrV0(loadJson(invalidGov));
  if (badGov.errors.length === 0) {
    console.error("validateOperatorIrV0: expected governance-write fixture to fail");
    process.exit(1);
  }
  if (!badGov.evaluationTrace.some((t) => t.rule_id === "IR.STEP.004" && !t.ok)) {
    console.error("validateOperatorIrV0: expected IR.STEP.004 to fail in trace");
    process.exit(1);
  }
  console.log(`validateOperatorIrV0: OK (governance-write: IR.STEP.004 failed as expected)`);

  const proofValid = buildOperatorProofTreeV0(loadJson(validPath), v);
  if (proofValid.verdict !== "valid" || proofValid.schemaVersion !== "operator-proof-tree/0.1.0") {
    console.error("validateOperatorIrV0: expected proof tree valid for good fixture");
    process.exit(1);
  }
  if (!proofValid.root || typeof proofValid.root !== "object") {
    console.error("validateOperatorIrV0: proof tree missing root");
    process.exit(1);
  }
  console.log("validateOperatorIrV0: OK (proof tree AST for valid fixture)");

  const proofBad = buildOperatorProofTreeV0(loadJson(invalidLayer), badLayer);
  if (proofBad.verdict !== "invalid") {
    console.error("validateOperatorIrV0: expected invalid proof verdict for bad layer");
    process.exit(1);
  }
  console.log("validateOperatorIrV0: OK (proof tree verdict=invalid for bad layer)");

  const d1 = operatorProofTreeCanonicalDigestV0(proofValid);
  const d2 = operatorProofTreeCanonicalDigestV0(proofValid);
  if (d1.canonical_sha256 !== d2.canonical_sha256) {
    console.error("validateOperatorIrV0: canonical digest not deterministic");
    process.exit(1);
  }
  const withC = attachCanonicalProofNormalizationV0(proofValid);
  if (withC.canonical?.sha256 !== d1.canonical_sha256) {
    console.error("validateOperatorIrV0: attachCanonical digest mismatch");
    process.exit(1);
  }
  console.log("validateOperatorIrV0: OK (canonical normalization + sha256 stable)");

  console.log("validateOperatorIrV0: all self-tests passed");
}

main();
