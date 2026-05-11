/**
 * Gateway — SHA256 hash-chain ile append-only denetim günlüğü (satır başına bir kayıt).
 * Dayanıklılık: varsayılan fsync (CASTLE_RHIZOH_AUDIT_FSYNC=0 ile kapatılabilir),
 * ROTATE_BYTES aşımında dosya `.rotated` ile yenilenir; isteğe bağlı `CASTLE_RHIZOH_AUDIT_ARCHIVE_AFTER_ROTATE_DIR`
 * ile segment kopyası (S3 Object Lock / Azure immutable blob / tape tarafı cron’a bırakılır).
 * Hydrate: son ~64KiB okunur (tam dosya taraması yok).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const GENESIS = "RHIZOH_AUDIT_CHAIN_GENESIS_V1";

/** @type {{ seq: number, headDigest: string, hydrated: boolean }} */
const chainState = {
  seq: 0,
  headDigest: GENESIS,
  hydrated: false
};

function digestHex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

function maybeRotate(auditPath) {
  const max = Math.floor(Number(process.env.CASTLE_RHIZOH_AUDIT_CHAIN_ROTATE_BYTES || 0));
  if (max <= 0 || !fs.existsSync(auditPath)) return;
  const st = fs.statSync(auditPath);
  if (st.size < max) return;
  const rotated = `${auditPath}.${Date.now()}.rotated`;
  fs.renameSync(auditPath, rotated);

  const archiveDir = String(process.env.CASTLE_RHIZOH_AUDIT_ARCHIVE_AFTER_ROTATE_DIR || "").trim();
  if (archiveDir) {
    try {
      fs.mkdirSync(archiveDir, { recursive: true });
      const dest = path.join(archiveDir, path.basename(rotated));
      fs.copyFileSync(rotated, dest);
    } catch {
      /* cold tier / WORM pipeline için kopya — best-effort; .rotated dosyası yerelde kalır */
    }
  }

  chainState.seq = 0;
  chainState.headDigest = GENESIS;
  chainState.hydrated = false;
}

function loadChainTail(path) {
  try {
    if (!fs.existsSync(path)) return;
    const st = fs.statSync(path);
    const chunkSize = Math.min(st.size, 65536);
    const fd = fs.openSync(path, "r");
    let rawTail = "";
    try {
      const buf = Buffer.alloc(chunkSize);
      fs.readSync(fd, buf, 0, chunkSize, Math.max(0, st.size - chunkSize));
      rawTail = buf.toString("utf8");
    } finally {
      fs.closeSync(fd);
    }
    const tailLines = rawTail.split("\n").filter(Boolean);
    let lastStr = tailLines[tailLines.length - 1];
    /** @type {Record<string, unknown> | null} */
    let last = null;
    try {
      last = lastStr ? JSON.parse(lastStr) : null;
    } catch {
      const full = fs.readFileSync(path, "utf8").trim().split("\n").filter(Boolean);
      lastStr = full[full.length - 1];
      last = lastStr ? JSON.parse(lastStr) : null;
    }
    if (!last) return;
    if (Number.isFinite(Number(last.seq))) chainState.seq = Number(last.seq);
    if (last.lineDigest && typeof last.lineDigest === "string") chainState.headDigest = String(last.lineDigest);
  } catch {
    /* bozuk son satır — dosya elle düzeltilmeli */
  }
}

function appendWithDurability(path, lineStr) {
  const fd = fs.openSync(path, "a");
  try {
    fs.writeSync(fd, lineStr, null, "utf8");
    if (process.env.CASTLE_RHIZOH_AUDIT_FSYNC !== "0") {
      fs.fsyncSync(fd);
    }
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * @param {string} canonicalAuditBody canonicalRhizohOperationalJson çıktısı (salt içermez)
 * @returns {Record<string, unknown> | null}
 */
export function appendRhizohConstitutionalAuditChainLine(canonicalAuditBody) {
  const path = String(process.env.CASTLE_RHIZOH_AUDIT_CHAIN_PATH || "").trim();
  if (!path || process.env.CASTLE_RHIZOH_AUDIT_CHAIN === "0") return null;

  maybeRotate(path);

  if (!chainState.hydrated) {
    chainState.hydrated = true;
    loadChainTail(path);
  }

  chainState.seq += 1;
  const recordDigest = digestHex(canonicalAuditBody);
  const lineMaterial = `${chainState.headDigest}|${recordDigest}|${chainState.seq}`;
  const lineDigest = digestHex(lineMaterial);

  const line = {
    seq: chainState.seq,
    prevDigest: chainState.headDigest,
    recordDigest,
    lineDigest,
    emittedAt: Date.now()
  };

  const prevBeforeAppend = chainState.headDigest;
  chainState.headDigest = lineDigest;

  const lineStr = `${JSON.stringify(line)}\n`;

  try {
    appendWithDurability(path, lineStr);
  } catch {
    chainState.seq -= 1;
    chainState.headDigest = prevBeforeAppend;
    return { ...line, appendOk: false, error: "write_failed" };
  }

  const mirrorPath = String(process.env.CASTLE_RHIZOH_AUDIT_MIRROR_PATH || "").trim();
  if (mirrorPath && mirrorPath !== path) {
    try {
      appendWithDurability(mirrorPath, lineStr);
    } catch {
      /* ikinci kopya — operasyonel dayanıklılık; birincil zincir tutarlı */
    }
  }

  return { ...line, appendOk: true };
}
