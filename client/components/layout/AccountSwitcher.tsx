"use client";

import { useEffect, useState } from "react";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trophy, Wallet } from "lucide-react";
import eventsApi from "@/services/eventsApi";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface AccountSwitcherProps {
  compact?: boolean;
}

export default function AccountSwitcher({
  compact = false,
}: AccountSwitcherProps) {
  const { activeContext, switchContext } = usePortfolio();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const response = await eventsApi.getUserRegistrations();
      console.log("All registrations:", response.registrations);

      // Show confirmed and pending registrations
      const activeRegistrations = response.registrations.filter(
        (reg: any) => reg.status === "CONFIRMED" || reg.status === "PENDING",
      );

      console.log("Filtered registrations:", activeRegistrations);
      setRegistrations(activeRegistrations);
    } catch (error) {
      console.error("Failed to load registrations:", error);
    }
  };

  const handleSwitchToMain = () => {
    switchContext({ type: "MAIN" });
    router.push("/portfolio");
  };

  const handleSwitchToEvent = (reg: any) => {
    switchContext({
      type: "EVENT",
      eventId: reg.event.id, // Use event ID for API calls
      eventSlug: reg.event.slug,
      eventTitle: reg.event.title,
    });
    router.push("/portfolio");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="outline" size="icon" className="shrink-0">
            {activeContext.type === "MAIN" ? (
              <Wallet className="h-4 w-4" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full shrink-0 justify-between md:w-[180px]"
          >
            <div className="flex items-center gap-2 truncate">
              {activeContext.type === "MAIN" ? (
                <>
                  <Wallet className="h-4 w-4" />
                  <span className="truncate">Main</span>
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  <span className="truncate">
                    {activeContext.eventTitle?.slice(0, 10) || "Event"}
                  </span>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSwitchToMain}
          className="cursor-pointer gap-2"
        >
          <Wallet className="h-4 w-4" />
          <div className="flex flex-col">
            <span>Main Account</span>
            <span className="text-muted-foreground text-xs">
              Personal Portfolio
            </span>
          </div>
          {activeContext.type === "MAIN" && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        {registrations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Event Accounts</DropdownMenuLabel>
            {registrations.map((reg) => (
              <DropdownMenuItem
                key={reg.id}
                onClick={() => handleSwitchToEvent(reg)}
                className="cursor-pointer gap-2"
              >
                <Trophy className="h-4 w-4" />
                <div className="flex flex-col truncate">
                  <span className="truncate">{reg.event.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {reg.event.status.replace("_", " ")}
                  </span>
                </div>
                {activeContext.type === "EVENT" &&
                  activeContext.eventTitle === reg.event.title && (
                    <Badge variant="secondary" className="ml-auto">
                      Active
                    </Badge>
                  )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
