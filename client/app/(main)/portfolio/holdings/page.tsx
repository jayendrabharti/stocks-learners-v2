"use client";

import { PortfolioHoldings } from "@/components/portfolio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { TrendingUp } from "lucide-react";

export default function HoldingsPage() {
  const [sortBy, setSortBy] = useState<string>("name");

  return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
              <TrendingUp className="h-8 w-8" />
              Holdings
            </h1>
            <p className="text-muted-foreground">
              View and manage your stock positions
            </p>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="pnl-high">P&L (High to Low)</SelectItem>
                <SelectItem value="pnl-low">P&L (Low to High)</SelectItem>
                <SelectItem value="value-high">Value (High to Low)</SelectItem>
                <SelectItem value="value-low">Value (Low to High)</SelectItem>
                <SelectItem value="qty-high">Quantity (High to Low)</SelectItem>
                <SelectItem value="qty-low">Quantity (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Holdings by Product Type */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Holdings</TabsTrigger>
            <TabsTrigger value="CNC">Delivery (CNC)</TabsTrigger>
            <TabsTrigger value="MIS">Intraday (MIS)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <PortfolioHoldings sortBy={sortBy} />
          </TabsContent>

          <TabsContent value="CNC" className="mt-6">
            <PortfolioHoldings product="CNC" sortBy={sortBy} />
          </TabsContent>

          <TabsContent value="MIS" className="mt-6">
            <PortfolioHoldings product="MIS" sortBy={sortBy} />
          </TabsContent>
        </Tabs>
      </div>
  );
}
