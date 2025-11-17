"use client";

import {
  InstrumentProvider,
  InstrumentDataSection,
  InstrumentBuySellSection,
} from "@/components/trading";
import { useParams } from "next/navigation";

export default function IndexPage() {
  const { search_id } = useParams();

  return (
    <InstrumentProvider
      config={{
        variant: "index",
        searchId: search_id as string,
      }}
    >
      <div className="mx-auto flex w-full flex-col gap-6 lg:flex-row">
        {/* Left: Header and Chart section */}
        <div className="w-full lg:w-2/3">
          <InstrumentDataSection />
        </div>

        {/* Right: Buy/Sell and Holdings section */}
        <div className="w-full lg:w-1/3">
          <InstrumentBuySellSection />
        </div>
      </div>
    </InstrumentProvider>
  );
}
