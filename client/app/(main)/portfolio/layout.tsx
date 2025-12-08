"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowDownUp,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/auth/AuthGuard";

const navItems = [
  {
    name: "Dashboard",
    href: "/portfolio",
    icon: LayoutDashboard,
  },
  {
    name: "Holdings",
    href: "/portfolio/holdings",
    icon: TrendingUp,
  },
  {
    name: "Transactions",
    href: "/portfolio/transactions",
    icon: ArrowDownUp,
  },
  {
    name: "Activity",
    href: "/portfolio/activity",
    icon: Activity,
  },
];

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard>
    <div className="flex w-full flex-col">
      {/* Mobile Menu */}
      <div className="bg-secondary fixed bottom-0 left-0 z-10 grid w-full grid-cols-4 items-center justify-around gap-3 border-t p-2 md:hidden">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={index} href={item.href} className="w-full">
              <Button
                variant={isActive ? "default" : "outline"}
                className="flex h-max w-full flex-col gap-1 px-0 py-4 text-xs"
              >
                <Icon className="size-5" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Desktop + Mobile Layout */}
      <div className="flex gap-6">
        {/* Left Side Navigation - Desktop Only */}
        <nav className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-20 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow"
                      : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>
    </div>
    </AuthGuard>
  );
}
