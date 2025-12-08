"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, TrendingUp, Trophy } from "lucide-react";
import { Event } from "@/services/eventsApi";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useSession } from "@/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const { switchContext } = usePortfolio();
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showRegisteredAlert, setShowRegisteredAlert] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500";
      case "REGISTRATION_OPEN":
        return "bg-green-500";
      case "ACTIVE":
        return "bg-orange-500";
      case "ENDED":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "Coming Soon";
      case "REGISTRATION_OPEN":
        return "Registration Open";
      case "ACTIVE":
        return "Live Now";
      case "ENDED":
        return "Ended";
      default:
        return status;
    }
  };

  const handleAction = () => {
    if (!isAuthenticated) {
      setShowLoginAlert(true);
      return;
    }

    if (event.userRegistration?.status === "CONFIRMED") {
      setShowRegisteredAlert(true);
      return;
    }

    if (event.status === "REGISTRATION_OPEN" && !event.isFull) {
      router.push(`/events/${event.slug}/register`);
    } else {
      router.push(`/events/${event.slug}`);
    }
  };

  const handleGoToPortfolio = () => {
    switchContext({
      type: "EVENT",
      eventId: event.slug,
      eventTitle: event.title,
    });
    router.push("/portfolio");
  };

  return (
    <>
      <Card className="group hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="mb-2 line-clamp-1 text-xl">
                {event.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description || "Join this exciting trading event"}
              </CardDescription>
            </div>
            <Badge className={cn("shrink-0", getStatusColor(event.status))}>
              {getStatusText(event.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Event Image */}
          {event.bannerImage && (
            <div className="bg-muted h-40 w-full overflow-hidden rounded-md">
              <img
                src={event.bannerImage}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          )}

          {/* Event Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Event Starts</p>
                <p className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(event.eventStartAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Users className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-muted-foreground text-xs">
                  {event.participantCount}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium">Initial Balance</p>
                <p className="text-muted-foreground text-xs">
                  ₹{event.initialBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium">Entry Fee</p>
                <p className="text-muted-foreground text-xs">
                  {event.registrationFee === 0
                    ? "Free"
                    : `₹${event.registrationFee.toLocaleString("en-IN")}`}
                </p>
              </div>
            </div>
          </div>

          {/* Spots Remaining */}
          {event.maxParticipants && (
            <div className="pt-2 text-sm">
              {event.isFull ? (
                <Badge variant="destructive" className="w-full justify-center">
                  Event Full
                </Badge>
              ) : event.spotsLeft && event.spotsLeft <= 10 ? (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600"></span>
                  <p className="text-sm font-medium">
                    Only {event.spotsLeft} spots remaining!
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center">
                  {event.spotsLeft} spots available
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className={cn(
              "h-11 w-full font-semibold transition-all",
              event.userRegistration?.status === "CONFIRMED"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "",
            )}
            disabled={event.isFull && !event.userRegistration}
            onClick={handleAction}
          >
            {event.userRegistration?.status === "CONFIRMED"
              ? "Go to Event Portfolio"
              : event.status === "REGISTRATION_OPEN" && !event.isFull
                ? "Register Now"
                : "View Details"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showLoginAlert} onOpenChange={setShowLoginAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be logged in to register for events.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/login")}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showRegisteredAlert}
        onOpenChange={setShowRegisteredAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already Registered</AlertDialogTitle>
            <AlertDialogDescription>
              You are already registered for this event. Would you like to go to
              your event portfolio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGoToPortfolio}>
              Go to Portfolio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
