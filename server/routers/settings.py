from fastapi import APIRouter
from pydantic import BaseModel

import persistence

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingsUpdate(BaseModel):
    confidenceThresh: float | None = None
    lookbackDays: int | None = None
    lastTicker: str | None = None


@router.get("")
def get_settings():
    s = persistence.load_settings()
    return {
        "confidenceThresh": s["confidence_thresh"],
        "lookbackDays": s["lookback_days"],
        "lastTicker": s["last_ticker"],
    }


@router.post("")
def update_settings(body: SettingsUpdate):
    current = persistence.load_settings()
    if body.confidenceThresh is not None:
        current["confidence_thresh"] = body.confidenceThresh
    if body.lookbackDays is not None:
        current["lookback_days"] = body.lookbackDays
    if body.lastTicker is not None:
        current["last_ticker"] = body.lastTicker
    persistence.save_settings(current)
    return {
        "confidenceThresh": current["confidence_thresh"],
        "lookbackDays": current["lookback_days"],
        "lastTicker": current["last_ticker"],
    }
