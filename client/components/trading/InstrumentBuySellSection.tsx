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
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Buy/Sell Section */}
        <div className="w-full lg:w-1/2 lg:min-w-[400px]">
          <BuySellSection
            exchangeToken={currentInstrument.exchange_token}
            tradingSymbol={currentInstrument.trading_symbol}
            instrumentName={currentInstrument.name || title || ""}
            currentPrice={currentPrice}
            lotSize={currentInstrument.lot_size}
            exchange={currentInstrument.exchange}
            segment={currentInstrument.segment}
            leverage={currentInstrument.leverage}
          />
        </div>

        {/* Holdings Section */}
        <div className="w-full lg:flex-1">
          <HoldingsSection />
        </div>
      </div>
    </div>
  );
}
