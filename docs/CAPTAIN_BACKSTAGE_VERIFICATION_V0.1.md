# Kaptan — Arka Sahne Doğrulama (v0.1)

**Ne zaman:** Dost “**Bitti Kaptan!**” yazdığında  
**Ne yapma:** Onlara konsol komutu gönderme — [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](../apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md)

Tam teknik runbook: [`GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](../apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md)

---

## 5 dakikalık kontrol listesi

### A — Gölge süreklilik (anayasa)

```javascript
window.__rhizoh_shadow_continuity
window.__rhizoh_boot_validity_token
```

| Beklenen | Red flag |
|----------|----------|
| `bootValidityTokenCreated: false` | `true` |
| `state: "SOFT_INIT"`, `walTick: 0` | token set |
| `__rhizoh_boot_validity_token` **yok** | herhangi bir string |

### B — Registry (opsiyonel Firestore sonra)

```javascript
window.__rhizoh.satelliteRegistry.nodes()
window.__rhizoh_node_id
```

Dinamik örnekler: Ankara → `node:ankara_satellite` · Kadıköy → `node:kadikoy_satellite` · Beşiktaş → `node:besiktas_satellite` · Barcelona → `node:barcelona_satellite` · İzmir → `node:izmir_satellite`

### C — Event bus (sim flag açıksa)

```javascript
window.__rhizoh.epistemicSimResearch.eventBus.status()
```

`enabled: true`, trace’de `readOnly: true` zarfalar.

### D — İmza (kutlamada gösterilen)

```javascript
window.__rhizoh_epistemic_compression_signature?.composedSignature
```

`epi_sig_<hex>` formatı.

### E — C kapalı

```javascript
window.__rhizoh_cross_node_resonance?.entanglementGuard?.entanglementCouplingAllowed
```

→ `false`

---

## Firebase / Firestore (domain sonrası)

Şimdilik çoğunlukla **client IDB** (`sovereign_shadow_onboarding_v0`). Domain + backend sync gelince:

- `castle_agent_identity` veya satellite registry mirror koleksiyonunu izle
- Dost `nodeId` + `epi_sig` ekran görüntüsünü arşivle (Build in Public)

---

## Dost başına kayıt (önerilen tablo)

| İsim | nodeId | epi_sig (kısa) | Tarih | Not |
|------|--------|----------------|-------|-----|
| Eren | | | | |
| Ceyda | | | | |
| Karden | | | | |
| Nisa | | | | kuramsal + anchor |

---

## Onlara göndereceğin tek mesaj (şablon)

> Çok yakında sana bir link atacağım. Haritayı kaydırıp şu an dünyada bulunduğun yeri, kendi evini veya kaleni bulup seçeceksin. **Kaleni mühürle** diyeceksin, ekranda o koordinata özel üretilen benzersiz imzan çıkacak. Gerisini bana bırak. Ekranda mühür parlayınca bana sadece **Bitti Kaptan!** yazman yeterli.

---

*Frozen core’a dokunulmadı — yalnızca izleme ve arşiv.*
