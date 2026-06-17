import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createChessArenaGameV0, pickChessArenaAiMoveV0 } from "../chessArenaEngineV0.js";
import {
  CHESS_STOCKFISH_ASSET_PATHS_V0,
  CHESS_STOCKFISH_SPAWN_POLICY_V0,
  disposeChessStockfishEngineV0,
  getChessStockfishEngineDetailV0,
  getChessStockfishEngineStatusV0,
  invokeStockfishFactoryV0,
  resetChessStockfishEngineV0,
  resolveChessStockfishEffectiveSpawnPolicyV0
} from "../chessStockfishEngineV0.js";

describe("chessStockfishEngineV0", () => {
  it("exposes stable chess-engine asset paths", () => {
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs).toBe("/chess-engine/stockfish-nnue-16-single.js");
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm).toBe("/chess-engine/stockfish-nnue-16-single.wasm");
  });

  it("uses blob wasm-hash primary spawn with inline fallback", () => {
    disposeChessStockfishEngineV0();
    expect(CHESS_STOCKFISH_SPAWN_POLICY_V0).toBe("wasm_binary_inline");
    expect(resolveChessStockfishEffectiveSpawnPolicyV0()).toBe("wasm_binary_inline");
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.spawnPolicy).toBe("wasm_binary_inline");
    expect(detail.workerStrategy).toBe("blob");
    expect(detail.hashWorkersDisabled).toBe(true);
    expect(detail.spawnStrategies).toEqual([
      "main_thread_wasm_binary",
      "xfer_wasm_bytes_deferred_import",
      "xfer_wasm_compiled_module",
      "blob_js_wasm_blob",
      "blob_js_wasm_hash",
      "wasm_binary_inline"
    ]);
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

  it("stockfish worker source supports xfer wasm patch", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const stockfishPath = join(here, "../../../../public/chess-engine/stockfish-nnue-16-single.js");
    const jsSource = readFileSync(stockfishPath, "utf8");
    const patchRe =
      /e=\{locateFile:function\(e\)\{return-1<e\.indexOf\("\.wasm"\)\?r:self\.location\.origin\+self\.location\.pathname\+"#"\+r\+",worker"\}\},i\(\)\(e\)\.then/;
    expect(patchRe.test(jsSource)).toBe(true);
    const patched = jsSource.replace(
      patchRe,
      'e={instantiateWasm:function(im,rcv){var m=self.__SF_WASM_MODULE__;if(!m)throw new Error("sf_wasm_module_missing");WebAssembly.instantiate(m,im).then(function(r){rcv(r.instance,r.module)}).catch(function(err){throw err;});return{}},locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},(self.__SF_WAIT_MODULE__?self.__SF_WAIT_MODULE__():Promise.resolve()).then(function(){return i()(e)}).then'
    );
    expect(patched).not.toBe(jsSource);
    expect(patched).toContain("__SF_WASM_MODULE__");
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
    expect(patched).toContain('false&&"undefined"!=typeof self');
    expect(patched).toContain('false&&"undefined"!=typeof onmessage');
    expect(patched).not.toContain("document.currentScript._exports=i()");
  });

  it("stockfish worker source supports wasm bytes deferred patch", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const stockfishPath = join(here, "../../../../public/chess-engine/stockfish-nnue-16-single.js");
    const jsSource = readFileSync(stockfishPath, "utf8");
    const patchRe =
      /e=\{locateFile:function\(e\)\{return-1<e\.indexOf\("\.wasm"\)\?r:self\.location\.origin\+self\.location\.pathname\+"#"\+r\+",worker"\}\},i\(\)\(e\)\.then/;
    const patched = jsSource.replace(
      patchRe,
      'e={wasmBinary:self.__SF_WASM_BYTES__,locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},i()(e).then'
    );
    expect(patched).toContain("__SF_WASM_BYTES__");
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
