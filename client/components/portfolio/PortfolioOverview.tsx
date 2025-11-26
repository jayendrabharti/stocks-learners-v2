"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, PieChart } from "lucide-react";
import { usePortfolio } from "@/providers/PortfolioProvider";

export function PortfolioOverview() {
  const { portfolio, portfolioLoading: loading } = usePortfolio();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="bg-muted h-4 w-24 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!portfolio) return null;

  const isProfitable = portfolio.totalPnL >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <PieChart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹
            {portfolio.totalPortfolioValue.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Cash + Holdings</p>
        </CardContent>
      </Card>

      {/* Current Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Holdings Value</CardTitle>
          <Activity className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹
            {portfolio.totalCurrentValue.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Invested: ₹
            {portfolio.totalInvestedValue.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              isProfitable
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isProfitable ? "+" : ""}₹
            {portfolio.totalPnL.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </div>
          <p
            className={`mt-1 text-xs ${
              isProfitable
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isProfitable ? "+" : ""}
            {portfolio.totalPnLPercentage.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Positions</CardTitle>
          <Activity className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {portfolio.stats.totalPositions}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            <span className="text-green-600">
              {portfolio.stats.profitablePositions}{" "}
            </span>
            profitable,{" "}
            <span className="text-red-600">
              {portfolio.stats.lossPositions}{" "}
            </span>
            loss
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
