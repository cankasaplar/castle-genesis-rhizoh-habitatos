/** Sortable, çakışmasız varlık kimlikleri (ULID) + deterministik jitter (orbit vb.). */

const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomChar() {
  const u = new Uint8Array(1);
  crypto.getRandomValues(u);
  return ULID_ENCODING[u[0] % 32];
}

function encodeTime(ms, len = 10) {
  let t = BigInt(ms);
  let s = "";
  for (let i = 0; i < len; i++) {
    s = ULID_ENCODING[Number(t & 31n)] + s;
    t >>= 5n;
  }
  return s;
}

/** Lexicografik sıralı, 128-bit benzeri string ID (çoğaltıcı yok, tarayıcıda güvenli). */
export function createCastleUlid(now = Date.now()) {
  let rand = "";
  for (let i = 0; i < 16; i++) rand += randomChar();
  return `${encodeTime(now, 10)}${rand}`;
}

/** String kimlikten deterministik iki küçük sayı (orbit offset / faz). FNV-1a 64-bit fold. */
export function stableJitterFromId(id) {
  const s = String(id);
  let h = 146959810393466560n;
  const prime = 1099511628211n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * prime) & ((1n << 64n) - 1n);
  }
  const lo = Number(h & 0xffffffffn) >>> 0;
  const hi = Number((h >> 32n) & 0xffffffffn) >>> 0;
  return { lo, hi };
}
