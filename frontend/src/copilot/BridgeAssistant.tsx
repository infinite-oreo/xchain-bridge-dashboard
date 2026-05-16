/**
 * BridgeAssistant — wires CopilotKit useCoAgent to BridgeCard + MarkovChart.
 * L3 Controlled Generative UI pattern:
 * - Agent控制渲染什么（bridge_card_data, markov_data）
 * - 前端控制怎么渲染（我们自己的组件）
 */

import { useCoAgent } from "@copilotkit/react-core";
import { BridgeCard, type BridgeCardData } from "../components/BridgeCard";
import { MarkovChart, type MarkovData } from "../components/MarkovChart";
import { Loader2 } from "lucide-react";

interface AgentState {
  bridge_card_data: BridgeCardData | null;
  markov_data: MarkovData | null;
  loading: boolean;
  selected_bridge: string | null;
}

const INITIAL_STATE: AgentState = {
  bridge_card_data: null,
  markov_data: null,
  loading: false,
  selected_bridge: null,
};

export function BridgeAssistant() {
  const { state } = useCoAgent<AgentState>({
    name: "bridge_analytics_agent",
    initialState: INITIAL_STATE,
  });

  const hasData = state.bridge_card_data || state.markov_data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Loading state */}
      {state.loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "12px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
            color: "#a5b4fc",
          }}
        >
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          Fetching on-chain data from Etherscan…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty state */}
      {!hasData && !state.loading && (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            color: "#334155",
            fontSize: "13px",
            border: "1px dashed rgba(148,163,184,0.1)",
            borderRadius: "16px",
          }}
        >
          Ask about a bridge to load analytics.
          <br />
          <span style={{ fontSize: "11px", marginTop: "6px", display: "block" }}>
            Try: "Show me Across Protocol stats" or "Analyze Stargate ETH"
          </span>
        </div>
      )}

      {/* BridgeCard */}
      {state.bridge_card_data && (
        <BridgeCard data={state.bridge_card_data} loading={state.loading} />
      )}

      {/* MarkovChart */}
      {state.markov_data && <MarkovChart data={state.markov_data} />}
    </div>
  );
}