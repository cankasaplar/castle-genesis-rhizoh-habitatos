/**
 * L9 Event Mesh · City Mind — sosyal taslakları UI kuyruğuna iletir.
 * @param {object} detail
 * @param {string} detail.trigger - swarm_nexus | spiral_geometry | academy_master | pet_guardian
 * @param {string} detail.agent
 * @param {string} detail.platform
 * @param {string} detail.text
 * @param {number} [detail.agentIdx]
 * @param {number} [detail.lat]
 * @param {number} [detail.lon]
 * @param {number[]} [detail.heatPulse]
 * @param {string[]} [detail.thoughtChain]
 */
export const CASTLE_L9_SOCIAL_EVENT = "castle-l9-social-draft";

/**
 * Dışarıdan çağrılmamalı — yalnızca L9 Event Bus V2 (execution gate sonrası).
 */
export function dispatchL9SocialDraftToWindow(detail) {
  if (typeof window === "undefined") return;
  const id = detail.id || `l9-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  window.dispatchEvent(
    new CustomEvent(CASTLE_L9_SOCIAL_EVENT, {
      detail: {
        time: "şimdi",
        ...detail,
        id,
        l9Execution: { gated: true, at: Date.now() }
      }
    })
  );
}

export function buildThoughtChainL8V1(input = {}) {
  const threat = Number(input.threat ?? input.threatLevel ?? 0.35);
  const district = Number(input.districtEnergy ?? 0.55);
  const swarm = Number(input.swarmLevel ?? 0.4);
  const mem = Number(input.memoryEcho ?? 0.3);
  const lines = [];
  lines.push(`Tehdit düzlemi · ${(threat * 100).toFixed(0)}% — L8 City Mind bu bölgede anomali eşiğini yeniden ölçtü.`);
  lines.push(`İlçe enerjisi · ${(district * 100).toFixed(0)}% — kale omurgası ve akademi hattı aynı sinüs üzerinde kilitlendi.`);
  lines.push(`Sürü alanı · ${(swarm * 100).toFixed(0)}% — çoklu ajan yörüngeleri Event Mesh (L9) üzerinde birleşti.`);
  lines.push(`Hafıza yankısı · ${(mem * 100).toFixed(0)}% — CODEX kısa süreli önbellek kararını destekledi.`);
  lines.push("Sonuç: dış yayın metni, bu dört sinyalin birleşik eşiği aşıldığında üretildi.");
  return lines;
}

export function buildPulseSeriesFromSeed(seed, len = 14) {
  let s = Math.max(1, Math.floor(Number(seed) || 1));
  const out = [];
  for (let i = 0; i < len; i++) {
    s = (s * 1103515245 + 12345) % 2147483647;
    out.push(18 + (s % 74));
  }
  return out;
}
