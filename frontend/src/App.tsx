import { useState } from "react";
import { BridgeCard, type BridgeCardData } from "./components/BridgeCard";
import { MarkovChart, type MarkovData } from "./components/MarkovChart";

const API_URL = "http://localhost:8000";

const C = {
  bg:        "#e8f0f5",
  bgCard:    "#ffffff",
  bgHover:   "#d4e4ed",
  border:    "rgba(90,127,156,0.2)",
  accent:    "#5A7F9C",
  accentLit: "#3d6478",
  text:      "#1e3a4a",
  textMuted: "#5A7F9C",
  textDim:   "#9ab8ca",
};

export default function App() {
  const [bridgeData, setBridgeData] = useState<BridgeCardData | null>(null);
  const [markovData, setMarkovData] = useState<MarkovData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");

  async function analyze(bridge: string) {
    setSelected(bridge);
    setLoading(true);
    setError(null);
    setBridgeData(null);
    setMarkovData(null);
    try {
      const [summaryRes, markovRes] = await Promise.all([
        fetch(`${API_URL}/bridge/summary?name=${encodeURIComponent(bridge)}`),
        fetch(`${API_URL}/bridge/markov?name=${encodeURIComponent(bridge)}`),
      ]);
      const summary = await summaryRes.json();
      const markov = await markovRes.json();
      if (summary.error) throw new Error(summary.error);
      setBridgeData(summary);
      setMarkovData(markov);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Mono', monospace", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: ${C.bg}; }
      `}</style>

      {/* Top nav */}
      <header style={{
        padding: "16px 40px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: C.bgCard,
      }}>
        <div style={{
          width: "30px", height: "30px",
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLit})`,
          borderRadius: "8px",
        }} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: C.text, letterSpacing: "-0.02em" }}>
          Cross-Chain Bridge Analytics
        </span>
        <span style={{
          marginLeft: "auto", fontSize: "11px", color: C.textMuted,
          padding: "3px 12px",
          background: `rgba(90,127,156,0.12)`,
          borderRadius: "20px",
          border: `1px solid ${C.border}`,
        }}>
          Phase 1 · Live Data
        </span>
      </header>

      <main style={{ padding: "40px", maxWidth: "960px", margin: "0 auto" }}>
        {/* Title */}
        <h1 style={{ fontSize: "26px", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>
          Bridge Reliability Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: C.textMuted, marginTop: "8px", marginBottom: "32px" }}>
          Real-time Markov chain analysis · Powered by Etherscan API
        </p>

        {/* Bridge selector */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
          {["Across Protocol", "Stargate ETH"].map((bridge) => (
            <button
              key={bridge}
              onClick={() => analyze(bridge)}
              style={{
                padding: "10px 22px",
                borderRadius: "10px",
                border: selected === bridge
                  ? `1px solid ${C.accent}`
                  : `1px solid ${C.border}`,
                background: selected === bridge
                  ? `rgba(90,127,156,0.18)`
                  : C.bgCard,
                color: selected === bridge ? C.accentLit : C.textMuted,
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                fontWeight: selected === bridge ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {bridge}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            padding: "14px 18px",
            background: `rgba(90,127,156,0.08)`,
            border: `1px solid ${C.border}`,
            borderRadius: "10px",
            color: C.accentLit,
            fontSize: "13px",
            marginBottom: "20px",
          }}>
            Fetching on-chain data from Etherscan…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            color: "#f87171",
            fontSize: "13px",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!bridgeData && !loading && !error && (
          <div style={{
            padding: "48px",
            textAlign: "center",
            border: `1px dashed ${C.border}`,
            borderRadius: "14px",
            color: C.textDim,
            fontSize: "13px",
          }}>
            选择上方的 Bridge 开始分析
          </div>
        )}

        {/* Components */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {bridgeData && <BridgeCard data={bridgeData} loading={loading} />}
          {markovData && <MarkovChart data={markovData} />}
        </div>
      </main>
    </div>
  );
}