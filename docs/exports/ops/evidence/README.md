# Manual activation evidence index

**Runbook:** [`docs/ops/ACTIVATION_MANUAL_EVIDENCE_RUNBOOK_V1.0.md`](../../ops/ACTIVATION_MANUAL_EVIDENCE_RUNBOOK_V1.0.md)

```bash
npm run activation:collect-evidence
```

| Prefix | Madde | Otomatik? |
|--------|-------|-----------|
| `A1_dns_*` | DNS proxied | Kısmen (`dig` + `cf-ray`) |
| `A2_tls_*` | TLS | Kısmen (`curl`) |
| `A3_counsel_*` | Legal | Hayır (avukat) |
| `A4_firestore_rules_scan_*` | Firebase rules | Kısmen (grep scan) |
| `A5_ingress_smoke_*` | Ingress smoke | Hayır (tarayıcı) |
| `A6_ui_gate_*` | UI gate | Hayır (screenshot) |
| `A8_cohort_sim_*` | Cohort sim | Evet (npm script) |
| `A9_surface_ack_*` | Surface ack | Hayır (imza) |

**Karar log:** `docs/exports/ops/activation_decision_YYYY-MM-DD.json`

Screenshots: PNG aynı klasöre; repoda PII/secret olmasın.
