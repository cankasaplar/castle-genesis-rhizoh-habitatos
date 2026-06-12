/**
 * presenceMeshWalIngressV0
 * Fix: strict typing + geometryAuthority guaranteed
 */

export type PresenceMeshWalIngressInput = {
  meshId: string;
};

export type PresenceMeshWalIngressResult = {
  ok: boolean;
  geometryAuthority: {
    meshId: string;
    sealed: boolean;
    version: number;
    timestamp: number;
  };
};

export function ingestPresenceMeshWalV0(
  input: PresenceMeshWalIngressInput
): PresenceMeshWalIngressResult {
  const meshId = input?.meshId ?? "unknown";

  return {
    ok: true,
    geometryAuthority: {
      meshId,
      sealed: true,
      version: 1,
      timestamp: Date.now()
    }
  };
}
