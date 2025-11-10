import AuthGuard from "@/auth/AuthGuard";
import Unauthenticated from "@/components/auth/Unauthenticated";
import { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthGuard fallback={<Unauthenticated />}>{children}</AuthGuard>;
}
