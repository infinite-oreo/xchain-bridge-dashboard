import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from "recharts";

export interface MarkovData {
  bridge: string;
  states: string[];
  state_sequence: string[];
  transition_matrix: Record<string, Record<string, number>>;
  state_frequency: Record<string, number>;
  total_analyzed: number;
}

interface Props { data: MarkovData; }

const STATE_COLORS: Record<string, string> = {
  high_volume: "#6366f1",
  low_volume:  "#06b6d4",
  error:       "#ef4444",
};

const STATE_LABELS: Record<string, string> = {
  high_volume: "High Volume",
  low_volume:  "Low Volume",
  error:       "Error",
};

type View = "matrix" | "frequency" | "timeline";

export function MarkovChart({ data }: Props) {
  const [view, setView] = useState<View>("matrix");

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid rgba(90,127,156,0.2)",
      borderRadius: "16px",
      padding: "28px",
      fontFamily: "'DM Mono', monospace",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "17px", fontWeight: 600, color: "#1e3a4a" }}>
            Markov State Transitions
          </div>
          <div style={{ fontSize: "13px", color: "#5A7F9C", marginTop: "3px" }}>
            {data.bridge} · {data.total_analyzed} txs analyzed
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(90,127,156,0.08)", borderRadius: "10px", padding: "4px" }}>
          {(["matrix", "frequency", "timeline"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'DM Mono', monospace",
              fontWeight: view === v ? 600 : 400,
              background: view === v ? "#5A7F9C" : "transparent",
              color: view === v ? "#ffffff" : "#5A7F9C",
              transition: "all 0.2s ease",
            }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {data.states.map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: STATE_COLORS[s] ?? "#888", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#5A7F9C" }}>{STATE_LABELS[s] ?? s}</span>
          </div>
        ))}
      </div>

      {view === "matrix"    && <MatrixView data={data} />}
      {view === "frequency" && <FrequencyView data={data} />}
      {view === "timeline"  && <TimelineView data={data} />}
    </div>
  );
}

function MatrixView({ data }: { data: MarkovData }) {
  const { states, transition_matrix } = data;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div style={{ fontSize: "12px", color: "#5A7F9C", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Transition probability matrix (from → to)
      </div>

      <div style={{ display: "flex", marginLeft: "110px", marginBottom: "6px", gap: "8px" }}>
        {states.map((s) => (
          <div key={s} style={{ width: "90px", fontSize: "12px", color: STATE_COLORS[s], textAlign: "center", flexShrink: 0 }}>
            {STATE_LABELS[s]}
          </div>
        ))}
      </div>

      {states.map((fromState) => (
        <div key={fromState} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "102px", fontSize: "12px", color: STATE_COLORS[fromState], textAlign: "right", paddingRight: "10px", flexShrink: 0 }}>
            {STATE_LABELS[fromState]}
          </div>
          {states.map((toState) => {
            const prob = transition_matrix[fromState]?.[toState] ?? 0;
            const cellKey = `${fromState}-${toState}`;
            const isHovered = hovered === cellKey;
            return (
              <div key={toState}
                onMouseEnter={() => setHovered(cellKey)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: "90px", height: "62px", borderRadius: "10px",
                  background: probToColor(prob, STATE_COLORS[toState] ?? "#888"),
                  border: isHovered ? `1px solid ${STATE_COLORS[toState]}` : "1px solid rgba(90,127,156,0.1)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "default", transition: "all 0.15s ease", flexShrink: 0,
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}>
                <span style={{ fontSize: "18px", fontWeight: 600, color: prob > 0.3 ? "#1e3a4a" : "#9ab8ca" }}>
                  {(prob * 100).toFixed(0)}%
                </span>
                {isHovered && (
                  <span style={{ fontSize: "11px", color: "#5A7F9C", marginTop: "2px" }}>{prob.toFixed(3)}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function probToColor(prob: number, baseColor: string): string {
  const alpha = Math.max(0.06, prob * 0.5);
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function FrequencyView({ data }: { data: MarkovData }) {
  const chartData = data.states.map((s) => ({
    name: STATE_LABELS[s] ?? s,
    count: data.state_frequency[s] ?? 0,
    color: STATE_COLORS[s] ?? "#888",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "220px" }}>
      <div style={{ fontSize: "12px", color: "#5A7F9C", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
        State frequency distribution
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fill: "#5A7F9C" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fill: "#9ab8ca" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(90,127,156,0.2)", borderRadius: "8px", fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "#1e3a4a" }} cursor={{ fill: "rgba(90,127,156,0.05)" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.75} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineView({ data }: { data: MarkovData }) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: "#5A7F9C", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Recent state sequence (latest → oldest)
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
        {data.state_sequence.map((state, i) => (
          <div key={i} title={`TX #${i + 1}: ${STATE_LABELS[state] ?? state}`} style={{
            width: "34px", height: "34px", borderRadius: "7px",
            background: STATE_COLORS[state] ?? "#888",
            opacity: 0.6 + (0.4 * (data.state_sequence.length - i)) / data.state_sequence.length,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "white", fontWeight: 600, cursor: "default",
          }}>
            {state === "high_volume" ? "H" : state === "low_volume" ? "L" : "E"}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "14px", fontSize: "13px", color: "#5A7F9C" }}>
        H = High Volume · L = Low Volume · E = Error
      </div>
    </div>
  );
}