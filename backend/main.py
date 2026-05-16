import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tools import get_bridge_summary, compute_markov_states

app = FastAPI(title="Cross-Chain Bridge Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/bridge/summary")
async def bridge_summary(name: str):
    result = await get_bridge_summary.ainvoke({"bridge_name": name})
    return result

@app.get("/bridge/markov")
async def bridge_markov(name: str):
    result = await compute_markov_states.ainvoke({"bridge_name": name})
    return result