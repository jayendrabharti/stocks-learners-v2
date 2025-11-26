"use client";

import { useEffect, useState } from "react";
import ApiClient from "@/utils/ApiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface LeaderboardUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  totalPnL: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalInvested: number;
  holdingsValue: number;
  portfolioValue: number;
  createdAt: string;
  rank: number;
}

interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await ApiClient.get<LeaderboardResponse>(
          "/admin/leaderboard",
          {
            params: {
              limit: 100,
            },
          },
        );

        if (response.data.success) {
          setLeaderboard(response.data.leaderboard);
        } else {
          setError("Failed to fetch leaderboard");
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to fetch leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <Trophy className="mr-1 h-3 w-3" />
          1st
        </Badge>
      );
    if (rank === 2)
      return (
        <Badge className="bg-gray-400 hover:bg-gray-500">
          <Trophy className="mr-1 h-3 w-3" />
          2nd
        </Badge>
      );
    if (rank === 3)
      return (
        <Badge className="bg-orange-600 hover:bg-orange-700">
          <Trophy className="mr-1 h-3 w-3" />
          3rd
        </Badge>
      );
    return <Badge variant="outline">{rank}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Users ranked by total profit & loss
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>
            {leaderboard.length} users ranked by total P&L
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total P&L</TableHead>
                <TableHead className="text-right">Realized P&L</TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
                <TableHead className="text-right">Holdings Value</TableHead>
                <TableHead className="text-right">Portfolio Value</TableHead>
                <TableHead className="text-right">Total Invested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                leaderboard.map((user) => {
                  const isProfitable = user.totalPnL >= 0;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>{getRankBadge(user.rank)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>
                              {user.name
                                ? user.name.charAt(0).toUpperCase()
                                : user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.name || "Anonymous"}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-semibold ${
                            isProfitable
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isProfitable ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {formatCurrency(user.totalPnL)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            user.totalRealizedPnL >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatCurrency(user.totalRealizedPnL)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            user.totalUnrealizedPnL >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatCurrency(user.totalUnrealizedPnL)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(user.holdingsValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(user.portfolioValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(user.totalInvested)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
