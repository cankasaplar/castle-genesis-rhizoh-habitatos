/**
 * Basit bellek içi rate limit (tek süreç; çoklu replika için Redis gerekir).
 */
const buckets = new Map();
const PRUNE_MS = 120_000;
let lastPrune = 0;

function prune(now) {
  if (now - lastPrune < PRUNE_MS) return;
  lastPrune = now;
  for (const [k, v] of buckets) {
    if (now > v.resetAt) buckets.delete(k);
  }
}

/**
 * @param {string} bucketKey
 * @param {number} max İstek üst sınırı (pencere başına)
 * @param {number} windowMs Pencere süresi
 * @returns {boolean} true = izinli
 */
export function checkHttpRateLimit(bucketKey, max, windowMs) {
  const now = Date.now();
  prune(now);
  const key = String(bucketKey || "anon");
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  return b.count <= max;
}

export function getHttpClientIp(req) {
  const xff = String(req.headers?.["x-forwarded-for"] || "").split(",")[0]?.trim();
  if (xff) return xff.slice(0, 80);
  const ra = req.socket?.remoteAddress || "";
  return String(ra).slice(0, 80) || "unknown";
}
