import { describe, expect, it, vi } from "vitest";
import { invokeRhizohCognitiveTurn } from "../runtime/rhizohCognitiveInvoke";
import { patchIdentity, resetRhizohStudioKernelStore } from "../store/studioStore";

describe("invokeRhizohCognitiveTurn", () => {
  it("parses gateway intents and runs turn (mock fetch)", async () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "ci-owner",
      actor: { id: "ci-owner", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "presence.*": true, "physics.*": true, "world.*": true },
      delegates: [],
      sharedOwnerIds: []
    });

    const fetchImpl = vi.fn(
      async (_url: string, init?: RequestInit) =>
        ({
          ok: true,
          json: async () => ({
            reply: "ok",
            directive: "NONE",
            intents: [
              {
                toolId: "noop",
                payload: {},
                confidence: 0.9,
                rationale: "test"
              }
            ]
          })
        }) as Response
    );

    const r = await invokeRhizohCognitiveTurn({
      userGoal: "hello",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      turnRunnerOpts: { maxIntentsPerTurn: 2 }
    });

    expect(fetchImpl).toHaveBeenCalled();
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(String(init?.body ?? "{}"));
    expect(body.context.cognitiveInvoke).toBe(true);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.assistantReply).toBe("ok");
      expect(r.intentsRaw.length).toBe(1);
      expect(r.turn.attempted).toBe(1);
      expect(r.turn.committed).toBe(0);
    }
  });
});
