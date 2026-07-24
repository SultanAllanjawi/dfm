import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import persistence
from data_manager import DataManager, ALL_TICKERS

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


class NewTrade(BaseModel):
    ticker: str
    side: str  # "BUY" | "SELL"
    entry: float
    size: float
    tp: float = 0.0
    sl: float = 0.0
    note: str = ""


class CloseTrade(BaseModel):
    exitPrice: float


def _enrich(trade: dict) -> dict:
    live = DataManager.get_live_price(trade["ticker"]) or trade["entry"]
    is_open = trade["status"] == "Open"
    if is_open:
        pnl_per = (live - trade["entry"]) if trade["side"] == "BUY" else (trade["entry"] - live)
        pnl_total = pnl_per * trade["size"]
        live_price = live
    else:
        pnl_total = trade.get("pnl", 0) or 0
        live_price = trade.get("exit", trade["entry"])
    pnl_pct = (pnl_total / (trade["entry"] * trade["size"])) * 100 if trade["entry"] > 0 else 0
    return {**trade, "livePrice": round(live_price, 4), "pnl": round(pnl_total, 4), "pnlPct": round(pnl_pct, 2)}


@router.get("")
def list_trades():
    trades = persistence.load_portfolio()
    enriched = [_enrich(t) for t in trades]
    total_pnl = sum(t["pnl"] for t in enriched)
    total_invest = sum(t["entry"] * t["size"] for t in enriched if t["status"] == "Open")
    open_count = sum(1 for t in trades if t["status"] == "Open")
    roi = (total_pnl / total_invest * 100) if total_invest > 0 else 0
    return {
        "trades": enriched,
        "summary": {
            "totalTrades": len(trades),
            "openPositions": open_count,
            "totalPnl": round(total_pnl, 2),
            "roiPct": round(roi, 2),
        },
    }


@router.post("")
def add_trade(trade: NewTrade):
    t = trade.ticker.upper().strip()
    if t not in ALL_TICKERS:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{trade.ticker}'")
    if trade.side not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="side must be BUY or SELL")
    trades = persistence.load_portfolio()
    now_str = (datetime.now(timezone.utc) + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M")
    record = {
        "id": str(uuid.uuid4()),
        "date": now_str, "ticker": t, "side": trade.side,
        "entry": trade.entry, "size": trade.size, "tp": trade.tp, "sl": trade.sl,
        "status": "Open", "exit": None, "pnl": None, "note": trade.note,
    }
    trades.append(record)
    persistence.save_portfolio(trades)
    return _enrich(record)


@router.patch("/{trade_id}/close")
def close_trade(trade_id: str, body: CloseTrade):
    trades = persistence.load_portfolio()
    idx = next((i for i, t in enumerate(trades) if t.get("id") == trade_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    t = trades[idx]
    pnl_per = (body.exitPrice - t["entry"]) if t["side"] == "BUY" else (t["entry"] - body.exitPrice)
    t["status"] = "Closed"
    t["exit"] = body.exitPrice
    t["pnl"] = pnl_per * t["size"]
    trades[idx] = t
    persistence.save_portfolio(trades)
    return _enrich(t)


@router.delete("/{trade_id}")
def delete_trade(trade_id: str):
    trades = persistence.load_portfolio()
    idx = next((i for i, t in enumerate(trades) if t.get("id") == trade_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    trades.pop(idx)
    persistence.save_portfolio(trades)
    return {"deleted": trade_id}
