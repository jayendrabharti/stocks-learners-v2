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
  const { account, accountLoading, refreshAll, activeContext } = usePortfolio();

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

    if (!qty || parseInt(qty) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (parseInt(qty) % lotSize !== 0) {
      toast.error(`Quantity must be a multiple of lot size (${lotSize})`);
      return;
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
      const errorMessage = errorData?.message || error?.message || "Order failed";
      const errorCode = errorData?.code || errorData?.errorCode;
      const suggestedAction = errorData?.action;
      
      // Determine action based on error code
      let action = undefined;
      if (errorCode === "INSUFFICIENT_FUNDS" || errorCode === "INSUFFICIENT_MARGIN") {
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
                <span className="font-semibold text-green-600">
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => handleOrderClick("BUY")}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading || !exchangeToken}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              BUY
            </Button>
            <Button
              onClick={() => handleOrderClick("SELL")}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading || !exchangeToken}
            >
              <TrendingDown className="mr-2 h-4 w-4" />
              SELL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {orderSide} Order</DialogTitle>
            <DialogDescription>
              Please review your order details before confirming
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instrument:</span>
              <span className="font-medium">{tradingSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Side:</span>
              <span
                className={`font-medium ${
                  orderSide === "BUY" ? "text-green-600" : "text-red-600"
                }`}
              >
                {orderSide}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{qty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product:</span>
              <span className="font-medium">{product}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">₹{currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Order Value:</span>
              <span className="font-semibold">
                ₹
                {orderValue.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {product === "MIS" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required Margin:</span>
                <span className="font-medium">
                  ₹
                  {requiredMargin.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOrder}
              disabled={loading}
              className={
                orderSide === "BUY"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {orderSide}
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
          <span className="font-semibold">
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
      </div>
    </>
  );
}
