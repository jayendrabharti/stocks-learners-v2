"use client";

import { useState } from "react";
import { executeBuyOrder, executeSellOrder } from "@/services/tradingApi";
import eventTradingApi from "@/services/eventTradingApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { cn } from "@/lib/utils";

interface BuySellSectionProps {
  exchangeToken: string;
  tradingSymbol: string;
  instrumentName: string;
  currentPrice: number;
  lotSize: number;
  exchange: string;
  segment: string;
}

type ProductType = "CNC" | "MIS";

export function BuySellSection({
  exchangeToken,
  tradingSymbol,
  instrumentName,
  currentPrice,
  lotSize,
  exchange,
  segment,
}: BuySellSectionProps) {
  const {
    account,
    accountLoading,
    refreshAll,
    activeContext,
    positions,
    positionsLoading,
  } = usePortfolio();

  const [qty, setQty] = useState<string>(lotSize.toString());
  const [product, setProduct] = useState<ProductType>("CNC");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    message: string;
    errorCode?: string;
    action?: { label: string; href?: string; onClick?: () => void };
  } | null>(null);

  const handleOrderClick = (side: "BUY" | "SELL") => {
    if (!exchangeToken) {
      toast.error("Instrument not loaded");
      return;
    }

    const parsedQty = parseInt(qty);

    if (!qty || isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }

    if (parsedQty % lotSize !== 0) {
      toast.error(`Quantity must be a multiple of lot size (${lotSize})`);
      return;
    }

    // For BUY orders, check if user has sufficient funds
    if (side === "BUY" && !accountLoading && account) {
      const requiredAmount = product === "MIS" ? requiredMargin : orderValue;
      if (requiredAmount > account.availableMargin) {
        toast.error("Insufficient funds", {
          description: `Required: ₹${requiredAmount.toFixed(2)}, Available: ₹${account.availableMargin.toFixed(2)}`,
        });
        return;
      }
    }

    setOrderSide(side);
    setShowConfirmDialog(true);
  };

  const executeOrder = async () => {
    if (!orderSide) return;

    try {
      setLoading(true);
      const orderData = {
        exchangeToken,
        qty: parseInt(qty),
        product,
      };

      let result;

      // Route to appropriate trading API based on active context
      if (activeContext.type === "EVENT" && activeContext.eventId) {
        // Use event trading API
        result =
          orderSide === "BUY"
            ? await eventTradingApi.buyOrder(activeContext.eventId, orderData)
            : await eventTradingApi.sellOrder(activeContext.eventId, orderData);
      } else {
        // Use main trading API
        result =
          orderSide === "BUY"
            ? await executeBuyOrder(orderData)
            : await executeSellOrder(orderData);
      }

      toast.success(result.message, {
        description: `${orderSide} ${qty} ${tradingSymbol} @ ₹${result.executedPrice.toFixed(2)}`,
      });

      setShowConfirmDialog(false);
      setQty(lotSize.toString());

      // Refresh portfolio data
      await refreshAll();
    } catch (error: any) {
      setShowConfirmDialog(false);

      // Parse error response
      const errorData = error?.response?.data?.error || error;
      const errorMessage =
        errorData?.message || error?.message || "Order failed";
      const errorCode = errorData?.code || errorData?.errorCode;
      const suggestedAction = errorData?.action;

      // Determine action based on error code
      let action = undefined;
      if (
        errorCode === "INSUFFICIENT_FUNDS" ||
        errorCode === "INSUFFICIENT_MARGIN"
      ) {
        action = {
          label: "Add Funds",
          href: "/add-funds",
        };
      } else if (suggestedAction) {
        action = {
          label: suggestedAction,
          onClick: () => setErrorDialog(null),
        };
      }

      setErrorDialog({
        message: errorMessage,
        errorCode,
        action,
      });
    } finally {
      setLoading(false);
    }
  };

  const orderValue = currentPrice * parseInt(qty || "0");
  const requiredMargin = product === "MIS" ? orderValue / 5 : orderValue;

  // Check if user has sufficient funds for BUY
  const hasSufficientFunds =
    !accountLoading && account
      ? (product === "MIS" ? requiredMargin : orderValue) <=
        account.availableMargin
      : true; // Default to true if loading to avoid flickering

  // Check if user has position for SELL
  const hasPosition =
    !positionsLoading && positions.length > 0
      ? positions.some(
          (pos) =>
            pos.instrument?.exchangeToken === exchangeToken &&
            pos.product === product &&
            pos.qty > 0,
        )
      : false;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Place Order</span>
            {!accountLoading && account && (
              <div className="flex items-center gap-2 text-sm font-normal">
                <Wallet className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">Available:</span>
                <span
                  className={`font-semibold ${hasSufficientFunds ? "text-green-600" : "text-red-600"}`}
                >
                  ₹
                  {account.availableMargin.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={product}
            onValueChange={(v) => setProduct(v as ProductType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="CNC">CNC (Delivery)</TabsTrigger>
              <TabsTrigger value="MIS">MIS (Intraday)</TabsTrigger>
            </TabsList>
            <TabsContent value="CNC" className="mt-4 space-y-4">
              <OrderInputs
                qty={qty}
                setQty={setQty}
                lotSize={lotSize}
                currentPrice={currentPrice}
                orderValue={orderValue}
                requiredAmount={orderValue}
                product="CNC"
              />
            </TabsContent>
            <TabsContent value="MIS" className="mt-4 space-y-4">
              <OrderInputs
                qty={qty}
                setQty={setQty}
                lotSize={lotSize}
                currentPrice={currentPrice}
                orderValue={orderValue}
                requiredAmount={requiredMargin}
                product="MIS"
              />
            </TabsContent>
          </Tabs>

          {/* Insufficient Funds Warning */}
          {!accountLoading && !hasSufficientFunds && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Insufficient Funds
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300">
                    Required: ₹
                    {(product === "MIS"
                      ? requiredMargin
                      : orderValue
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    • Available: ₹
                    {account?.availableMargin.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              onClick={() => handleOrderClick("BUY")}
              className="h-11 bg-emerald-600 font-semibold text-white transition-all hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:text-white/70"
              disabled={loading || !exchangeToken || !hasSufficientFunds}
              title={!hasSufficientFunds ? "Insufficient funds" : undefined}
            >
              {loading && orderSide === "BUY" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              {loading && orderSide === "BUY" ? "Buying..." : "BUY"}
            </Button>
            <Button
              onClick={() => handleOrderClick("SELL")}
              className="h-11 bg-rose-600 font-semibold text-white transition-all hover:bg-rose-700 disabled:bg-rose-600/50 disabled:text-white/70"
              disabled={loading || !exchangeToken || !hasPosition}
              title={
                !hasPosition ? `No ${product} position to sell` : undefined
              }
            >
              {loading && orderSide === "SELL" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingDown className="mr-2 h-4 w-4" />
              )}
              {loading && orderSide === "SELL" ? "Selling..." : "SELL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Confirm {orderSide} Order
            </DialogTitle>
            <DialogDescription className="text-base">
              Please review your order details before confirming
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Instrument:</span>
              <span className="font-semibold">{tradingSymbol}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Side:</span>
              <span
                className={`font-semibold ${
                  orderSide === "BUY"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {orderSide}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Quantity:</span>
              <span className="font-semibold">{qty}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Product:</span>
              <span className="font-semibold">{product}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground text-sm">Price:</span>
              <span className="font-semibold">₹{currentPrice.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <span className="font-bold">Order Value:</span>
              <span className="text-lg font-bold">
                ₹
                {orderValue.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {product === "MIS" && (
              <div className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2">
                <span className="text-muted-foreground text-sm">
                  Required Margin (20%):
                </span>
                <span className="font-semibold">
                  ₹
                  {requiredMargin.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              onClick={executeOrder}
              disabled={loading}
              className={cn(
                "min-w-32 font-semibold",
                orderSide === "BUY"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-rose-600 text-white hover:bg-rose-700",
              )}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Processing..." : `Confirm ${orderSide}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Alert Dialog */}
      {errorDialog && (
        <ErrorAlertDialog
          open={!!errorDialog}
          onOpenChange={(open) => !open && setErrorDialog(null)}
          message={errorDialog.message}
          errorCode={errorDialog.errorCode}
          action={errorDialog.action}
        />
      )}
    </>
  );
}

function OrderInputs({
  qty,
  setQty,
  lotSize,
  currentPrice,
  orderValue,
  requiredAmount,
  product,
}: {
  qty: string;
  setQty: (v: string) => void;
  lotSize: number;
  currentPrice: number;
  orderValue: number;
  requiredAmount: number;
  product: ProductType;
}) {
  const { account, accountLoading } = usePortfolio();
  const hasSufficientFunds =
    !accountLoading && account
      ? requiredAmount <= account.availableMargin
      : true;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input
          id="qty"
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min={lotSize}
          step={lotSize}
          placeholder={`Min: ${lotSize}`}
        />
        <p className="text-muted-foreground text-xs">Lot size: {lotSize}</p>
      </div>

      <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-medium">₹{currentPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order Value:</span>
          <span className="font-medium">
            ₹{orderValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2 text-sm">
          <span className="text-muted-foreground font-medium">
            {product === "MIS" ? "Required Margin:" : "Required Amount:"}
          </span>
          <span
            className={`font-semibold ${!hasSufficientFunds ? "text-red-600" : ""}`}
          >
            ₹
            {requiredAmount.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {product === "MIS" && (
          <p className="text-muted-foreground text-xs">
            5x leverage applied (only 20% margin required)
          </p>
        )}
        {!hasSufficientFunds && account && (
          <p className="text-xs font-medium text-red-600">
            Insufficient funds. Available: ₹
            {account.availableMargin.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </p>
        )}
      </div>
    </>
  );
}
