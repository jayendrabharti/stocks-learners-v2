"use client";

import { AccountSummary } from "@/components/account/AccountSummary";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { usePortfolio } from "@/providers/PortfolioProvider";

export default function Page() {
  const { portfolio, portfolioLoading: loading } = usePortfolio();

  // Calculate holdings performance (unrealized P&L from all open positions)
  const calculateHoldingsPerformance = () => {
    if (!portfolio) return { amount: 0, isPositive: true };

    let unrealizedPnL = 0;

    // Sum up unrealized P&L for all holdings
    // This represents the profit/loss on current holdings since they were bought
    const allHoldings = [
      ...portfolio.holdings.CNC.positions,
      ...portfolio.holdings.MIS.positions,
    ];

    allHoldings.forEach((holding) => {
      unrealizedPnL += holding.unrealizedPnL;
    });

    return {
      amount: unrealizedPnL,
      isPositive: unrealizedPnL >= 0,
    };
  };

  const holdingsPerf = calculateHoldingsPerformance();

  return (
      <div className="space-y-6 pb-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your portfolio and trading performance
          </p>
        </div>

        {/* Account Summary Cards */}
        <AccountSummary />

        {/* Portfolio Overview Cards */}
        <PortfolioOverview />

        {/* Additional Dashboard Widgets */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Holdings Performance
              </CardTitle>
              {holdingsPerf.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="bg-muted h-8 w-24 animate-pulse rounded"></div>
              ) : (
                <>
                  <div
                    className={`text-2xl font-bold ${
                      holdingsPerf.isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {holdingsPerf.isPositive ? "+" : ""}₹
                    {Math.abs(holdingsPerf.amount).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Unrealized P&L on current positions
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invested
              </CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="bg-muted h-8 w-24 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ₹
                    {portfolio?.totalInvestedValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    }) || "0.00"}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Across all holdings
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Breakdown / Reconciliation */}
        {!loading && portfolio && (
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Portfolio Breakdown & P&L Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {/* Portfolio Value Calculation */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cash:</span>
                    <span className="font-medium">
                      ₹
                      {portfolio.account.totalCash.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      + Holdings Value:
                    </span>
                    <span className="font-medium">
                      ₹
                      {portfolio.totalCurrentValue.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Portfolio Value:</span>
                    <span>
                      ₹
                      {portfolio.totalPortfolioValue.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* P&L Breakdown */}
                <div className="space-y-2 border-t pt-3">
                  <div className="text-muted-foreground mb-2 text-xs font-semibold">
                    P&L Breakdown:
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Realized P&L (All-time):
                    </span>
                    <span
                      className={
                        portfolio.totalRealizedPnLAllTime >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {portfolio.totalRealizedPnLAllTime >= 0 ? "+" : ""}₹
                      {portfolio.totalRealizedPnLAllTime.toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits: 2,
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Unrealized P&L (Current):
                    </span>
                    <span
                      className={
                        portfolio.totalUnrealizedPnL >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {portfolio.totalUnrealizedPnL >= 0 ? "+" : ""}₹
                      {portfolio.totalUnrealizedPnL.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-xs font-semibold">
                    <span>Total P&L:</span>
                    <span
                      className={
                        portfolio.totalPnL >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {portfolio.totalPnL >= 0 ? "+" : ""}₹
                      {portfolio.totalPnL.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Fees */}
                {portfolio.totalFeesPaid > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Total Fees Paid:
                      </span>
                      <span className="text-muted-foreground">
                        ₹
                        {portfolio.totalFeesPaid.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">
              <p>
                View detailed{" "}
                <a
                  href="/portfolio/holdings"
                  className="text-primary hover:underline"
                >
                  Holdings
                </a>
                ,{" "}
                <a
                  href="/portfolio/transactions"
                  className="text-primary hover:underline"
                >
                  Transactions
                </a>
                , or{" "}
                <a
                  href="/portfolio/activity"
                  className="text-primary hover:underline"
                >
                  Activity
                </a>{" "}
                from the sidebar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
