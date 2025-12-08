"use client";

import { useRouter } from "next/navigation";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "../ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import ApiClient from "@/utils/ApiClient";

export default function AddFundsButton() {
  const router = useRouter();
  const { activeContext } = usePortfolio();

  const [amount, setAmount] = useState(1000);
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [loading, setLoading] = useState(false);

  if (activeContext.type === "EVENT") {
    return null;
  }

  const fetchExchangeRate = async () => {
    setLoading(true);
    try {
      const response = await ApiClient.get("/settings");
      setExchangeRate(response.data.exchangeRate || 1.0);
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
    } finally {
      setLoading(false);
    }
  };

  const payableAmount = amount ? amount / exchangeRate : 0;

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) fetchExchangeRate();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={"outline"} size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </DialogTrigger>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!amount || amount < 1) {
            toast.error("Please enter a valid amount");
            return;
          }
          router.push(`/add-funds?amount=${amount}`);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Funds to Wallet</DialogTitle>
            <DialogDescription className="text-base">
              Enter the amount of credits you want to add to your trading wallet
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Amount (Credits)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min={1}
                step={100}
                className="h-11"
              />
            </div>

            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                Loading exchange rates...
              </div>
            ) : (
              <div className="bg-muted/50 space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-medium">
                    ₹1 = {exchangeRate} Credits
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="font-semibold">You Pay:</span>
                  <span className="text-lg font-bold">
                    ₹
                    {payableAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" type="button" className="min-w-24">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!amount || amount < 1 || loading}
              className="min-w-32"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
