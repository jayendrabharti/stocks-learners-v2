"use client";

import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuMessageSquareText, LuLayoutDashboard, LuUser } from "react-icons/lu";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

export default function AdminBottomBar({
  className = "",
}: {
  className?: string;
}) {
  const pathname = usePathname();

  // Main navigation items for the admin system
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LuLayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: LuUser,
    },
    {
      title: "Contact Us",
      href: "/admin/contact",
      icon: LuMessageSquareText,
    },
  ];

  return (
    <nav
      className={cn(
        "bg-background border-border z-50 border-t shadow-lg backdrop-blur-lg",
        className,
      )}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((navLink, index) => {
          const active = pathname === navLink.href;
          return (
            <Link
              key={index}
              href={navLink.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg px-3 py-2 transition-colors duration-200",
                "transition-all duration-150 active:scale-90",
              )}
              prefetch={true}
            >
              <navLink.icon
                className={cn(
                  "mb-1 size-8 rounded p-1",
                  active
                    ? "text-background bg-primary"
                    : "text-muted-foreground",
                )}
              />

              <span
                className={cn(
                  "max-w-full truncate text-center text-xs leading-tight",
                  active ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                {navLink.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
