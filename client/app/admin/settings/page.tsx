"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateExchangeRate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings/exchange-rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeRate: parseFloat(exchangeRate) }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update exchange rate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Configure application settings
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Exchange Rate Configuration
            </CardTitle>
            <CardDescription>
              Set the conversion rate from real money to dummy trading money
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Exchange Rate</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.1"
                min="0.1"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="1.0"
              />
              <p className="text-sm text-muted-foreground">
                Example: If exchange rate is 10, depositing ₹100 will give ₹1000 dummy money
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="space-y-1 text-sm">
                <p>₹100 real money = ₹{(100 * parseFloat(exchangeRate || "1")).toLocaleString()} dummy money</p>
                <p>₹1,000 real money = ₹{(1000 * parseFloat(exchangeRate || "1")).toLocaleString()} dummy money</p>
                <p>₹10,000 real money = ₹{(10000 * parseFloat(exchangeRate || "1")).toLocaleString()} dummy money</p>
              </div>
            </div>

            <Button
              onClick={handleUpdateExchangeRate}
              disabled={isLoading || !exchangeRate || parseFloat(exchangeRate) <= 0}
            >
              {isLoading ? "Updating..." : "Update Exchange Rate"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
