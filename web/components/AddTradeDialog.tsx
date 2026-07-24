"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import type { TickerInfo } from "@/lib/types";

export function AddTradeDialog({ tickers, onAdded }: { tickers: TickerInfo[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(tickers[0]?.ticker ?? "");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState(0);
  const [size, setSize] = useState(1);
  const [tp, setTp] = useState(0);
  const [sl, setSl] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!ticker || entry <= 0 || size <= 0) {
      toast.error("Ticker, entry price, and size are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.addTrade({ ticker, side, entry, size, tp, sl, note });
      toast.success(`Trade added: ${side} ${ticker} @ $${entry}`);
      setOpen(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not add trade");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Trade
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Trade</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Asset</Label>
            <Select value={ticker} onValueChange={(v) => v && setTicker(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tickers.map((t) => (
                  <SelectItem key={t.ticker} value={t.ticker}>{t.name} ({t.ticker})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Side</Label>
            <Select value={side} onValueChange={(v) => v && setSide(v as "BUY" | "SELL")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">BUY</SelectItem>
                <SelectItem value="SELL">SELL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Entry Price ($)</Label>
            <Input type="number" step="0.0001" value={entry} onChange={(e) => setEntry(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Position Size</Label>
            <Input type="number" step="0.0001" value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Take Profit ($)</Label>
            <Input type="number" step="0.0001" value={tp} onChange={(e) => setTp(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs text-muted-foreground">Stop Loss ($)</Label>
            <Input type="number" step="0.0001" value={sl} onChange={(e) => setSl(Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <Label className="mb-1.5 text-xs text-muted-foreground">Notes (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Signal confidence 73%" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? "Adding…" : "Add Trade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
