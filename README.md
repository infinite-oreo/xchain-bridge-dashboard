# XChain Bridge Dashboard

A full-stack analytics dashboard for monitoring Ethereum cross-chain bridge protocols in real time. Combines on-chain transaction data from Etherscan with Markov chain modeling and a conversational AI agent to surface reliability insights for **Across Protocol** and **Stargate ETH**.

![Phase 1 · Live Data](https://img.shields.io/badge/Phase%201-Live%20Data-5A7F9C?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-4B5563?style=flat-square)

---

## Overview

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend API | FastAPI, Uvicorn |
| AI Agent | LangGraph, LangChain Anthropic (Claude Sonnet) |
| On-chain Data | Etherscan API v2 |

Click a bridge button to fetch live on-chain data and render the stats card and Markov chart instantly via the REST API.

---

## Features

- **Bridge Stats Card** — success rate, transaction count, total ETH volume, average gas used, and failed-transaction alert for each bridge.
- **Markov Chain Analysis** — classifies each transaction as `high_volume` (> 0.1 ETH), `low_volume`, or `error`, then computes the full transition probability matrix and state frequency distribution.
- **Three chart views** — transition matrix heatmap, state frequency bar chart, and chronological state timeline — all built with Recharts.

---

## Project Structure

```
xchain-bridge-dashboard/
├── backend/
│   ├── main.py          # FastAPI app + REST endpoints
│   ├── agent.py         # LangGraph agent + CopilotKit wiring
│   ├── tools.py         # Etherscan tools (LangChain @tool)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                        # Direct-mode UI
│   │   ├── components/
│   │   │   ├── BridgeCard.tsx             # Stats card component
│   │   │   └── MarkovChart.tsx            # Markov visualization (3 views)
│   ├── package.json
│   └── vite.config.ts
└── .env.example
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/)
- [Etherscan API key](https://etherscan.io/myapikey)

---

## Setup

### 1. Clone & configure environment

```bash
git clone https://github.com/your-username/xchain-bridge-dashboard.git
cd xchain-bridge-dashboard
cp .env.example .env
```

Edit `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ETHERSCAN_API_KEY=<your-key>
```

### 2. Backend

> **Important:** uvicorn must be started from inside the `backend/` directory. Running it from the project root will cause a `ModuleNotFoundError: No module named 'tools'` because `main.py` imports `tools` as a local module.

```bash
cd backend
python -m venv ../.venv
source ../.venv/bin/activate      # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Query param | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check |
| `GET` | `/bridge/summary` | `name` | High-level stats for a bridge |
| `GET` | `/bridge/markov` | `name` | Markov transition matrix + state frequency |

**Supported bridge names:** `Across Protocol`, `Stargate ETH`

Example:

```bash
curl "http://localhost:8000/bridge/summary?name=Across%20Protocol"
```

```json
{
  "bridge": "Across Protocol",
  "address": "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
  "tx_count": 100,
  "total_volume_eth": 42.1337,
  "success_rate_pct": 98.0,
  "avg_gas_used": 134200,
  "error_count": 2
}
```

---

## How the Markov Model Works

Each recent transaction is classified into one of three states:

| State | Condition |
|---|---|
| `high_volume` | Value > 0.1 ETH and no error |
| `low_volume` | Value ≤ 0.1 ETH and no error |
| `error` | Transaction reverted (`isError = 1`) |

From the last 50 transactions, consecutive state pairs are counted and normalized into a row-stochastic **transition matrix**. This lets you see, for example, whether a high-volume transaction is likely to be followed by another high-volume one or a revert — a proxy for bridge stability under load.

---

## AI Agent Architecture

The LangGraph agent runs a simple loop:

```
agent → (has tool calls?) → tools → agent → … → after_tools → END
```

Three LangChain tools are available to the agent:

- `get_bridge_transactions` — fetches the latest N transactions from Etherscan.
- `get_bridge_summary` — wraps the above and computes aggregate stats.
- `compute_markov_states` — wraps the above and runs the Markov computation.

The agent emits intermediate state (`bridge_card_data`, `markov_data`, `loading`) so the `BridgeCard` and `MarkovChart` components can render progressively as data arrives.

---

## Monitored Contracts

| Bridge | Contract Address |
|---|---|
| Across Protocol | [`0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5`](https://etherscan.io/address/0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5) |
| Stargate ETH Pool | [`0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56`](https://etherscan.io/address/0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56) |

---

## Development

```bash
# Backend (auto-reload) — must run from backend/
cd backend && uvicorn main:app --reload --port 8000

# Frontend (HMR)
cd frontend && npm run dev

# Type-check frontend
cd frontend && npm run build
```

---

## License

MIT
