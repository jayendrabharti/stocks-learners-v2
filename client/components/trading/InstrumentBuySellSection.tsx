"use client";

import { Card } from "@/components/ui/card";
import { useInstrument } from "./InstrumentProvider";

export function InstrumentBuySellSection() {
  const { metadata, currentPrice, title } = useInstrument();

  return (
    <div className="w-full max-w-full px-4 py-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Buy/Sell {title || "..."}</h2>
          <div className="text-muted-foreground text-sm">
            Buy/Sell section placeholder - UI and functionality coming soon
          </div>
          <div className="border-muted mt-4 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Current Price: ₹{currentPrice || "..."}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              • Order placement interface
            </p>
            <p className="text-muted-foreground text-sm">
              • Quantity and price controls
            </p>
            <p className="text-muted-foreground text-sm">
              • Market/Limit order options
            </p>
            <p className="text-muted-foreground text-sm">
              • Portfolio integration
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
