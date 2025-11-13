"use client";

import Unauthenticated from "@/components/auth/Unauthenticated";
import { SessionContextType, useSession } from "@/providers/SessionProvider";
import { LoaderCircleIcon } from "lucide-react";

export default function AuthGuard({
  children,
  fallback = Unauthenticated,
  title,
  description,
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ title?: string; description?: string }>;
  title?: string;
  description?: string;
}) {
  const { user, status }: SessionContextType = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <LoaderCircleIcon className="size-16 animate-spin" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!user || status !== "authenticated") {
    const Fallback = fallback;
    return <Fallback title={title} description={description} />;
  }

  return <>{children}</>;
}
