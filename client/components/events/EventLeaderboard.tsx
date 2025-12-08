"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardEntry } from "@/services/eventsApi";
import { TrendingUp, TrendingDown, Trophy, Sparkles } from "lucide-react";

interface EventLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userRank?: { rank: number; totalPnL: number; totalPnLPercentage: number } | null;
  eventStatus?: string;
  prizes?: any;
}

export default function EventLeaderboard({
  leaderboard,
  userRank,
  eventStatus,
  prizes,
}: EventLeaderboardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">🥉 3rd</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  const isEventEnded = eventStatus === "ENDED";
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Winners Podium (shown when event ends) */}
      {isEventEnded && topThree.length > 0 && (
        <div className="relative">
          {/* Celebration Banner */}
          <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white p-6 rounded-lg mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Event Complete - Winners!</h2>
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-lg opacity-90">Congratulations to our top performers!</p>
          </div>

          {/* Winners Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            {topThree[1] && (
              <Card className="border-2 border-gray-400 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-400" />
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <div className="text-6xl">🥈</div>
                  </div>
                  <CardTitle className="text-lg">2nd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={topThree[1].userAvatar || undefined} />
                    <AvatarFallback>{topThree[1].userName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-lg">{topThree[1].userName || "Anonymous"}</p>
                  <div className="space-y-1">
                    <p className={`text-2xl font-bold ${topThree[1].totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{topThree[1].totalPnL.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {topThree[1].totalPnLPercentage >= 0 ? "+" : ""}
                      {topThree[1].totalPnLPercentage.toFixed(2)}% P&L
                    </p>
                  </div>
                  {prizes?.["2nd"] && (
                    <Badge className="bg-gray-400 mt-2">{prizes["2nd"]}</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 1st Place - Larger */}
            {topThree[0] && (
              <Card className="border-4 border-yellow-500 relative overflow-hidden md:order-first md:col-start-1 md:col-end-4 md:row-start-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 scale-105">
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600" />
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <div className="text-7xl animate-bounce">🥇</div>
                  </div>
                  <CardTitle className="text-2xl">🏆 Champion! 🏆</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3">
                  <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-500">
                    <AvatarImage src={topThree[0].userAvatar || undefined} />
                    <AvatarFallback className="text-2xl">{topThree[0].userName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-2xl">{topThree[0].userName || "Anonymous"}</p>
                  <div className="space-y-1">
                    <p className={`text-3xl font-bold ${topThree[0].totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{topThree[0].totalPnL.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {topThree[0].totalPnLPercentage >= 0 ? "+" : ""}
                      {topThree[0].totalPnLPercentage.toFixed(2)}% P&L
                    </p>
                  </div>
                  {prizes?.["1st"] && (
                    <Badge className="bg-yellow-500 text-lg py-1 px-3 mt-2">{prizes["1st"]}</Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <Card className="border-2 border-orange-600 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-orange-600" />
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <div className="text-6xl">🥉</div>
                  </div>
                  <CardTitle className="text-lg">3rd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={topThree[2].userAvatar || undefined} />
                    <AvatarFallback>{topThree[2].userName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <p className="font-bold text-lg">{topThree[2].userName || "Anonymous"}</p>
                  <div className="space-y-1">
                    <p className={`text-2xl font-bold ${topThree[2].totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ₹{topThree[2].totalPnL.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {topThree[2].totalPnLPercentage >= 0 ? "+" : ""}
                      {topThree[2].totalPnLPercentage.toFixed(2)}% P&L
                    </p>
                  </div>
                  {prizes?.["3rd"] && (
                    <Badge className="bg-orange-600 mt-2">{prizes["3rd"]}</Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* User's Rank (if available) */}
      {userRank && (
        <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-2xl font-bold">#{userRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p
                className={`text-2xl font-bold ${
                  userRank.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₹{userRank.totalPnL.toLocaleString()}
              </p>
              <p
                className={`text-sm ${
                  userRank.totalPnLPercentage >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {userRank.totalPnLPercentage >= 0 ? "+" : ""}
                {userRank.totalPnLPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div>
        <h3 className="text-xl font-bold mb-4">
          {isEventEnded ? "Final Rankings" : "Current Standings"}
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rank</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead className="text-right">Portfolio Value</TableHead>
                <TableHead className="text-right">Total P&L</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
                <TableHead className="text-right">Positions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.userId} className={entry.rank <= 3 && isEventEnded ? "bg-muted/50" : ""}>
                  <TableCell>{getRankBadge(entry.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.userAvatar || undefined} />
                        <AvatarFallback>
                          {entry.userName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {entry.userName || "Anonymous"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{entry.portfolioValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        entry.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {entry.totalPnL >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        ₹{Math.abs(entry.totalPnL).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        entry.totalPnLPercentage >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {entry.totalPnLPercentage >= 0 ? "+" : ""}
                      {entry.totalPnLPercentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <span className="font-medium">{entry.totalPositions}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        ({entry.profitablePositions} profitable)
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No participants yet. Be the first to register!
        </div>
      )}
    </div>
  );
}
