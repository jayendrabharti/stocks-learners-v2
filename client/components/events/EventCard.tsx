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

import { LOW_SPOTS_THRESHOLD } from "@/utils/constants";

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
        return "bg-blue-500 hover:bg-blue-600";
      case "REGISTRATION_OPEN":
        return "bg-emerald-500 hover:bg-emerald-600";
      case "ACTIVE":
        return "bg-orange-500 hover:bg-orange-600";
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
        return "Open";
      case "ACTIVE":
        return "Live";
      case "ENDED":
        return "Ended";
      default:
        return status;
    }
  };

  const isRegistered = event.userRegistration?.status === "CONFIRMED";
  const canRegister =
    event.status === "REGISTRATION_OPEN" && !event.isFull && !isRegistered;

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
            <div className="pt-2">
              {event.isFull ? (
                <Badge
                  variant="destructive"
                  className="w-full justify-center py-2"
                >
                  ⛔ Event Full
                </Badge>
              ) : event.spotsLeft && event.spotsLeft <= LOW_SPOTS_THRESHOLD ? (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-400"></span>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Only {event.spotsLeft}{" "}
                    {event.spotsLeft === 1 ? "spot" : "spots"} left!
                  </p>
                </div>
              ) : event.spotsLeft ? (
                <div className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2">
                  <p className="text-sm font-medium">Spots Available</p>
                  <Badge variant="secondary">{event.spotsLeft}</Badge>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-2 pt-4">
          {isRegistered && (
            <div className="mb-2 w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                ✓ You're registered for this event
              </p>
            </div>
          )}

          <Button
            className={cn(
              "h-11 w-full font-semibold transition-all",
              isRegistered
                ? "bg-emerald-600 hover:bg-emerald-700"
                : canRegister
                  ? "bg-primary hover:bg-primary/90"
                  : "",
            )}
            variant={isRegistered || canRegister ? "default" : "outline"}
            disabled={event.isFull && !isRegistered}
            onClick={handleAction}
          >
            {isRegistered
              ? "Go to Event Portfolio"
              : canRegister
                ? event.registrationFee === 0
                  ? "Register for Free"
                  : "Register Now"
                : event.status === "UPCOMING"
                  ? "View Details"
                  : event.status === "ACTIVE"
                    ? "View Leaderboard"
                    : "View Results"}
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
