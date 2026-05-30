/**
 * Shared parse for `buildRuntimeSnapshotV1` snap object top-level keys.
 *
 * Single intentional coupling point: the snap object in runtimeSnapshotV1.js must still be
 * closed by `};` immediately before `logRuntimeSnapshotValidationIssues`. If that call moves,
 * update this regex. Lock file is a derived artifact (`syncRuntimeSnapshotV1TopLevelLock.mjs`).
 */

/** @param {string} src */
export function extractTopLevelSnapKeysFromSource(src) {
  const n = String(src || "").replace(/\r\n/g, "\n");
  const block = n.match(/const snap = \{([\s\S]*?)\n  \};\n  logRuntimeSnapshotValidationIssues/);
  if (!block) {
    return { ok: false, keys: [], error: "snap_block_not_found" };
  }
  const found = new Set();
  for (const line of block[1].split("\n")) {
    const m = /^    ([a-zA-Z0-9_]+)(:|,)/.exec(line);
    if (m) found.add(m[1]);
  }
  return { ok: true, keys: [...found].sort(), error: null };
}
