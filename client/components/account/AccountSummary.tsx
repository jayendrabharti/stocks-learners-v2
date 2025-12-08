"use client";

import { usePortfolio } from "@/providers/PortfolioProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, TrendingUp, Wallet } from "lucide-react";
import AddFundsButton from "../portfolio/AddFundsButton";

export function AccountSummary() {
  const { account, accountLoading: loading } = usePortfolio();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Cash */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
          <Wallet className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-row justify-between">
            <span className="text-2xl font-bold">
              ₹
              {account.totalCash.toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </span>
            <AddFundsButton />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Total funds in account
          </p>
        </CardContent>
      </Card>

      {/* Used Margin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Used Margin</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹
            {account.usedMargin.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Blocked for open positions
          </p>
        </CardContent>
      </Card>

      {/* Available Margin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Available Margin
          </CardTitle>
          <IndianRupee className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₹
            {account.availableMargin.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Available for trading
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
