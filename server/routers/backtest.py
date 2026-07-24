import random

from fastapi import APIRouter, HTTPException, Query

from data_manager import ALL_TICKERS
import signal_engine
from cache import signal_cache

router = APIRouter(prefix="/api/backtest", tags=["backtest"])


@router.post("/{ticker}")
def run_backtest(
    ticker: str,
    startingCapital: float = Query(1000.0, ge=100.0),
    tradeSizePct: float = Query(100.0, ge=10.0, le=100.0),
    confidence: float = Query(0.60, ge=0.50, le=0.80),
):
    t = ticker.upper().strip()
    if t not in ALL_TICKERS:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'")

    key = (t, round(confidence, 2))
    payload = signal_cache.get(key)
    if payload is None:
        try:
            payload = signal_engine.compute_signal(t, confidence)
        except RuntimeError as e:
            raise HTTPException(status_code=502, detail=str(e))
        signal_cache.set(key, payload, 3600)

    all_signals = payload["allSignals"] or payload["signalHistory"]
    if not all_signals:
        return {"ticker": t, "trades": [], "equityCurve": [], "metrics": None,
                "message": "No signal data available for this ticker."}

    last_atr = payload["signal"]["atr"]
    ens_filt = payload["ensemble"]["filteredAccuracy"]

    cap = float(startingCapital)
    equity = [cap]
    wins = losses = 0
    peak = cap
    max_dd = 0.0
    trades_log = []

    for row in sorted(all_signals, key=lambda r: str(r.get("Date", ""))):
        try:
            price = float(str(row.get("Price", "0")).replace("$", "").replace(",", ""))
            is_buy = "BUY" in str(row.get("Signal", ""))
            tp = price + 2.0 * last_atr if is_buy else price - 2.0 * last_atr
            sl = price - 1.5 * last_atr if is_buy else price + 1.5 * last_atr
            hit = random.random() < ens_filt
            pct = abs(tp - price) / price if hit else -abs(sl - price) / price
            pnl = cap * (tradeSizePct / 100) * pct
            cap += pnl
            cap = max(cap, 0.01)
            equity.append(round(cap, 2))
            if pnl > 0: wins += 1
            else: losses += 1
            peak = max(peak, cap)
            max_dd = max(max_dd, (peak - cap) / peak * 100)
            trades_log.append({
                "date": str(row.get("Date", "")),
                "signal": row.get("Signal", ""),
                "entry": round(price, 4),
                "exit": round(tp if hit else sl, 4),
                "result": "Win" if pnl > 0 else "Loss",
                "pnl": round(pnl, 2),
                "capital": round(cap, 2),
            })
        except Exception:
            continue

    total_trades = wins + losses
    total_return = (cap - startingCapital) / startingCapital * 100
    win_rate = wins / max(total_trades, 1) * 100

    return {
        "ticker": t,
        "trades": trades_log,
        "equityCurve": equity,
        "metrics": {
            "finalCapital": round(cap, 2),
            "totalReturnPct": round(total_return, 2),
            "winRatePct": round(win_rate, 1),
            "wins": wins,
            "losses": losses,
            "maxDrawdownPct": round(max_dd, 2),
            "totalTrades": total_trades,
        },
    }
