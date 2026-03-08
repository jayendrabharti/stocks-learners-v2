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
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Wallet,
  LogIn,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useSession } from "@/providers/SessionProvider";
import { ErrorAlertDialog } from "@/components/ui/error-alert-dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BuySellSectionProps {
  exchangeToken: string;
  tradingSymbol: string;
  instrumentName: string;
  currentPrice: number;
  lotSize: number;
  exchange: string;
  segment: string;
  leverage?: number; // Dynamic leverage from instrument (default 5x for MIS)
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
  leverage = 5, // Default 5x leverage for MIS if not provided
}: BuySellSectionProps) {
  const { isAuthenticated, status } = useSession();
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

      // Error is already parsed by the trading API service
      const errorMessage = error?.message || "Order failed. Please try again.";
      const errorCode = error?.code;
      const errorAction = error?.action;

      // Determine action based on error code
      let action = undefined;
      if (
        errorCode === "TRADING_INSUFFICIENT_FUNDS" ||
        errorCode === "TRADING_INSUFFICIENT_MARGIN" ||
        errorCode === "ACCOUNT_INSUFFICIENT_BALANCE"
      ) {
        action = {
          label: "Contact Admin",
          href: "/contact",
        };
      } else if (errorAction?.href) {
        action = errorAction;
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

  const parsedQty = parseInt(qty || "0", 10);
  const safeQty = isNaN(parsedQty) ? 0 : parsedQty;
  const orderValue = currentPrice * safeQty;
  // Use dynamic leverage from instrument instead of hardcoded 5x
  const effectiveLeverage = leverage > 0 ? leverage : 5;
  const requiredMargin =
    product === "MIS" ? orderValue / effectiveLeverage : orderValue;

  // Check if user has sufficient funds for BUY
  const hasSufficientFunds =
    !accountLoading && account
      ? (product === "MIS" ? requiredMargin : orderValue) <=
        account.availableMargin
      : true; // Default to true if loading to avoid flickering

  // Get the current position for this instrument and product type
  const currentPosition = positions.find(
    (pos) =>
      pos.instrument?.exchangeToken === exchangeToken &&
      pos.product === product &&
      pos.qty > 0,
  );

  // Check if user has position for SELL (and get the quantity)
  const hasPosition = !positionsLoading && currentPosition !== undefined;
  const positionQty = currentPosition?.qty || 0;

  // Check if sell quantity is valid (not more than owned)
  const sellQtyValid = parseInt(qty || "0") <= positionQty;

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
                leverage={1}
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
                leverage={effectiveLeverage}
              />
            </TabsContent>
          </Tabs>

          {/* Login Required Warning */}
          {status !== "loading" && !isAuthenticated && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-start gap-2">
                <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Login Required
                  </p>
                  <p className="mt-1 text-blue-700 dark:text-blue-300">
                    Please log in to start trading and manage your portfolio.
                  </p>
                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Log in now
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Funds Warning */}
          {isAuthenticated && !accountLoading && !hasSufficientFunds && (
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

          {/* No Position Warning */}
          {isAuthenticated && !positionsLoading && !hasPosition && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/30">
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    No {product} Position
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    You don&apos;t have any {product} holdings for{" "}
                    {tradingSymbol} to sell. Buy first to create a position.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sell Quantity Exceeds Position Warning */}
          {isAuthenticated &&
            !positionsLoading &&
            hasPosition &&
            !sellQtyValid && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm dark:border-orange-800 dark:bg-orange-950/30">
                <div className="flex items-start gap-2">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-500" />
                  <div>
                    <p className="font-medium text-orange-900 dark:text-orange-100">
                      Sell Quantity Too High
                    </p>
                    <p className="mt-1 text-orange-700 dark:text-orange-300">
                      You can only sell up to {positionQty} units of{" "}
                      {tradingSymbol} ({product}). Requested: {qty || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              onClick={() => handleOrderClick("BUY")}
              className="h-11 bg-emerald-600 font-semibold text-white transition-all hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:text-white/70"
              disabled={
                loading ||
                !exchangeToken ||
                !hasSufficientFunds ||
                !isAuthenticated
              }
              title={
                !hasSufficientFunds
                  ? "Insufficient funds"
                  : !isAuthenticated
                    ? "Login required"
                    : undefined
              }
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
              disabled={
                loading ||
                !exchangeToken ||
                !hasPosition ||
                !sellQtyValid ||
                !isAuthenticated
              }
              title={
                !hasPosition
                  ? `No ${product} position to sell`
                  : !sellQtyValid
                    ? `Max sellable: ${positionQty}`
                    : !isAuthenticated
                      ? "Login required"
                      : undefined
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
                  Required Margin ({(100 / effectiveLeverage).toFixed(0)}%):
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
  leverage = 5,
}: {
  qty: string;
  setQty: (v: string) => void;
  lotSize: number;
  currentPrice: number;
  orderValue: number;
  requiredAmount: number;
  product: ProductType;
  leverage?: number;
}) {
  const { account, accountLoading } = usePortfolio();
  const hasSufficientFunds =
    !accountLoading && account
      ? requiredAmount <= account.availableMargin
      : true;

  const marginPercentage = leverage > 0 ? Math.round((1 / leverage) * 100) : 20;

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
            {leverage}x leverage applied (only {marginPercentage}% margin
            required)
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
