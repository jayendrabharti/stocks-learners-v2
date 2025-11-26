"use client";
import AuthGuard from "@/auth/AuthGuard";
import AuthHeader from "@/components/auth/AuthHeader";
import Main from "@/components/Main";

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Main className="bg-background text-foreground grid h-dvh min-h-dvh w-full grid-rows-[auto_1fr]">
      <AuthHeader />
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <AuthGuard>{children}</AuthGuard>
      </div>
    </Main>
  );
}
