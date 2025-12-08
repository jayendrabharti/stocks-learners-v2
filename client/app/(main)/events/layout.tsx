import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Trading Events - ${appName}`,
  description:
    "Join exciting virtual trading competitions. Test your skills against other traders and win prizes.",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
