"use client";

import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TickerSelector } from "@/components/TickerSelector";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { HeroPrice } from "@/components/HeroPrice";
import { SevenDayOutlook } from "@/components/SevenDayOutlook";
import { AIAssistant } from "@/components/AIAssistant";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/Panel";
import { LiveChart } from "@/components/tabs/LiveChart";
import { PriceAndSignals } from "@/components/tabs/PriceAndSignals";
import { PredictedVsActual } from "@/components/tabs/PredictedVsActual";
import { ModelPerformance } from "@/components/tabs/ModelPerformance";
import { SignalHistory } from "@/components/tabs/SignalHistory";
import { Scanner } from "@/components/tabs/Scanner";
import { Backtest } from "@/components/tabs/Backtest";
import { StatRow } from "@/components/dashboard/StatRow";
import { SignalConfidenceCard } from "@/components/dashboard/SignalConfidenceCard";
import { ModelEnsembleDonut } from "@/components/dashboard/ModelEnsembleDonut";
import { RecentSignalsBook } from "@/components/dashboard/RecentSignalsBook";
import { ComparisonMiniCards } from "@/components/dashboard/ComparisonMiniCards";
import { EnsembleAccuracyCard } from "@/components/dashboard/EnsembleAccuracyCard";
import { TopMoversCard } from "@/components/dashboard/TopMoversCard";
import { PortfolioMiniCard } from "@/components/dashboard/PortfolioMiniCard";
import { AISignalTeaser } from "@/components/dashboard/AISignalTeaser";
import { TradingSignalCard } from "@/components/dashboard/TradingSignalCard";
import { PositionSizeCalculator } from "@/components/dashboard/PositionSizeCalculator";
import { Watchlist } from "@/components/dashboard/Watchlist";
import { RollingAccuracyCard } from "@/components/dashboard/RollingAccuracyCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/useApi";
import { api, ApiError } from "@/lib/api";
import { useDashboardStore } from "@/lib/store";
import { useState } from "react";

const HERO_RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "ALL", days: 3650 },
];

const staggerColumn = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const ticker = useDashboardStore((s) => s.ticker);
  const setTicker = useDashboardStore((s) => s.setTicker);
  const confidence = useDashboardStore((s) => s.confidence);
  const lookbackDays = useDashboardStore((s) => s.lookbackDays);
  const setLookbackDays = useDashboardStore((s) => s.setLookbackDays);
  const lastScan = useDashboardStore((s) => s.lastScan);
  const [activeTab, setActiveTab] = useState("chart");

  const tickersQ = useApi(() => api.listTickers(), []);
  const signalQ = useApi(() => api.getSignal(ticker, confidence), [ticker, confidence]);

  const activeTicker = tickersQ.data?.find((t) => t.ticker === ticker);

  async function forceRefresh() {
    try {
      await api.refreshTicker(ticker);
      toast.success(`Refreshed data for ${ticker}`);
      signalQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Refresh failed");
    }
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">AI-driven signals for DFM &amp; ADX-listed equities</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tickersQ.data && <TickerSelector tickers={tickersQ.data} value={ticker} onChange={setTicker} />}
            {activeTicker && <CsvUploadDialog ticker={activeTicker} onUploaded={() => signalQ.refetch()} />}
            <Button variant="outline" size="icon" onClick={forceRefresh} title="Force refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <SettingsPanel />
          </div>
        </div>

        {signalQ.loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        )}

        {signalQ.error && !signalQ.loading && (
          <EmptyState icon="⚠️" title={`Could not load data for ${ticker}`} description={signalQ.error} />
        )}

        {signalQ.data && !signalQ.loading && (
          <>
            <Panel tilt className="flex flex-wrap items-start justify-between gap-4">
              <HeroPrice signal={signalQ.data} dataPoints={signalQ.data.dataPoints} />
              <div className="flex gap-1">
                {HERO_RANGES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setLookbackDays(r.days)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      lookbackDays === r.days ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Panel>

            <StatRow ticker={ticker} signal={signalQ.data} />

            <div className="grid gap-4 xl:grid-cols-[280px_1fr_300px]">
              {/* Left column */}
              <motion.div variants={staggerColumn} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={staggerItem}>
                  <SignalConfidenceCard signal={signalQ.data} />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <ModelEnsembleDonut signal={signalQ.data} />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <RollingAccuracyCard ticker={ticker} />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <RecentSignalsBook ticker={ticker} rows={signalQ.data.signalHistory} />
                </motion.div>
              </motion.div>

              {/* Center column */}
              <motion.div variants={staggerColumn} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={staggerItem}>
                  <PriceAndSignals ticker={ticker} signalHistory={signalQ.data.signalHistory} />
                </motion.div>
                {tickersQ.data && (
                  <motion.div variants={staggerItem}>
                    <ComparisonMiniCards ticker={ticker} tickers={tickersQ.data} />
                  </motion.div>
                )}
                <motion.div variants={staggerItem}>
                  <PositionSizeCalculator signal={signalQ.data} />
                </motion.div>
              </motion.div>

              {/* Right column */}
              <motion.div variants={staggerColumn} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={staggerItem}>
                  <EnsembleAccuracyCard signal={signalQ.data} />
                </motion.div>
                {tickersQ.data && (
                  <motion.div variants={staggerItem}>
                    <Watchlist tickers={tickersQ.data} />
                  </motion.div>
                )}
                <motion.div variants={staggerItem}>
                  <TopMoversCard scan={lastScan} onViewAll={() => setActiveTab("scanner")} />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <PortfolioMiniCard />
                </motion.div>
                <motion.div variants={staggerItem}>
                  <AISignalTeaser signal={signalQ.data} onClick={() => setActiveTab("history")} />
                </motion.div>
              </motion.div>
            </div>

            <TradingSignalCard signal={signalQ.data} />

            <SevenDayOutlook outlook={signalQ.data.outlook7d} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
              <TabsList className="scrollbar-thin flex-wrap justify-start overflow-x-auto">
                <TabsTrigger value="chart">Live Chart</TabsTrigger>
                <TabsTrigger value="predicted">Predicted vs Actual</TabsTrigger>
                <TabsTrigger value="performance">Model Performance</TabsTrigger>
                <TabsTrigger value="history">Signal History</TabsTrigger>
                <TabsTrigger value="scanner">Scanner</TabsTrigger>
                <TabsTrigger value="backtest">Backtest</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <LiveChart signal={signalQ.data} />
              </TabsContent>
              <TabsContent value="predicted">
                <PredictedVsActual signal={signalQ.data} />
              </TabsContent>
              <TabsContent value="performance">
                <ModelPerformance signal={signalQ.data} />
              </TabsContent>
              <TabsContent value="history">
                <SignalHistory rows={signalQ.data.signalHistory} />
              </TabsContent>
              <TabsContent value="scanner">
                <Scanner />
              </TabsContent>
              <TabsContent value="backtest">
                <Backtest ticker={ticker} />
              </TabsContent>
            </Tabs>

            <AIAssistant ticker={ticker} />
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
