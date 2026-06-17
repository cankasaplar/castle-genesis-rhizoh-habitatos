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
      "xfer_wasm_compiled_module",
      "blob_js_wasm_blob",
      "blob_js_wasm_hash",
      "wasm_binary_inline"
    ]);
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
      'e={instantiateWasm:function(im,rcv){var m=self.__SF_WASM_MODULE__;if(!m)throw new Error("sf_wasm_module_missing");WebAssembly.instantiate(m,im).then(function(r){rcv(r.instance,r.module)});return{}},locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},(self.__SF_WAIT_MODULE__?self.__SF_WAIT_MODULE__():Promise.resolve()).then(function(){return i()(e)}).then'
    );
    expect(patched).not.toBe(jsSource);
    expect(patched).toContain("__SF_WASM_MODULE__");
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
