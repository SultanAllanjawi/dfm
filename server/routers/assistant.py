import os

import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from data_manager import ALL_TICKERS, UAE_NAMES
import persistence
from cache import signal_cache

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    ticker: str
    message: str
    history: list[ChatMessage] = []


def _build_system_context(ticker: str) -> str:
    name = UAE_NAMES.get(ticker, ticker)
    payload = signal_cache.get((ticker, 0.60))

    portfolio = persistence.load_portfolio()
    open_trades = [t for t in portfolio if t.get("status") == "Open"][:5]
    port_str = "\n".join(
        f"  {t['ticker']} {t['side']} @ ${t['entry']:.4f} | TP:${t.get('tp', 0):.4f} SL:${t.get('sl', 0):.4f}"
        for t in open_trades
    ) or "  None"

    if payload:
        price_str = f"${payload['price']['display']:,.4f}"
        sig = payload["signal"]["value"]
        conf = payload["signal"]["confidencePct"]
        tp = f"${payload['signal']['takeProfit']:,.4f}" if payload["signal"]["takeProfit"] else "N/A"
        sl = f"${payload['signal']['stopLoss']:,.4f}" if payload["signal"]["stopLoss"] else "N/A"
        acc = round(payload["ensemble"]["filteredAccuracy"] * 100)
    else:
        price_str, sig, conf, tp, sl, acc = "unknown", "unknown", 0, "N/A", "N/A", 0

    return (
        f"You are a trading AI assistant for a DFM/UAE equities dashboard. "
        f"{name} ({ticker}) | Price:{price_str} | {sig} {conf}% conf | TP:{tp} SL:{sl} | "
        f"Model accuracy:{acc}% | Open portfolio positions:\n{port_str}\n"
        f"Answer any question concisely."
    )


@router.post("/chat")
def chat(req: ChatRequest):
    t = req.ticker.upper().strip()
    if t not in ALL_TICKERS:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{req.ticker}'")

    groq_key = os.environ.get("GROQ_API_KEY", "")
    if not groq_key:
        raise HTTPException(status_code=503, detail="AI assistant is not configured (missing GROQ_API_KEY).")

    system_prompt = _build_system_context(t)
    messages = [{"role": "system", "content": system_prompt}]
    for m in req.history[-3:]:
        messages.append({"role": m.role, "content": m.content[:300]})
    messages.append({"role": "user", "content": req.message[:500]})

    try:
        resp = requests.post(
            GROQ_URL,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {groq_key}"},
            json={"model": "llama-3.3-70b-versatile", "messages": messages, "max_tokens": 1024, "temperature": 0.4},
            timeout=45,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Groq error {resp.status_code}: {resp.text[:200]}")
        answer = resp.json()["choices"][0]["message"]["content"]
        return {"role": "assistant", "content": answer}
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Connection error: {str(e)[:150]}")
