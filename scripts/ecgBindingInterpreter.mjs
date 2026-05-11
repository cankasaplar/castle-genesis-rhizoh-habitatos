/**
 * ECGBinding Interpreter (ECGI-1) — read-only reasoning trace; no I/O side effects.
 * @see docs/ECGBINDING_INTERPRETER_V1.md
 *
 *   node scripts/ecgBindingInterpreter.mjs --file path/to/binding.json
 *   node scripts/ecgBindingInterpreter.mjs --json '{"causalNodeId":"cn:x"}'   # POSIX shells
 *   ECGI_INPUT_JSON='{"epochRef":"0x1"}' node scripts/ecgBindingInterpreter.mjs
 */

import { readFileSync } from "node:fs";

/**
 * @param {unknown} raw
 * @returns {{ causalNodeId?: string, epochRef?: string } | null}
 */
export function parseEcgBinding(raw) {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const causalNodeId = typeof o.causalNodeId === "string" ? o.causalNodeId.trim() : undefined;
  const epochRef = typeof o.epochRef === "string" ? o.epochRef.trim() : undefined;
  if (!causalNodeId && !epochRef) return {};
  return {
    ...(causalNodeId ? { causalNodeId } : {}),
    ...(epochRef ? { epochRef } : {})
  };
}

/**
 * @param {{ causalNodeId?: string, epochRef?: string } | null} binding
 */
export function interpretEcgBinding(binding) {
  const empty = !binding || (!binding.causalNodeId && !binding.epochRef);
  const b = empty ? {} : { ...binding };

  return {
    ecgiVersion: "1.0",
    role: "READ_ONLY_WITNESS",
    binding: b,
    trace: empty
      ? [
          {
            kind: "no_witness",
            meaning: "No ECG/epoch witness attached; correlation optional."
          }
        ]
      : [
          {
            kind: "witness_link",
            meaning:
              "AEE finding or human note may reference this ECG/epoch id for audit correlation only."
          }
        ],
    forbidden: [
      "Do not treat ecgBinding as proof of causal derivation from SESSION_LOG.",
      "Do not mutate causal graph from interpreter output.",
      "Do not elevate witness link to canonical truth without CIL + attested artifact path."
    ],
    empty
  };
}

function main() {
  const argv = process.argv.slice(2);
  let rawText = null;

  const fi = argv.indexOf("--file");
  if (fi !== -1 && argv[fi + 1]) {
    try {
      rawText = readFileSync(argv[fi + 1], "utf8");
    } catch {
      console.error("ecgBindingInterpreter: cannot read --file");
      process.exit(1);
    }
  }

  const ji = argv.indexOf("--json");
  if (rawText == null && ji !== -1 && argv[ji + 1]) {
    rawText = argv[ji + 1];
  }

  if (rawText == null && process.env.ECGI_INPUT_JSON) {
    rawText = process.env.ECGI_INPUT_JSON;
  }

  if (rawText == null) {
    console.error(
      "Usage: node scripts/ecgBindingInterpreter.mjs --file binding.json | --json '{...}' | ECGI_INPUT_JSON=..."
    );
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(rawText);
  } catch {
    console.error("ecgBindingInterpreter: invalid JSON");
    process.exit(1);
  }
  const binding = parseEcgBinding(raw);
  if (binding === null) {
    console.error("ecgBindingInterpreter: binding must be object or null");
    process.exit(1);
  }
  console.log(JSON.stringify(interpretEcgBinding(binding), null, 2));
}

main();
