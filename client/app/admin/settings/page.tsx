"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ApiClient from "@/utils/ApiClient";

export default function AdminSettingsPage() {
  const [currentRate, setCurrentRate] = useState<number>(1.0);
  const [exchangeRate, setExchangeRate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Fetch current exchange rate on mount
  useEffect(() => {
    ApiClient.get("/admin/settings")
      .then((response) => {
        const rate = response.data.exchangeRate;
        setCurrentRate(rate);
        setExchangeRate(rate.toString());
      })
      .catch((err) => {
        toast.error("Failed to load settings", {
          description: err.response?.data?.error?.message || "Unknown error",
        });
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  const handleUpdateExchangeRate = async () => {
    const rate = parseFloat(exchangeRate);

    // Validation
    if (isNaN(rate) || !isFinite(rate)) {
      toast.error("Invalid exchange rate", {
        description: "Please enter a valid number",
      });
      return;
    }

    if (rate <= 0) {
      toast.error("Invalid exchange rate", {
        description: "Exchange rate must be greater than 0",
      });
      return;
    }

    if (rate > 1000) {
      toast.error("Invalid exchange rate", {
        description: "Exchange rate cannot exceed 1000",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiClient.put("/admin/settings/exchange-rate", {
        exchangeRate: rate,
      });

      if (response.status === 200) {
        setCurrentRate(rate);
        toast.success("Exchange rate updated successfully!");
      }
    } catch (err: any) {
      toast.error("Failed to update exchange rate", {
        description: err.response?.data?.error?.message || "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Settings</h1>
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
              Set the conversion rate from real money to dummy trading money.
              Current rate: <span className="font-medium">{currentRate}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate">Exchange Rate</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1000"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder="1.0"
                  />
                  <p className="text-muted-foreground text-sm">
                    Example: If exchange rate is 10, depositing ₹100 will give
                    ₹1000 dummy money
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="mb-2 font-medium">Preview</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      ₹100 real money = ₹
                      {(100 * (parseFloat(exchangeRate) || 0)).toLocaleString()}{" "}
                      dummy money
                    </p>
                    <p>
                      ₹1,000 real money = ₹
                      {(
                        1000 * (parseFloat(exchangeRate) || 0)
                      ).toLocaleString()}{" "}
                      dummy money
                    </p>
                    <p>
                      ₹10,000 real money = ₹
                      {(
                        10000 * (parseFloat(exchangeRate) || 0)
                      ).toLocaleString()}{" "}
                      dummy money
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleUpdateExchangeRate}
                  disabled={
                    isLoading || !exchangeRate || parseFloat(exchangeRate) <= 0
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Exchange Rate"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
