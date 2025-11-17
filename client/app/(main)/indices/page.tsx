"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { marketApi, IndexData } from "@/services/marketApi";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import RevealHero from "@/components/animations/RevealHero";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

export default function IndicesPage() {
  const [majorIndices, setMajorIndices] = useState<IndexData[]>([]);
  const [searchResults, setSearchResults] = useState<IndexData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch major indices on mount
  useEffect(() => {
    const fetchMajorIndices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await marketApi.getMajorIndices();
        setMajorIndices(data);
      } catch (err) {
        console.error("Error fetching major indices:", err);
        setError("Failed to load indices data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMajorIndices();
  }, []);

  // Search indices when debounced search term changes
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const searchIndices = async () => {
      try {
        setSearchLoading(true);
        const data = await marketApi.getIndices(debouncedSearch, 1, 20);
        setSearchResults(data.allAssets || []);
      } catch (err) {
        console.error("Error searching indices:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    searchIndices();
  }, [debouncedSearch]);

  const displayIndices = searchTerm.trim() ? searchResults : majorIndices;
  const isSearching = searchTerm.trim().length > 0;

  return (
    <section className="mx-auto flex w-full flex-col gap-8 p-4">
      <RevealHero className="mx-auto text-3xl font-extrabold">
        Market Indices
      </RevealHero>

      {error && (
        <div className="border-destructive/50 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="text-destructive h-5 w-5" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mx-auto w-full max-w-2xl">
        <Input
          type="text"
          placeholder="Search indices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Indices Section */}
      <section className="w-full space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {isSearching ? "Search Results" : "Major Indices"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isSearching
                ? `${displayIndices.length} results found`
                : "Key market indices"}
            </p>
          </div>
        </div>

        {loading || searchLoading ? (
          <div className="w-full space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : displayIndices.length > 0 ? (
          <div className="w-full space-y-2">
            {/* Table Header */}
            <div className="text-muted-foreground grid w-full grid-cols-[2fr_1fr_1fr] gap-4 px-4 text-sm font-medium">
              <div>Index</div>
              <div className="text-right">52W High</div>
              <div className="text-right">52W Low</div>
            </div>

            {/* Indices List */}
            {displayIndices.map((index) => (
              <Link
                key={index.header.searchId}
                href={`/indices/${index.header.searchId}`}
                className="hover:bg-accent grid w-full grid-cols-[2fr_1fr_1fr] items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {index.header.logoUrl && (
                    <img
                      src={index.header.logoUrl}
                      alt={index.header.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{index.header.displayName}</h3>
                    <p className="text-muted-foreground text-sm">
                      {index.header.shortName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {index.yearHighPrice ? (
                    <div className="font-medium">
                      ₹{index.yearHighPrice.toLocaleString("en-IN")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </div>

                <div className="text-right">
                  {index.yearLowPrice ? (
                    <div className="font-medium">
                      ₹{index.yearLowPrice.toLocaleString("en-IN")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">N/A</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-32 items-center justify-center">
            {isSearching ? "No indices found" : "No data available"}
          </div>
        )}
      </section>
    </section>
  );
}
