export type TickerInfo = {
  ticker: string;
  name: string;
  exchange: "DFM" | "ADX";
  autoFetch: boolean;
  tvSymbol: string | null;
  investingSlug: string | null;
};

export type PriceResponse = {
  ticker: string;
  price: number;
  isLive: boolean;
};

export type OhlcvBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SignalValue = "BUY" | "SELL" | "HOLD";

export type OutlookDay = {
  date: string;
  label: string;
  signal: SignalValue;
  confidencePct: number;
  entry: number;
  takeProfit: number | null;
  stopLoss: number | null;
  riskReward: number;
};

export type ModelMetric = { accuracy: number; f1: number; auc: number };

export type ActiveSignalStatus = {
  status: "NONE" | "ACTIVE" | "HIT_TP" | "HIT_SL" | "EXPIRED";
  message: string;
  pnl_pct: number;
  hours_old?: number;
  remaining_h?: number;
  valid_until?: boolean;
  signal?: string;
  entry?: number;
  tp?: number | null;
  sl?: number | null;
};

export type SignalHistoryRow = {
  Date: string;
  Price: string;
  Signal: string;
  "P(UP)": string;
  Confidence: string;
};

export type AllSignalRow = {
  Date: string;
  Price: string;
  Signal: string;
  Confidence: string;
};

export type SignalResponse = {
  ticker: string;
  name: string;
  tvSymbol: string | null;
  investingSlug: string | null;
  price: { display: number; lastClose: number; dayChangePct: number; isLive: boolean };
  signal: {
    value: SignalValue;
    confidencePct: number;
    probUp: number;
    entry: number;
    takeProfit: number | null;
    stopLoss: number | null;
    riskReward: number;
    atr: number;
  };
  activeSignalStatus: ActiveSignalStatus;
  outlook7d: OutlookDay[];
  modelMetrics: Record<string, ModelMetric>;
  ensemble: {
    accuracy: number;
    filteredAccuracy: number;
    f1: number;
    auc: number;
    bestModel: string;
    modelsUsed: string[];
    modelsExcluded: string[];
  };
  confusionMatrix: number[][];
  rocCurve: { fpr: number; tpr: number }[];
  predictedVsActual: { date: string; actual: number; predicted: number }[];
  priceError: { rmse: number; mae: number; mape: number };
  signalHistory: SignalHistoryRow[];
  allSignals: AllSignalRow[];
  dataPoints: number;
};

export type ScannerResult = {
  ticker: string;
  name?: string;
  price?: number;
  signal: string;
  confidencePct: number;
  probUp?: number;
  accuracyPct?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  riskReward?: number;
  error: string | null;
};

export type ScannerResponse = {
  scannedAt: string;
  results: ScannerResult[];
  summary: { total: number; buy: number; sell: number; hold: number; bias: string };
};

export type BacktestTrade = {
  date: string;
  signal: string;
  entry: number;
  exit: number;
  result: "Win" | "Loss";
  pnl: number;
  capital: number;
};

export type BacktestResponse = {
  ticker: string;
  trades: BacktestTrade[];
  equityCurve: number[];
  metrics: {
    finalCapital: number;
    totalReturnPct: number;
    winRatePct: number;
    wins: number;
    losses: number;
    maxDrawdownPct: number;
    totalTrades: number;
  } | null;
  message?: string;
};

export type Trade = {
  id: string;
  date: string;
  ticker: string;
  side: "BUY" | "SELL";
  entry: number;
  size: number;
  tp: number;
  sl: number;
  status: "Open" | "Closed";
  exit: number | null;
  pnl: number | null;
  note: string;
  livePrice: number;
  pnlPct: number;
};

export type PortfolioResponse = {
  trades: Trade[];
  summary: { totalTrades: number; openPositions: number; totalPnl: number; roiPct: number };
};

export type Settings = {
  confidenceThresh: number;
  lookbackDays: number;
  lastTicker: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
