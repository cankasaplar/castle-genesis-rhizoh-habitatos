import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createChessArenaGameV0, pickChessArenaAiMoveV0 } from "../chessArenaEngineV0.js";
import {
  CHESS_STOCKFISH_ASSET_PATHS_V0,
  CHESS_STOCKFISH_SINGLE_PIPELINE_V0,
  CHESS_STOCKFISH_SPAWN_POLICY_V0,
  deliverChessStockfishUciCommandV0,
  disposeChessStockfishEngineV0,
  getChessStockfishEngineDetailV0,
  getChessStockfishEngineStatusV0,
  invokeStockfishFactoryV0,
  resetChessStockfishEngineV0,
  resolveChessStockfishEffectiveSpawnPolicyV0,
  withChessStockfishEngineLockV0
} from "../chessStockfishEngineV0.js";

describe("chessStockfishEngineV0", () => {
  it("exposes stable chess-engine asset paths", () => {
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs).toBe("/chess-engine/stockfish-nnue-16-single.js");
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm).toBe("/chess-engine/stockfish-nnue-16-single.wasm");
  });

  it("uses a single isolated main-thread pipeline without worker fallbacks", () => {
    disposeChessStockfishEngineV0();
    expect(CHESS_STOCKFISH_SPAWN_POLICY_V0).toBe("wasm_single_thread_isolated");
    expect(CHESS_STOCKFISH_SINGLE_PIPELINE_V0).toBe("wasm_single_thread_isolated");
    expect(resolveChessStockfishEffectiveSpawnPolicyV0()).toBe("wasm_single_thread_isolated");
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.spawnPolicy).toBe("wasm_single_thread_isolated");
    expect(detail.workerStrategy).toBe("main_thread_isolated");
    expect(detail.singlePipeline).toBe(true);
    expect(detail.fallbackDisabled).toBe(true);
    expect(detail.hashWorkersDisabled).toBe(true);
    expect(detail.spawnStrategies).toEqual(["wasm_single_thread_isolated"]);
    expect(detail.deploymentLayer.workerFallbackDisabled).toBe(true);
  });

  it("deliverChessStockfishUciCommandV0 prefers onCustomMessage for single-thread WASM", () => {
    const received = [];
    const bridge = {
      postMessage() {
        /* single-thread bundle: no-op without PThread */
      },
      onCustomMessage(cmd) {
        received.push(cmd);
      }
    };
    expect(deliverChessStockfishUciCommandV0(bridge, "uci")).toBe("onCustomMessage");
    expect(received).toEqual(["uci"]);
  });

  it("withChessStockfishEngineLockV0 allows nested acquire without deadlock", async () => {
    const out = await Promise.race([
      withChessStockfishEngineLockV0(() =>
        withChessStockfishEngineLockV0(async () => "nested_ok")
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error("deadlock")), 400))
    ]);
    expect(out).toBe("nested_ok");
  });

  it("invokeStockfishFactoryV0 requires outer()(opts) call shape", async () => {
    const outer = () => (opts) =>
      Promise.resolve({
        opts,
        addMessageListener() {},
        postMessage() {}
      });
    const engine = await invokeStockfishFactoryV0(outer, { wasmBinary: new Uint8Array([0]) });
    expect(engine.opts.wasmBinary).toBeInstanceOf(Uint8Array);
    await expect(invokeStockfishFactoryV0(() => 1, {})).rejects.toThrow("stockfish_factory_inner_missing");
    await expect(invokeStockfishFactoryV0(() => () => null, {})).rejects.toThrow("stockfish_factory_not_promise");
  });

  it("starts in not_started and can reset after dispose", () => {
    disposeChessStockfishEngineV0();
    expect(getChessStockfishEngineStatusV0()).toBe("not_started");
    resetChessStockfishEngineV0();
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.status).toBe("not_started");
    expect(detail.wasmPath).toContain(".wasm");
  });

  it("stockfish worker source supports manual-init patch", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const stockfishPath = join(here, "../../../../public/chess-engine/stockfish-nnue-16-single.js");
    const jsSource = readFileSync(stockfishPath, "utf8");
    const autoGate =
      '"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]';
    const onmessageGate =
      '"undefined"!=typeof onmessage&&("undefined"==typeof window||void 0===window.document)';
    const autoTail =
      '):"object"==typeof document&&document.currentScript?document.currentScript._exports=i():i())';
    expect(jsSource).toContain(autoGate);
    expect(jsSource).toContain(onmessageGate);
    expect(jsSource).toContain(autoTail);
    const patched = jsSource
      .split(autoGate)
      .join('false&&"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]')
      .split(onmessageGate)
      .join('false&&"undefined"!=typeof onmessage&&("undefined"==typeof window||void 0===window.document)')
      .split(autoTail)
      .join(
        '):"object"==typeof document&&document.currentScript?(typeof self!=="undefined"?self.__SF_STOCKFISH_FACTORY__=i:0):(typeof self!=="undefined"?self.__SF_STOCKFISH_FACTORY__=i:0))'
      );
    expect(patched).toContain("__SF_STOCKFISH_FACTORY__");
    expect(patched).not.toContain("document.currentScript._exports=i()");
  });
});

describe("pickChessArenaAiMoveV0 deterministic fallback", () => {
  it("returns the same move for the same position", () => {
    const game = createChessArenaGameV0();
    const first = game.legalMoves()[0]?.san;
    expect(first).toBeTruthy();
    const repeat = createChessArenaGameV0();
    expect(pickChessArenaAiMoveV0(game)).toBe(pickChessArenaAiMoveV0(repeat));
  });
});
