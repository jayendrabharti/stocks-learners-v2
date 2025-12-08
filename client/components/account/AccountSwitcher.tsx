"use client";

import { useState } from "react";
import { useAccount } from "@/providers/AccountProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Wallet, Trophy } from "lucide-react";

export default function AccountSwitcher() {
  const { currentAccount, accounts, switchAccount } = useAccount();

  if (accounts.length <= 1) {
    return null; // Don't show if only main account exists
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Active Account</label>
        <Select
          value={currentAccount?.id}
          onValueChange={switchAccount}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-2">
                  {account.type === "main" ? (
                    <Wallet className="h-4 w-4" />
                  ) : (
                    <Trophy className="h-4 w-4" />
                  )}
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{account.cash.toLocaleString()} available
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Current Account Info */}
        {currentAccount && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cash Balance</span>
              <span className="text-sm font-bold">
                ₹{currentAccount.cash.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Used Margin</span>
              <span className="text-sm">
                ₹{currentAccount.usedMargin.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="text-sm text-green-600 font-medium">
                ₹{currentAccount.availableMargin.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
