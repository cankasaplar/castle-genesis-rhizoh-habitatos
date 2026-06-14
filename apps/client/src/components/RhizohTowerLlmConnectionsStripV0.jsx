import React, { memo, useCallback, useEffect, useState } from "react";
import { getOrCreateCastleDevUid, getRhizohApiBase } from "../rhizoh/useRhizohGatewayMonitor.js";

const TOWER_DEFAULT_PROVIDER_V0 = Object.freeze({
  gemini_tower: { provider: "gemini", model: "gemini-2.0-flash" },
  chatgpt_tower: { provider: "openai", model: "gpt-4o-mini" },
  tower: { provider: "openai", model: "gpt-4o-mini" }
});

/**
 * Compact LLM connection strip for tower workspaces.
 * Production: platform keys on Render only — no client key entry (security).
 * Dev: optional BYOK for local gateway testing.
 */
export const RhizohTowerLlmConnectionsStripV0 = memo(function RhizohTowerLlmConnectionsStripV0({
  towerId = "tower",
  uiLocale = "en",
  allowUserKeys = import.meta.env.DEV
}) {
  const tr = uiLocale === "tr";
  const defaults = TOWER_DEFAULT_PROVIDER_V0[towerId] || TOWER_DEFAULT_PROVIDER_V0.tower;
  const [items, setItems] = useState([]);
  const [provider, setProvider] = useState(defaults.provider);
  const [model, setModel] = useState(defaults.model);
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };

  const load = useCallback(async () => {
    if (!allowUserKeys) return;
    try {
      const res = await fetch(`${getRhizohApiBase()}/llm/connections`, { headers });
      const json = await res.json();
      if (json?.ok) {
        const rows = Array.isArray(json.items) ? json.items : [];
        const scoped = rows.filter((row) => {
          const label = String(row?.label || "");
          return !label || label.startsWith(`${towerId}_`);
        });
        setItems(scoped.length ? scoped : rows.slice(0, 4));
      }
    } catch {
      /* noop */
    }
  }, [allowUserKeys, towerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!allowUserKeys || !apiKey.trim()) return;
    setStatus(tr ? "Kaydediliyor…" : "Saving…");
    try {
      const res = await fetch(`${getRhizohApiBase()}/llm/connections`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          provider: provider === "google" ? "gemini" : provider,
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

  if (!allowUserKeys) {
    return (
      <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
          {tr ? "Tower LLM" : "Tower LLM"}
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-white/55">
          {tr
            ? "Üretimde LLM anahtarları yalnızca Render gateway üzerinde tutulur; tarayıcıya veya arayüze yazılmaz. Sohbet ve üretim istekleri şifreli gateway üzerinden gider."
            : "In production, LLM keys live only on the Render gateway — never in the browser or UI. Chat and generation requests route through the encrypted gateway."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
        {tr ? "Tower API anahtarı (dev)" : "Tower API key (dev)"}
      </p>
      <p className="mt-1 text-[10px] text-white/50">
        {tr
          ? "Yalnızca yerel geliştirme — üretimde anahtarlar Render'da kalır."
          : "Local development only — production keys stay on Render."}
      </p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-[10px] text-white/65">
          {items.slice(0, 4).map((row) => (
            <li key={row.id}>
              {row.provider} · {row.model}
              {row.keyMask ? ` · ${row.keyMask}` : ""}
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
          <option value="gemini">Gemini</option>
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
