from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from data_manager import ALL_TICKERS
import signal_engine
from cache import signal_cache, scanner_cache

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

SCAN_TTL = 1800


@router.post("")
def run_scan(confidence: float = 0.60):
    cache_key = ("__scan__", round(confidence, 2))
    cached = scanner_cache.get(cache_key)
    if cached is not None:
        return cached

    results = []
    for t in ALL_TICKERS:
        try:
            sig_key = (t, round(confidence, 2))
            payload = signal_cache.get(sig_key)
            if payload is None:
                payload = signal_engine.compute_signal(t, confidence)
                signal_cache.set(sig_key, payload, 3600)
            results.append({
                "ticker": t,
                "name": payload["name"],
                "price": payload["price"]["display"],
                "signal": payload["signal"]["value"],
                "confidencePct": payload["signal"]["confidencePct"],
                "probUp": payload["signal"]["probUp"],
                "accuracyPct": round(payload["ensemble"]["filteredAccuracy"] * 100, 1),
                "takeProfit": payload["signal"]["takeProfit"],
                "stopLoss": payload["signal"]["stopLoss"],
                "riskReward": payload["signal"]["riskReward"],
                "error": None,
            })
        except Exception as e:
            results.append({"ticker": t, "signal": "—", "confidencePct": 0, "error": str(e)[:200]})

    order = {"BUY": 0, "SELL": 1, "HOLD": 2, "—": 3}
    results.sort(key=lambda r: (order.get(r.get("signal", "—"), 3), -r.get("confidencePct", 0)))

    n_buy = sum(1 for r in results if r.get("signal") == "BUY")
    n_sell = sum(1 for r in results if r.get("signal") == "SELL")
    n_hold = sum(1 for r in results if r.get("signal") == "HOLD")
    bias = "BULLISH" if n_buy > n_sell else "BEARISH" if n_sell > n_buy else "MIXED"

    payload = {
        "scannedAt": (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat(),
        "results": results,
        "summary": {"total": len(results), "buy": n_buy, "sell": n_sell, "hold": n_hold, "bias": bias},
    }
    scanner_cache.set(cache_key, payload, SCAN_TTL)
    return payload
