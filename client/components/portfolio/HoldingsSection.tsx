"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useEffect, useState } from "react";
import ApiClient from "@/utils/ApiClient";
import Link from "next/link";
import { formatTimestamp } from "@/utils";

export function HoldingsSection() {
  const { positions, positionsLoading } = usePortfolio();

  console.log("HoldingsSection rendered", { positions, positionsLoading });

  if (positionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const cncPositions = positions.filter((p) => p.product === "CNC");
  const misPositions = positions.filter((p) => p.product === "MIS");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Your Holdings ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No holdings yet</p>
            <p className="mt-1 text-sm">
              Start trading to see your positions here
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({positions.length})</TabsTrigger>
              <TabsTrigger value="CNC">CNC ({cncPositions.length})</TabsTrigger>
              <TabsTrigger value="MIS">MIS ({misPositions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <PositionsList positions={positions} />
            </TabsContent>

            <TabsContent value="CNC" className="mt-4">
              <PositionsList positions={cncPositions} />
            </TabsContent>

            <TabsContent value="MIS" className="mt-4">
              <PositionsList positions={misPositions} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function PositionsList({ positions }: { positions: any[] }) {
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(
    new Set(),
  );

  // Fetch metadata and titles for all positions
  useEffect(() => {
    const fetchMetadata = async () => {
      const newMetadata: Record<string, any> = {};
      const newTitles: Record<string, string> = {};

      for (const position of positions) {
        try {
          const searchId =
            position.instrument.searchId ||
            position.instrument.tradingSymbol.toLowerCase();
          const metadataResponse = await ApiClient.get(
            `/metadata?search_id=${searchId}`,
          );

          if (position.instrument.segment === "CASH") {
            newTitles[position.id] = metadataResponse.data.displayName;
          } else {
            const searchResponse = await ApiClient.get("/search", {
              params: { query: position.instrument.tradingSymbol, size: 1 },
            });
            const { success, instruments } = searchResponse.data;
            if (success && instruments[0]) {
              newTitles[position.id] = instruments[0].title;
            }
          }
          newMetadata[position.id] = metadataResponse.data;
        } catch (error) {
          // Metadata not found - logo will not be displayed
        }
      }

      setMetadataMap(newMetadata);
      setTitleMap(newTitles);
    };

    if (positions.length > 0) {
      fetchMetadata();
    }
  }, [positions]);

  if (positions.length === 0) {
    return (
      <div className="text-muted-foreground py-6 text-center text-sm">
        No positions in this category
      </div>
    );
  }

  const getInstrumentUrl = (position: any) => {
    const { type, tradingSymbol, searchId } = position.instrument;
    const id = searchId || tradingSymbol.toLowerCase();

    if (type === "EQ") return `/stocks/${id}`;
    if (type === "IDX") return `/indices/${id}`;
    if (type === "FUT") return `/futures/${id}/${tradingSymbol}`;
    if (type === "CE" || type === "PE")
      return `/options/${id}/${tradingSymbol}`;
    return "#";
  };

  return (
    <div className="space-y-3">
      {positions.map((position) => {
        const isProfitable = position.totalPnL >= 0;
        const metadata = metadataMap[position.id];
        const instrumentUrl = getInstrumentUrl(position);
        const isExpanded = expandedPositions.has(position.id);
        const hasLots = position.lots && position.lots.length > 0;

        return (
          <div
            key={position.id}
            className="bg-card rounded-lg border transition-all hover:shadow-md"
          >
            <div className="hover:bg-muted/30 p-4 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={instrumentUrl}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <Avatar className="h-12 w-12 shrink-0 rounded-lg">
                    <AvatarImage
                      src={metadata?.logoUrl}
                      alt={position.instrument.tradingSymbol}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary rounded-lg font-semibold">
                      {position.instrument.tradingSymbol.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="truncate font-semibold hover:underline">
                      {titleMap[position.id] ||
                        position.instrument.name ||
                        position.instrument.tradingSymbol}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {position.instrument.tradingSymbol} •{" "}
                      {position.instrument.exchange}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {position.product}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {position.instrument.segment}
                      </Badge>
                    </div>
                  </div>
                </Link>

                <div className="shrink-0 space-y-1.5 text-right">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Qty: </span>
                    <span className="font-semibold">{position.qty}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Avg: </span>
                    <span className="font-semibold">
                      ₹{position.avgPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">LTP: </span>
                    <span className="font-semibold">
                      ₹{position.currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Value: </span>
                  <span className="font-semibold">
                    ₹
                    {position.currentValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        isProfitable
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isProfitable && "+"}₹
                      {position.totalPnL.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`flex items-center justify-end gap-1 text-xs font-medium ${
                        isProfitable
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isProfitable ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {position.pnlPercentage.toFixed(2)}%
                    </div>
                  </div>
                  {hasLots && (
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedPositions);
                        if (isExpanded) {
                          newExpanded.delete(position.id);
                        } else {
                          newExpanded.add(position.id);
                        }
                        setExpandedPositions(newExpanded);
                      }}
                      className="hover:bg-muted rounded p-1.5"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Lots Details */}
            {isExpanded && hasLots && (
              <div className="bg-muted/30 border-t p-3">
                <h5 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                  Individual Lots ({position.lots.length})
                </h5>
                <div className="space-y-2">
                  {position.lots.map((lot: any, index: number) => {
                    const lotPnL = lot.unrealizedPnL;
                    const lotPnLPercentage =
                      ((position.currentPrice - lot.buyPrice) / lot.buyPrice) *
                      100;
                    const lotProfitable = lotPnL >= 0;

                    return (
                      <div
                        key={lot.id}
                        className="bg-card flex items-center justify-between rounded border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-xs font-medium">
                              {lot.remainingQty} / {lot.totalQty} shares
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatTimestamp(lot.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">
                              Buy
                            </div>
                            <div className="text-xs font-medium">
                              ₹{lot.buyPrice.toFixed(2)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`text-xs font-semibold ${
                                lotProfitable
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {lotProfitable && "+"}₹
                              {lotPnL.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div
                              className={`text-xs ${
                                lotProfitable
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {lotPnLPercentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
