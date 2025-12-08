import { Metadata } from "next";
import { appName } from "@/utils/data";

export const metadata: Metadata = {
  title: `Profile - ${appName}`,
  description: "Manage your account settings and profile information.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
