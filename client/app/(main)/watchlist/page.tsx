"use client";
import AuthGuard from "@/auth/AuthGuard";
import RevealHero from "@/components/animations/RevealHero";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/providers/WatchlistProvider";
import WatchlistItemCard from "@/components/trading/WatchlistItemCard";
import { AnimatePresence } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";
import Link from "next/link";

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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-primary/10 mb-4 rounded-full p-4">
                  <Star className="text-primary h-12 w-12" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">
                  Your watchlist is empty
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm text-center">
                  Start tracking stocks you're interested in by adding them to
                  your watchlist
                </p>
                <Link href="/stocks">
                  <Button size="lg">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Browse Stocks
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
