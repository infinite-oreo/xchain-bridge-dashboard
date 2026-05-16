"""
Etherscan API tools for Cross-Chain Bridge Analytics.
Targets: Across Protocol (0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5)
         Stargate ETH Pool  (0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56)
"""

import os
import httpx
from typing import Any
from langchain_core.tools import tool

ETHERSCAN_API = "https://api.etherscan.io/v2/api"
ETHERSCAN_KEY = os.getenv("ETHERSCAN_API_KEY", "")

# Known bridge contract addresses
BRIDGE_CONTRACTS = {
    "Across Protocol": "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
    "Stargate ETH":    "0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56",
}


async def _etherscan_get(params: dict) -> dict:
    params["apikey"] = ETHERSCAN_KEY
    params["chainid"] = "1"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(ETHERSCAN_API, params=params)
        r.raise_for_status()
        return r.json()


@tool
async def get_bridge_transactions(bridge_name: str, limit: int = 20) -> dict[str, Any]:
    """
    Fetch recent transactions for a named bridge contract from Etherscan.
    Returns list of tx with hash, value (ETH), timestamp, from/to.
    bridge_name: one of 'Across Protocol' or 'Stargate ETH'
    """
    address = BRIDGE_CONTRACTS.get(bridge_name)
    if not address:
        return {"error": f"Unknown bridge: {bridge_name}. Choose from {list(BRIDGE_CONTRACTS)}"}

    data = await _etherscan_get({
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 99999999,
        "page": 1,
        "offset": limit,
        "sort": "desc",
    })

    if data.get("status") != "1":
        return {"error": data.get("message", "Etherscan error"), "raw": data}

    txs = []
    for tx in data["result"]:
        eth_value = int(tx["value"]) / 1e18
        txs.append({
            "hash": tx["hash"],
            "from": tx["from"],
            "to": tx["to"],
            "value_eth": round(eth_value, 6),
            "timestamp": int(tx["timeStamp"]),
            "gas_used": int(tx["gasUsed"]),
            "is_error": tx["isError"] == "1",
        })

    return {
        "bridge": bridge_name,
        "address": address,
        "count": len(txs),
        "transactions": txs,
    }


@tool
async def compute_markov_states(bridge_name: str, limit: int = 50) -> dict[str, Any]:
    """
    Fetch transactions and compute Markov chain state transitions.
    States: 'high_volume' (>0.1 ETH), 'low_volume' (<=0.1 ETH), 'error'
    Returns transition matrix and state sequence for visualization.
    """
    result = await get_bridge_transactions.ainvoke({"bridge_name": bridge_name, "limit": limit})
    if "error" in result:
        return result

    txs = result["transactions"]

    def classify(tx: dict) -> str:
        if tx["is_error"]:
            return "error"
        return "high_volume" if tx["value_eth"] > 0.1 else "low_volume"

    states = [classify(tx) for tx in txs]
    state_labels = ["high_volume", "low_volume", "error"]

    # Count transitions
    counts: dict[str, dict[str, int]] = {s: {t: 0 for t in state_labels} for s in state_labels}
    for i in range(len(states) - 1):
        counts[states[i]][states[i + 1]] += 1

    # Normalize to probabilities
    matrix: dict[str, dict[str, float]] = {}
    for s in state_labels:
        total = sum(counts[s].values())
        matrix[s] = {t: (counts[s][t] / total if total > 0 else 0.0) for t in state_labels}

    # State frequency
    freq = {s: states.count(s) for s in state_labels}

    return {
        "bridge": bridge_name,
        "states": state_labels,
        "state_sequence": states[:20],
        "transition_matrix": matrix,
        "state_frequency": freq,
        "total_analyzed": len(states),
    }


@tool
async def get_bridge_summary(bridge_name: str) -> dict[str, Any]:
    """
    Get high-level summary stats for a bridge: total ETH volume, success rate,
    avg gas, tx count. Used to populate BridgeCard component.
    """
    result = await get_bridge_transactions.ainvoke({"bridge_name": bridge_name, "limit": 100})
    if "error" in result:
        return result

    txs = result["transactions"]
    if not txs:
        return {"error": "No transactions found"}

    total_eth = sum(tx["value_eth"] for tx in txs)
    success_txs = [tx for tx in txs if not tx["is_error"]]
    success_rate = len(success_txs) / len(txs) * 100
    avg_gas = sum(tx["gas_used"] for tx in txs) / len(txs)

    return {
        "bridge": bridge_name,
        "address": result["address"],
        "tx_count": len(txs),
        "total_volume_eth": round(total_eth, 4),
        "success_rate_pct": round(success_rate, 2),
        "avg_gas_used": int(avg_gas),
        "error_count": len(txs) - len(success_txs),
    }