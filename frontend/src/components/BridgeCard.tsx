import { Activity, AlertTriangle, CheckCircle, Fuel, Hash, Layers } from "lucide-react";

export interface BridgeCardData {
  bridge: string;
  address: string;
  tx_count: number;
  total_volume_eth: number;
  success_rate_pct: number;
  avg_gas_used: number;
  error_count: number;
}

interface Props {
  data: BridgeCardData;
  loading?: boolean;
}

const BRIDGE_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  "Across Protocol": { accent: "#5A7F9C", bg: "#eef4f8", border: "rgba(90,127,156,0.3)" },
  "Stargate ETH":    { accent: "#0e7490", bg: "#e8f6f9", border: "rgba(14,116,144,0.3)" },
};

const DEFAULT_COLOR = { accent: "#5A7F9C", bg: "#eef4f8", border: "rgba(90,127,156,0.3)" };

export function BridgeCard({ data, loading = false }: Props) {
  const colors = BRIDGE_COLORS[data.bridge] ?? DEFAULT_COLOR;
  const isHealthy = data.success_rate_pct >= 95;

  return (
    <div style={{
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      borderRadius: "16px",
      padding: "28px",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
      fontFamily: "'DM Mono', monospace",
    }}>
      {loading && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite", zIndex: 10,
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: colors.accent,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Layers size={22} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "18px", color: "#1e3a4a", letterSpacing: "-0.02em" }}>
            {data.bridge}
          </div>
          <div style={{ fontSize: "12px", color: colors.accent, marginTop: "3px", fontWeight: 500 }}>
            {data.address.slice(0, 10)}…{data.address.slice(-6)}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          {isHealthy
            ? <CheckCircle size={22} color="#16a34a" />
            : <AlertTriangle size={22} color="#d97706" />}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <StatBlock icon={<Activity size={15} color={colors.accent} />} label="Success Rate" value={`${data.success_rate_pct}%`} accent={colors.accent} highlight />
        <StatBlock icon={<Hash size={15} color={colors.accent} />}     label="TX Count"     value={data.tx_count.toLocaleString()} accent={colors.accent} />
        <StatBlock icon={<Layers size={15} color={colors.accent} />}   label="Volume"       value={`${data.total_volume_eth} ETH`} accent={colors.accent} />
        <StatBlock icon={<Fuel size={15} color={colors.accent} />}     label="Avg Gas"      value={data.avg_gas_used.toLocaleString()} accent={colors.accent} />
      </div>

      {data.error_count > 0 && (
        <div style={{
          marginTop: "16px", padding: "10px 14px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <AlertTriangle size={14} color="#dc2626" />
          <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 500 }}>
            {data.error_count} failed transactions detected
          </span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600;700&display=swap');
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

function StatBlock({ icon, label, value, accent, highlight = false }: {
  icon: React.ReactNode; label: string; value: string; accent: string; highlight?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
      border: `1px solid rgba(90,127,156,0.15)`,
      borderRadius: "12px", padding: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        {icon}
        <span style={{ fontSize: "12px", color: accent, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: highlight ? accent : "#1e3a4a", letterSpacing: "-0.03em" }}>
        {value}
      </div>
    </div>
  );
}