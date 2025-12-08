import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Stocks - ${appName}`,
  description:
    "Browse and trade stocks in a virtual environment. Learn stock trading with real market data.",
};

export default function StocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
