"use client";

import AuthGuard from "@/auth/AuthGuard";
import { AccountSummary } from "@/components/account/AccountSummary";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { getPortfolio, type Portfolio } from "@/services/portfolioApi";

export default function Page() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate today's performance (positions opened today)
  const calculateTodayPerformance = () => {
    if (!portfolio) return { amount: 0, isPositive: true };

    const today = new Date().toDateString();
    let todayPnL = 0;

    // Sum up unrealized P&L for all holdings
    // This gives us the current day's movement since unrealized P&L represents
    // the difference between current price and buy price
    const allHoldings = [
      ...portfolio.holdings.CNC.positions,
      ...portfolio.holdings.MIS.positions,
    ];

    allHoldings.forEach((holding) => {
      todayPnL += holding.unrealizedPnL;
    });

    return {
      amount: todayPnL,
      isPositive: todayPnL >= 0,
    };
  };

  const todayPerf = calculateTodayPerformance();

  return (
    <AuthGuard>
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
                Today's Performance
              </CardTitle>
              {todayPerf.isPositive ? (
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
                      todayPerf.isPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {todayPerf.isPositive ? "+" : ""}₹
                    {Math.abs(todayPerf.amount).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Day change in portfolio
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
    </AuthGuard>
  );
}
