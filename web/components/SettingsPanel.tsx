"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useDashboardStore } from "@/lib/store";

export function SettingsPanel() {
  const confidence = useDashboardStore((s) => s.confidence);
  const setConfidence = useDashboardStore((s) => s.setConfidence);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon">
            <Settings2 className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent className="w-72">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Signal Confidence Threshold — {(confidence * 100).toFixed(0)}%
          </Label>
          <Slider
            value={[confidence]}
            min={0.5}
            max={0.8}
            step={0.01}
            onValueChange={(v) => setConfidence(Array.isArray(v) ? v[0] : v)}
          />
          <p className="pt-1 text-xs text-muted-foreground">Higher = fewer but more reliable signals. Affects the 7-day outlook only.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
