export function prepareRhizohLlmTurnV0(input?: {
  message?: string;
  text?: string;
  speakInstantAck?: boolean;
  voiceTurn?: boolean;
  sourcePath?: string;
  confidence?: number;
  source?: string;
}): {
  turn: Record<string, unknown>;
  [key: string]: unknown;
};

export function buildRhizohLlmContextPatchFromPrepV0(
  prep: ReturnType<typeof prepareRhizohLlmTurnV0>
): Record<string, unknown>;
