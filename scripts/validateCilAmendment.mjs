/**
 * Amendment Execution Engine — parse + routing + targets + verify hooks + ARSM-1 observability.
 *
 * Run:
 *   node scripts/validateCilAmendment.mjs
 *   node scripts/validateCilAmendment.mjs --verify
 *   node scripts/validateCilAmendment.mjs --verbose
 *   node scripts/validateCilAmendment.mjs --json          # stdout: single JSON report (ARSM-1)
 *   node scripts/validateCilAmendment.mjs --json --verify
 *   node scripts/validateCilAmendment.mjs --paths docs/foo.md
 *
 * @see docs/AEE_RUNTIME_STATE_MACHINE_V1.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

export const AEE_VERSION = "0.2";

/** @see docs/AEE_RUNTIME_STATE_MACHINE_V1.md §7.1 */
export const AEE_CODES = Object.freeze({
  DATE_INVALID: "AEE_DATE_INVALID",
  CHANGE_CLASS_INVALID: "AEE_CHANGE_CLASS_INVALID",
  SPECFLOW_INVALID: "AEE_SPECFLOW_INVALID",
  PRIOR_ANCHOR_MISSING: "AEE_PRIOR_ANCHOR_MISSING",
  TARGETS_EMPTY: "AEE_TARGETS_EMPTY",
  TARGET_NOT_FOUND: "AEE_TARGET_NOT_FOUND",
  TRUST_ROOT_ATTESTATION_WEAK: "AEE_TRUST_ROOT_ATTESTATION_WEAK",
  VERIFY_GRAPH_FAILED: "AEE_VERIFY_GRAPH_FAILED",
  VERIFY_SPECFLOW_FAILED: "AEE_VERIFY_SPECFLOW_FAILED"
});

/** @typedef {{ severity: 'error' | 'warning', code: string, message: string, amendmentId: string, file: string, aeeState: string, ecgBinding: null | { causalNodeId?: string, epochRef?: string } }} AeeFinding */

const CHANGE_CLASSES = new Set(["ADD", "CLARIFY", "VERSION_LINE", "PROTOCOL_BUMP", "TRUST_ROOT"]);
const SPECFLOW_VALUES = new Set(["CORE-ELIGIBLE", "RESEARCH-ONLY", "FUTURE-PROOF-ONLY"]);

/** Strip fenced ``` blocks so template examples are not parsed as live amendments. */
export function stripMarkdownFencedBlocks(md) {
  return md.replace(/^```[^\n]*\n[\s\S]*?^```\s*/gm, "");
}

function walkMarkdownFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkMarkdownFiles(p, acc);
    else if (name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

/**
 * @returns {{ id: string, body: string, file: string }[]}
 */
export function extractAmendmentBlocks(content, fileLabel) {
  const stripped = stripMarkdownFencedBlocks(content);
  const blocks = [];
  const re = /^##\s+CIL-AMENDMENT\s+(.+)$/gm;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const id = m[1].trim();
    const start = m.index + m[0].length;
    const tail = stripped.slice(start);
    const nextIdx = tail.search(/^##\s+/m);
    const body = nextIdx === -1 ? tail : tail.slice(0, nextIdx);
    blocks.push({ id, body, file: fileLabel });
  }
  return blocks;
}

/**
 * @param {string} body
 * @returns {Record<string, string>}
 */
export function parseAmendmentFields(body) {
  /** @type {Record<string, string>} */
  const fields = {};
  const lines = body.split(/\r?\n/);
  let currentKey = null;
  let buf = [];

  const flush = () => {
    if (!currentKey) return;
    fields[currentKey] = buf.join("\n").trim();
    currentKey = null;
    buf = [];
  };

  for (const line of lines) {
    const km = line.match(/^\*\*([A-Za-z][A-Za-z -]*):\*\*\s*(.*)$/);
    if (km) {
      flush();
      const key = km[1].trim().toLowerCase().replace(/\s+/g, "-");
      currentKey = key;
      if (km[2].trim()) buf.push(km[2].trim());
      continue;
    }
    if (currentKey) {
      if (line.trim() === "" && buf.length === 0) continue;
      buf.push(line);
    }
  }
  flush();
  return fields;
}

/**
 * @param {string} targetsField
 * @returns {string[]}
 */
export function parseTargetPaths(targetsField) {
  if (!targetsField) return [];
  const raw = targetsField.split(/\r?\n/)[0] ?? "";
  return raw
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("("));
}

/**
 * @param {string} changeClass
 */
export function routeChangeClass(changeClass) {
  const routes = {
    ADD: { tier: "baseline", notes: "Append-only normative text; verify graph + specflow." },
    CLARIFY: { tier: "baseline", notes: "Non-normative or same-law clarification." },
    VERSION_LINE: {
      tier: "stabilization",
      notes: "Must align with STABILIZATION.md / new phase line (v571+ or experimental)."
    },
    PROTOCOL_BUMP: {
      tier: "artifact-protocol",
      notes: "Cross-check ARTIFACT_FAMILY_TAXONOMY + boot protocols (human review)."
    },
    TRUST_ROOT: {
      tier: "trust-root",
      notes: "ADR_BOOTSTRAP_AUTHORITY dual attestation; attestations strongly expected."
    }
  };
  return routes[changeClass] ?? { tier: "unknown", notes: "" };
}

/**
 * @param {Omit<AeeFinding, 'ecgBinding'> & { ecgBinding?: AeeFinding['ecgBinding'] }} partial
 * @returns {AeeFinding}
 */
function makeFinding(partial) {
  return {
    severity: partial.severity,
    code: partial.code,
    message: partial.message,
    amendmentId: partial.amendmentId,
    file: partial.file,
    aeeState: partial.aeeState,
    ecgBinding: partial.ecgBinding ?? null
  };
}

/**
 * Optional: AEE_ECG_REF_JSON env = {"causalNodeId":"...","epochRef":"..."} applied to all findings (witness only).
 */
function readEnvEcgBinding() {
  const raw = process.env.AEE_ECG_REF_JSON;
  if (!raw || !raw.trim()) return null;
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === "object") {
      return {
        causalNodeId: typeof o.causalNodeId === "string" ? o.causalNodeId : undefined,
        epochRef: typeof o.epochRef === "string" ? o.epochRef : undefined
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {{ id: string, body: string, file: string }} block
 * @param {{ verbose?: boolean, ecgWitness?: AeeFinding['ecgBinding'] }} opts
 * @returns {{ ok: boolean, errors: string[], warnings: string[], findings: AeeFinding[], lastState: string }}
 */
export function validateAmendmentBlock(block, opts = {}) {
  /** @type {AeeFinding[]} */
  const findings = [];
  const fields = parseAmendmentFields(block.body);
  const date = fields["date"] ?? "";
  const changeClass = (fields["change-class"] ?? "").trim();
  const targetsRaw = fields["targets"] ?? "";
  const prior = (fields["prior-anchor"] ?? "").trim();
  const specflow = (fields["specflow"] ?? "").trim();
  const attestations = fields["attestations"] ?? "";
  const witness = opts.ecgWitness ?? null;

  const pushErr = (code, state, msg) => {
    findings.push(
      makeFinding({
        severity: "error",
        code,
        message: msg,
        amendmentId: block.id,
        file: block.file,
        aeeState: state,
        ecgBinding: witness
      })
    );
  };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    pushErr(
      AEE_CODES.DATE_INVALID,
      "PARSED",
      `**Date:** must be YYYY-MM-DD (got: ${JSON.stringify(date)})`
    );
  }
  if (!CHANGE_CLASSES.has(changeClass)) {
    pushErr(
      AEE_CODES.CHANGE_CLASS_INVALID,
      "ROUTED",
      `**Change-class:** must be one of ${[...CHANGE_CLASSES].join(", ")} (got: ${JSON.stringify(changeClass)})`
    );
  }
  if (!SPECFLOW_VALUES.has(specflow)) {
    pushErr(
      AEE_CODES.SPECFLOW_INVALID,
      "ROUTED",
      `**SPECFLOW:** must be one of ${[...SPECFLOW_VALUES].join(", ")} (got: ${JSON.stringify(specflow)})`
    );
  }
  if (prior.length < 2) {
    pushErr(
      AEE_CODES.PRIOR_ANCHOR_MISSING,
      "PARSED",
      "**Prior-anchor:** required (e.g. commit SHA or parent amendment id)"
    );
  }

  const targets = parseTargetPaths(targetsRaw);
  if (targets.length === 0) {
    pushErr(AEE_CODES.TARGETS_EMPTY, "TARGETS_RESOLVED", "**Targets:** must list at least one repo path (comma-separated on first line)");
  }
  for (const t of targets) {
    const abs = resolve(ROOT, t.replace(/^\.\//, ""));
    if (!existsSync(abs)) {
      pushErr(
        AEE_CODES.TARGET_NOT_FOUND,
        "TARGETS_RESOLVED",
        `target path does not exist: ${t}`
      );
    }
  }

  if (changeClass === "TRUST_ROOT" && attestations.length < 10) {
    findings.push(
      makeFinding({
        severity: "warning",
        code: AEE_CODES.TRUST_ROOT_ATTESTATION_WEAK,
        message: "TRUST_ROOT should include **Attestations:** (dual attestation per ADR)",
        amendmentId: block.id,
        file: block.file,
        aeeState: "TARGETS_RESOLVED",
        ecgBinding: witness
      })
    );
  }

  const route = routeChangeClass(changeClass);
  if (opts.verbose) {
    console.error(
      `[route] ${block.id} change-class=${changeClass} tier=${route.tier} — ${route.notes}`
    );
  }

  const hasErr = findings.some((f) => f.severity === "error");
  const errors = findings.filter((f) => f.severity === "error").map((f) => `[${f.amendmentId}] ${f.file}: ${f.message}`);
  const warnings = findings.filter((f) => f.severity === "warning").map((f) => `[${f.amendmentId}] ${f.file}: ${f.message}`);
  const lastState = hasErr
    ? (findings.find((f) => f.severity === "error")?.aeeState ?? "FAILED")
    : "TARGETS_RESOLVED";

  return { ok: !hasErr, errors, warnings, findings, lastState };
}

/**
 * @param {{ inheritStdio: boolean }} opts
 * @returns {{ ok: boolean, failures: AeeFinding[] }}
 */
export function runVerifyHooks(opts = { inheritStdio: true }) {
  const steps = [
    { script: "validateStabilizationGraph.mjs", code: AEE_CODES.VERIFY_GRAPH_FAILED },
    { script: "validateSpecflowCoherence.mjs", code: AEE_CODES.VERIFY_SPECFLOW_FAILED }
  ];
  /** @type {AeeFinding[]} */
  const failures = [];
  for (const s of steps) {
    const r = spawnSync("node", [join("scripts", s.script)], {
      cwd: ROOT,
      stdio: opts.inheritStdio ? "inherit" : "pipe",
      encoding: opts.inheritStdio ? undefined : "utf8",
      maxBuffer: 2 * 1024 * 1024
    });
    if (r.status !== 0) {
      failures.push(
        makeFinding({
          severity: "error",
          code: s.code,
          message: `verify hook failed: ${s.script}`,
          amendmentId: "_runtime_",
          file: s.script,
          aeeState: "VERIFYING",
          ecgBinding: null
        })
      );
      if (!opts.inheritStdio && r.stderr) {
        failures[failures.length - 1].message += ` | stderr_tail: ${String(r.stderr).slice(-2000)}`;
      }
      return { ok: false, failures };
    }
  }
  return { ok: true, failures: [] };
}

function parseArgs(argv) {
  const verify = argv.includes("--verify");
  const verbose = argv.includes("--verbose");
  const json = argv.includes("--json");
  const paths = [];
  const pi = argv.indexOf("--paths");
  if (pi !== -1) {
    for (let i = pi + 1; i < argv.length && !argv[i].startsWith("--"); i++) {
      paths.push(resolve(ROOT, argv[i]));
    }
  }
  return { verify, verbose, json, paths };
}

function main() {
  const { verify, verbose, json, paths } = parseArgs(process.argv.slice(2));
  const ecgWitness = readEnvEcgBinding();

  let files;
  if (paths.length > 0) {
    files = paths.filter((p) => p.endsWith(".md") && existsSync(p));
    if (!json) {
      for (const p of paths) {
        if (!p.endsWith(".md")) console.error(`validateCilAmendment: skip non-md: ${p}`);
        if (!existsSync(p)) console.error(`validateCilAmendment: missing: ${p}`);
      }
    }
  } else {
    files = walkMarkdownFiles(join(ROOT, "docs"));
  }

  /** @type {{ id: string, body: string, file: string }[]} */
  const allBlocks = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const label = relative(ROOT, file).replace(/\\/g, "/");
    allBlocks.push(...extractAmendmentBlocks(content, label));
  }

  /** @type {AeeFinding[]} */
  const allFindings = [];
  /** @type {{ id: string, file: string, ok: boolean, lastState: string, findings: AeeFinding[] }[]} */
  const amendmentReports = [];

  if (!json) {
    if (allBlocks.length === 0) console.log("validateCilAmendment: no CIL-AMENDMENT blocks found (ok).");
    else console.log(`validateCilAmendment: found ${allBlocks.length} amendment block(s).`);
  }

  for (const block of allBlocks) {
    const r = validateAmendmentBlock(block, { verbose, ecgWitness });
    amendmentReports.push({
      id: block.id,
      file: block.file,
      ok: r.ok,
      lastState: r.lastState,
      findings: r.findings
    });
    allFindings.push(...r.findings);
    if (!json) {
      for (const w of r.warnings) console.error(`WARN ${w}`);
      for (const e of r.errors) console.error(`ERR  ${e}`);
    }
  }

  const parsePhaseOk = amendmentReports.every((a) => a.ok);
  let verifyHooks = {
    ran: false,
    ok: true,
    failures: /** @type {AeeFinding[]} */ ([]),
    skippedReason: /** @type {string | null} */ (null)
  };

  if (verify && parsePhaseOk) {
    if (!json) console.log("validateCilAmendment: running verify hooks (graph + specflow)…");
    verifyHooks = {
      ran: true,
      ok: true,
      failures: [],
      skippedReason: null,
      ...(() => {
        const vr = runVerifyHooks({ inheritStdio: !json });
        return { ok: vr.ok, failures: vr.failures };
      })()
    };
    allFindings.push(...verifyHooks.failures);
    if (!verifyHooks.ok && !json) {
      console.error("validateCilAmendment: verify hook failed.");
    }
    if (!json && verifyHooks.ok) console.log("validateCilAmendment: verify hooks passed.");
  } else if (verify && !parsePhaseOk) {
    verifyHooks = { ran: false, ok: true, failures: [], skippedReason: "parse_phase_failed" };
  }

  let runState = "IDLE";
  if (allBlocks.length === 0) {
    runState = "IDLE_NO_AMENDMENTS";
  } else if (!parsePhaseOk) {
    runState = "FAILED";
  } else if (verify) {
    runState = verifyHooks.ok ? "VERIFIED" : "FAILED";
  } else {
    runState = "TARGETS_RESOLVED";
  }

  for (const ar of amendmentReports) {
    if (verify && parsePhaseOk && verifyHooks.ok) ar.lastState = "VERIFIED";
  }

  const ok =
    (allBlocks.length === 0 || parsePhaseOk) &&
    (!verify || verifyHooks.ok);

  if (json) {
    const report = {
      aeeVersion: AEE_VERSION,
      arsm: "ARSM-1",
      ok,
      runState,
      amendmentCount: allBlocks.length,
      amendments: amendmentReports,
      verifyHooks: {
        ran: verifyHooks.ran,
        ok: verifyHooks.ok,
        skippedReason: verifyHooks.skippedReason ?? null
      },
      findings: allFindings,
      ecgTracePolicy: {
        binding: "optional-reference-only",
        note: "ecgBinding is witness linkage for explanation traces; not derived from TAL or amendment per ETSS-1",
        envHint: "Set AEE_ECG_REF_JSON for optional causalNodeId / epochRef on findings"
      }
    };
    console.log(JSON.stringify(report, null, 2));
  }

  process.exit(ok ? 0 : 1);
}

main();
