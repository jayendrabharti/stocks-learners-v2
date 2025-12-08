"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { marketApi, FnOUnderlying, FnOContract } from "@/services/marketApi";
import {
  AlertCircle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import RevealHero from "@/components/animations/RevealHero";
import { formatCurrency, formatNumber } from "@/services/marketApi";

import { SKELETON_LOADER_COUNT } from "@/utils/constants";

export default function FnOPage() {
  const [topUnderlyings, setTopUnderlyings] = useState<FnOUnderlying[]>([]);
  const [topContracts, setTopContracts] = useState<FnOContract[]>([]);
  const [activeTab, setActiveTab] = useState<"futures" | "options">("futures");
  const [loading, setLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch top underlyings on mount
  useEffect(() => {
    const fetchUnderlyings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await marketApi.getFnOTopUnderlyings(6);
        setTopUnderlyings(data);
      } catch (err) {
        console.error("Error fetching F&O underlyings:", err);
        setError("Failed to load F&O data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnderlyings();
  }, []);

  // Fetch top contracts when tab changes
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setContractsLoading(true);
        const instruments =
          activeTab === "futures"
            ? "INDEX_FUTURES,STOCKS_FUTURES"
            : "INDEX_OPTIONS,STOCKS_OPTIONS";
        const data = await marketApi.getFnOTopContracts({
          instruments,
          limit: 10,
        });
        setTopContracts(data);
      } catch (err) {
        console.error("Error fetching F&O contracts:", err);
      } finally {
        setContractsLoading(false);
      }
    };

    fetchContracts();
  }, [activeTab]);

  return (
    <section className="mx-auto flex w-full flex-col gap-8 p-4">
      <RevealHero className="mx-auto text-3xl font-extrabold">
        Futures & Options
      </RevealHero>

      {error && (
        <div className="border-destructive/50 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Top Traded Underlyings Section */}
      <section className="w-full space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Top traded F&O underlyings
            </h2>
            <p className="text-muted-foreground text-sm">
              Most actively traded stocks in Futures & Options
            </p>
          </div>
        </div>

        {loading ? (
          <div className="w-full space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : topUnderlyings.length > 0 ? (
          <div className="w-full space-y-2">
            {/* Table Header */}
            <div className="text-muted-foreground grid w-full grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 text-sm font-medium">
              <div>Company</div>
              <div className="text-right">LTP (1D)</div>
              <div className="text-right">OI Change</div>
              <div className="text-right">Volume</div>
            </div>

            {/* Underlyings List */}
            {topUnderlyings.map((underlying) => (
              <Link
                key={underlying.searchId}
                href={`/stocks/${underlying.searchId}`}
                className="hover:bg-accent grid w-full grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{underlying.companyShortName}</h3>
                  <p className="text-muted-foreground text-sm">
                    {underlying.nseScriptCode}
                  </p>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(underlying.ltp)}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-sm ${
                      underlying.dayChangePerc >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {underlying.dayChangePerc >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(underlying.dayChangePerc).toFixed(2)}%
                  </div>
                </div>

                <div className="text-right">
                  {underlying.oiChangePerc !== undefined &&
                  underlying.oiChangePerc !== null ? (
                    <>
                      <div
                        className={`font-medium ${
                          underlying.oiChangePerc >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {underlying.oiChangePerc >= 0 ? "+" : ""}
                        {underlying.oiChangePerc.toFixed(2)}%
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {formatNumber(underlying.oi)}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {formatNumber(underlying.volume)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No data available
          </div>
        )}
      </section>

      {/* Top Traded Contracts Section */}
      <section className="w-full space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Top traded contracts</h2>
            <p className="text-muted-foreground text-sm">
              Most actively traded futures and options contracts
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-border flex w-full gap-1 border-b">
          <button
            onClick={() => setActiveTab("futures")}
            className={`text-foreground hover:text-foreground relative px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === "futures"
                ? "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5"
                : "text-muted-foreground"
            }`}
          >
            Futures
          </button>
          <button
            onClick={() => setActiveTab("options")}
            className={`text-foreground hover:text-foreground relative px-4 pb-3 text-sm font-medium transition-colors ${
              activeTab === "options"
                ? "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5"
                : "text-muted-foreground"
            }`}
          >
            Options
          </button>
        </div>

        {contractsLoading ? (
          <div className="w-full space-y-3">
            {Array.from({ length: SKELETON_LOADER_COUNT }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : topContracts.length > 0 ? (
          <div className="w-full space-y-2">
            {/* Table Header */}
            <div className="text-muted-foreground grid w-full grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 text-sm font-medium">
              <div>Contract</div>
              <div className="text-right">LTP (1D)</div>
              <div className="text-right">OI</div>
              <div className="text-right">Volume</div>
            </div>

            {/* Contracts List */}
            {topContracts.map((contract, index) => (
              <div
                key={`${contract.searchId}-${index}`}
                className="hover:bg-accent grid w-full grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{contract.companyName}</h3>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>{contract.contractType}</span>
                    <span>•</span>
                    <span>
                      {new Date(contract.expiryDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                    {contract.strikePrice && (
                      <>
                        <span>•</span>
                        <span>₹{contract.strikePrice}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(contract.ltp)}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-sm ${
                      contract.dayChangePerc >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {contract.dayChangePerc >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(contract.dayChangePerc).toFixed(2)}%
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">{formatNumber(contract.oi)}</div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {formatNumber(contract.volume)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            No data available
          </div>
        )}
      </section>
    </section>
  );
}
