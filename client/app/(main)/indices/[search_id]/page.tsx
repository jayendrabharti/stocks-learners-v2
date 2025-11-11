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
      <InstrumentDataSection />
      <InstrumentBuySellSection />
    </InstrumentProvider>
  );
}
