import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Indices - ${appName}`,
  description:
    "Track major stock market indices. Monitor Nifty, Sensex, and other market benchmarks.",
};

export default function IndicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
