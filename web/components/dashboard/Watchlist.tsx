"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star, X } from "lucide-react";
import { Panel, PanelLabel } from "../Panel";
import { EmptyState } from "../EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { fmtPrice, signalColor } from "@/lib/format";
import type { TickerInfo } from "@/lib/types";

const POLL_MS = 60_000;
const lastSignalKey = (ticker: string) => `dfm-watch-last-${ticker}`;

function WatchlistRow({ ticker, onRemove }: { ticker: string; onRemove: () => void }) {
  const priceQ = useApi(() => api.getPrice(ticker), [ticker]);
  const signalQ = useApi(() => api.getSignal(ticker), [ticker]);
  // A plain ref (not state) drives the flip comparison so it's immune to
  // React 18/19 dev StrictMode's double-invoke of effects — localStorage is
  // only touched to seed/persist across page reloads, never read mid-compare.
  const lastSeenRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!signalQ.data) return;
    const current = signalQ.data.signal.value;
    if (lastSeenRef.current === undefined) {
      try {
        const stored = window.localStorage.getItem(lastSignalKey(ticker));
        lastSeenRef.current = stored ? (JSON.parse(stored) as string) : null;
      } catch {
        lastSeenRef.current = null;
      }
    }
    if (lastSeenRef.current !== null && lastSeenRef.current !== current) {
      toast(`${ticker} flipped to ${current}`, {
        description: `${signalQ.data.signal.confidencePct.toFixed(0)}% confidence · just now`,
      });
    }
    if (lastSeenRef.current !== current) {
      lastSeenRef.current = current;
      try {
        window.localStorage.setItem(lastSignalKey(ticker), JSON.stringify(current));
      } catch {
        // ignore quota errors
      }
    }
  }, [signalQ.data, ticker]);

  useEffect(() => {
    const id = setInterval(() => {
      priceQ.refetch();
      signalQ.refetch();
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const sig = signalQ.data?.signal.value ?? "—";

  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/40">
      <div>
        <div className="text-xs font-semibold text-foreground">{ticker}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{priceQ.data ? fmtPrice(priceQ.data.price) : "—"}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: signalColor(sig) }}>
          {sig}
        </span>
        <button onClick={onRemove} className="text-muted-foreground hover:text-[var(--sell)]" aria-label={`Remove ${ticker}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Watchlist({ tickers }: { tickers: TickerInfo[] }) {
  const [watched, setWatched] = useLocalStorage<string[]>("dfm-watchlist", []);

  const available = tickers.filter((t) => !watched.includes(t.ticker));

  return (
    <Panel hover>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-[var(--warn)]" />
          <PanelLabel dotColor="var(--warn)">Watchlist</PanelLabel>
        </div>
        {available.length > 0 && (
          <Select
            onValueChange={(v) => {
              if (typeof v === "string") setWatched([...watched, v]);
            }}
          >
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <SelectValue placeholder="Add ticker" />
            </SelectTrigger>
            <SelectContent>
              {available.map((t) => (
                <SelectItem key={t.ticker} value={t.ticker}>
                  {t.ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {watched.length === 0 ? (
        <EmptyState icon="⭐" title="No tickers watched" description="Add a ticker above to track its price and get notified when the signal flips." />
      ) : (
        <div className="mt-1 space-y-0.5">
          {watched.map((t, i) => (
            <motion.div key={t} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <WatchlistRow ticker={t} onRemove={() => setWatched(watched.filter((w) => w !== t))} />
            </motion.div>
          ))}
        </div>
      )}
    </Panel>
  );
}
