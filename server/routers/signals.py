from fastapi import APIRouter

import persistence

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("/active")
def active_signals():
    all_sigs = persistence.load_active_signals()
    tracked = [
        {"ticker": t, **s}
        for t, s in all_sigs.items()
        if not t.endswith("_prev") and s.get("status") in ("ACTIVE", "HIT_TP", "HIT_SL")
    ]
    tracked.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
    return {"signals": tracked}


@router.get("/closed")
def closed_signals():
    history = persistence.load_closed_signals()
    return {"signals": list(reversed(history))}
