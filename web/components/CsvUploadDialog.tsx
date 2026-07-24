"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import type { TickerInfo } from "@/lib/types";

export function CsvUploadDialog({ ticker, onUploaded }: { ticker: TickerInfo; onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function submit() {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadCsv(ticker.ticker, file);
      toast.success(`Uploaded ${res.rows} rows for ${ticker.ticker}`);
      setOpen(false);
      setFile(null);
      onUploaded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload price history for {ticker.name}</DialogTitle>
          <DialogDescription>
            {ticker.autoFetch
              ? "This ticker auto-fetches from Yahoo Finance, but you can override with your own CSV."
              : "This ticker has no free auto-fetch source — a CSV upload is required to compute signals."}
            {" "}Expects columns: Date, Open, High, Low, Close/Price, Volume.
          </DialogDescription>
        </DialogHeader>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
        />
        <DialogFooter>
          <Button onClick={submit} disabled={!file || uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
