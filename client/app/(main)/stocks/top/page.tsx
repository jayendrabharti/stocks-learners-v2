"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockCard, MostBoughtCard } from "@/components/market";
import {
  marketApi,
  Stock,
  MostBoughtStock,
  MoverType,
} from "@/services/marketApi";
import {
  TrendingUp,
  TrendingDown,
  Volume2,
  Users,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

type StockType = "bought" | "gainers" | "losers" | "volume";

const typeConfig: Record<
  StockType,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
  }
> = {
  bought: {
    title: "Most Bought on Groww",
    description: "Popular stocks among investors",
    icon: <Users className="h-6 w-6" />,
    colorClass: "text-primary",
  },
  gainers: {
    title: "Top Gainers",
    description: "Best performing stocks today",
    icon: <TrendingUp className="h-6 w-6" />,
    colorClass: "text-green-600 dark:text-green-400",
  },
  losers: {
    title: "Top Losers",
    description: "Worst performing stocks today",
    icon: <TrendingDown className="h-6 w-6" />,
    colorClass: "text-red-600 dark:text-red-400",
  },
  volume: {
    title: "Volume Shakers",
    description: "Stocks with unusual trading activity",
    icon: <Volume2 className="h-6 w-6" />,
    colorClass: "text-primary",
  },
};

export default function TopStocksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = (searchParams.get("type") as StockType) || "bought";

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [mostBought, setMostBought] = useState<MostBoughtStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate type
  useEffect(() => {
    if (!["bought", "gainers", "losers", "volume"].includes(type)) {
      router.push("/stocks/top?type=bought");
    }
  }, [type, router]);

  // Fetch data based on type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (type === "bought") {
          const data = await marketApi.getMostBought(50);
          setMostBought(data);
        } else {
          const moverType: MoverType =
            type === "volume" ? "volume" : (type as MoverType);
          const data = await marketApi.getTopMovers(moverType, 50);
          setStocks(data);
        }
      } catch (err) {
        console.error("Error fetching stocks:", err);
        setError("Failed to load stocks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  const config = typeConfig[type];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Back Button */}
      <Link href="/stocks">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Button>
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className={`bg-primary/10 rounded-lg p-3 ${config.colorClass}`}>
          {config.icon}
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {config.description}
          </p>
        </div>
      </div>

      {/* Type Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Link href="/stocks/top?type=bought">
              <Button
                variant={type === "bought" ? "default" : "outline"}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Most Bought
              </Button>
            </Link>
            <Link href="/stocks/top?type=gainers">
              <Button
                variant={type === "gainers" ? "default" : "outline"}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Top Gainers
              </Button>
            </Link>
            <Link href="/stocks/top?type=losers">
              <Button
                variant={type === "losers" ? "default" : "outline"}
                className="gap-2"
              >
                <TrendingDown className="h-4 w-4" />
                Top Losers
              </Button>
            </Link>
            <Link href="/stocks/top?type=volume">
              <Button
                variant={type === "volume" ? "default" : "outline"}
                className="gap-2"
              >
                <Volume2 className="h-4 w-4" />
                Volume Shakers
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="text-destructive h-5 w-5" />
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stocks Grid */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">
            {loading
              ? "Loading..."
              : type === "bought"
                ? `${mostBought.length} Stocks`
                : `${stocks.length} Stocks`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : type === "bought" && mostBought.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mostBought.map((stock, index) => (
                <MostBoughtCard
                  key={`bought-${stock.company.searchId}-${index}`}
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
          ) : stocks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stocks.map((stock, index) => (
                <StockCard
                  key={`${type}-${stock.searchId}-${index}`}
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
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              No stocks available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
