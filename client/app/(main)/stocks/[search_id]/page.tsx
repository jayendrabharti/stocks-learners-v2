"use client";

import {
  InstrumentProvider,
  InstrumentDataSection,
  InstrumentBuySellSection,
} from "@/components/trading";
import { useParams } from "next/navigation";

export default function StockPage() {
  const { search_id } = useParams();

  return (
    <InstrumentProvider
      config={{
        variant: "stock",
        searchId: search_id as string,
      }}
    >
      <div className="mx-auto flex w-full flex-col lg:flex-row">
        {/* Top: Header and Chart section */}
        <div className="w-full flex-2">
          <InstrumentDataSection />
        </div>

        {/* Bottom: Buy/Sell and Holdings side by side */}
        <div className="w-full flex-1">
          <InstrumentBuySellSection />
        </div>
      </div>
    </InstrumentProvider>
  );
}
