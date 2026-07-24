import type {
  TickerInfo,
  PriceResponse,
  OhlcvBar,
  SignalResponse,
  ScannerResponse,
  BacktestResponse,
  PortfolioResponse,
  Settings,
  ChatMessage,
  Trade,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore — non-JSON error body
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listTickers: () => request<TickerInfo[]>("/api/tickers"),
  getPrice: (ticker: string) => request<PriceResponse>(`/api/tickers/${ticker}/price`),
  getOhlcv: (ticker: string, lookback = 90) =>
    request<{ ticker: string; bars: OhlcvBar[] }>(`/api/tickers/${ticker}/ohlcv?lookback=${lookback}`),
  getSignal: (ticker: string, confidence = 0.6) =>
    request<SignalResponse>(`/api/tickers/${ticker}/signal?confidence=${confidence}`),
  getAccuracyHistory: (ticker: string) =>
    request<{ ticker: string; history: { timestamp: string; filteredAccuracy: number; accuracy: number }[] }>(
      `/api/tickers/${ticker}/accuracy-history`
    ),
  uploadCsv: async (ticker: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/tickers/${ticker}/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.detail ?? res.statusText, res.status);
    }
    return res.json() as Promise<{ ticker: string; rows: number; message: string }>;
  },
  refreshTicker: (ticker: string) =>
    request<{ ticker: string; rows: number; message: string }>(`/api/tickers/${ticker}/refresh`, { method: "POST" }),

  getPortfolio: () => request<PortfolioResponse>("/api/portfolio"),
  addTrade: (trade: { ticker: string; side: "BUY" | "SELL"; entry: number; size: number; tp?: number; sl?: number; note?: string }) =>
    request<Trade>("/api/portfolio", { method: "POST", body: JSON.stringify(trade) }),
  closeTrade: (id: string, exitPrice: number) =>
    request<Trade>(`/api/portfolio/${id}/close`, { method: "PATCH", body: JSON.stringify({ exitPrice }) }),
  deleteTrade: (id: string) => request<{ deleted: string }>(`/api/portfolio/${id}`, { method: "DELETE" }),

  getActiveSignals: () => request<{ signals: unknown[] }>("/api/signals/active"),
  getClosedSignals: () => request<{ signals: unknown[] }>("/api/signals/closed"),

  getSettings: () => request<Settings>("/api/settings"),
  updateSettings: (patch: Partial<{ confidenceThresh: number; lookbackDays: number; lastTicker: string }>) =>
    request<Settings>("/api/settings", { method: "POST", body: JSON.stringify(patch) }),

  runScan: (confidence = 0.6) => request<ScannerResponse>(`/api/scanner?confidence=${confidence}`, { method: "POST" }),

  runBacktest: (ticker: string, params: { startingCapital: number; tradeSizePct: number; confidence: number }) =>
    request<BacktestResponse>(
      `/api/backtest/${ticker}?startingCapital=${params.startingCapital}&tradeSizePct=${params.tradeSizePct}&confidence=${params.confidence}`,
      { method: "POST" }
    ),

  chat: (ticker: string, message: string, history: ChatMessage[]) =>
    request<{ role: string; content: string }>("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ ticker, message, history }),
    }),
};
