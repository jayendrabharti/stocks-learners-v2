"use client";

import { BuySellSection, HoldingsSection } from "@/components/portfolio";
import { useInstrument } from "./InstrumentProvider";

export function InstrumentBuySellSection() {
  const { currentInstrument, currentPrice, title } = useInstrument();

  // Wait for instrument data to load
  if (!currentInstrument) {
    return null;
  }

  return (
    <div className="w-full px-4 py-6">
      {/* Desktop: Side by side, Mobile: Stacked */}
      <div className="flex flex-row gap-6 lg:flex-col">
        {/* Buy/Sell Section */}
        <div className="flex-1">
          <BuySellSection
            exchangeToken={currentInstrument.exchange_token}
            tradingSymbol={currentInstrument.trading_symbol}
            instrumentName={currentInstrument.name || title || ""}
            currentPrice={currentPrice}
            lotSize={currentInstrument.lot_size}
            exchange={currentInstrument.exchange}
            segment={currentInstrument.segment}
          />
        </div>

        {/* Holdings Section */}
        <div className="flex-1">
          <HoldingsSection />
        </div>
      </div>
    </div>
  );
}
