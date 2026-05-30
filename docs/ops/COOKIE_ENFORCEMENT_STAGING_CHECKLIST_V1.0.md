# Cookie Enforcement — Staging Checklist v1.0

**Goal:** Analytics and third-party telemetry do **not** load until cookie consent grants `analytics: true` (default **false**).

## Pre-check (code)

- [ ] `main.jsx` calls `initFirebaseAnalyticsWhenReady()` **only** if `getCookieConsentV0().analytics === true`
- [ ] Default banner sets `analytics: false`

## Network tab (staging / rhizoh.com)

| # | Action | Expect |
|---|--------|--------|
| 1 | First visit, dismiss cookie banner (default) | **No** `google-analytics.com`, **no** `googletagmanager.com` |
| 2 | No Firebase `measurementId` analytics init in console boot log | `skipped — cookie consent analytics off` |
| 3 | Optional: enable analytics in consent (future UI) | Only then measurement requests |

## Third-party embeds

- [ ] No surprise iframe widgets on ingress screens
- [ ] Cesium / map tiles = operational (document in cookie policy as necessary)

## Record

Date · Tester · Browser · Result: PASS / FAIL · Notes
