"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      eventTitle: event.title
    });
    router.push("/portfolio");
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {event.description || "Join this exciting trading event"}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(event.status)}>
              {getStatusText(event.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Event Image */}
          {event.bannerImage && (
            <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden">
              <img
                src={event.bannerImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Event Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Event Starts</p>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(event.eventStartAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-muted-foreground">
                  {event.participantCount}
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Initial Balance</p>
                <p className="text-muted-foreground">
                  ₹{event.initialBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Entry Fee</p>
                <p className="text-muted-foreground">
                  ₹{event.registrationFee.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Spots Remaining */}
          {event.maxParticipants && (
            <div className="text-sm">
              {event.isFull ? (
                <Badge variant="destructive">Event Full</Badge>
              ) : (
                <p className="text-muted-foreground">
                  {event.spotsLeft} spots remaining
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className={`w-full ${
              event.userRegistration?.status === "CONFIRMED" 
                ? "bg-green-600 hover:bg-green-700" 
                : ""
            }`}
            disabled={event.isFull && !event.userRegistration}
            onClick={handleAction}
          >
            {event.userRegistration?.status === "CONFIRMED"
              ? "Go to Event"
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

      <AlertDialog open={showRegisteredAlert} onOpenChange={setShowRegisteredAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already Registered</AlertDialogTitle>
            <AlertDialogDescription>
              You are already registered for this event. Would you like to go to your event portfolio?
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
