import { FaHome } from "react-icons/fa";
import { AiOutlineStock } from "react-icons/ai";
import { MdAccountBalanceWallet } from "react-icons/md";
import { FaHistory } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { TbChartCandle } from "react-icons/tb";

export interface NavBarLinkType {
  name: string;
  href: string;
  icon: React.ElementType;
}

// Main navigation - Simple direct links
export const NavBarLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks/explore", icon: AiOutlineStock },
  { name: "F&O", href: "/fno/explore", icon: TbChartCandle },
];

// Legacy/Quick Links for backward compatibility
export const QuickLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
  { name: "Stocks", href: "/stocks", icon: AiOutlineStock },
  { name: "F&O", href: "/fno", icon: TbChartCandle },
  { name: "Portfolio", href: "/portfolio", icon: MdAccountBalanceWallet },
  { name: "F&O Positions", href: "/fno-positions", icon: TbChartCandle },
  { name: "Watchlist", href: "/watchlist", icon: FaStar },
  { name: "Transactions", href: "/transactions", icon: FaHistory },
];
