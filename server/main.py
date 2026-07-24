import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import tickers, portfolio, signals, settings, scanner, backtest, assistant

app = FastAPI(title="DFM Trading Platform API", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
extra_origin = os.environ.get("FRONTEND_ORIGIN")
if extra_origin:
    ALLOWED_ORIGINS.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickers.router)
app.include_router(portfolio.router)
app.include_router(signals.router)
app.include_router(settings.router)
app.include_router(scanner.router)
app.include_router(backtest.router)
app.include_router(assistant.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
