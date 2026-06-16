"use client";
import { useEffect, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function getLeads(filters?: { tier?: string; min_score?: number }) {
  const params = new URLSearchParams();
  if (filters?.tier) params.set("tier", filters.tier);
  if (filters?.min_score) params.set("min_score", String(filters.min_score));
  const res = await fetch(`${BASE}/api/leads?${params}`);
  return res.json();
}

async function getStats() {
  const res = await fetch(`${BASE}/api/stats`);
  return res.json();
}

async function runPipeline() {
  const res = await fetch(`${BASE}/api/pipeline/run`, { method: "POST" });
  return res.json();
}

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tier, setTier] = useState("");

  const load = async (t?: string) => {
    setLoading(true);
    const data = await getLeads({ tier: t ?? tier });
    setLeads(Array.isArray(data) ? data : []);
    const s = await getStats();
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRun = async () => {
    setRunning(true);
    await runPipeline();
    await load();
    setRunning(false);
  };

  const tierColor = (t: string) =>
    t === "hot" ? "bg-red-100 text-red-700" :
    t === "warm" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-500";

  const signalColor = (s: string) =>
    s === "hiring" ? "bg-blue-100 text-blue-700" :
    s === "funding" ? "bg-green-100 text-green-700" :
    "bg-purple-100 text-purple-700";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lead Intelligence</h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered intent signals from the web</p>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {running ? "Scanning..." : "Run Pipeline"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total leads", value: stats.total ?? 0, color: "text-gray-900" },
            { label: "Hot", value: stats.hot ?? 0, color: "text-red-600" },
            { label: "Warm", value: stats.warm ?? 0, color: "text-amber-600" },
            { label: "Cold", value: stats.cold ?? 0, color: "text-gray-400" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3 mb-4">
          {["", "hot", "warm", "cold"].map(t => (
            <button
              key={t}
              onClick={() => { setTier(t); load(t); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                tier === t
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Company", "Industry", "Stage", "Signal", "Score", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-300">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-300">No leads yet. Run the pipeline.</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(lead)}>
                  <td className="px-4 py-3 font-medium text-gray-900">{lead.company_name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{lead.industry ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{lead.stage ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${signalColor(lead.signal_type)}`}>
                      {lead.signal_type?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColor(lead.score_tier)}`}>
                      {lead.intent_score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-indigo-500 text-xs">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selected.company_name}</h2>
                  {selected.website && (
                    <a href={`https://${selected.website}`} target="_blank" className="text-xs text-indigo-500 hover:underline">
                      {selected.website}
                    </a>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierColor(selected.score_tier)}`}>
                  {selected.intent_score}/100
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Industry", value: selected.industry },
                  { label: "Stage", value: selected.stage },
                  { label: "Signal", value: selected.signal_type?.replace("_", " ") },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-sm text-gray-700 font-medium">{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 mb-3">
                <p className="text-xs text-indigo-400 uppercase tracking-wide mb-1">AI reasoning</p>
                <p className="text-sm text-indigo-900">{selected.reasoning}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mb-3">
                <p className="text-xs text-green-500 uppercase tracking-wide mb-1">Recommended approach</p>
                <p className="text-sm text-green-900">{selected.recommended_approach}</p>
              </div>

              {selected.source_url && (
                <a href={selected.source_url} target="_blank" className="text-xs text-indigo-400 hover:underline">
                  View original source →
                </a>
              )}

              <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}