"""
signal_engine.py — shared signal computation used by the /tickers/{ticker}/signal
and /scanner endpoints. Ports the math from the original Streamlit app.py
(entry/TP/SL sizing, 7-day outlook decay, model performance summaries) into a
single JSON-serializable builder.
"""
import math
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, roc_curve

from data_manager import DataManager
from feature_engine import build_features
from model_engine import ModelEngine
import persistence

DUBAI_OFFSET = timedelta(hours=4)


def _next_trading_dates(start_date, n: int):
    """Ported as-is from the original app.py: skips Sat/Sun (weekday>=5).
    Note DFM/ADX actually trade Sun-Thu (weekend is Fri/Sat) — the original
    app never corrected for this, so this keeps parity with its behavior."""
    dates = []
    d = start_date
    while len(dates) < n:
        d = d + timedelta(days=1)
        if d.weekday() < 5:
            dates.append(d)
    return dates


def _clean_float(x, default=0.0):
    try:
        x = float(x)
        return x if math.isfinite(x) else default
    except Exception:
        return default


def compute_signal(ticker: str, confidence_thresh: float = 0.60) -> dict:
    dm = DataManager(ticker)
    df = dm.get_data()
    df_feat = build_features(df)

    engine = ModelEngine(df_feat)
    results = engine.train(verbose=False, sentiment_score=0.0)

    last_close = float(df_feat["Close"].iloc[-1])
    prev_close = float(df_feat["Close"].iloc[-2])
    day_chg = (last_close - prev_close) / prev_close * 100

    live_price = DataManager.get_live_price(ticker)
    display_price = live_price if (live_price and live_price > 0) else last_close
    if not display_price or display_price != display_price:
        display_price = last_close

    last_prob = float(results["last_prob"])
    last_sig = results["last_signal"]
    last_conf = float(results["last_confidence"])

    atr_raw = float(df_feat["ATR"].dropna().iloc[-1]) if ("ATR" in df_feat.columns and len(df_feat["ATR"].dropna()) > 0) else 0
    last_atr = atr_raw if (atr_raw > 0 and atr_raw == atr_raw) else display_price * 0.025

    conf_mult = max(0.6, min(1.5, 0.8 + (last_conf - 60) / 100))
    max_dist = conf_mult * last_atr  # no per-asset dollar cap for DFM/UAE tickers
    tp_dist = min(conf_mult * last_atr, max_dist)
    sl_dist = tp_dist * 0.9

    if last_sig == "BUY":
        entry_p = round(display_price, 4)
        tp_price = round(display_price + tp_dist, 4)
        sl_price = round(display_price - sl_dist, 4)
    elif last_sig == "SELL":
        entry_p = round(display_price, 4)
        tp_price = round(display_price - tp_dist, 4)
        sl_price = round(display_price + sl_dist, 4)
    else:
        entry_p = round(display_price, 4)
        tp_price = None
        sl_price = None

    if last_sig == "HOLD":
        rr = 0.0
    else:
        rr = abs(tp_price - entry_p) / max(abs(entry_p - sl_price), 0.0001)

    # ── 7-day forward outlook (weekday-only, confidence decays with distance) ──
    now_dubai = datetime.now(timezone.utc) + DUBAI_OFFSET
    today_date = now_dubai.date()
    trading_dates = _next_trading_dates(today_date, 7)
    outlook = []
    for i, d7 in enumerate(trading_dates):
        p7 = 0.5 + (last_prob - 0.5) * math.exp(-0.30 * i)
        c7 = max(p7, 1 - p7) * 100
        s7 = "BUY" if p7 >= confidence_thresh else "SELL" if p7 <= (1 - confidence_thresh) else "HOLD"
        atr7 = last_atr * (1 + 0.01 * i)
        cap7 = display_price * 0.009
        dist7 = min(conf_mult * atr7, cap7)
        if s7 == "BUY":
            tp7, sl7 = round(display_price + dist7, 4), round(display_price - dist7 * 0.9, 4)
        elif s7 == "SELL":
            tp7, sl7 = round(display_price - dist7, 4), round(display_price + dist7 * 0.9, 4)
        else:
            tp7 = sl7 = None
        rr7 = abs(tp7 - display_price) / max(abs(display_price - sl7), 0.0001) if tp7 else 0.0
        outlook.append({
            "date": d7.isoformat(),
            "label": d7.strftime("%a %d %b"),
            "signal": s7,
            "confidencePct": round(c7, 1),
            "entry": round(display_price, 4),
            "takeProfit": tp7,
            "stopLoss": sl7,
            "riskReward": round(rr7, 2),
        })

    # ── Model performance: per-model metrics + confusion matrix + ROC ──
    y_te = np.asarray(results["y_te"])
    ens_proba = np.asarray(results["ens_proba"])
    ens_pred = np.asarray(results["ens_pred"])

    model_metrics = {}
    for name, md in results["model_data"].items():
        model_metrics[name] = {
            "accuracy": _clean_float(md["acc"]),
            "f1": _clean_float(md["f1"]),
            "auc": _clean_float(md["auc"]),
        }

    cm = confusion_matrix(y_te, ens_pred, labels=[0, 1]).tolist() if len(y_te) > 0 else [[0, 0], [0, 0]]
    if len(np.unique(y_te)) > 1:
        fpr, tpr, _ = roc_curve(y_te, ens_proba)
        # thin to at most ~60 points for a clean, light JSON payload
        idx = np.linspace(0, len(fpr) - 1, min(60, len(fpr))).astype(int)
        roc_points = [{"fpr": _clean_float(fpr[i]), "tpr": _clean_float(tpr[i])} for i in idx]
    else:
        roc_points = []

    # ── Predicted vs actual price ──
    price_pred = np.asarray(results["price_pred"])
    y_price_te = np.asarray(results["y_price_te"])
    te_df = results["te_df"]
    n = min(len(te_df), len(price_pred), len(y_price_te))
    te_dates = [str(d)[:10] for d in te_df.index[-n:]]
    pred_vs_actual = [
        {"date": te_dates[i], "actual": _clean_float(y_price_te[-n:][i]), "predicted": _clean_float(price_pred[-n:][i])}
        for i in range(n)
    ]
    denom = np.where(y_price_te[-n:] != 0, y_price_te[-n:], np.nan)
    mape = float(np.nanmean(np.abs((y_price_te[-n:] - price_pred[-n:]) / denom)) * 100) if n > 0 else 0.0

    # ── Signal history + all rich signals ──
    sig_hist = results["signal_history"].to_dict("records") if len(results["signal_history"]) else []
    multi_signals = results["multi_signals"].to_dict("records") if len(results["multi_signals"]) else []

    # ── Persist active-signal tracking (TP/SL watch, closed-signal log) ──
    prev_status = persistence.load_active_signals().get(ticker, {}).get("status")
    status_info = persistence.update_signal_status(ticker, last_sig, display_price, tp_price, sl_price, display_price)
    if status_info["status"] in ("HIT_TP", "HIT_SL") and prev_status not in ("HIT_TP", "HIT_SL"):
        exit_p = tp_price if status_info["status"] == "HIT_TP" else sl_price
        if exit_p and entry_p:
            persistence.save_closed_signal(
                ticker=ticker, signal=last_sig, entry=entry_p, exit_price=exit_p,
                tp=tp_price or 0, sl=sl_price or 0, result=status_info["status"],
            )

    persistence.record_accuracy(ticker, results["ensemble_filt_acc"], results["ensemble_acc"])

    from data_manager import TV_MAP, INVESTING_SLUGS, UAE_NAMES

    return {
        "ticker": ticker,
        "name": UAE_NAMES.get(ticker, ticker),
        "tvSymbol": TV_MAP.get(ticker),
        "investingSlug": INVESTING_SLUGS.get(ticker),
        "price": {
            "display": round(display_price, 4),
            "lastClose": round(last_close, 4),
            "dayChangePct": round(day_chg, 2),
            "isLive": bool(live_price),
        },
        "signal": {
            "value": last_sig,
            "confidencePct": round(last_conf, 1),
            "probUp": round(last_prob * 100, 1),
            "entry": entry_p,
            "takeProfit": tp_price,
            "stopLoss": sl_price,
            "riskReward": round(rr, 2),
            "atr": round(last_atr, 4),
        },
        "activeSignalStatus": status_info,
        "outlook7d": outlook,
        "modelMetrics": model_metrics,
        "ensemble": {
            "accuracy": _clean_float(results["ensemble_acc"]),
            "filteredAccuracy": _clean_float(results["ensemble_filt_acc"]),
            "f1": _clean_float(results["ensemble_f1"]),
            "auc": _clean_float(results["ensemble_auc"]),
            "bestModel": results["best_model"],
            "modelsUsed": results["ensemble_models"],
            "modelsExcluded": results["excluded_models"],
        },
        "confusionMatrix": cm,
        "rocCurve": roc_points,
        "predictedVsActual": pred_vs_actual,
        "priceError": {"rmse": _clean_float(results["rmse"]), "mae": _clean_float(results["mae"]), "mape": _clean_float(mape)},
        "signalHistory": sig_hist,
        "allSignals": multi_signals,
        "dataPoints": len(df_feat),
    }


def get_ohlcv(ticker: str, lookback_days: int = 90) -> list:
    dm = DataManager(ticker)
    df = dm.get_data()
    tail = df.tail(lookback_days)
    out = []
    for idx, row in tail.iterrows():
        out.append({
            "date": str(idx)[:10],
            "open": _clean_float(row["Open"]),
            "high": _clean_float(row["High"]),
            "low": _clean_float(row["Low"]),
            "close": _clean_float(row["Close"]),
            "volume": _clean_float(row.get("Volume", 0)),
        })
    return out
