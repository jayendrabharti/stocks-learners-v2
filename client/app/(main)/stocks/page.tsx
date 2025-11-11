"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockCard, MostBoughtCard } from "@/components/market";
import {
  marketApi,
  Stock,
  MostBoughtStock,
  MoverType,
} from "@/services/marketApi";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function StocksPage() {
  const [mostBought, setMostBought] = useState<MostBoughtStock[]>([]);
  const [topMovers, setTopMovers] = useState<Stock[]>([]);
  const [activeTab, setActiveTab] = useState<MoverType>("gainers");
  const [loading, setLoading] = useState(true);
  const [moversLoading, setMoversLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch most bought stocks on mount
  useEffect(() => {
    const fetchMostBought = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await marketApi.getMostBought(4);
        setMostBought(data);
      } catch (err) {
        console.error("Error fetching most bought stocks:", err);
        setError("Failed to load market data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMostBought();
  }, []);

  // Fetch top movers when tab changes
  useEffect(() => {
    const fetchTopMovers = async () => {
      try {
        setMoversLoading(true);
        const data = await marketApi.getTopMovers(activeTab, 6);
        setTopMovers(data);
      } catch (err) {
        console.error("Error fetching top movers:", err);
      } finally {
        setMoversLoading(false);
      }
    };

    fetchTopMovers();
  }, [activeTab]);

  return (
    <div className="w-full space-y-12 px-4 py-6 sm:px-6 lg:px-8">
      {/* Error State */}
      {error && (
        <div className="border-destructive/50 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Most Bought on Groww Section */}
      <section className="w-full space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Most bought stocks on Groww
            </h2>
          </div>
          <Link href="/stocks/top?type=bought">
            <Button variant="link" className="text-primary gap-1 px-0">
              See more
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : mostBought.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {mostBought.map((stock) => (
              <MostBoughtCard
                key={stock.company.searchId}
                searchId={stock.company.searchId}
                companyName={stock.company.companyName}
                companyShortName={stock.company.companyShortName}
                imageUrl={stock.company.imageUrl}
                ltp={stock.stats.ltp}
                dayChange={stock.stats.dayChange}
                dayChangePerc={stock.stats.dayChangePerc}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No data available
          </div>
        )}
      </section>

      {/* Top Market Movers Section */}
      <section className="w-full space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Top market movers</h2>
          </div>
          <Link href={`/stocks/top?type=${activeTab}`}>
            <Button variant="link" className="text-primary gap-1 px-0">
              See more
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="border-border flex w-full gap-1 border-b">
          <button
            onClick={() => setActiveTab("gainers")}
            className={`text-foreground hover:text-foreground relative px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === "gainers"
                ? "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5"
                : "text-muted-foreground"
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setActiveTab("losers")}
            className={`text-foreground hover:text-foreground relative px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === "losers"
                ? "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5"
                : "text-muted-foreground"
            }`}
          >
            Losers
          </button>
          <button
            onClick={() => setActiveTab("volume")}
            className={`text-foreground hover:text-foreground relative px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === "volume"
                ? "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5"
                : "text-muted-foreground"
            }`}
          >
            Volume shockers
          </button>
        </div>

        {/* Table Header */}
        <div className="text-muted-foreground grid w-full grid-cols-[2fr_1fr] gap-4 px-4 text-sm font-medium">
          <div>Company</div>
          <div className="text-right">Market price (1D)</div>
        </div>

        {/* Content based on active tab */}
        {moversLoading ? (
          <div className="w-full space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : topMovers.length > 0 ? (
          <div className="w-full space-y-1">
            {topMovers.map((stock, index) => (
              <StockCard
                key={`${activeTab}-${stock.searchId}-${index}`}
                companyName={stock.companyName}
                companyShortName={stock.companyShortName}
                searchId={stock.searchId}
                logoUrl={stock.logoUrl}
                ltp={stock.ltp}
                close={stock.close}
                yearHigh={stock.yearHigh}
                yearLow={stock.yearLow}
                volume={stock.volume}
                marketCap={stock.marketCap}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No data available
          </div>
        )}
      </section>
    </div>
  );
}
