"use client";

import Link from "next/link";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";

export default function AddFundsButton() {
  const { activeContext } = usePortfolio();

  if (activeContext.type === "EVENT") {
    return null;
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/contact">
        <MessageCircle className="mr-2 h-4 w-4" />
        Need More Funds?
      </Link>
    </Button>
  );
}
