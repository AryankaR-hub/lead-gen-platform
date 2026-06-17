"use client";
import { useEffect, useState } from "react";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function getLeads(filters?: { tier?: string }) {
  const params = new URLSearchParams();
  if (filters?.tier) params.set("tier", filters.tier);
  const res = await fetch(BASE + "/api/leads?" + params.toString());
  return res.json();
}

async function getStats() {
  const res = await fetch(BASE + "/api/stats");
  return res.json();
}

async function runPipeline() {
  const res = await fetch(BASE + "/api/pipeline/run", { method: "POST" });
  return res.json();
}

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color =
    tier === "hot" ? "#f43f5e" :
    tier === "warm" ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{ position: "relative", width: 48, height: 48 }}>
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="3.5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color}
          strokeWidth="3.5" strokeDasharray={filled + " " + circ}
          strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: color
      }}>
        {score}
      </div>
    </div>
  );
}

const SIG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  hiring: { bg: "#eff6ff", color: "#3b82f6", border: "#bfdbfe", label: "Hiring" },
  funding: { bg: "#f0fdf4", color: "#22c55e", border: "#bbf7d0", label: "Funding" },
  growth_discussion: { bg: "#fdf4ff", color: "#a855f7", border: "#e9d5ff", label: "Growth" },
};

const TIER: Record<string, { dot: string; glow: string; row: string; badge: string; text: string; label: string }> = {
  hot:  { dot: "#f43f5e", glow: "rgba(244,63,94,0.25)",  row: "#fff5f7", badge: "#fff1f3", text: "#f43f5e", label: "Hot" },
  warm: { dot: "#f59e0b", glow: "rgba(245,158,11,0.25)", row: "#fffdf0", badge: "#fffbeb", text: "#f59e0b", label: "Warm" },
  cold: { dot: "#94a3b8", glow: "rgba(148,163,184,0.2)", row: "#fafafa", badge: "#f8fafc", text: "#94a3b8", label: "Cold" },
};

const DEFAULT_TIER = { dot: "#cbd5e1", glow: "rgba(203,213,225,0.2)", row: "#fafafa", badge: "#f8fafc", text: "#94a3b8", label: "—" };

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tier, setTier] = useState("");
  const [hovered, setHovered] = useState<number | null>(null);

  const load = async (t?: string) => {
    setLoading(true);
    const [data, s] = await Promise.all([
      getLeads({ tier: t !== undefined ? t : tier }),
      getStats(),
    ]);
    setLeads(Array.isArray(data) ? data : []);
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

  const sig = (type: string) => SIG[type] ?? { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0", label: type ?? "—" };
  const tr = (t: string) => TIER[t] ?? DEFAULT_TIER;

  const FILTERS = [
    { key: "", label: "All", color: "#6366f1" },
    { key: "hot", label: "Hot", color: "#f43f5e" },
    { key: "warm", label: "Warm", color: "#f59e0b" },
    { key: "cold", label: "Cold", color: "#94a3b8" },
  ];

  const STATS = [
    { label: "Total", value: stats.total ?? 0, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", bar: "#6366f1" },
    { label: "Hot", value: stats.hot ?? 0, color: "#f43f5e", bg: "#fff1f3", border: "#fda4af", bar: "#f43f5e" },
    { label: "Warm", value: stats.warm ?? 0, color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", bar: "#f59e0b" },
    { label: "Cold", value: stats.cold ?? 0, color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", bar: "#94a3b8" },
    { label: "Unclassified", value: stats.other ?? 0, color: "#cbd5e1", bg: "#f8fafc", border: "#e2e8f0", bar: "#cbd5e1" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes barGrow { from{width:0} to{width:var(--w)} }
        .skel{background:linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px;}
        .filter-pill{transition:all 0.15s ease;cursor:pointer;}
        .filter-pill:hover{transform:translateY(-1px);}
        .lead-row{transition:background 0.1s ease;}
        .view-btn{opacity:0;transition:opacity 0.15s;}
        .lead-row:hover .view-btn{opacity:1;}
      `}</style>

      {/* Navbar */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(99,102,241,0.4)" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b", letterSpacing: "-0.3px" }}>NexusLeads</span>
              <span style={{ marginLeft: 8, fontSize: 10, color: "#a5b4fc", background: "#eef2ff", padding: "2px 7px", borderRadius: 999, fontWeight: 700, letterSpacing: "0.05em" }}>BETA</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {running && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6366f1", fontSize: 13, fontWeight: 500 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", animation: "blink 1s infinite" }} />
                Scanning signals...
              </div>
            )}
            <button onClick={handleRun} disabled={running} style={{
              background: running ? "#e0e7ff" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: running ? "#6366f1" : "white",
              padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: "none", cursor: running ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: running ? "none" : "0 3px 12px rgba(99,102,241,0.4)",
              transition: "all 0.2s"
            }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                style={running ? { animation: "spin 1s linear infinite" } : {}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {running ? "Running..." : "Run Pipeline"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 32px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 36, animation: "fadeUp 0.4s ease" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>Lead Intelligence</h1>
          <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 6, margin: "6px 0 0" }}>
            Automatically discovers and scores companies by their likelihood to need outbound sales support
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 36 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 16, padding: "18px 20px",
              border: "1px solid " + s.border,
              animation: "fadeUp 0.4s ease", animationDelay: (i * 60) + "ms", animationFillMode: "both",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.bar }} />
                <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 10 }}>{s.value}</div>
              <div style={{ height: 3, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999, background: s.bar,
                  width: stats.total ? ((s.value / stats.total) * 100) + "%" : "0%",
                  transition: "width 0.8s ease"
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600, marginRight: 4 }}>Filter:</span>
          {FILTERS.map(f => {
            const active = tier === f.key;
            return (
              <button key={f.key} className="filter-pill"
                onClick={() => { setTier(f.key); load(f.key); }}
                style={{
                  padding: "6px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                  background: active ? f.color : "white",
                  color: active ? "white" : "#64748b",
                  border: active ? "none" : "1px solid #e2e8f0",
                  boxShadow: active ? "0 2px 10px " + f.color + "50" : "none",
                  cursor: "pointer"
                }}>
                {f.label}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#cbd5e1", fontWeight: 500 }}>
            {leads.length} companies
          </span>
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "2px solid #f1f5f9" }}>
                {["", "Company", "Industry", "Stage", "Signal", "Score", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(7)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "17px 17px 17px 22px", width: 36 }}>
                      <div className="skel" style={{ width: 9, height: 9, borderRadius: "50%" }} />
                    </td>
                    <td style={{ padding: "17px 16px" }}><div className="skel" style={{ height: 13, width: 130 }} /></td>
                    <td style={{ padding: "17px 16px" }}><div className="skel" style={{ height: 11, width: 170 }} /></td>
                    <td style={{ padding: "17px 16px" }}><div className="skel" style={{ height: 22, width: 75, borderRadius: 6 }} /></td>
                    <td style={{ padding: "17px 16px" }}><div className="skel" style={{ height: 22, width: 85, borderRadius: 999 }} /></td>
                    <td style={{ padding: "17px 16px" }}><div className="skel" style={{ width: 48, height: 48, borderRadius: "50%" }} /></td>
                    <td />
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "72px 16px" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No leads found</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>Click Run Pipeline to discover companies</div>
                  </td>
                </tr>
              ) : leads.map((lead, i) => {
                const s = sig(lead.signal_type);
                const t = tr(lead.score_tier);
                const isHov = hovered === lead.id;
                return (
                  <tr key={lead.id} className="lead-row"
                    onClick={() => setSelected(lead)}
                    onMouseEnter={() => setHovered(lead.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      borderBottom: "1px solid #f8fafc", cursor: "pointer",
                      background: isHov ? t.row : "white",
                      animation: "fadeUp 0.3s ease",
                      animationDelay: (i * 30) + "ms", animationFillMode: "both"
                    }}
                  >
                    <td style={{ padding: "17px 17px 17px 22px" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: t.dot, boxShadow: "0 0 8px " + t.glow }} />
                    </td>
                    <td style={{ padding: "17px 16px", fontWeight: 700, color: "#1e293b" }}>{lead.company_name}</td>
                    <td style={{ padding: "17px 16px", color: "#94a3b8", fontSize: 12, maxWidth: 220 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.industry ?? "—"}</div>
                    </td>
                    <td style={{ padding: "17px 16px" }}>
                      <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "#f8fafc", color: "#64748b", border: "1px solid #f1f5f9", fontWeight: 600 }}>
                        {lead.stage ?? "unknown"}
                      </span>
                    </td>
                    <td style={{ padding: "17px 16px" }}>
                      <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: s.bg, color: s.color, border: "1px solid " + s.border, fontWeight: 700 }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "17px 16px" }}>
                      <ScoreRing score={lead.intent_score} tier={lead.score_tier} />
                    </td>
                    <td style={{ padding: "17px 16px" }}>
                      <span className="view-btn" style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700, whiteSpace: "nowrap" }}>
                        View →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
          Powered by Hacker News · Gemini AI · PostgreSQL
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 24, padding: 28, maxWidth: 500, width: "100%", animation: "modalIn 0.22s ease", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tr(selected.score_tier).dot, boxShadow: "0 0 10px " + tr(selected.score_tier).glow }} />
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.4px" }}>{selected.company_name}</h2>
                </div>
                {selected.website && (
                  <a href={"https://" + selected.website} target="_blank" style={{ fontSize: 12, color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                    {selected.website} ↗
                  </a>
                )}
              </div>
              <ScoreRing score={selected.intent_score} tier={selected.score_tier} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {selected.industry && (
                <span style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                  {selected.industry}
                </span>
              )}
              {selected.stage && (
                <span style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                  {selected.stage}
                </span>
              )}
              {selected.signal_type && (
                <span style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: sig(selected.signal_type).bg, color: sig(selected.signal_type).color, border: "1px solid " + sig(selected.signal_type).border, fontWeight: 700 }}>
                  {sig(selected.signal_type).label}
                </span>
              )}
              <span style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, fontWeight: 700, background: tr(selected.score_tier).badge, color: tr(selected.score_tier).text, border: "1px solid " + tr(selected.score_tier).dot + "30" }}>
                {tr(selected.score_tier).label} lead
              </span>
            </div>

            {selected.signal_summary && (
              <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7, fontWeight: 700 }}>Signal Detected</div>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: 0 }}>{selected.signal_summary}</p>
              </div>
            )}

            {selected.reasoning && (
              <div style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)", borderRadius: 14, padding: "14px 16px", marginBottom: 12, border: "1px solid #c7d2fe" }}>
                <div style={{ fontSize: 10, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7, fontWeight: 700 }}>AI Reasoning</div>
                <p style={{ fontSize: 13, color: "#3730a3", lineHeight: 1.65, margin: 0 }}>{selected.reasoning}</p>
              </div>
            )}

            {selected.recommended_approach && (
              <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: 10, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7, fontWeight: 700 }}>Recommended Approach</div>
                <p style={{ fontSize: 13, color: "#14532d", lineHeight: 1.65, margin: 0 }}>{selected.recommended_approach}</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
              {selected.source_url ? (
                <a href={selected.source_url} target="_blank" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
                  View original source ↗
                </a>
              ) : <span />}
              <button onClick={() => setSelected(null)} style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 22px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
