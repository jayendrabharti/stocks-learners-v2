# Services Layer

This directory contains reusable service functions that abstract external API calls and data fetching operations. The service layer promotes code reusability, maintainability, and separation of concerns.

## Architecture

The services layer sits between controllers and external APIs/data sources:

```
Controllers → Services → External APIs/Data Sources
```

## Available Services

### 1. Market Service (`marketService.ts`)

Provides functions to fetch market-related data from Groww API.

#### Functions:

- **`fetchMostBoughtStocks(options)`**
  - Fetches the most bought stocks on Groww platform
  - Parameters:
    - `options.size` (optional): Number of stocks to fetch (default: 10)
  - Returns: `Promise<MostBoughtStock[]>`
- **`fetchTopMovers(options)`**
  - Fetches top market movers (gainers, losers, or volume shakers)
  - Parameters:
    - `options.type` (optional): 'gainers' | 'losers' | 'volume' (default: 'gainers')
    - `options.pageSize` (optional): Number of stocks to fetch (default: 10)
  - Returns: `Promise<Stock[]>`

#### Usage Example:

```typescript
import { fetchMostBoughtStocks, fetchTopMovers } from "@/services";

// Get top 20 most bought stocks
const mostBought = await fetchMostBoughtStocks({ size: 20 });

// Get top 15 gainers
const gainers = await fetchTopMovers({ type: "gainers", pageSize: 15 });
```

---

### 2. Instruments Service (`instrumentsService.ts`)

Provides functions to fetch instrument data from cached CSV file.

#### Functions:

- **`fetchInstrumentsBySymbol(tradingSymbol, shouldRefresh)`**

  - Fetches instruments matching a trading symbol
  - Parameters:
    - `tradingSymbol`: The trading symbol to search for
    - `shouldRefresh` (optional): Whether to refresh cache (default: false)
  - Returns: `Promise<InstrumentRow[]>`

- **`fetchInstrumentsByIsin(isin, shouldRefresh)`**

  - Fetches instruments matching an ISIN
  - Parameters:
    - `isin`: The ISIN to search for
    - `shouldRefresh` (optional): Whether to refresh cache (default: false)
  - Returns: `Promise<InstrumentRow[]>`

- **`fetchInstrumentsBySymbolAndIsin(tradingSymbol, isin, shouldRefresh)`**
  - Fetches instruments matching both trading symbol and ISIN
  - Parameters:
    - `tradingSymbol`: The trading symbol to search for
    - `isin`: The ISIN to match
    - `shouldRefresh` (optional): Whether to refresh cache (default: false)
  - Returns: `Promise<InstrumentRow[]>`

#### Usage Example:

```typescript
import { fetchInstrumentsBySymbol, fetchInstrumentsByIsin } from "@/services";

// Fetch by trading symbol
const instruments = await fetchInstrumentsBySymbol("RELIANCE");

// Fetch by ISIN with cache refresh
const instruments = await fetchInstrumentsByIsin("INE002A01018", true);
```

---

### 3. Live Data Service (`liveDataService.ts`)

Provides functions to fetch real-time market data.

#### Functions:

- **`fetchLiveData(options)`**
  - Fetches live market data for a given instrument
  - Parameters:
    - `options.scriptCode`: The script code of the instrument
    - `options.exchange`: The exchange (NSE, BSE, etc.)
    - `options.type`: The instrument type (EQ, IDX, FUT, CE, PE)
  - Returns: `Promise<LiveDataResult>`

#### Usage Example:

```typescript
import { fetchLiveData } from "@/services";

const liveData = await fetchLiveData({
  scriptCode: "500325",
  exchange: "NSE",
  type: "EQ",
});
```

---

### 4. Historical Data Service (`historicalDataService.ts`)

Provides functions to fetch historical chart data.

#### Functions:

- **`fetchHistoricalData(options)`**
  - Fetches historical chart data for a given instrument
  - Parameters:
    - `options.scriptCode`: The script code of the instrument
    - `options.exchange`: The exchange (NSE, BSE, etc.)
    - `options.segment`: The market segment (CASH, FNO)
    - `options.timeRange`: The time range (1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL)
  - Returns: `Promise<HistoricalDataResult>`

#### Usage Example:

```typescript
import { fetchHistoricalData } from "@/services";

const historicalData = await fetchHistoricalData({
  scriptCode: "500325",
  exchange: "NSE",
  segment: "CASH",
  timeRange: "1M",
});
```

---

### 5. Search Service (`searchService.ts`)

Provides functions for global search across instruments.

#### Functions:

- **`performGlobalSearch(options)`**
  - Performs a global search for instruments
  - Parameters:
    - `options.query`: The search query string
    - `options.from` (optional): Starting offset (default: 0)
    - `options.size` (optional): Number of results (default: 20)
    - `options.web` (optional): Web flag (default: true)
  - Returns: `Promise<SearchResult>`

#### Usage Example:

```typescript
import { performGlobalSearch } from "@/services";

const results = await performGlobalSearch({
  query: "Reliance",
  size: 10,
});
```

---

### 6. Metadata Service (`metadataService.ts`)

Provides functions to fetch company metadata.

#### Functions:

- **`fetchCompanyMetadata(options)`**
  - Fetches company metadata by search ID
  - Parameters:
    - `options.searchId`: The search ID of the company
  - Returns: `Promise<CompanyMetadata>`

#### Usage Example:

```typescript
import { fetchCompanyMetadata } from "@/services";

const metadata = await fetchCompanyMetadata({
  searchId: "RELIANCE",
});
```

---

## Benefits

1. **Reusability**: Service functions can be used across multiple controllers, routes, or even background jobs
2. **Maintainability**: Centralized logic makes updates and bug fixes easier
3. **Testability**: Services can be unit tested independently of controllers
4. **Separation of Concerns**: Controllers handle HTTP logic, services handle business logic
5. **DRY Principle**: Avoid duplicating API call logic throughout the codebase

## Usage in Controllers

Controllers should use services instead of making direct API calls:

```typescript
// ❌ Bad: Direct API call in controller
export const getStocks = async (req: Request, res: Response) => {
  const response = await fetch("https://api.example.com/stocks");
  const data = await response.json();
  res.json(data);
};

// ✅ Good: Using service function
export const getStocks = async (req: Request, res: Response) => {
  try {
    const data = await fetchMostBoughtStocks({ size: 10 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
};
```

## Future Use Cases

These service functions can be reused for:

- **Background Jobs**: Periodic data synchronization, cache warming
- **Webhooks**: Processing external events
- **Internal APIs**: Building additional endpoints
- **Data Analysis**: Aggregating market data for analytics
- **Notifications**: Sending alerts based on market conditions
- **Batch Processing**: Processing multiple instruments in parallel

## Adding New Services

When adding new services:

1. Create a new file in `services/` directory
2. Export reusable functions with clear interfaces
3. Add proper TypeScript types
4. Include JSDoc comments
5. Update `services/index.ts` to export the new service
6. Document in this README
