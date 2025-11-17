"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Clock, ArrowDownUp } from "lucide-react";
import { useEffect, useState } from "react";
import ApiClient from "@/utils/ApiClient";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await ApiClient.get("/trading/transactions");
        const txns = response.data.transactions || [];
        setTransactions(txns);

        // Fetch metadata for stocks/indices
        const newMetadata: Record<string, any> = {};
        for (const txn of txns) {
          if (txn.instrument.type === "EQ" || txn.instrument.type === "IDX") {
            try {
              const searchId = txn.instrument.tradingSymbol.toLowerCase();
              const metaResponse = await ApiClient.get(
                `/metadata?search_id=${searchId}`,
              );
              newMetadata[txn.instrument.id] = metaResponse.data;
            } catch (error) {
              // Metadata not found - logo will not be displayed
            }
          }
        }
        setMetadataMap(newMetadata);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const buyTransactions = transactions.filter((t) => t.side === "BUY");
  const sellTransactions = transactions.filter((t) => t.side === "SELL");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Transaction History ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No transactions yet</p>
            <p className="mt-1 text-sm">
              Start trading to see your transaction history
            </p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="BUY">
                BUY ({buyTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="SELL">
                SELL ({sellTransactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TransactionsList
                transactions={transactions}
                metadataMap={metadataMap}
              />
            </TabsContent>

            <TabsContent value="BUY" className="mt-4">
              <TransactionsList
                transactions={buyTransactions}
                metadataMap={metadataMap}
              />
            </TabsContent>

            <TabsContent value="SELL" className="mt-4">
              <TransactionsList
                transactions={sellTransactions}
                metadataMap={metadataMap}
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionsList({
  transactions,
  metadataMap,
}: {
  transactions: Transaction[];
  metadataMap: Record<string, any>;
}) {
  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground py-6 text-center text-sm">
        No transactions in this category
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isBuy = transaction.side === "BUY";
        const hasProfit =
          transaction.realizedPnl && transaction.realizedPnl > 0;
        const metadata = metadataMap[transaction.instrument.id];
        const date = new Date(transaction.createdAt);

        return (
          <div
            key={transaction.id}
            className="bg-card hover:bg-muted/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-start gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage
                    src={metadata?.logoUrl}
                    alt={transaction.instrument.tradingSymbol}
                  />
                  <AvatarFallback className="rounded-lg">
                    {transaction.instrument.tradingSymbol.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
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
                  <div className="text-muted-foreground text-xs">
                    {transaction.instrument.tradingSymbol} •{" "}
                    {transaction.instrument.exchange}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {date.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>

              <div className="ml-3 shrink-0 space-y-1 text-right">
                <div className="text-sm">
                  <span className="text-muted-foreground">Qty: </span>
                  <span className="font-medium">{transaction.qty}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Price: </span>
                  <span className="font-medium">
                    ₹{transaction.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Value: </span>
                  <span className="font-medium">
                    ₹
                    {(transaction.price * transaction.qty).toLocaleString(
                      "en-IN",
                      { maximumFractionDigits: 0 },
                    )}
                  </span>
                </div>
                {transaction.fees > 0 && (
                  <div className="text-muted-foreground text-xs">
                    Fees: ₹{transaction.fees.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {transaction.realizedPnl !== null && (
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Realized P&L:
                  </span>
                  <div
                    className={`flex items-center gap-1 font-semibold ${
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
                    {transaction.realizedPnl.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
