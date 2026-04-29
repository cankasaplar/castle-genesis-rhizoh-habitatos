# Security Hardening Checklist

This project is configured to avoid hardcoded secrets and reduce runtime abuse risk.

## 1) Secrets and environment variables

- Keep all secret values in `.env` (never commit real values).
- Use `.env.example` only as a template.
- Rotate `CASTLE_GATEWAY_TOKEN` and TURN credentials periodically.
- Do not expose server-only values to client unless required (`VITE_*` are public by design).

## 2) Gateway hardening

- WebSocket message size limit is enforced (`CASTLE_MAX_MESSAGE_BYTES`).
- Optional origin allowlist is enforced (`CASTLE_ALLOWED_ORIGINS`).
- Optional token gate is enforced (`CASTLE_GATEWAY_TOKEN` via WS query `?token=`).
- Optional identity gate is enforced (`CASTLE_REQUIRE_AUTH=true`).
  - Firebase Admin token verify (preferred when service account vars exist)
  - JWT HS256 verify fallback (`CASTLE_JWT_SECRET`)
- Input frame validation is enforced:
  - monotonic frame id
  - command allowlist
  - per-frame command cap
  - anti-spam window/rate cap
- Signaling payload size/type checks are enforced.

## 3) Open data access model

- Open-data access is **allowlisted** and proxied by gateway.
- Supported providers:
  - `wikipedia`
  - `openmeteo`
  - `github`
- Raw arbitrary URL fetch is intentionally blocked to reduce SSRF and abuse risk.

## 4) Media (WebRTC)

- STUN is enabled by default.
- TURN server support is available via:
  - `VITE_TURN_URL`
  - `VITE_TURN_USERNAME`
  - `VITE_TURN_CREDENTIAL`
- For production, TURN is strongly recommended for NAT traversal reliability.
- SFU layer is provided with mediasoup (`apps/sfu`) for multi-user scaling.

## 6) CI security baseline

- GitHub workflow: `.github/workflows/security.yml`
- Includes:
  - dependency install + build
  - `npm audit` high-level scan
  - local SAST pattern checks
  - CodeQL analysis

## 5) Remaining best practices

- Run dependency audit in CI (`npm audit`).
- Add WAF/reverse proxy + TLS termination in production.
- Add auth identity verification (JWT/Firebase token validation) at gateway.
- Add structured security logging and alerting for abuse patterns.
