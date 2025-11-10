"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import {
  Loader2Icon,
  LockIcon,
  LogInIcon,
  UserRoundCogIcon,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useSession } from "@/providers/SessionProvider";
import { motion, AnimatePresence } from "motion/react";

export default function UserButton({
  className = "",
  variant = "simple",
  expanded = false,
}: {
  className?: string;
  variant?: "simple" | "expandable";
  expanded?: boolean;
}) {
  const { user, status } = useSession();

  const formatIndianCurrency = (value: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (status == "loading")
    return <Loader2Icon className={cn("animate-spin", className)} />;

  if (status == "unauthenticated")
    return (
      <Link href="/login">
        <Button variant="outline" className="rounded-full">
          Log In <LogInIcon />
        </Button>
      </Link>
    );

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase();

  if (user) {
    if (variant === "simple") {
      return (
        <div className={cn("flex items-center", className)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-200 w-72">
              <DropdownMenuSeparator />

              {/* User Info */}
              <div className="space-y-2 px-3 py-2 text-center">
                {user?.name && (
                  <span className="text-foreground block font-medium">
                    {user.name}
                  </span>
                )}
                <Separator />
                {user?.email && (
                  <span className="text-muted-foreground block text-xs">
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="text-muted-foreground block text-xs">
                    {user.phone}
                  </span>
                )}
              </div>

              <DropdownMenuSeparator />

              <div className="flex flex-col gap-2 p-1">
                <Link href="/profile" prefetch={true}>
                  <Button
                    variant={"outline"}
                    className="mx-auto flex w-full items-center justify-start"
                  >
                    <UserRoundCogIcon />
                    Profile Settings
                  </Button>
                </Link>

                {user.isAdmin && (
                  <Link href={`/admin`} prefetch={true}>
                    <Button
                      variant={"outline"}
                      className="mx-auto flex w-full items-center justify-start"
                    >
                      <LockIcon />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}

                <SignOutButton className="mx-auto flex w-full items-center justify-start" />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } else {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex flex-row items-center gap-2 rounded-2xl border",
                "mx-auto transition-all duration-300",
                expanded
                  ? "border-border bg-secondary px-4 py-2 shadow-md"
                  : "mx-auto border-transparent bg-transparent",
                className,
              )}
            >
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, height: 0 }}
                    animate={{ opacity: 1, width: "auto", height: "auto" }}
                    exit={{ opacity: 0, width: 0, height: 0 }}
                    className="flex flex-col truncate"
                  >
                    <span>{user.email}</span>
                    {user.name && (
                      <span className="text-sm font-light">{user.name}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex flex-col gap-2 p-1">
              <Link href="/profile" prefetch={true}>
                <Button
                  variant={"outline"}
                  className="mx-auto flex w-full items-center justify-start"
                >
                  <UserRoundCogIcon />
                  Profile Settings
                </Button>
              </Link>

              {user.isAdmin && (
                <Link href={`/admin`} prefetch={true}>
                  <Button
                    variant={"outline"}
                    className="mx-auto flex w-full items-center justify-start"
                  >
                    <LockIcon />
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <SignOutButton className="mx-auto flex w-full items-center justify-start" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
}
