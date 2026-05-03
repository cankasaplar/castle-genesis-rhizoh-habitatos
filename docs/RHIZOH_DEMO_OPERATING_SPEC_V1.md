# RHIZOH_DEMO_OPERATING_SPEC_V1

Kategori: Demo ve execution evidence spesifikasyonu  
Hedef kitle: Enterprise CTO/CISO, lighthouse müşteri ekipleri, teknik yatırımcılar

## Demo Thesis

Tek use-case: **Autonomous Warehouse Fleet Governance Runtime**  
Amaç: RHIZOH'un 5-plane modelini tek dikeyde, ölçülebilir KPI'larla canlı göstermek.

## 1) Scope

Demo aşağıdaki uçtan uca akışı kapsar:

1. Fleet spawn
2. Permit issuance
3. Drift detection
4. External proof routing
5. Replay verification
6. Kill switch
7. Audit log export

## 2) Plane-to-Feature Mapping

| Plane | Demo bileşeni | Kanıt artefaktı |
|------|----------------|-----------------|
| Execution | Fleet spawn + scheduler durumu | Frame state ve execution trace |
| Proof | SMT IR + proof/check + witness | Proof result + attestation ref |
| Governance | permit/revoke + gate + kill switch | Governance decision log |
| Identity | seal + fingerprint + closure root | Identity seal chain |
| Physical | robot/edge telemetri simülasyonu | Telemetry stream records |

## 3) Functional Requirements

- `spawn fleet`: en az 100 ajanlık simülasyon oluşturma
- `issue permit`: ajan veya görev bazlı yetki verme
- `drift detection`: sapma sinyali üretip governance'e aktarma
- `proof routing`: en az 2 proof node'a asenkron dağıtım
- `replay verification`: seçilen olay için replay doğrulama sonucu
- `kill switch`: kritik seviyede eylem kesme
- `audit log`: izlenebilir CSV/JSON export

## 4) Dashboard Modules

1. **Fleet Control Panel**: spawn, pause, resume
2. **Permit Console**: allow/revoke, risk tier
3. **Proof Monitor**: routing durumu, proof latency, witness summary
4. **Drift & Containment Panel**: drift score, intervention events
5. **Replay Workbench**: replay id, verify output, mismatch reason
6. **Emergency Controls**: kill switch + override reason
7. **Audit Timeline**: olay zinciri ve export

## 5) API Bindings (v1)

Demo en az şu endpoint yüzeylerini kullanır:

- `POST /runtime/spawn`
- `POST /runtime/permit`
- `POST /runtime/revoke`
- `POST /proof/check`
- `POST /proof/attest`
- `POST /identity/seal`
- `POST /replay/verify`
- `GET /governance/audit`
- `GET /telemetry/stream`

Referans: `RHIZOH_API_CONTRACTS_V1.md`.

## 6) KPI Set (Pilot Evidence)

- **Incident reduction**: baseline'e göre düşüş eğilimi
- **Proof latency**: p50/p95 proof routing süresi
- **Governance latency**: permit/gate karar süresi
- **Replay coverage**: kritik olayların replay doğrulama kapsama oranı
- **Governance intervention rate**: manuel müdahale gerektiren akış oranı
- **Containment success rate**: kill switch / gate sonrası izolasyon başarısı

Not: KPI değerleri deployment ortamına göre raporlanır; evrensel garanti olarak sunulmaz.

## 7) Non-Functional Targets

- Demo uptime hedefi: %99+ (pilot ortamı)
- Görsel panel gecikmesi: `<1s` telemetry refresh
- Proof routing hedefi: `<250ms` (non-blocking path, ortam bağımlı)
- Audit export: talep başına `<30s`

## 8) Evidence Package Output

Demo sonunda standart bir kanıt paketi üretilir:

1. `demo_run_summary.json`
2. `proof_routing_metrics.csv`
3. `governance_interventions.csv`
4. `replay_verification_report.json`
5. `incident_timeline_export.csv`
6. `architecture_trace_map.md`

## 9) 90-Day Delivery Plan

### Days 1-21
- API bağlama, dashboard iskeleti, telemetry akışı

### Days 22-45
- Proof routing + witness görünürlüğü + permit/kill switch eylemleri

### Days 46-70
- Replay verify entegrasyonu + audit export paketi

### Days 71-90
- Lighthouse demo runbook, KPI toplama, executive readout

## 10) Exit Criteria

- Tek bir senaryoda tüm 7 fonksiyon uçtan uca başarılı
- KPI seti en az bir tam pilot akışında ölçülmüş
- Audit ve replay çıktıları bağımsız incelenebilir durumda
- Demo paketinden production pilot planına doğrudan geçiş mümkün

