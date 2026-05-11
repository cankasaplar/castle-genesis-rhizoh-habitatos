/**
 * EBVM-1 — step-level execution inspector.
 * @see docs/EVALUATE_BIND_VIRTUAL_MACHINE_V1.md
 *
 *   node scripts/csbVmInspect.mjs <vm-record.json> [--step N]
 *   npm run epistemic:csb-vm | node scripts/csbVmInspect.mjs --stdin
 */

import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function readJsonPath(p) {
  const full = isAbsolute(p) ? p : resolve(process.cwd(), p);
  return JSON.parse(readFileSync(full, "utf8"));
}

function inspectVm(vm, stepIndex) {
  const steps = vm.steps ?? [];
  const summary = steps.map((s) => ({
    pc: s.pc,
    gateId: s.gateId,
    impl: s.impl,
    ok: s.ok,
    stateInHash: s.stateInHash?.slice(0, 18) + "…",
    stateOutHash: s.stateOutHash?.slice(0, 18) + "…"
  }));

  if (stepIndex == null) {
    return {
      vmVersion: vm.vmVersion,
      manifestVersion: vm.manifestVersion,
      stepCount: steps.length,
      resultOk: vm.result?.ok,
      steps: summary
    };
  }

  const s = steps[stepIndex];
  if (!s) {
    return { error: "NO_SUCH_STEP", stepIndex, stepCount: steps.length };
  }
  return {
    pc: s.pc,
    gateId: s.gateId,
    impl: s.impl,
    ok: s.ok,
    detail: s.detail,
    stateInHash: s.stateInHash,
    stateOutHash: s.stateOutHash
  };
}

function main() {
  const argv = process.argv.slice(2);
  let stdin = false;
  let stepIndex = null;
  let path = "";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--stdin") stdin = true;
    else if (argv[i] === "--step" && argv[i + 1] != null) stepIndex = Number(argv[++i]);
    else if (!argv[i].startsWith("-")) path = argv[i];
  }

  let vm;
  try {
    if (stdin) {
      const raw = readFileSync(0, "utf8");
      vm = JSON.parse(raw);
    } else if (path) {
      vm = readJsonPath(path);
    } else {
      console.error("Usage: node scripts/csbVmInspect.mjs <vm-record.json> [--step N]");
      console.error("   or: npm run epistemic:csb-vm --silent 2>nul | node scripts/csbVmInspect.mjs --stdin");
      process.exit(1);
    }
  } catch (e) {
    console.error("csbVmInspect:", e.message);
    process.exit(1);
  }

  console.log(JSON.stringify(inspectVm(vm, Number.isFinite(stepIndex) ? stepIndex : null), null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main();
}
