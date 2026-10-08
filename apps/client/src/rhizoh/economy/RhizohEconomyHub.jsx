import React, { useState, useEffect } from "react";
import { Coins, Heart, Cpu, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Layers } from "lucide-react";

export function RhizohEconomyHub() {
  const [summary, setSummary] = useState(null);
  const [ledgerEvents, setLedgerEvents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tier_id: "RHIZOH_SUPPORTER",
    intent_type: "MEMBERSHIP",
    compute_type: "",
    message: ""
  });
  const [submitMsg, setSubmitMsg] = useState(null);

  const fetchEconomyData = () => {
    fetch("/api/economy/summary")
      .then((r) => r.json())
      .then((d) => d.ok && setSummary(d))
      .catch(() => {});

    fetch("/api/economy/ledger")
      .then((r) => r.json())
      .then((d) => d.ok && setLedgerEvents(d.events || []))
      .catch(() => {});

    fetch("/api/economy/allocations")
      .then((r) => r.json())
      .then((d) => d.ok && setAllocations(d.allocations || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEconomyData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/economy/pledge-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitMsg({ ok: true, text: data.message });
        setFormData({ name: "", email: "", tier_id: "RHIZOH_SUPPORTER", intent_type: "MEMBERSHIP", compute_type: "", message: "" });
        fetchEconomyData();
      } else {
        setSubmitMsg({ ok: false, text: data.error || "Failed to submit pledge." });
      }
    } catch (err) {
      setSubmitMsg({ ok: false, text: err.message });
    }
  };

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <Coins className="w-4 h-4" />
          <span>PHASE 12 — SOVEREIGN ECONOMIC INFRASTRUCTURE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Support Rhizoh & Fuel Continuous Research
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Not a charity or cosmetic donate button. Rhizoh Economy is the metabolic loop turning community support and compute partnerships into empirical research, self-play tournaments, and verifiable engine evolution.
        </p>
      </div>

      {/* 2. Feedback loop banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-2">
        <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
          The Provenance Loop (P12-C)
        </div>
        <div className="text-xs font-mono text-slate-200 leading-relaxed">
          Sponsor / Member → Compute Credits → Research Experiment ID → Artifact SHA → Chronicle
        </div>
        <div className="text-xs text-slate-400">
          Axiom: Financial resources fund hardware, but have zero influence over game outcomes, engine moves, or promotion gates.
        </div>
      </div>

      {/* 3. Metrics Overview */}
      {summary && summary.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono text-slate-400">ECONOMIC EVENTS</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{summary.metrics.total_economic_events}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono text-emerald-400">VERIFIED SPONSORS</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{summary.metrics.verified_sponsors}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono text-sky-400">COMPUTE HOURS ALLOCATED</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{summary.metrics.total_compute_hours_allocated}h</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-mono text-purple-400">PLEDGE INTENTS</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{summary.metrics.pledge_intents_registered}</div>
          </div>
        </div>
      )}

      {/* 4. Membership Tiers (P12-A) */}
      <div className="space-y-4">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
          MEMBERSHIP TIERS (P12-A ECONOMIC IDENTITY)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summary?.membership_tiers?.map((tier) => (
            <div key={tier.tier_id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-mono text-emerald-400 font-bold mb-1">{tier.tier_id}</div>
                <h3 className="text-lg font-bold text-slate-100">{tier.name}</h3>
                <div className="text-2xl font-extrabold text-white my-3">
                  {tier.monthly_usd ? `$${tier.monthly_usd}/mo` : "Custom Cluster"}
                </div>
                <p className="text-xs text-slate-400 mb-4">{tier.tagline}</p>
                <div className="space-y-2 mb-6">
                  {tier.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 mb-3 leading-tight">
                  <span className="text-amber-400">Guard:</span> {tier.epistemic_guard}
                </div>
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, tier_id: tier.tier_id }))}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors"
                >
                  Select Tier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Pledge Intent Form */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl space-y-6 max-w-2xl mx-auto">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Register Support or Compute Partnership</h3>
          <p className="text-xs text-slate-400 mt-1">
            Payment gateway integration is currently in staging. Registering your pledge intent seals your commitment into the Economic Ledger without upfront credit card processing.
          </p>
        </div>

        {submitMsg && (
          <div className={`p-4 rounded-xl text-xs font-mono border ${
            submitMsg.ok ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}>
            {submitMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1">Your Name / Organization</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. DeepMind Research Fellow / Alpha Labs"
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Email (Pseudonymously Hashed for Privacy)</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@domain.com"
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Contribution Type</label>
              <select
                value={formData.intent_type}
                onChange={(e) => setFormData({ ...formData, intent_type: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="MEMBERSHIP">Membership</option>
                <option value="COMPUTE_PARTNER">Compute Partner (GPU/CPU)</option>
                <option value="RESEARCH_SPONSOR">Research Sponsorship</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Target Tier</label>
              <select
                value={formData.tier_id}
                onChange={(e) => setFormData({ ...formData, tier_id: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="RHIZOH_SUPPORTER">Rhizoh Supporter ($5)</option>
                <option value="RHIZOH_PATRON">Rhizoh Patron ($20)</option>
                <option value="RESEARCH_PARTNER">Research Partner ($100)</option>
                <option value="COMPUTE_FOUNDER">Compute Founder (Custom)</option>
              </select>
            </div>
          </div>

          {formData.intent_type === "COMPUTE_PARTNER" && (
            <div>
              <label className="block text-slate-400 mb-1">Hardware / Cluster Specification</label>
              <input
                type="text"
                value={formData.compute_type}
                onChange={(e) => setFormData({ ...formData, compute_type: e.target.value })}
                placeholder="e.g. 8x RTX 4090 / 64-core EPYC / H100 SXM"
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Optional Note / Target Track</label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="e.g. Target my compute support toward the SPRT Search Ablation gauntlet"
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider transition-all shadow-lg shadow-emerald-500/20"
          >
            SEAL INTENT INTO ECONOMIC LEDGER
          </button>
        </form>
      </div>

      {/* 6. Economic Ledger Events (P12-B) */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
            P12-B ECONOMIC LEDGER (SHA-256 SEALED)
          </div>
          <span className="text-xs font-mono text-slate-400">Total Events: {ledgerEvents.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3">EVENT ID</th>
                <th className="pb-3">TYPE</th>
                <th className="pb-3">TIMESTAMP</th>
                <th className="pb-3">ACTOR HASH</th>
                <th className="pb-3">EVENT HASH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ledgerEvents.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500 font-mono text-xs">
                  Zero economic events in live ledger. All fixtures excluded. Awaiting genuine community pledge verification.
                </td>
              </tr>
            ) : ledgerEvents.map((ev) => (
                <tr key={ev.event_id} className="text-slate-300">
                  <td className="py-2.5 font-bold text-emerald-400">{ev.event_id}</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                      {ev.event_type}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 text-slate-400">{ev.actor_hash}</td>
                  <td className="py-2.5 text-slate-400 font-mono text-[11px]">{ev.event_hash?.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
