# Trading Instrument Components

This folder contains generalized components for rendering stock, index, option, and future instrument pages.

## Components

### 1. `InstrumentProvider`

A context provider that manages all instrument-related data and state.

### 2. `InstrumentPage`

The presentational component that renders the instrument UI (header, chart, controls).

### 3. `useInstrumentData`

Custom hook that handles all data fetching and business logic.

### 4. `useInstrument`

Hook to access instrument data within any component wrapped by `InstrumentProvider`.

## Usage

### Basic Page Setup

```tsx
"use client";

import { InstrumentProvider, InstrumentPage } from "@/components/trading";
import { useParams } from "next/navigation";

export default function StockPage() {
  const { search_id } = useParams();

  return (
    <InstrumentProvider
      config={{
        variant: "stock", // "stock" | "index" | "option" | "future"
        searchId: search_id as string,
        // tradingSymbol is required for "option" and "future"
      }}
    >
      <InstrumentPage />
    </InstrumentProvider>
  );
}
```

### Using Instrument Data in Custom Components

You can create additional components that use the instrument data:

```tsx
"use client";

import { useInstrument } from "@/components/trading";

export function CustomInstrumentWidget() {
  const {
    metadata,
    liveData,
    currentPrice,
    positiveChange,
    changeValue,
    changePerc,
  } = useInstrument();

  return (
    <div>
      <h3>{metadata?.displayName}</h3>
      <p>Price: ₹{currentPrice}</p>
      <p className={positiveChange ? "text-green-600" : "text-red-600"}>
        {positiveChange && "+"}
        {changeValue.toFixed(2)} ({changePerc.toFixed(2)}%)
      </p>
    </div>
  );
}
```

Then use it in your page:

```tsx
export default function StockPage() {
  const { search_id } = useParams();

  return (
    <InstrumentProvider
      config={{ variant: "stock", searchId: search_id as string }}
    >
      <InstrumentPage />
      <CustomInstrumentWidget /> {/* Has access to all instrument data */}
    </InstrumentProvider>
  );
}
```

## Configuration

### Variant Types

- **`stock`**: Regular equity stocks
  - Uses ISIN for instrument lookup
  - Segment: CASH
  - All time ranges available
  - Title: metadata.displayName

- **`index`**: Market indices
  - Uses ISIN for instrument lookup
  - Segment: CASH
  - All time ranges available
  - Title: metadata.displayName
  - Price from `liveData.value` (instead of `liveData.ltp`)

- **`option`**: Options contracts
  - Uses trading_symbol for instrument lookup
  - Segment: FNO
  - Limited time ranges: 1D, 1W, 1M
  - Title: Fetched from search API

- **`future`**: Futures contracts
  - Uses trading_symbol for instrument lookup
  - Segment: FNO
  - Limited time ranges: 1D, 1W, 1M
  - Title: Fetched from search API

## Available Context Data

```typescript
{
  // Metadata
  metadata: any | null
  metadataError: string | null

  // Instruments
  instruments: Instrument[] | null
  currentInstrument: Instrument | null
  exchange: Exchange
  setExchange: (exchange: Exchange) => void

  // Live Data
  liveData: any | null
  liveDataError: string | null

  // Historical Data
  historicalData: any | null
  historicalDataError: string | null
  timeRange: HistoricalDataTimeRange
  setTimeRange: (range: HistoricalDataTimeRange) => void

  // Computed Values
  type: InstrumentType
  scriptCode: string
  currentPrice: number
  positiveChange: boolean
  changeValue: number
  changePerc: number
  title: string | null

  // Watchlist
  watchlist: boolean
  toggleWatchlist: () => void

  // Utils
  formatTimeStamp: (timestamp: number, format?: "date" | "datetime") => string
  refetchHistoricalData: () => void

  // Config
  config: InstrumentPageConfig
  segment: InstrumentSegment
  availableTimeRanges: HistoricalDataTimeRange[]
}
```

## Benefits

1. **Single Source of Truth**: All pages use the same logic and components
2. **Easy Maintenance**: Changes in one place affect all instrument pages
3. **Reusable**: Add custom components that access instrument data via `useInstrument()`
4. **Type-Safe**: TypeScript types for all data and configurations
5. **Flexible**: Each variant can have its own behavior while sharing the same structure

## Adding New Features

To add a feature (e.g., add order book data):

1. Add state and logic to `useInstrumentData.tsx`
2. Expose it in the return object
3. Update `types.ts` with the new data in `InstrumentContextValue`
4. Use it in `InstrumentPage.tsx` or any custom component via `useInstrument()`

All pages will automatically get the new feature!
