import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const studioRoot = path.join(root, "apps/client/src/studio");
const sourceFilePattern = /\.[cm]?[jt]sx?$/;
const disallowedRelativeExtPattern = /\.(?:js|jsx|ts|tsx)$/i;

function collectSourceFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if (entry.isFile() && sourceFilePattern.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function findViolations(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const lines = src.split(/\r?\n/);
  const violations = [];

  // Finds static import/export-from specifiers on each line.
  const importExportSpecifierPattern =
    /\b(?:import|export)\b(?:[\s\w*$,{}\n\r]*?\bfrom\b)?[\s]*["']([^"']+)["']/g;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    importExportSpecifierPattern.lastIndex = 0;
    let match = importExportSpecifierPattern.exec(line);
    while (match) {
      const specifier = match[1];
      const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
      if (isRelative && disallowedRelativeExtPattern.test(specifier)) {
        violations.push({
          filePath,
          line: i + 1,
          specifier,
        });
      }
      match = importExportSpecifierPattern.exec(line);
    }
  }

  return violations;
}

if (!fs.existsSync(studioRoot)) {
  console.error(`[studio-import-extensions] Missing directory: ${path.relative(root, studioRoot)}`);
  process.exit(1);
}

const files = collectSourceFiles(studioRoot);
const violations = files.flatMap(findViolations);

if (violations.length > 0) {
  console.error("[studio-import-extensions] Relative import/export specifiers must be extensionless:");
  for (const violation of violations) {
    console.error(
      `  ${path.relative(root, violation.filePath)}:${violation.line} -> ${JSON.stringify(violation.specifier)}`
    );
  }
  process.exit(1);
}

console.log(`[studio-import-extensions] OK (${files.length} files scanned)`);
