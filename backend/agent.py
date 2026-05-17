"""
LangGraph agent for Cross-Chain Bridge Analytics.
"""

import operator
from typing import Any, TypedDict, Annotated

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from tools import get_bridge_transactions, compute_markov_states, get_bridge_summary

# ── State ─────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    bridge_card_data: dict | None
    markov_data: dict | None
    loading: bool
    selected_bridge: str | None


# ── LLM + Tools ───────────────────────────────────────────────────────────────

TOOLS = [get_bridge_transactions, compute_markov_states, get_bridge_summary]

llm = ChatAnthropic(
    model="claude-sonnet-4-20250514",
    temperature=0,
).bind_tools(TOOLS)

SYSTEM_PROMPT = """You are a Cross-Chain Bridge Analytics assistant.
You help users analyze Ethereum bridge protocols (Across Protocol, Stargate ETH) using on-chain data.

When a user asks about a bridge:
1. Call get_bridge_summary to get high-level stats
2. Call compute_markov_states to get transition matrix
3. Summarize findings in plain language

Available bridges: 'Across Protocol', 'Stargate ETH'
"""

# ── Nodes ─────────────────────────────────────────────────────────────────────

async def agent_node(state: AgentState, config) -> dict:
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = await llm.ainvoke(messages, config)
    return {"messages": [response], "loading": True}


async def after_tools_node(state: AgentState, config) -> dict:
    return {"loading": False}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "after_tools"


# ── Graph ──────────────────────────────────────────────────────────────────────

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
