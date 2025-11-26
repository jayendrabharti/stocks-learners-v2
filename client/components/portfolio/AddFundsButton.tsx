"use client";

import { useRouter } from "next/navigation";
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

export default function AddFundsButton() {
  const router = useRouter();

  const [amount, setAmount] = useState(1000);

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant={"outline"}>
            Add Funds <PlusIcon />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="amount-1">Amount</Label>
              <Input
                id="amount-1"
                name="amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={() => {
                if (!amount) {
                  toast.error("Add amount.");
                }
                router.push(`/add-funds?amount=${amount}`);
              }}
            >
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
