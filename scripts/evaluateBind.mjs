/**
 * CSB-1 reference interpreter — EngineManifest-driven constraint evaluation only (no inference).
 * @see docs/GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md
 * @see docs/ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md
 * @see docs/EVALUATE_BIND_VIRTUAL_MACHINE_V1.md
 *
 *   npm run epistemic:csb-eval
 *   node scripts/evaluateBind.mjs <manifest.json> <inputs.json>
 *   npm run epistemic:csb-vm
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** @type {Record<string, string>} */
export const GATE_ERRORS = Object.freeze({
  G0: "CSB_ERR_IDENTITY",
  G1: "CSB_ERR_SNAPSHOT_BIND",
  G2: "CSB_ERR_CAUSAL_CLOSURE",
  G3: "CSB_ERR_SEMANTIC_CONSTRAINT"
});

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

/**
 * Deterministic serialization for harness equality checks.
 * @param {unknown} result
 */
export function stableStringifyForDeterminism(result) {
  return stableStringify(result);
}

/**
 * @param {unknown} state
 */
export function hashStateSnapshot(state) {
  const h = createHash("sha256").update(stableStringify(state), "utf8").digest("hex");
  return `sha256:${h}`;
}

/**
 * @param {unknown} m
 * @returns {string[]}
 */
export function validateEmcsManifest(m) {
  const errors = [];
  if (!m || typeof m !== "object") return ["manifest must be object"];
  const mv = String(m.manifestVersion ?? "");
  if (!mv.startsWith("EMCS-")) errors.push("manifestVersion must be EMCS-*");
  const sem = m.semantics;
  if (!sem || typeof sem !== "object") errors.push("semantics required");
  else {
    if (!sem.vg || typeof sem.vg !== "object") errors.push("semantics.vg required");
    else if (!Array.isArray(sem.vg.entryGates)) errors.push("semantics.vg.entryGates must be array");
    if (!sem.pal || typeof sem.pal !== "object") errors.push("semantics.pal required");
    else if (!Array.isArray(sem.pal.projectionOrder)) errors.push("semantics.pal.projectionOrder required");
    if (!sem.csb || typeof sem.csb !== "object") errors.push("semantics.csb required");
  }
  if (!m.gateMap || typeof m.gateMap !== "object") errors.push("gateMap required");
  else for (const g of ["G0", "G1", "G2", "G3"]) {
    if (!m.gateMap[g]) errors.push(`gateMap.${g} required`);
  }
  return errors;
}

/** @type {Record<string, (manifest: object, state: object, gateId: string) => object>} */
const GATE_RUNNERS = {
  eoiValidator(_manifest, state, gateId) {
    const anchor = state.identity?.anchor;
    if (!anchor || typeof anchor !== "string" || !anchor.trim()) {
      return { ok: false, gate: gateId };
    }
    return { ok: true, gate: gateId, state: { ...state, _g0: { anchor: anchor.trim() } } };
  },
  snapshotLockValidator(_manifest, state, gateId) {
    const snap = state.snapshot?.commitSnapshot;
    const snapAnchor = state.snapshot?.anchor ?? state.identity?.anchor;
    const idAnchor = state.identity?.anchor;
    if (!snap || typeof snap !== "string" || !String(snap).trim()) {
      return { ok: false, gate: gateId };
    }
    if (String(snapAnchor ?? "").trim() !== String(idAnchor ?? "").trim()) {
      return { ok: false, gate: gateId, detail: "ANCHOR_MISMATCH" };
    }
    return {
      ok: true,
      gate: gateId,
      state: { ...state, _g1: { commitSnapshot: String(snap).trim() } }
    };
  },
  reconcileValidator(_manifest, state, gateId) {
    const w = state.temporal?.reconcileWitness;
    if (!w || typeof w !== "object") return { ok: false, gate: gateId };
    if (w.status === "conflict") return { ok: false, gate: gateId, detail: "RECONCILE_CONFLICT" };
    return { ok: true, gate: gateId, state };
  },
  semanticConstraintValidator(_manifest, state, gateId) {
    const sem = state.semantic;
    if (!sem || typeof sem !== "object") return { ok: false, gate: gateId };
    if (sem.constraintsPass !== true) return { ok: false, gate: gateId };
    return { ok: true, gate: gateId, state };
  }
};

/**
 * @param {object} manifest
 * @param {string} gateId
 * @param {object} state
 */
function runGate(manifest, gateId, state) {
  const impl = manifest.gateMap[gateId];
  const runner = GATE_RUNNERS[impl];
  if (!runner) {
    return { ok: false, gate: gateId, impl, detail: "UNKNOWN_GATE_RUNNER" };
  }
  return runner(manifest, state, gateId);
}

/**
 * @param {{ boot?: object, temporal?: object, semantic?: object, trace: object[] }} parts
 */
export function buildValidityBundle(parts) {
  const { boot, temporal, semantic, trace } = parts;
  return {
    csbVersion: "1.0",
    boot: boot ?? null,
    temporal: temporal ?? null,
    semantic: semantic ?? null,
    traceSummary: trace.map((t) => ({ gate: t.gate, ok: t.ok }))
  };
}

/**
 * Reference: manifest + inputs → ValidityBundle | CSB_ERR_* (constraint evaluation only).
 * @param {object} manifest
 * @param {object} inputs
 */
export function evaluateBind(manifest, inputs) {
  const verr = validateEmcsManifest(manifest);
  if (verr.length) {
    return {
      ok: false,
      error: "CSB_ERR_MANIFEST",
      trace: [{ ok: false, gate: null, detail: verr }]
    };
  }

  const vg = manifest.semantics.vg;
  if (vg.failFast !== true) {
    return {
      ok: false,
      error: "CSB_ERR_MANIFEST",
      trace: [{ ok: false, detail: "reference interpreter requires semantics.vg.failFast === true" }]
    };
  }

  const order = ["G0", "G1", "G2", "G3"];
  const gates = new Set(vg.entryGates);
  const trace = [];
  let state = typeof inputs === "object" && inputs !== null ? { ...inputs } : {};

  for (const gateId of order) {
    if (!gates.has(gateId)) {
      return {
        ok: false,
        error: "CSB_ERR_MANIFEST",
        trace: [...trace, { ok: false, gate: gateId, detail: "MISSING_ENTRY_GATE" }]
      };
    }
    const g = runGate(manifest, gateId, state);
    trace.push(g);
    if (!g.ok) {
      return { ok: false, error: GATE_ERRORS[gateId], trace };
    }
    state = g.state;
  }

  const bundle = buildValidityBundle({
    boot: { identity: state.identity, snapshot: state.snapshot },
    temporal: state.temporal,
    semantic: state.semantic,
    trace
  });

  return {
    ok: true,
    manifestVersion: manifest.manifestVersion,
    validityBundle: bundle,
    trace
  };
}

/**
 * EBVM-1 — step traces with deterministic state hashes (debug / replay layer).
 * @param {object} manifest
 * @param {object} inputs
 */
export function evaluateBindVm(manifest, inputs) {
  const verr = validateEmcsManifest(manifest);
  if (verr.length) {
    return {
      vmVersion: "EBVM-1.0",
      manifestVersion: manifest?.manifestVersion ?? null,
      frozenCoreHash: manifest?.frozenCoreHash ?? null,
      steps: [],
      result: {
        ok: false,
        error: "CSB_ERR_MANIFEST",
        trace: [{ ok: false, gate: null, detail: verr }]
      }
    };
  }

  const vg = manifest.semantics.vg;
  if (vg.failFast !== true) {
    return {
      vmVersion: "EBVM-1.0",
      manifestVersion: manifest.manifestVersion,
      frozenCoreHash: manifest.frozenCoreHash ?? null,
      steps: [],
      result: {
        ok: false,
        error: "CSB_ERR_MANIFEST",
        trace: [{ ok: false, detail: "reference interpreter requires semantics.vg.failFast === true" }]
      }
    };
  }

  const order = ["G0", "G1", "G2", "G3"];
  const gates = new Set(vg.entryGates);
  /** @type {object[]} */
  const steps = [];
  let state = typeof inputs === "object" && inputs !== null ? { ...inputs } : {};

  for (let pc = 0; pc < order.length; pc++) {
    const gateId = order[pc];
    if (!gates.has(gateId)) {
      return {
        vmVersion: "EBVM-1.0",
        manifestVersion: manifest.manifestVersion,
        frozenCoreHash: manifest.frozenCoreHash ?? null,
        steps,
        result: {
          ok: false,
          error: "CSB_ERR_MANIFEST",
          trace: [{ ok: false, gate: gateId, detail: "MISSING_ENTRY_GATE" }]
        }
      };
    }
    const stateInHash = hashStateSnapshot(state);
    const g = runGate(manifest, gateId, state);
    const stateOutHash = g.ok && g.state ? hashStateSnapshot(g.state) : stateInHash;
    steps.push({
      pc,
      gateId,
      impl: manifest.gateMap[gateId],
      stateInHash,
      stateOutHash,
      ok: g.ok,
      detail: g.detail ?? null
    });
    if (!g.ok) {
      return {
        vmVersion: "EBVM-1.0",
        manifestVersion: manifest.manifestVersion,
        frozenCoreHash: manifest.frozenCoreHash ?? null,
        steps,
        result: { ok: false, error: GATE_ERRORS[gateId], trace: [g] }
      };
    }
    state = g.state;
  }

  const fullTrace = [];
  let st = typeof inputs === "object" && inputs !== null ? { ...inputs } : {};
  for (const gateId of order) {
    const g = runGate(manifest, gateId, st);
    fullTrace.push(g);
    st = g.state;
  }

  const bundle = buildValidityBundle({
    boot: { identity: state.identity, snapshot: state.snapshot },
    temporal: state.temporal,
    semantic: state.semantic,
    trace: fullTrace
  });

  return {
    vmVersion: "EBVM-1.0",
    manifestVersion: manifest.manifestVersion,
    frozenCoreHash: manifest.frozenCoreHash ?? null,
    steps,
    result: {
      ok: true,
      manifestVersion: manifest.manifestVersion,
      validityBundle: bundle,
      trace: fullTrace
    }
  };
}

/**
 * Execution consistency: re-run VM and compare step hashes to recorded trace.
 * @param {object} manifest
 * @param {object} inputs
 * @param {{ steps?: object[], manifestVersion?: string }} recorded
 */
export function replayVmTrace(manifest, inputs, recorded) {
  const fresh = evaluateBindVm(manifest, inputs);
  const a = recorded.steps ?? [];
  const b = fresh.steps ?? [];
  if (a.length !== b.length) {
    return {
      ok: false,
      error: "CSB_ERR_VM_REPLAY_MISMATCH",
      detail: "step_count",
      expected: a.length,
      actual: b.length
    };
  }
  if (recorded.manifestVersion != null && String(recorded.manifestVersion) !== String(manifest.manifestVersion ?? "")) {
    return {
      ok: false,
      error: "CSB_ERR_VM_REPLAY_MISMATCH",
      detail: "manifestVersion",
      expected: recorded.manifestVersion,
      actual: manifest.manifestVersion
    };
  }
  for (let i = 0; i < a.length; i++) {
    const keys = ["gateId", "ok", "stateInHash", "stateOutHash"];
    for (const k of keys) {
      if (a[i][k] !== b[i][k]) {
        return {
          ok: false,
          error: "CSB_ERR_VM_REPLAY_MISMATCH",
          detail: `step_${i}_${k}`,
          expected: a[i][k],
          actual: b[i][k]
        };
      }
    }
  }
  return { ok: true, vmVersion: fresh.vmVersion };
}

function readJsonPath(p) {
  const full = isAbsolute(p) ? p : resolve(process.cwd(), p);
  const raw = readFileSync(full, "utf8");
  return JSON.parse(raw);
}

function main() {
  const argv = process.argv.slice(2);
  let manifestPath = "";
  let inputsPath = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--manifest" && argv[i + 1]) {
      manifestPath = argv[++i];
    } else if (argv[i] === "--inputs" && argv[i + 1]) {
      inputsPath = argv[++i];
    }
  }
  const pos = argv.filter((a) => !a.startsWith("-"));
  if (!manifestPath && pos.length >= 2) {
    manifestPath = pos[0];
    inputsPath = pos[1];
  }
  if (!manifestPath || !inputsPath) {
    manifestPath = "scripts/fixtures/emcs-sample-manifest.json";
    inputsPath = "scripts/fixtures/emcs-sample-inputs-pass.json";
  }
  let manifest;
  let inputs;
  try {
    manifest = readJsonPath(manifestPath);
    inputs = readJsonPath(inputsPath);
  } catch (e) {
    console.error("evaluateBind:", e.message);
    process.exit(1);
  }
  const r = evaluateBind(manifest, inputs);
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok ? 0 : 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
