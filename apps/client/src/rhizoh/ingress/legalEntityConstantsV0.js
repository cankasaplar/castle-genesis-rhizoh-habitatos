/**
 * Legal entity SSOT for ingress copy — docs/legal/RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md
 */
export const LEGAL_ENTITY_V0 = Object.freeze({
  controllerName: "Can Kasaplar",
  country: "Türkiye",
  postalAddressLine1: "Serencebey Yokuşu Sokak No: 13/2",
  postalAddressLine2: "Beşiktaş, 34357 İstanbul",
  kvkkEmail: "cankasaplar@gmail.com",
  legalEmail: "cankasaplar@gmail.com",
  contactEmail: "cankasaplar@gmail.com",
  webPrimary: "https://rhizoh.com",
  webGenesis: "https://castle-genesis.com",
  webApp: "https://app.castle-genesis.com",
  effectiveDateTr: "19.05.2026",
  /** Planlanan domain posta — henüz operasyonel mühür değil */
  plannedDomainKvkk: "kvkk@rhizoh.com",
  plannedDomainLegal: "legal@rhizoh.com"
});

export function formatPostalAddressV0() {
  const e = LEGAL_ENTITY_V0;
  return `${e.postalAddressLine1}, ${e.postalAddressLine2}, ${e.country}`;
}

export function formatDataControllerLineV0() {
  const e = LEGAL_ENTITY_V0;
  return `Veri sorumlusu: ${e.controllerName} · ${formatPostalAddressV0()} · KVKK: ${e.kvkkEmail}`;
}
