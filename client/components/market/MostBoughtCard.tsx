"use client";

import { formatCurrency } from "@/services/marketApi";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Bookmark } from "lucide-react";

interface MostBoughtCardProps {
  searchId: string;
  companyName: string;
  companyShortName: string;
  imageUrl: string;
  ltp: number;
  dayChange: number;
  dayChangePerc: number;
  className?: string;
}

export function MostBoughtCard({
  searchId,
  companyName,
  companyShortName,
  imageUrl,
  ltp,
  dayChange,
  dayChangePerc,
  className,
}: MostBoughtCardProps) {
  const isPositive = dayChangePerc >= 0;
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWatchlisted(!isWatchlisted);
    // TODO: Add watchlist logic here
  };

  return (
    <div
      className={cn(
        "group border-border/50 bg-card hover:border-border rounded-xl border p-4 transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="space-y-3">
        {/* Logo and Watchlist */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={companyShortName}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold">
                {companyShortName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={handleWatchlistToggle}
            className={cn(
              "transition-colors",
              isWatchlisted
                ? "text-primary fill-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Bookmark
              className={cn("h-4 w-4", isWatchlisted && "fill-current")}
            />
          </button>
        </div>

        {/* Company Name */}
        <div>
          <Link href={`/stocks/${searchId}`}>
            <h3 className="text-foreground hover:text-primary text-sm font-medium transition-colors">
              {companyShortName}
            </h3>
          </Link>
        </div>

        {/* Price */}
        <div>
          <p className="text-foreground text-lg font-semibold">
            {formatCurrency(ltp)}
          </p>
        </div>

        {/* Change */}
        <div>
          <span
            className={cn(
              "text-sm font-medium",
              isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {isPositive ? "+" : ""}
            {dayChange.toFixed(2)} ({isPositive ? "+" : ""}
            {dayChangePerc.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
