import React, { memo, useCallback, useEffect, useState } from "react";
import { getOrCreateCastleDevUid, getRhizohApiBase } from "../rhizoh/useRhizohGatewayMonitor.js";

/**
 * Compact LLM API key strip for tower workspaces — gateway-backed.
 */
export const RhizohTowerLlmConnectionsStripV0 = memo(function RhizohTowerLlmConnectionsStripV0({
  towerId = "tower",
  uiLocale = "en"
}) {
  const tr = uiLocale === "tr";
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${getRhizohApiBase()}/llm/connections`, { headers });
      const json = await res.json();
      if (json?.ok) setItems(Array.isArray(json.items) ? json.items : []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!apiKey.trim()) return;
    setStatus(tr ? "Kaydediliyor…" : "Saving…");
    try {
      const res = await fetch(`${getRhizohApiBase()}/llm/connections`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey.trim(),
          label: `${towerId}_workspace`,
          isDefault: items.length === 0
        })
      });
      const json = await res.json();
      if (json?.ok) {
        setItems(json.items || []);
        setApiKey("");
        setStatus(tr ? "Anahtar kaydedildi." : "Key saved.");
      } else {
        setStatus(json?.error || "error");
      }
    } catch {
      setStatus(tr ? "Hata" : "Error");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
        {tr ? "Tower API anahtarı" : "Tower API key"}
      </p>
      <p className="mt-1 text-[10px] text-white/50">
        {tr
          ? "Çıktılarınız şifreli bağlantı üzerinden gateway'e gider; arşive gönderebilirsiniz."
          : "Outputs route via encrypted gateway connection; send to your archive."}
      </p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-[10px] text-white/65">
          {items.slice(0, 4).map((row) => (
            <li key={row.id}>
              {row.provider} · {row.model}
              {row.isDefault ? (tr ? " · varsayılan" : " · default") : ""}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded border border-white/15 bg-black/50 px-2 py-1 text-[10px] text-white"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google</option>
          <option value="mistral">Mistral</option>
        </select>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="min-w-[100px] flex-1 rounded border border-white/15 bg-black/50 px-2 py-1 text-[10px] text-white"
          placeholder="model"
        />
      </div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={tr ? "API anahtarı" : "API key"}
        className="mt-2 w-full rounded border border-white/15 bg-black/50 px-2 py-1.5 text-[10px] text-white"
      />
      <button
        type="button"
        onClick={() => void onSave()}
        className="mt-2 rounded-lg border border-cyan-400/45 px-2 py-1 text-[10px] text-cyan-100"
      >
        {tr ? "Kaydet" : "Save"}
      </button>
      {status ? <p className="mt-1 text-[9px] text-white/45">{status}</p> : null}
    </div>
  );
});
