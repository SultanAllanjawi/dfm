"""
data_manager.py — DFM/UAE-only data layer.

Source priority:
  1. Uploaded CSV (the only source for ADX-listed tickers — Yahoo has no
     data at all for FAB.ADX / ALDAR.ADX / ADCB.ADX)
  2. Yahoo Finance chart endpoint (raw requests, UAE_YAHOO_MAP translation)
  3. yfinance library fallback
  4. Cached CSV in data/
"""

import os, json, requests
import pandas as pd
from datetime import datetime, timezone

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_THIS_DIR, "data")

# ── UAE DFM/ADX → Yahoo Finance ticker translation ──────────────────
# NOTE: Yahoo Finance simply does not carry live chart data for FAB.ADX,
# ALDAR.ADX or ADCB.ADX (verified directly against their API — every symbol
# variant either 404s or resolves to an unrelated/stale instrument). Those
# three are CSV-upload-only; see UAE_NO_AUTO_FETCH below.
UAE_YAHOO_MAP = {
    "EMAAR.DFM" : "EMAAR.AE",
    "ENBD.DFM"  : "EMIRATESNBD.AE",   # NOT "ENBD.AE" — that symbol is delisted/404 on Yahoo
    "DIB.DFM"   : "DIB.AE",
    "DU.DFM"    : "DU.AE",
    "DEWA.DFM"  : "DEWA.AE",
    "SALIK.DFM" : "SALIK.AE",
    "MASQ.DFM"  : "MASQ.AE",
}

# UAE tickers with no working free auto-fetch source — CSV upload required.
UAE_NO_AUTO_FETCH = {"FAB.ADX", "ALDAR.ADX", "ADCB.ADX"}

UAE_NAMES = {
    "EMAAR.DFM" : "Emaar Properties",
    "ENBD.DFM"  : "Emirates NBD",
    "DIB.DFM"   : "Dubai Islamic Bank",
    "DU.DFM"    : "du Telecom",
    "DEWA.DFM"  : "Dubai Electricity & Water",
    "SALIK.DFM" : "Salik",
    "MASQ.DFM"  : "Mashreq Bank",
    "FAB.ADX"   : "First Abu Dhabi Bank",
    "ALDAR.ADX" : "Aldar Properties",
    "ADCB.ADX"  : "Abu Dhabi Commercial Bank",
}

# TradingView symbols for the Live Chart tab.
TV_MAP = {
    "EMAAR.DFM" : "DFM:EMAAR",
    "ENBD.DFM"  : "DFM:EMIRATESNBD",
    "DIB.DFM"   : "DFM:DIB",
    "DU.DFM"    : "DFM:DU",
    "DEWA.DFM"  : "DFM:DEWA",
    "SALIK.DFM" : "DFM:SALIK",
    "MASQ.DFM"  : "DFM:MASQ",
    "FAB.ADX"   : "ADX:FAB",
    "ALDAR.ADX" : "ADX:ALDAR",
    "ADCB.ADX"  : "ADX:ADCB",
}

# Investing.com chart slugs (used for the "DFM Official" / Investing.com links).
INVESTING_SLUGS = {
    "EMAAR.DFM" : "emaar-properties",
    "ENBD.DFM"  : "emirates-nbd",
    "DIB.DFM"   : "dubai-islamic-bank",
    "DU.DFM"    : "emirates-integrated-telecom",
    "DEWA.DFM"  : "dubai-electricity-water",
    "SALIK.DFM" : "salik-pjsc",
    "MASQ.DFM"  : "mashreqbank",
    "FAB.ADX"   : "first-abu-dhabi-bank",
    "ALDAR.ADX" : "aldar-properties",
    "ADCB.ADX"  : "abu-dhabi-commercial-bank",
}

ALL_TICKERS = list(UAE_NAMES.keys())

HDR = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


class DataManager:
    def __init__(self, ticker: str):
        self.ticker = ticker.upper().strip()
        safe = self.ticker.replace("/", "_").replace(".", "_")
        self.data_file = os.path.join(DATA_DIR, f"{safe}.csv")
        self.meta_file = os.path.join(DATA_DIR, f"{safe}_meta.json")
        os.makedirs(DATA_DIR, exist_ok=True)

    # ── Public entry point ──────────────────────────────────────────
    def get_data(self, uploaded_file=None) -> pd.DataFrame:
        """Returns an OHLCV DataFrame (DatetimeIndex) ready for feature engineering."""
        if uploaded_file is not None:
            try:
                df = self._parse_csv(uploaded_file)
                if len(df) >= 80:
                    self._save(df)
                    self._save_meta()
                    return self._clean(df)
            except Exception:
                pass

        cached = self._load_cached()
        cache_too_small = cached is not None and len(cached) < 200

        if self._is_stale() or cached is None or cache_too_small:
            fresh = self._fetch_daily()
            if fresh is not None and len(fresh) >= 80:
                merged = self._merge(cached, fresh)
                self._save(merged)
                self._save_meta()
                clean = self._clean(merged)
                return clean.tail(7500).reset_index(drop=True) if len(clean) > 7500 else clean
            elif cached is not None and len(cached) >= 80:
                clean = self._clean(cached)
                return clean.tail(7500).reset_index(drop=True) if len(clean) > 7500 else clean
            raise RuntimeError(
                f"Could not load data for {self.ticker}. "
                f"{'This ticker has no free auto-fetch source — upload a CSV.' if self.ticker in UAE_NO_AUTO_FETCH else 'Try again or upload a CSV.'}"
            )

        if cached is not None and len(cached) >= 80:
            clean = self._clean(cached)
            return clean.tail(7500).reset_index(drop=True) if len(clean) > 7500 else clean

        raise RuntimeError(f"Could not load data for {self.ticker}. Please upload a CSV.")

    # ── Daily fetch ──────────────────────────────────────────────────
    def _fetch_daily(self):
        if self.ticker in UAE_YAHOO_MAP:
            return self._yahoo_uae()
        return None  # ADX tickers: CSV upload only, no auto-fetch source exists

    def _yahoo_uae(self):
        """Fetch UAE DFM stocks straight from Yahoo Finance's chart endpoint.

        IMPORTANT: use range=10y, never range=max — Yahoo silently drops to
        MONTHLY granularity when range=max is combined with interval=1d, which
        was quietly starving newer listings (e.g. SALIK, DEWA, both IPO'd 2022)
        of enough rows to clear the pipeline's minimums."""
        yf_ticker = UAE_YAHOO_MAP.get(self.ticker, self.ticker)

        for base in ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]:
            try:
                r = requests.get(
                    f"{base}/v8/finance/chart/{yf_ticker}?interval=1d&range=10y",
                    headers=HDR, timeout=15)
                if r.status_code != 200:
                    continue
                result = r.json()["chart"]["result"][0]
                ts = result["timestamp"]
                q = result["indicators"]["quote"][0]
                dates = [datetime.fromtimestamp(t, tz=timezone.utc).date() for t in ts]
                df = pd.DataFrame({
                    "Date": dates,
                    "Open": q.get("open", [None] * len(ts)),
                    "High": q.get("high", [None] * len(ts)),
                    "Low": q.get("low", [None] * len(ts)),
                    "Close": q.get("close", [None] * len(ts)),
                    "Volume": [v / 1e6 if v else 0 for v in q.get("volume", [0] * len(ts))],
                })
                df["Date"] = pd.to_datetime(df["Date"])
                df = df.dropna(subset=["Close"])
                df["Change_Pct"] = df["Close"].pct_change() * 100
                df = df.sort_values("Date").drop_duplicates("Date").reset_index(drop=True)
                if len(df) >= 30:
                    return df
            except Exception:
                continue

        # Fallback: yfinance library (handles cookies/crumb itself)
        try:
            import yfinance as _yf
            _raw = _yf.download(yf_ticker, period="10y", interval="1d", progress=False, auto_adjust=True)
            if _raw is not None and len(_raw) >= 30:
                _raw = _raw.reset_index()
                if hasattr(_raw.columns, "levels"):
                    _raw.columns = [c[0] if isinstance(c, tuple) else c for c in _raw.columns]
                df = pd.DataFrame()
                df["Date"] = pd.to_datetime(_raw.get("Date", _raw.get("Datetime", _raw.index)))
                df["Open"] = pd.to_numeric(_raw.get("Open", _raw.get("open", None)), errors="coerce")
                df["High"] = pd.to_numeric(_raw.get("High", _raw.get("high", None)), errors="coerce")
                df["Low"] = pd.to_numeric(_raw.get("Low", _raw.get("low", None)), errors="coerce")
                df["Close"] = pd.to_numeric(_raw.get("Close", _raw.get("close", None)), errors="coerce")
                df["Volume"] = pd.to_numeric(_raw.get("Volume", _raw.get("volume", None)), errors="coerce").fillna(0) / 1e6
                df = df.dropna(subset=["Close"])
                df["Change_Pct"] = df["Close"].pct_change() * 100
                df = df.sort_values("Date").drop_duplicates("Date").reset_index(drop=True)
                if len(df) >= 30:
                    return df
        except Exception:
            pass
        return None

    # ── CSV parse ────────────────────────────────────────────────────
    def _parse_csv(self, f):
        raw = pd.read_csv(f)
        dc = next((c for c in raw.columns if c.lower() in ["date", "time", "datetime"]), raw.columns[0])
        for fmt in ["%m/%d/%Y", "%Y-%m-%d", "%d/%m/%Y", None]:
            try:
                raw[dc] = pd.to_datetime(raw[dc], format=fmt, errors="raise" if fmt else "coerce")
                break
            except Exception:
                continue
        raw = raw.sort_values(dc).reset_index(drop=True)

        def pv(v):
            s = str(v).strip().replace(",", "")
            if "B" in s: return float(s.replace("B", "")) * 1000
            if "M" in s: return float(s.replace("M", ""))
            if "K" in s: return float(s.replace("K", "")) / 1000
            try: return float(s)
            except Exception: return 1.0

        pc = next((c for c in raw.columns if c.lower() in ["price", "close", "adj close"]), raw.columns[1])
        df = pd.DataFrame()
        df["Date"] = raw[dc]
        df["Close"] = pd.to_numeric(raw[pc].astype(str).str.replace(",", ""), errors="coerce")
        for s in ["Open", "High", "Low"]:
            c = next((x for x in raw.columns if x.lower() == s.lower()), None)
            df[s] = pd.to_numeric(raw[c].astype(str).str.replace(",", ""), errors="coerce") if c else df["Close"]
        vc = next((c for c in raw.columns if c.lower() in ["vol.", "volume", "vol"]), None)
        df["Volume"] = raw[vc].apply(pv) if vc else 1.0
        cc = next((c for c in raw.columns if c.lower() in ["change %", "change_pct"]), None)
        df["Change_Pct"] = (raw[cc].astype(str).str.replace("%", "").astype(float)
                             if cc else df["Close"].pct_change() * 100)
        df.dropna(subset=["Close"], inplace=True)
        return df.reset_index(drop=True)

    # ── Helpers ──────────────────────────────────────────────────────
    def _load_cached(self):
        if os.path.exists(self.data_file):
            try:
                df = pd.read_csv(self.data_file, parse_dates=["Date"])
                return df if len(df) >= 30 else None
            except Exception:
                return None
        return None

    def _merge(self, existing, fresh):
        if existing is None:
            return fresh
        combined = pd.concat([existing, fresh], ignore_index=True)
        combined["Date"] = pd.to_datetime(combined["Date"])
        return combined.sort_values("Date").drop_duplicates("Date", keep="last").reset_index(drop=True)

    def _save(self, df):
        try: df.to_csv(self.data_file, index=False)
        except Exception: pass

    def _save_meta(self):
        try:
            with open(self.meta_file, "w") as f:
                json.dump({"last_updated": datetime.now(timezone.utc).isoformat(), "ticker": self.ticker}, f)
        except Exception:
            pass

    def _is_stale(self):
        if not os.path.exists(self.meta_file):
            return True
        try:
            with open(self.meta_file) as f:
                meta = json.load(f)
            if meta.get("ticker") != self.ticker:
                return True
            age = (datetime.now(timezone.utc) - datetime.fromisoformat(meta["last_updated"])).total_seconds()
            return age > 5 * 60  # stale after 5 minutes
        except Exception:
            return True

    def _clean(self, df) -> pd.DataFrame:
        df = df.copy()
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"])
            df = df.sort_values("Date").drop_duplicates("Date").reset_index(drop=True)
        df["Volume"] = pd.to_numeric(df.get("Volume", 1.0), errors="coerce")
        df["Volume"] = df["Volume"].fillna(df["Volume"].rolling(10, min_periods=1).median()).fillna(1.0)
        for col in ["Open", "High", "Low", "Change_Pct"]:
            if col not in df.columns:
                if col == "Open": df[col] = df["Close"].shift(1).fillna(df["Close"])
                elif col == "High": df[col] = df["Close"] * 1.015
                elif col == "Low": df[col] = df["Close"] * 0.985
                elif col == "Change_Pct": df[col] = df["Close"].pct_change() * 100
        for col in ["Close", "Open", "High", "Low"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df.dropna(subset=["Close"], inplace=True)
        if "Date" in df.columns:
            df.set_index("Date", inplace=True)
        return df

    # ── Static helpers ───────────────────────────────────────────────
    @staticmethod
    def get_live_price(ticker: str) -> float | None:
        if ticker in UAE_YAHOO_MAP:
            yf_ticker = UAE_YAHOO_MAP[ticker]
            try:
                import yfinance as _yf2
                _t = _yf2.Ticker(yf_ticker)
                _h = _t.history(period="5d")
                if _h is not None and len(_h) > 0:
                    return float(_h["Close"].iloc[-1])
            except Exception:
                pass
            for base in ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"]:
                try:
                    r = requests.get(
                        f"{base}/v8/finance/chart/{yf_ticker}?interval=1d&range=5d",
                        headers=HDR, timeout=5)
                    if r.status_code == 200:
                        closes = r.json()["chart"]["result"][0]["indicators"]["quote"][0]["close"]
                        p = next((c for c in reversed(closes) if c), None)
                        if p: return float(p)
                except Exception:
                    pass
            return None
        return None  # ADX tickers have no live-price source — frontend falls back to last close

    @staticmethod
    def get_ticker_name(ticker: str) -> str:
        return UAE_NAMES.get(ticker, ticker)
