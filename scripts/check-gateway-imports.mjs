import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.join(import.meta.dirname, "..");
const gatewaySrc = path.join(root, "apps/gateway/src");

const tracked = new Set(
  execSync("git ls-files apps/gateway/src", { cwd: root, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
);

function localImports(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const dir = path.dirname(filePath);
  const out = [];
  const re = /from ["'](\.\/[^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    let p = path.join(dir, m[1]);
    if (!p.endsWith(".js")) p += ".js";
    out.push(p);
  }
  return out;
}

const queue = [path.join(gatewaySrc, "server.js")];
const seen = new Set();
const untracked = new Set();
const missing = new Set();

while (queue.length) {
  const file = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  if (!fs.existsSync(file)) {
    missing.add(file);
    continue;
  }
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (!tracked.has(rel)) untracked.add(rel);
  for (const dep of localImports(file)) {
    if (!seen.has(dep)) queue.push(dep);
  }
}

console.log("missing", missing.size);
[...missing].sort().forEach((p) => console.log("  ", path.relative(root, p)));
console.log("untracked", untracked.size);
[...untracked].sort().forEach((p) => console.log("  ", p));
