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
    <Dialog onOpenChange={(open) => {
      if (open) fetchExchangeRate();
    }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!amount) {
          toast.error("Add amount.");
          return;
        }
        router.push(`/add-funds?amount=${amount}`);
      }}>
        <DialogTrigger asChild>
          <Button variant={"outline"}>
            Add Funds <PlusIcon className="ml-2 h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount of credits you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (Credits)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter amount"
                min={1}
              />
            </div>
            
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading rates...</div>
            ) : (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-medium">1 INR = {exchangeRate} Credits</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                  <span>You Pay:</span>
                  <span>₹{payableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              Proceed to Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
