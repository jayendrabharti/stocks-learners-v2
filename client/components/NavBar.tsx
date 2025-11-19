"use client";

import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ArrowDownUpIcon,
  ChevronDownIcon,
  EyeIcon,
  LayoutDashboardIcon,
  Menu,
  TrendingUpIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitch from "@/components/ThemeSwitch";
import { useState } from "react";
import Reveal from "@/components/animations/Reveal";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { FaHome } from "react-icons/fa";
import { AiOutlineStock } from "react-icons/ai";
import { TbChartCandle } from "react-icons/tb";
import { MdAccountBalanceWallet } from "react-icons/md";
import UserButton from "@/components/auth/UserButton";
import { Separator } from "./ui/separator";
import { ButtonGroup, ButtonGroupSeparator } from "./ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MarketStatus } from "@/components/market";
import Search from "./search/search";

type NavBarLinkType = {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: NavBarLinkType[];
};

export const NavBarLinks: NavBarLinkType[] = [
  // { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "F&O", href: "/fno", icon: TbChartCandle },
  { name: "Watchlist", href: "/watchlist", icon: EyeIcon },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: MdAccountBalanceWallet,
    children: [
      {
        name: "Dashboard",
        href: "/portfolio",
        icon: LayoutDashboardIcon,
      },
      {
        name: "Holdings",
        href: "/portfolio/holdings",
        icon: TrendingUpIcon,
      },
      {
        name: "Transactions",
        href: "/portfolio/transactions",
        icon: ArrowDownUpIcon,
      },
      {
        name: "Activity",
        href: "/portfolio/activity",
        icon: ActivityIcon,
      },
    ],
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    if (pathname === href) return true;
    if (pathname.includes(href) && href !== "/") return true;

    return false;
  };

  return (
    <nav
      className={cn(
        `w-full space-x-2`,
        `border-border border-b shadow-md`,
        `sticky top-0 left-0 z-50`,
        `flex flex-row items-center py-3`,
        `bg-background transition-all duration-200`,
      )}
    >
      <Reveal
        className={cn(
          "flex flex-row items-center justify-between",
          "mx-auto px-5 md:px-10",
          "w-full",
        )}
      >
        <div className="flex shrink-0 items-center gap-3">
          <Logo />
          <Separator orientation={"vertical"} className="hidden md:block" />
        </div>

        <div
          className={cn(
            `flex flex-col md:flex-row`,
            `items-start md:items-center`,
            `justify-start`,
            `gap-3 md:gap-1.5`,
            `top-full left-0 w-full md:w-auto`,
            "px-5 py-4 md:p-0",
            "absolute md:static md:mx-4 md:flex-1",
            "transition-all duration-200",
            "shadow-md md:shadow-none",
            expanded
              ? "translate-y-0 scale-y-100"
              : "-translate-y-1/2 scale-y-0 md:translate-y-0 md:scale-y-100",
            expanded && "bg-background",
            `border-border border-b-2 md:border-0`,
          )}
        >
          {NavBarLinks.map((link, index) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            if (link.children) {
              return (
                <ButtonGroup className="w-full md:w-max" key={index}>
                  <Link
                    href={link.href}
                    prefetch={true}
                    scroll={true}
                    onClick={() => setExpanded(false)}
                    className="flex-1"
                  >
                    <Button
                      className={cn(
                        "w-full justify-start rounded-l-full border-r-0 md:w-max",
                      )}
                      variant={active ? "default" : "outline"}
                    >
                      <Icon />
                      {link.name}
                    </Button>
                  </Link>
                  <ButtonGroupSeparator />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        className="rounded-full"
                        variant={active ? "default" : "outline"}
                        size={"icon"}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-max flex-col gap-2 rounded-3xl p-3">
                      {link.children.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setExpanded(false)}
                          >
                            <Button
                              className="w-full justify-start rounded-2xl"
                              variant={isActive ? "default" : "outline"}
                            >
                              <Icon />
                              {item.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </ButtonGroup>
              );
            }

            return (
              <Link
                key={index}
                prefetch={true}
                href={link.href}
                scroll={true}
                onClick={() => setExpanded(false)}
                className={"flex w-full md:w-max"}
              >
                <Button
                  className={cn("w-full justify-start rounded-full md:w-max")}
                  variant={active ? "default" : "outline"}
                >
                  <Icon />
                  {link.name}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
          <div className="hidden lg:block">
            <MarketStatus />
          </div>
          <ThemeSwitch />
          <Search />
          <UserButton />
        </div>

        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={(e) => {
            setExpanded((prev) => !prev);
            e.stopPropagation();
          }}
          className={cn("relative ml-2 flex md:hidden")}
        >
          <X
            className={cn(
              "absolute transition-all duration-200",
              expanded ? "scale-200 rotate-180" : "scale-0 rotate-0",
            )}
          />

          <Menu
            className={cn(
              "absolute transition-all duration-200",
              expanded ? "scale-0 rotate-180" : "scale-200 rotate-0",
            )}
          />
        </Button>
      </Reveal>
    </nav>
  );
}
