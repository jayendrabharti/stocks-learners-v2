"use client";

import { useEffect, useState } from "react";
import {
  marketApi,
  MarketStatus as MarketStatusType,
} from "@/services/marketApi";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketStatus() {
  const [status, setStatus] = useState<MarketStatusType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await marketApi.getMarketStatus();
        setStatus(data);
      } catch (error) {
        console.error("Failed to fetch market status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Refresh status every minute
    const interval = setInterval(fetchStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!status) return null;

  const formatTime = (timeString?: string, showDate: boolean = false) => {
    if (!timeString) return null;
    try {
      const date = new Date(timeString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      const timeFormatted = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Always show date if requested or if not today
      if (showDate || !isToday) {
        const dateFormatted = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });

        return `${dateFormatted}, ${timeFormatted}`;
      }

      return timeFormatted;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock
        className={cn(status.isOpen ? "text-green-600" : "text-red-500")}
      />
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span
            className={`font-medium ${
              status.isOpen
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            Market {status.isOpen ? "Open" : "Closed"}
          </span>
          {status.nextCloseTime && (
            <span className="text-muted-foreground text-xs">
              closes at {formatTime(status.nextCloseTime, false)}
            </span>
          )}
          {status.nextOpenTime && (
            <span className="text-muted-foreground text-xs">
              opens at {formatTime(status.nextOpenTime, true)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
