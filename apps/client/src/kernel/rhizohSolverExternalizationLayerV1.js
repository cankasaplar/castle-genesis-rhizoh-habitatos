/**
 * RHIZOH Solver Externalization Layer v1
 * — SMT eklenti yüzeyi, kanıt doğrulayıcı adaptörü, kanonik eşdeğerlik köprüsü, dış truth protokolü.
 *
 * Varsayılan: hiçbir çözücü bağlı değil; çağrılar güvenli şekilde "plugin yok" döner.
 */

import { buildEpistemicSmtIrV1 } from "./rhizohEpistemicKernelV1.js";
import { provePass45FinalizeCanonicalEquivalence } from "./rhizohCanonicalEquivalence.js";
import {
  encodeExternalTruthCertRequestV1,
  parseExternalTruthCertResponseV1,
  buildExternalTruthCertProtocolSurface,
  EXTERNAL_TRUTH_CERT_MESSAGE_KIND,
  RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION
} from "./rhizohExternalTruthCertProtocolV1.js";

export const RHIZOH_SOLVER_EXTERNALIZATION_LAYER_VERSION = "v1";

/** @typedef {import("./rhizohEpistemicKernelV1.js").buildEpistemicSmtIrV1} SmtIrBuilder */

/**
 * SMT eklenti sözleşmesi v1.
 * @typedef {object} RhizohSmtSolverPluginV1
 * @property {string} pluginId
 * @property {string} backendKind — örn. z3_wasm | z3_server | cvc5 | mock
 * @property {(ir: object) => Promise<{ status: "sat" | "unsat" | "unknown", model?: object, diagnostics?: string }>} checkSat
 */

let _smtPlugin = /** @type {RhizohSmtSolverPluginV1 | null} */ (null);

export function assertValidSmtSolverPluginV1(plugin) {
  if (!plugin || typeof plugin !== "object") throw new Error("rhizohSmtPlugin: invalid plugin object");
  if (!plugin.pluginId || typeof plugin.pluginId !== "string") throw new Error("rhizohSmtPlugin: pluginId required");
  if (!plugin.backendKind || typeof plugin.backendKind !== "string") throw new Error("rhizohSmtPlugin: backendKind required");
  if (typeof plugin.checkSat !== "function") throw new Error("rhizohSmtPlugin: checkSat(ir) required");
}

/**
 * @param {RhizohSmtSolverPluginV1} plugin
 */
export function registerRhizohSmtSolverPlugin(plugin) {
  assertValidSmtSolverPluginV1(plugin);
  _smtPlugin = plugin;
}

export function clearRhizohSmtSolverPlugin() {
  _smtPlugin = null;
}

/** Geliştirme / test: gerçek çözücü yokken pipeline duman testi. */
export function createMockRhizohSmtSolverPlugin(pluginId = "mock_sat_v1") {
  return Object.freeze({
    pluginId,
    backendKind: "mock",
    async checkSat() {
      return Object.freeze({ status: /** @type {const} */ ("sat"), diagnostics: "mock_solver_no_soundness" });
    }
  });
}

export function getRhizohSmtSolverPlugin() {
  return _smtPlugin;
}

/**
 * @param {object} smtIr — buildEpistemicSmtIrV1 çıktısı veya uyumlu
 */
export async function runRhizohSmtCheckViaPlugin(smtIr) {
  const p = _smtPlugin;
  if (!p) {
    return Object.freeze({
      ok: false,
      reason: "no_solver_plugin_registered",
      status: "unavailable"
    });
  }
  try {
    const out = await p.checkSat(smtIr);
    return Object.freeze({
      ok: true,
      pluginId: p.pluginId,
      backendKind: p.backendKind,
      status: out?.status ?? "unknown",
      model: out?.model ?? null,
      diagnostics: out?.diagnostics ?? null
    });
  } catch (e) {
    return Object.freeze({
      ok: false,
      reason: "solver_plugin_threw",
      error: e
    });
  }
}

/**
 * Kanıt doğrulayıcı adaptörü — dış sertifika / imza doğrulaması için kanca (gövde stub).
 * @param {{ verifyCertificate?: (cert: object) => Promise<{ verified: boolean, reason?: string }> }} [hooks]
 */
export function createRhizohProofVerifierAdapter(hooks = {}) {
  const verifyCertificate = hooks.verifyCertificate;

  return {
    /**
     * @param {object} witness — frame meta.proofWitness veya dış yanıt
     */
    async verifyWitness(witness) {
      if (!witness || typeof witness !== "object") {
        return Object.freeze({ verified: false, reason: "missing_witness" });
      }
      if (witness.externalCertificate && typeof verifyCertificate === "function") {
        return verifyCertificate(witness.externalCertificate);
      }
      if (witness.obligationsSatisfied === true && witness.layerVersion === "v1" && witness.source === "external_verifier") {
        return Object.freeze({ verified: true, reason: "trusted_external_flag_stub" });
      }
      return Object.freeze({
        verified: false,
        reason: "verifier_adapter_stub_no_certificate_backend"
      });
    }
  };
}

/**
 * Yerel kanonik eşdeğerlik + isteğe bağlı SMT IR üretimi + isteğe bağlı plugin çağrısı.
 * @param {{
 *   gpuReadbackBytes: Uint8Array,
 *   maxParticleCountInCell: number,
 *   uniqueCellCount: number,
 *   bridgePayload?: object
 * }} inputs
 * @param {{ invokeSolver?: boolean }} [opts]
 */
export async function bridgeCanonicalEquivalenceToSolverLayer(inputs, opts = {}) {
  const local = provePass45FinalizeCanonicalEquivalence({
    gpuReadbackBytes: inputs.gpuReadbackBytes,
    maxParticleCountInCell: inputs.maxParticleCountInCell,
    uniqueCellCount: inputs.uniqueCellCount
  });
  const smtIr = buildEpistemicSmtIrV1(inputs.bridgePayload ?? {});
  let solverResult = null;
  if (opts.invokeSolver) {
    solverResult = await runRhizohSmtCheckViaPlugin(smtIr);
  }
  return Object.freeze({
    layerVersion: RHIZOH_SOLVER_EXTERNALIZATION_LAYER_VERSION,
    localCanonicalProof: local,
    smtIntermediateRepresentation: smtIr,
    solverInvocation: opts.invokeSolver ? solverResult : Object.freeze({ skipped: true }),
    note: "solver_result_does_not_replace_local_witness_without_policy_merge"
  });
}

/**
 * Dış truth sertifikasyon isteği üret (gönderim host’a ait).
 */
export function proposeExternalTruthCertificationV1(parts) {
  const req = encodeExternalTruthCertRequestV1(parts);
  return Object.freeze({
    protocolVersion: RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION,
    request: req,
    responseParser: "parseExternalTruthCertResponseV1"
  });
}

export function ingestExternalTruthCertResponseV1(raw) {
  return parseExternalTruthCertResponseV1(raw);
}

/**
 * Köprü özet yüzeyi — warmSwarmGpu / manifest.
 * @param {object} [bridgePayload]
 */
export function buildSolverExternalizationLayerPayload(bridgePayload = {}) {
  const plugin = getRhizohSmtSolverPlugin();
  const verifier = createRhizohProofVerifierAdapter();
  return Object.freeze({
    layerVersion: RHIZOH_SOLVER_EXTERNALIZATION_LAYER_VERSION,
    smtSolverPlugin: Object.freeze({
      registered: !!plugin,
      pluginId: plugin?.pluginId ?? null,
      backendKind: plugin?.backendKind ?? null
    }),
    proofVerifierAdapter: Object.freeze({
      kind: "rhizohProofVerifierAdapter_v1_stub",
      verifyWitness: "async (witness) => ..."
    }),
    canonicalEquivalenceBridge: Object.freeze({
      entrypoint: "bridgeCanonicalEquivalenceToSolverLayer",
      localModule: "rhizohCanonicalEquivalence.js"
    }),
    externalTruthCertificationProtocol: buildExternalTruthCertProtocolSurface(),
    externalProofNetworkCrossRef: "rhizohExternalProofNetworkV1",
    criticalHonestyCrossRef: "fieldTruthV529.criticalSolverAndProofRealityV529",
    bridgePayloadRef: bridgePayload?.snapshotId ?? null
  });
}

export {
  EXTERNAL_TRUTH_CERT_MESSAGE_KIND,
  RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION,
  encodeExternalTruthCertRequestV1,
  parseExternalTruthCertResponseV1
};
