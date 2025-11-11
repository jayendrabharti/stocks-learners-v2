"use client";

import {
  InstrumentProvider,
  InstrumentDataSection,
  InstrumentBuySellSection,
} from "@/components/trading";
import { useParams } from "next/navigation";

export default function OptionPage() {
  const { search_id, trading_symbol } = useParams();

  return (
    <InstrumentProvider
      config={{
        variant: "option",
        searchId: search_id as string,
        tradingSymbol: trading_symbol as string,
      }}
    >
      <InstrumentDataSection />
      <InstrumentBuySellSection />
    </InstrumentProvider>
  );
}
