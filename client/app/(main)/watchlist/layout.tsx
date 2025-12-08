import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Watchlist - ${appName}`,
  description:
    "Manage your stock watchlist. Track your favorite stocks and monitor their performance.",
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
