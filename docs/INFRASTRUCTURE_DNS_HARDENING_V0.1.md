# Infrastructure & DNS Hardening v0.1 (rhizoh.com)

**Tag:** `OPERATIONS` — runbook, not application code  
**Goal:** Origin masking, edge filtering, registrar privacy, certificate and DNS integrity.

---

## 1. Registrar — WHOIS privacy

1. Enable **WHOIS Privacy / GDPR Privacy** on the domain at registrar.
2. Confirm public WHOIS shows registrar proxy contacts only — no personal phone/email.
3. Lock domain: **transfer lock** + **registrar lock** where available.

---

## 2. Cloudflare — ingress shield (do not point A record to bare origin)

1. Add `rhizoh.com` (and `www`) to Cloudflare; nameservers at registrar → Cloudflare.
2. **DNS records:**
   - `A` / `AAAA` for `@` and `www` → **Proxied** (orange cloud) to origin IP **or** tunnel.
   - **Never** publish origin IP in public DNS without proxy.
3. **SSL/TLS:** Full (strict) — valid origin cert (Let’s Encrypt or Cloudflare origin cert).
4. **Always Use HTTPS** + HSTS (after smoke test): max-age ≥ 6 months, include subdomains when ready.

---

## 3. WAF & rate limiting (edge / “antre”)

| Rule | Suggested starting point |
|------|-------------------------|
| Global rate limit | 100 req/min/IP on `/api/*` |
| Login / auth paths | 10 req/min/IP |
| Bot fight mode | Managed challenge on suspicious ASNs |
| OWASP core ruleset | On (log → block after tuning) |
| Geo block (optional) | Only if product scope is fixed |

Tune using Cloudflare Security Events; avoid blocking legitimate sovereign node health checks (allowlist probe IPs).

---

## 4. DNS integrity records

| Record | Purpose |
|--------|---------|
| **CAA** | `0 issue "letsencrypt.org"` (and backup CA if used) |
| **TXT** SPF | Only if sending mail from domain |
| **TXT** DMARC | `p=none` initially → tighten |
| **TXT** domain verification | Google / other consoles as needed |

---

## 5. Origin server

- Firewall: allow **only** Cloudflare IP ranges (or Cloudflare Tunnel — preferred; no open 443 to world).
- Disable direct IP access via separate vhost or null route.
- SSH: key-only, non-default port or bastion; fail2ban optional.

---

## 6. Verification checklist

- [ ] `curl -sI https://rhizoh.com` shows Cloudflare headers (`cf-ray`, `server: cloudflare`)
- [ ] Direct origin IP:443 from external network **fails** or shows default deny
- [ ] WHOIS privacy on
- [ ] CAA present
- [ ] Legal preamble loads (`VITE_RHIZOH_LEGAL_PREAMBLE=1`)

---

## Related

- [`LEGAL_REALITY_SPEC_V0.1.md`](LEGAL_REALITY_SPEC_V0.1.md)
- [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md)
