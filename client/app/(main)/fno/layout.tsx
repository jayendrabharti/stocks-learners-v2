import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `F&O Trading - ${appName}`,
  description:
    "Trade futures and options in a virtual environment. Learn derivatives trading with zero risk.",
};

export default function FnoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
