"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import ApiClient from "@/utils/ApiClient";
import { usePortfolio } from "@/providers/PortfolioProvider";

interface Transaction {
  id: string;
  side: "BUY" | "SELL";
  product: "CNC" | "MIS";
  qty: number;
  price: number;
  limitPrice: number | null;
  realizedPnl: number | null;
  fees: number;
  createdAt: string;
  instrument: {
    id: string;
    tradingSymbol: string;
    name: string | null;
    type: string;
    exchange: string;
    segment: string;
  };
}

export default function Page() {
  const { activeContext } = usePortfolio();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        
        // Fetch transactions based on active context
        const response = activeContext.type === "EVENT" && activeContext.eventId
          ? await ApiClient.get(`/events/${activeContext.eventId}/trading/transactions`)
          : await ApiClient.get("/trading/transactions");
        
        const txns = response.data.transactions || [];
        // Show only recent 20 activities
        setTransactions(txns.slice(0, 20));

        // Fetch metadata for stocks/indices
        const newMetadata: Record<string, any> = {};
        for (const txn of txns.slice(0, 20)) {
          if (txn.instrument.type === "EQ" || txn.instrument.type === "IDX") {
            try {
              const searchId = txn.instrument.tradingSymbol.toLowerCase();
              const metaResponse = await ApiClient.get(
                `/metadata?search_id=${searchId}`,
              );
              newMetadata[txn.instrument.id] = metaResponse.data;
            } catch (error) {
              // Metadata not found
            }
          }
        }
        setMetadataMap(newMetadata);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activeContext.type, activeContext.eventId]);

  if (loading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          </CardContent>
        </Card>
    );
  }

  return (
      <div className="space-y-6 pb-6">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
            <Activity className="h-8 w-8" />
            Activity Log
          </h1>
          <p className="text-muted-foreground">
            Timeline of your recent trading activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <Clock className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p>No activity yet</p>
                <p className="mt-1 text-sm">
                  Start trading to see your activity log
                </p>
              </div>
            ) : (
              <div className="relative space-y-4">
                {/* Timeline Line */}
                <div className="border-border absolute top-0 left-5 h-full w-px border-l-2"></div>

                {/* Activity Items */}
                {transactions.map((transaction, index) => {
                  const isBuy = transaction.side === "BUY";
                  const metadata = metadataMap[transaction.instrument.id];
                  const date = new Date(transaction.createdAt);
                  const hasProfit =
                    transaction.realizedPnl && transaction.realizedPnl > 0;

                  return (
                    <div key={transaction.id} className="relative pl-12">
                      {/* Timeline Dot */}
                      <div
                        className={`border-background absolute top-3 left-3 h-4 w-4 rounded-full border-2 ${
                          isBuy ? "bg-green-600" : "bg-red-600"
                        }`}
                      ></div>

                      <div className="bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-start gap-3">
                            <Avatar className="h-12 w-12 rounded-lg">
                              <AvatarImage
                                src={metadata?.logoUrl}
                                alt={transaction.instrument.tradingSymbol}
                              />
                              <AvatarFallback className="rounded-lg">
                                {transaction.instrument.tradingSymbol.substring(
                                  0,
                                  2,
                                )}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-semibold">
                                  {isBuy ? "Bought" : "Sold"} {transaction.qty}{" "}
                                  shares of{" "}
                                  {metadata?.displayName ||
                                    transaction.instrument.name ||
                                    transaction.instrument.tradingSymbol}
                                </span>
                                <Badge
                                  variant={isBuy ? "default" : "destructive"}
                                  className={
                                    isBuy
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "bg-red-600 hover:bg-red-700"
                                  }
                                >
                                  {transaction.side}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.product}
                                </Badge>
                              </div>

                              <div className="text-muted-foreground text-sm">
                                <div>
                                  {transaction.instrument.tradingSymbol} •{" "}
                                  {transaction.instrument.exchange}
                                </div>
                                <div className="mt-1 flex items-center gap-4">
                                  <span>
                                    Price: ₹{transaction.price.toFixed(2)}
                                  </span>
                                  <span>
                                    Value: ₹
                                    {(
                                      transaction.price * transaction.qty
                                    ).toLocaleString("en-IN", {
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                  {transaction.fees > 0 && (
                                    <span className="text-xs">
                                      Fees: ₹{transaction.fees.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {date.toLocaleString("en-IN", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </div>

                              {transaction.realizedPnl !== null && (
                                <div className="mt-2 border-t pt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">
                                      Realized P&L:
                                    </span>
                                    <span
                                      className={`flex items-center gap-1 text-sm font-semibold ${
                                        hasProfit
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-red-600 dark:text-red-400"
                                      }`}
                                    >
                                      {hasProfit ? (
                                        <TrendingUp className="h-3 w-3" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3" />
                                      )}
                                      {hasProfit && "+"}₹
                                      {transaction.realizedPnl.toLocaleString(
                                        "en-IN",
                                        { maximumFractionDigits: 2 },
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
