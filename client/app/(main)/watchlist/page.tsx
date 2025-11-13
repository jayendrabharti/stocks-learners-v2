"use client";
import AuthGuard from "@/auth/AuthGuard";
import RevealHero from "@/components/animations/RevealHero";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/providers/WatchlistProvider";
import WatchlistItemCard from "@/components/trading/WatchlistItemCard";
import { AnimatePresence } from "framer-motion";

export default function WatchlistPage() {
  const { watchlistItems, loading, error, removeWatchlistItem } =
    useWatchlist();

  return (
    <section className="mx-auto flex w-full flex-col p-4">
      <RevealHero className="mx-auto mb-4 text-3xl font-extrabold">
        Your Watchlist
      </RevealHero>
      <AuthGuard>
        <div className="mx-auto flex w-full max-w-150 flex-col">
          {!!watchlistItems && watchlistItems.length === 0 && (
            <span className="mx-auto font-light">
              No items in your watchlist.
            </span>
          )}
          {(!watchlistItems || loading) && (
            <>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </>
          )}
          <AnimatePresence mode="popLayout">
            {watchlistItems?.map((watchlistItem) => (
              <WatchlistItemCard
                key={watchlistItem.id}
                watchlistItem={watchlistItem}
                removeWatchlistItem={removeWatchlistItem}
              />
            ))}
          </AnimatePresence>
        </div>
      </AuthGuard>
    </section>
  );
}
