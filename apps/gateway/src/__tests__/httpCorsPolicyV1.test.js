import test from "node:test";
import assert from "node:assert/strict";
import {
  buildHttpCorsOriginAllowSet,
  createHttpCorsPolicy,
  normalizeHttpOrigin,
  RHIZOH_BROWSER_ORIGINS_V1
} from "../httpCorsPolicyV1.js";

test("production defaults include rhizoh.com and firebase hosting", () => {
  const set = buildHttpCorsOriginAllowSet({ NODE_ENV: "production", CASTLE_ALLOWED_ORIGINS: "" });
  assert.ok(set.has("https://rhizoh.com"));
  assert.ok(set.has("https://www.rhizoh.com"));
  assert.ok(set.has("https://castle-genesis.web.app"));
});

test("env origins merge with production defaults", () => {
  const set = buildHttpCorsOriginAllowSet({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "https://preview.example.com",
    CASTLE_HTTP_CORS_ORIGIN: "https://rhizoh.com"
  });
  assert.ok(set.has("https://preview.example.com"));
  assert.ok(set.has("https://rhizoh.com"));
  for (const o of RHIZOH_BROWSER_ORIGINS_V1) {
    assert.ok(set.has(normalizeHttpOrigin(o)), `missing default ${o}`);
  }
});

test("preflight echoes request origin when whitelisted", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "",
    CASTLE_HTTP_CORS_ORIGIN: ""
  });
  const req = { headers: { origin: "https://www.rhizoh.com" } };
  assert.equal(policy.accessControlAllowOriginValue(req), "https://www.rhizoh.com");
});

test("unknown origin returns null (browser blocks)", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "https://rhizoh.com",
    CASTLE_HTTP_CORS_ORIGIN: "https://rhizoh.com"
  });
  const req = { headers: { origin: "https://evil.example" } };
  assert.equal(policy.accessControlAllowOriginValue(req), null);
});

test("CASTLE_HTTP_CORS_ORIGIN=* allows wildcard", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_HTTP_CORS_ORIGIN: "*"
  });
  assert.equal(policy.accessControlAllowOriginValue({ headers: { origin: "https://any.example" } }), "*");
});

test("WebSocket origin check uses normalized allow set", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "https://rhizoh.com/"
  });
  assert.equal(policy.isWebSocketOriginAllowed("https://rhizoh.com"), true);
  assert.equal(policy.isWebSocketOriginAllowed("https://www.rhizoh.com"), true);
  assert.equal(policy.isWebSocketOriginAllowed("https://blocked.example"), false);
});

test("firebase preview channel origin is allowed in production", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "",
    CASTLE_HTTP_CORS_ORIGIN: "https://rhizoh.com"
  });
  const preview = "https://castle-genesis--t0-companion-obs-pzyoelen.web.app";
  const req = { headers: { origin: preview } };
  assert.equal(policy.accessControlAllowOriginValue(req), preview);
  assert.equal(policy.isWebSocketOriginAllowed(preview), true);
});

test("localhost dev on any port is allowed in production", () => {
  const policy = createHttpCorsPolicy({
    NODE_ENV: "production",
    CASTLE_ALLOWED_ORIGINS: "",
    CASTLE_HTTP_CORS_ORIGIN: "https://rhizoh.com"
  });
  const dev5174 = "http://localhost:5174";
  const req = { headers: { origin: dev5174 } };
  assert.equal(policy.accessControlAllowOriginValue(req), dev5174);
  assert.equal(policy.isWebSocketOriginAllowed(dev5174), true);
});

test("applyHttpCorsHeaders sets ACAO for OPTIONS path", () => {
  const policy = createHttpCorsPolicy({ NODE_ENV: "production" });
  /** @type {Record<string, string>} */
  const headers = {};
  const res = { setHeader: (k, v) => { headers[k] = v; } };
  policy.applyHttpCorsHeaders({ headers: { origin: "https://rhizoh.com" } }, res);
  assert.equal(headers["Access-Control-Allow-Origin"], "https://rhizoh.com");
  assert.equal(headers["Access-Control-Max-Age"], "86400");
  assert.match(headers["Access-Control-Allow-Headers"], /X-Castle-Gateway-Token/);
});
