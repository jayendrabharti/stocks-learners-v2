"use client";

import React, { createContext, useContext } from "react";
import { useInstrumentData } from "./useInstrumentData";
import type { InstrumentContextValue, InstrumentPageConfig } from "./types";

const InstrumentContext = createContext<InstrumentContextValue | null>(null);

export function InstrumentProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config: InstrumentPageConfig;
}) {
  const instrumentData = useInstrumentData(config);

  return (
    <InstrumentContext.Provider value={instrumentData}>
      {children}
    </InstrumentContext.Provider>
  );
}

export function useInstrument() {
  const context = useContext(InstrumentContext);
  if (!context) {
    throw new Error("useInstrument must be used within InstrumentProvider");
  }
  return context;
}
