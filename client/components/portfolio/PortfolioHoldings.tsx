"use client";

import { Fragment, useEffect, useState } from "react";
import {
  getPortfolio,
  type Portfolio,
  type Holding,
} from "@/services/portfolioApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ApiClient from "@/utils/ApiClient";
import Link from "next/link";
import { instrumentTypeName } from "../trading/InstrumentDataSection";
import { formatTimestamp } from "@/utils";

interface PortfolioHoldingsProps {
  product?: "CNC" | "MIS";
  sortBy?: string;
}

export function PortfolioHoldings({
  product,
  sortBy = "name",
}: PortfolioHoldingsProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await getPortfolio();
      setPortfolio(data);

      // Fetch metadata for stocks/indices
      const allHoldings = [
        ...data.holdings.CNC.positions,
        ...data.holdings.MIS.positions,
      ];

      const newMetadata: Record<string, any> = {};
      const newTitles: Record<string, string> = {};
      for (const holding of allHoldings) {
        try {
          const searchId =
            holding.instrument.searchId ||
            holding.instrument.tradingSymbol.toLowerCase();
          const metadataResponse = await ApiClient.get(
            `/metadata?search_id=${searchId}`,
          );
          if (holding.instrument.segment === "CASH") {
            newTitles[holding.instrument.id] =
              metadataResponse.data.displayName;
          } else {
            const searchResponse = await ApiClient.get("/search", {
              params: { query: holding.instrument.tradingSymbol, size: 1 },
            });
            const { success, instruments } = searchResponse.data;
            if (success && instruments[0]) {
              newTitles[holding.instrument.id] = instruments[0].title;
            }
          }
          newMetadata[holding.instrument.id] = metadataResponse.data;
        } catch (error) {
          // Metadata not found - logo will not be displayed
        }
      }
      setMetadataMap(newMetadata);
      setTitleMap(newTitles);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading holdings...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Failed to load holdings
          </p>
        </CardContent>
      </Card>
    );
  }

  const holdings: Holding[] = product
    ? portfolio.holdings[product].positions
    : [
        ...portfolio.holdings.CNC.positions,
        ...portfolio.holdings.MIS.positions,
      ];

  // Apply sorting
  const sortedHoldings = [...holdings].sort((a, b) => {
    switch (sortBy) {
      case "name":
        const nameA = titleMap[a.instrument.id] || a.instrument.tradingSymbol;
        const nameB = titleMap[b.instrument.id] || b.instrument.tradingSymbol;
        return nameA.localeCompare(nameB);
      case "pnl-high":
        return b.totalPnL - a.totalPnL;
      case "pnl-low":
        return a.totalPnL - b.totalPnL;
      case "value-high":
        return b.currentValue - a.currentValue;
      case "value-low":
        return a.currentValue - b.currentValue;
      case "qty-high":
        return b.qty - a.qty;
      case "qty-low":
        return a.qty - b.qty;
      default:
        return 0;
    }
  });

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground py-8 text-center">
            No holdings found.{" "}
            {product === "CNC"
              ? "Start investing with delivery orders"
              : product === "MIS"
                ? "Start trading intraday"
                : "Start trading to see your positions here"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product === "CNC"
            ? "Delivery Holdings (CNC)"
            : product === "MIS"
              ? "Intraday Positions (MIS)"
              : "All Holdings"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">LTP</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHoldings.map((holding) => {
                const isProfitable = holding.totalPnL >= 0;
                const metadata = metadataMap[holding.instrument.id];
                const isExpanded = expandedRows.has(holding.positionId);
                const hasLots = holding.lots && holding.lots.length > 0;

                const getInstrumentUrl = () => {
                  const { type, tradingSymbol, searchId, exchange } =
                    holding.instrument;
                  const id = searchId || tradingSymbol.toLowerCase();
                  const exchangeParam = `?exchange=${exchange}`;

                  if (type === "EQ") return `/stocks/${id}${exchangeParam}`;
                  if (type === "IDX") return `/indices/${id}${exchangeParam}`;
                  if (type === "FUT")
                    return `/futures/${id}/${tradingSymbol}${exchangeParam}`;
                  if (type === "CE" || type === "PE")
                    return `/options/${id}/${tradingSymbol}${exchangeParam}`;
                  return "#";
                };

                return (
                  <Fragment key={holding.positionId}>
                    <TableRow key={holding.positionId}>
                      <TableCell>
                        {hasLots && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedRows);
                              if (isExpanded) {
                                newExpanded.delete(holding.positionId);
                              } else {
                                newExpanded.add(holding.positionId);
                              }
                              setExpandedRows(newExpanded);
                            }}
                            className="hover:bg-muted rounded p-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={getInstrumentUrl()}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage
                              src={metadata?.logoUrl}
                              alt={holding.instrument.tradingSymbol}
                            />
                            <AvatarFallback className="rounded-lg">
                              {holding.instrument.tradingSymbol.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold hover:underline">
                              {titleMap[holding.instrument.id]}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {holding.instrument.tradingSymbol} •{" "}
                              {holding.instrument.exchange}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.qty}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{holding.avgPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{holding.currentPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹
                        {holding.currentValue.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <div
                            className={`font-semibold ${
                              isProfitable
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isProfitable && "+"}₹
                            {holding.totalPnL.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div
                            className={`text-xs ${
                              isProfitable
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isProfitable ? (
                              <TrendingUp className="mr-1 inline h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 inline h-3 w-3" />
                            )}
                            {holding.pnlPercentage.toFixed(2)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">
                            {instrumentTypeName[
                              holding.instrument
                                .type as keyof typeof instrumentTypeName
                            ] || holding.instrument.type}
                          </Badge>
                          <Badge
                            variant={
                              holding.product === "CNC"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {holding.product}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Lots Details */}
                    {isExpanded && hasLots && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50 p-0">
                          <div className="p-4">
                            <h4 className="mb-3 text-sm font-semibold">
                              Individual Lots ({holding.lots!.length})
                            </h4>
                            <div className="space-y-2">
                              {holding.lots!.map((lot, index) => {
                                const lotPnL = lot.unrealizedPnL;
                                const lotPnLPercentage =
                                  ((holding.currentPrice - lot.buyPrice) /
                                    lot.buyPrice) *
                                  100;
                                const lotProfitable = lotPnL >= 0;

                                return (
                                  <div
                                    key={lot.id}
                                    className="bg-card flex items-center justify-between rounded-lg border p-3"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">
                                          Lot {index + 1} • {lot.remainingQty} /{" "}
                                          {lot.totalQty} shares
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                          Bought on{" "}
                                          {formatTimestamp(lot.createdAt)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                      <div className="text-right">
                                        <div className="text-muted-foreground text-xs">
                                          Buy Price
                                        </div>
                                        <div className="font-medium">
                                          ₹{lot.buyPrice.toFixed(2)}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <div className="text-muted-foreground text-xs">
                                          Current
                                        </div>
                                        <div className="font-medium">
                                          ₹{holding.currentPrice.toFixed(2)}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <div className="text-muted-foreground text-xs">
                                          P&L
                                        </div>
                                        <div
                                          className={`font-semibold ${
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
                                          {lotProfitable ? (
                                            <TrendingUp className="mr-1 inline h-3 w-3" />
                                          ) : (
                                            <TrendingDown className="mr-1 inline h-3 w-3" />
                                          )}
                                          {lotPnLPercentage.toFixed(2)}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
