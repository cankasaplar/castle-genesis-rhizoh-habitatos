/**
 * Canlı closure bayrakları — gerçek yollar çalıştıkça güncellenir (test / telemetry).
 */

let _gpuClosureV1Live = false;
let _cpuDeterministicKernelVerified = false;
let _replaySealChainVerified = false;
let _driftKernelActive = false;
let _hardFirewallTierObserved = false;

export function resetRhizohClosureLiveFlags() {
  _gpuClosureV1Live = false;
  _cpuDeterministicKernelVerified = false;
  _replaySealChainVerified = false;
  _driftKernelActive = false;
  _hardFirewallTierObserved = false;
}

export function markRhizohGpuClosureV1Live(v = true) {
  _gpuClosureV1Live = !!v;
}

export function markRhizohCpuDeterministicKernelVerified(v = true) {
  _cpuDeterministicKernelVerified = !!v;
}

export function markRhizohReplaySealChainVerified(v = true) {
  _replaySealChainVerified = !!v;
}

export function markRhizohDriftKernelActive(v = true) {
  _driftKernelActive = !!v;
}

export function markRhizohHardFirewallObserved(v = true) {
  _hardFirewallTierObserved = !!v;
}

export function getRhizohLiveClosureFlags() {
  return Object.freeze({
    gpuClosure: _gpuClosureV1Live,
    cpuFallbackDeterministic: _cpuDeterministicKernelVerified,
    replaySealVerified: _replaySealChainVerified,
    driftKernelActive: _driftKernelActive,
    hardFirewallObserved: _hardFirewallTierObserved
  });
}
