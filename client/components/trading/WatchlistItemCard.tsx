"use client";
import { instrumentTypeName } from "@/components/trading/InstrumentDataSection";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/utils";
import { ExternalLink, Trash2Icon } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import ApiClient from "@/utils/ApiClient";
import Link from "next/link";
export default function WatchlistItemCard({
  watchlistItem,
  removeWatchlistItem,
}: {
  watchlistItem: WatchlistItem;
  removeWatchlistItem: (id: string) => Promise<void>;
}) {
  const { instrumentType, searchId, tradingSymbol } = watchlistItem;

  const [deleting, startDeleting] = useTransition();
  const [metadata, setMetadata] = useState<any>(null);
  const [title, setTitle] = useState<string | null>(null);

  // Fetch metadata
  useEffect(() => {
    ApiClient.get(`/metadata?search_id=${searchId}`).then((response) => {
      setMetadata(response.data);
    });
  }, [watchlistItem]);

  // Set title based on variant
  useEffect(() => {
    if (!metadata) return;

    if (["FUT", "CE", "PE"].includes(instrumentType)) {
      // Fetch title from search API
      ApiClient.get("/search", {
        params: { query: tradingSymbol, size: 1 },
      })
        .then((response) => {
          const { success, instruments } = response.data;
          if (!success || instruments.length === 0) {
            setTitle(metadata.displayName);
            return;
          }
          setTitle(instruments[0].title);
        })
        .catch(() => {
          setTitle(metadata.displayName);
        });
    } else {
      // stock or index - use displayName
      setTitle(metadata.displayName);
    }
  }, [metadata, watchlistItem]);

  const href = useMemo(() => {
    if (instrumentType === "EQ") {
      return `/stocks/${searchId}`;
    } else if (instrumentType === "IDX") {
      return `/indices/${searchId}`;
    } else if (instrumentType === "FUT") {
      return `/futures/${searchId}/${tradingSymbol}`;
    } else if (instrumentType === "CE" || instrumentType === "PE") {
      return `/options/${searchId}/${tradingSymbol}`;
    }
  }, [watchlistItem]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, x: -100 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="group bg-card mb-4 flex flex-row flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border px-6 py-4 shadow-md transition-all hover:shadow-lg"
    >
      <div className="flex flex-1 items-center gap-4">
        {/* Logo */}
        {metadata?.logoUrl ? (
          <img
            src={metadata.logoUrl}
            alt={title ?? watchlistItem.tradingSymbol ?? undefined}
            className="size-12 rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border">
            <span className="text-muted-foreground text-lg font-bold">
              {(watchlistItem.tradingSymbol || watchlistItem.searchId)
                .substring(0, 2)
                .toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-col gap-0.5">
            <Link
              className="truncate text-lg font-semibold"
              href={href || "/stocks"}
              target="_blank"
            >
              {title || watchlistItem.tradingSymbol || watchlistItem.searchId}
            </Link>
            <span className="text-muted-foreground truncate text-sm font-medium">
              {watchlistItem.tradingSymbol}
            </span>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 font-medium">
              {instrumentTypeName[watchlistItem.instrumentType]}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Added {formatTimestamp(watchlistItem.createdAt)}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant={"destructive"}
        size="icon"
        className="ml-auto shrink-0 transition-all group-hover:scale-105"
        onClick={() =>
          startDeleting(async () => {
            await removeWatchlistItem(watchlistItem.id);
          })
        }
        disabled={deleting}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
