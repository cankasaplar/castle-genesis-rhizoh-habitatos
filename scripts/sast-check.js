import { readFileSync } from "node:fs";
import { join } from "node:path";

const files = [
  "apps/client/src/App.jsx",
  "apps/gateway/src/server.js",
  "apps/gateway/src/auth.js",
  "apps/sfu/src/server.js"
];

const blockedPatterns = [
  { name: "eval", re: /\beval\s*\(/g },
  { name: "Function ctor", re: /\bnew Function\s*\(/g },
  { name: "child_process exec", re: /\bexec\s*\(/g },
  { name: "hardcoded api key", re: /api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi }
];

const findings = [];

for (const file of files) {
  const full = join(process.cwd(), file);
  const content = readFileSync(full, "utf8");
  for (const pattern of blockedPatterns) {
    if (pattern.re.test(content)) findings.push(`${file}: blocked pattern detected -> ${pattern.name}`);
  }
}

if (findings.length) {
  console.error("SAST check failed:");
  findings.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log("SAST check passed.");
