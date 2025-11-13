import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { ArrowRightIcon } from "lucide-react";

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  shortcut?: {
    link: string;
    label: string;
  };
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export default function DashboardStatCard({
  title,
  value,
  icon,
  shortcut,
  trend,
  className,
}: DashboardStatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent>
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="text-muted-foreground mt-1 flex items-center space-x-1 text-xs">
            <span
              className={cn(
                "flex items-center",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
            </span>
            <span>{trend.label}</span>
          </div>
        )}
        {shortcut && (
          <>
            <Separator className="my-2" />
            <Link href={shortcut.link}>
              <Button variant={"link"} className="group">
                {shortcut.label}{" "}
                <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
