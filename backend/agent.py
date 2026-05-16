"""
LangGraph agent for Cross-Chain Bridge Analytics.
Integrates with CopilotKit for L3 Controlled Generative UI.
"""

from typing import Any
from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import SystemMessage
from copilotkit.langchain import copilotkit_emit_state, copilotkit_customize_config
from typing import TypedDict, Annotated
import operator

from tools import get_bridge_transactions, compute_markov_states, get_bridge_summary

# ── State ────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    bridge_card_data: dict | None
    markov_data: dict | None
    loading: bool
    selected_bridge: str | None


# ── LLM + Tools ──────────────────────────────────────────────────────────────

TOOLS = [get_bridge_transactions, compute_markov_states, get_bridge_summary]

llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    temperature=0,
).bind_tools(TOOLS)

SYSTEM_PROMPT = """You are a Cross-Chain Bridge Analytics assistant.
You help users analyze Ethereum bridge protocols (Across Protocol, Stargate ETH) using on-chain data.

When a user asks about a bridge:
1. Call get_bridge_summary to get high-level stats → emit bridge_card_data
2. Call compute_markov_states to get transition matrix → emit markov_data
3. Summarize findings in plain language

Always emit UI state updates so the dashboard components update in real time.
Available bridges: 'Across Protocol', 'Stargate ETH'
"""

# ── Nodes ─────────────────────────────────────────────────────────────────────

async def agent_node(state: AgentState, config) -> dict:
    config = copilotkit_customize_config(
        config,
        emit_intermediate_state=[
            {"state_key": "bridge_card_data", "tool": "get_bridge_summary", "tool_argument": "bridge_name"},
            {"state_key": "markov_data", "tool": "compute_markov_states", "tool_argument": "bridge_name"},
        ]
    )

    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = await llm.ainvoke(messages, config)

    await copilotkit_emit_state(config, {"loading": True})

    return {"messages": [response], "loading": True}


async def after_tools_node(state: AgentState, config) -> dict:
    """Post-process tool results into UI state."""
    updates: dict[str, Any] = {"loading": False}
    await copilotkit_emit_state(config, updates)
    return updates


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "after_tools"


# ── Graph ─────────────────────────────────────────────────────────────────────

tool_node = ToolNode(TOOLS)

builder = StateGraph(AgentState)
builder.add_node("agent", agent_node)
builder.add_node("tools", tool_node)
builder.add_node("after_tools", after_tools_node)

builder.set_entry_point("agent")
builder.add_conditional_edges("agent", should_continue, {
    "tools": "tools",
    "after_tools": "after_tools",
})
builder.add_edge("tools", "agent")
builder.add_edge("after_tools", END)

graph = builder.compile()