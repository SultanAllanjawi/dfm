import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Query

from data_manager import DataManager, ALL_TICKERS, UAE_NAMES, UAE_NO_AUTO_FETCH, TV_MAP, INVESTING_SLUGS
import signal_engine
import persistence
from cache import signal_cache, price_cache

router = APIRouter(prefix="/api/tickers", tags=["tickers"])

PRICE_TTL = 30
SIGNAL_TTL = 3600


def _require_ticker(ticker: str) -> str:
    t = ticker.upper().strip()
    if t not in ALL_TICKERS:
        raise HTTPException(status_code=404, detail=f"Unknown ticker '{ticker}'. Valid tickers: {ALL_TICKERS}")
    return t


@router.get("")
def list_tickers():
    return [
        {
            "ticker": t,
            "name": UAE_NAMES[t],
            "exchange": "DFM" if t.endswith(".DFM") else "ADX",
            "autoFetch": t not in UAE_NO_AUTO_FETCH,
            "tvSymbol": TV_MAP.get(t),
            "investingSlug": INVESTING_SLUGS.get(t),
        }
        for t in ALL_TICKERS
    ]


@router.get("/{ticker}/price")
def get_price(ticker: str):
    t = _require_ticker(ticker)
    cached = price_cache.get(t)
    if cached is not None:
        return cached
    price = DataManager.get_live_price(t)
    if price is None:
        try:
            df = DataManager(t).get_data()
            price = float(df["Close"].iloc[-1])
            is_live = False
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
    else:
        is_live = True
    payload = {"ticker": t, "price": round(price, 4), "isLive": is_live}
    price_cache.set(t, payload, PRICE_TTL)
    return payload


@router.get("/{ticker}/ohlcv")
def get_ohlcv(ticker: str, lookback: int = Query(90, ge=5, le=3650)):
    t = _require_ticker(ticker)
    try:
        return {"ticker": t, "bars": signal_engine.get_ohlcv(t, lookback)}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/{ticker}/signal")
def get_signal(ticker: str, confidence: float = Query(0.60, ge=0.50, le=0.80)):
    t = _require_ticker(ticker)
    key = (t, round(confidence, 2))
    cached = signal_cache.get(key)
    if cached is not None:
        return cached
    try:
        payload = signal_engine.compute_signal(t, confidence)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    signal_cache.set(key, payload, SIGNAL_TTL)
    return payload


@router.get("/{ticker}/accuracy-history")
def get_accuracy_history(ticker: str):
    t = _require_ticker(ticker)
    return {"ticker": t, "history": persistence.load_accuracy_history(t)}


@router.post("/{ticker}/upload")
async def upload_csv(ticker: str, file: UploadFile = File(...)):
    t = _require_ticker(ticker)
    content = await file.read()
    persistence.save_uploaded_csv(t, content)
    try:
        import io
        df = DataManager(t).get_data(uploaded_file=io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")
    signal_cache.clear_ticker(t)
    price_cache.clear_ticker(t)
    return {"ticker": t, "rows": len(df), "message": "CSV uploaded and cached."}


@router.post("/{ticker}/refresh")
def refresh_ticker(ticker: str):
    t = _require_ticker(ticker)
    dm = DataManager(t)
    if os.path.exists(dm.meta_file):
        os.remove(dm.meta_file)
    signal_cache.clear_ticker(t)
    price_cache.clear_ticker(t)
    try:
        df = dm.get_data()
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"ticker": t, "rows": len(df), "message": "Cache cleared and data refreshed."}
