"use client";
import { cn } from "@/lib/utils";
import ThemeSwitch from "../ThemeSwitch";
import UserButton from "../auth/UserButton";
import AdminSideBarExpandToggle from "./AdminSideBarExpandToggle";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { anurati } from "@/utils/fonts";
import { appName } from "@/utils/data";
import Logo from "../Logo";

export default function AdminHeader({
  className = "",
}: {
  className?: string;
}) {
  return (
    <header
      className={cn(
        "bg-background border-border flex flex-row items-center space-x-3 border-b p-3 shadow-md",
        className,
      )}
    >
      <Logo />

      <AdminSideBarExpandToggle />

      <Separator orientation={"vertical"} />

      <span className="text-lg font-bold">Admin Dashboard</span>

      <div className="mx-auto" />

      <ThemeSwitch />

      <UserButton />
    </header>
  );
}
