/**
 * HTTP + WebSocket browser origin policy (Rhizoh prod surfaces).
 * Env (`CASTLE_ALLOWED_ORIGINS`, `CASTLE_HTTP_CORS_ORIGIN`) merges with production defaults
 * so Render mis-config does not drop preflight ACAO headers.
 */

export const RHIZOH_BROWSER_ORIGINS_V1 = Object.freeze([
  "https://rhizoh.com",
  "https://www.rhizoh.com",
  "https://castle-genesis.web.app",
  "https://castle-genesis.firebaseapp.com",
  "https://app.castle-genesis.com",
  "https://castle-genesis.com",
  "http://localhost:5173",
  "https://localhost:5173"
]);

export const HTTP_CORS_ALLOW_HEADERS_V1 =
  "Content-Type, Authorization, X-Castle-Dev-Uid, X-Castle-Guest-Id, X-Castle-Gateway-Token, X-Castle-Ingress-Contract, X-Rhizoh-Outcome-Signature, X-Rhizoh-Outcome-Source-Token, X-Castle-Academic-Observatory-Key, X-Castle-Moderation-Key, X-Rhizoh-Ui-Lang, X-Rhizoh-Speech-Lang, X-Rhizoh-Llm-Lang, X-Rhizoh-Language-Trace-Id";

export function normalizeHttpOrigin(origin) {
  return String(origin || "")
    .trim()
    .replace(/\/+$/, "");
}

/** Any localhost port — Vite dev may bind 5174+ when 5173 is taken. */
export function isLocalhostDevOrigin(origin) {
  const n = normalizeHttpOrigin(origin);
  if (!n) return false;
  try {
    const host = new URL(n).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

/** Firebase Hosting preview channels: castle-genesis--<channel>.web.app */
export function isCastleGenesisFirebasePreviewOrigin(origin) {
  const n = normalizeHttpOrigin(origin);
  if (!n) return false;
  try {
    const host = new URL(n).hostname.toLowerCase();
    return (
      host.startsWith("castle-genesis--") &&
      (host.endsWith(".web.app") || host.endsWith(".firebaseapp.com"))
    );
  } catch {
    return false;
  }
}

/** @param {NodeJS.ProcessEnv} [env] */
export function parseAllowedOriginsFromEnv(env = process.env) {
  const fromList = String(env.CASTLE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const primary = normalizeHttpOrigin(env.CASTLE_HTTP_CORS_ORIGIN);
  return { fromList, primary };
}

/** @param {NodeJS.ProcessEnv} [env] */
export function buildHttpCorsOriginAllowSet(env = process.env) {
  const set = new Set();
  const isProd = String(env.NODE_ENV || "").toLowerCase() === "production";
  if (isProd) {
    for (const o of RHIZOH_BROWSER_ORIGINS_V1) {
      const n = normalizeHttpOrigin(o);
      if (n) set.add(n);
    }
  }
  const { fromList, primary } = parseAllowedOriginsFromEnv(env);
  for (const o of fromList) {
    const n = normalizeHttpOrigin(o);
    if (n) set.add(n);
  }
  if (primary && primary !== "*") set.add(primary);
  return set;
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{
 *   allowSet: Set<string>,
 *   accessControlAllowOriginValue: (req: { headers?: Record<string, string | string[] | undefined> }) => string | null,
 *   applyHttpCorsHeaders: (req: { headers?: Record<string, string | string[] | undefined> }, res: { setHeader: (k: string, v: string) => void }) => string | null,
 *   isWebSocketOriginAllowed: (origin: string) => boolean
 * }}
 */
export function createHttpCorsPolicy(env = process.env) {
  const primaryEnv = normalizeHttpOrigin(env.CASTLE_HTTP_CORS_ORIGIN);
  const allowSet = buildHttpCorsOriginAllowSet(env);

  function accessControlAllowOriginValue(req) {
    if (primaryEnv === "*") return "*";
    const reqOrigin = normalizeHttpOrigin(req?.headers?.origin);
    if (allowSet.size === 0) return "*";
    if (!reqOrigin) return "*";
    if (allowSet.has(reqOrigin)) return reqOrigin;
    if (isCastleGenesisFirebasePreviewOrigin(reqOrigin)) return reqOrigin;
    if (isLocalhostDevOrigin(reqOrigin)) return reqOrigin;
    return null;
  }

  function applyHttpCorsHeaders(req, res) {
    const allow = accessControlAllowOriginValue(req);
    if (allow) {
      res.setHeader("Access-Control-Allow-Origin", allow);
      if (allow !== "*") {
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
      }
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", HTTP_CORS_ALLOW_HEADERS_V1);
    res.setHeader("Access-Control-Max-Age", "86400");
    return allow;
  }

  function isWebSocketOriginAllowed(origin) {
    if (primaryEnv === "*") return true;
    if (allowSet.size === 0) return true;
    const n = normalizeHttpOrigin(origin);
    if (!n) return true;
    return allowSet.has(n) || isCastleGenesisFirebasePreviewOrigin(n) || isLocalhostDevOrigin(n);
  }

  return {
    allowSet,
    accessControlAllowOriginValue,
    applyHttpCorsHeaders,
    isWebSocketOriginAllowed
  };
}
