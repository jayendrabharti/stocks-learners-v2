"use client";

import { formatCurrency, calculateChangePercent } from "@/services/marketApi";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useWatchlist } from "@/providers/WatchlistProvider";

interface StockCardProps {
  companyName: string;
  companyShortName: string;
  searchId: string;
  logoUrl: string;
  ltp: number;
  close: number;
  yearHigh?: number;
  yearLow?: number;
  volume?: number;
  marketCap?: number;
  className?: string;
}

export function StockCard({
  companyName,
  companyShortName,
  searchId,
  logoUrl,
  ltp,
  close,
  className,
}: StockCardProps) {
  const changePercent = calculateChangePercent(ltp, close);
  const changeValue = ltp - close;
  const isPositive = changeValue >= 0;

  const { watchlistItems, addWatchlistItem, removeWatchlistItem } =
    useWatchlist();

  // Check if this stock is in the watchlist
  const watchlistItem = useMemo(() => {
    return watchlistItems?.find(
      (item) => item.searchId === searchId && item.instrumentType === "EQ",
    );
  }, [watchlistItems, searchId]);

  const isWatchlisted = !!watchlistItem;
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isWatchlisted && watchlistItem) {
        await removeWatchlistItem(watchlistItem.id);
      } else {
        await addWatchlistItem({
          instrumentType: "EQ",
          searchId,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "hover:bg-accent group grid grid-cols-[2fr_1fr] gap-4 rounded-lg px-4 py-3 transition-colors",
        className,
      )}
    >
      {/* Company Info */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyShortName}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold">
              {companyShortName?.substring(0, 2).toUpperCase() || "NA"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/stocks/${searchId}`}>
            <h3 className="text-foreground hover:text-primary truncate text-sm font-medium transition-colors">
              {companyShortName}
            </h3>
          </Link>
        </div>
        <button
          onClick={handleWatchlistToggle}
          disabled={isLoading}
          className={cn(
            "transition-all",
            isWatchlisted
              ? "text-primary fill-primary"
              : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100",
            isLoading && "cursor-not-allowed opacity-50",
          )}
        >
          <Bookmark
            className={cn("h-4 w-4", isWatchlisted && "fill-current")}
          />
        </button>
      </div>

      {/* Market Price and Change */}
      <div className="flex items-center justify-end">
        <div className="text-right">
          <p className="text-foreground text-sm font-semibold">
            {formatCurrency(ltp)}
          </p>
          <p
            className={cn(
              "text-xs font-medium",
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {changeValue.toFixed(2)} ({changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
}
