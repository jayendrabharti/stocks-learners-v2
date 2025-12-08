"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import eventsApi, { Event } from "@/services/eventsApi";
import EventLeaderboard from "@/components/events/EventLeaderboard";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Trophy, ArrowLeft } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
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
import { useSession } from "@/providers/SessionProvider";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.slug as string;
  const { switchContext } = usePortfolio();
  const { isAuthenticated } = useSession();

  const [event, setEvent] = useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showRegisteredAlert, setShowRegisteredAlert] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      loadLeaderboard();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const data = await eventsApi.getEventDetails(eventId);
      setEvent(data);
    } catch (error) {
      console.error("Error loading event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await eventsApi.getEventLeaderboard(eventId, 50);
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const handleRegister = () => {
    if (!event) return;

    if (!isAuthenticated) {
      setShowLoginAlert(true);
      return;
    }

    if (event.userRegistration?.status === "CONFIRMED") {
      setShowRegisteredAlert(true);
      return;
    }

    router.push(`/events/${event.slug}/register`);
  };

  const handleGoToPortfolio = () => {
    if (!event) return;
    switchContext({
      type: "EVENT",
      eventId: event.slug,
      eventTitle: event.title,
    });
    router.push("/portfolio");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="bg-muted h-64 rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Event not found</h2>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

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
        return "Registration Open";
      case "ACTIVE":
        return "Live Now";
      case "ENDED":
        return "Ended";
      default:
        return status.replace("_", " ");
    }
  };

  const isRegistrationPeriod =
    event &&
    new Date() >= new Date(event.registrationStartAt) &&
    new Date() <= new Date(event.registrationEndAt);

  const isEventActive =
    event &&
    new Date() >= new Date(event.eventStartAt) &&
    new Date() <= new Date(event.eventEndAt);

  const isRegistered = event?.userRegistration?.status === "CONFIRMED";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/events")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      {/* Event Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {event.title}
              </h1>
              <Badge className={getStatusColor(event.status)}>
                {getStatusText(event.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-base md:text-lg">
              {event.description}
            </p>

            {/* Contextual Status Messages */}
            {event.status === "UPCOMING" && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Registration opens{" "}
                  {formatDistanceToNow(new Date(event.registrationStartAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}

            {isRegistrationPeriod && !isRegistered && !event.isFull && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  ✨ Registration is open! Secure your spot now.
                </p>
              </div>
            )}

            {isEventActive && isRegistered && (
              <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/30">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  🔥 Event is live! Start trading now to climb the leaderboard.
                </p>
              </div>
            )}

            {event.status === "ENDED" && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/30">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This event has ended. Check the final leaderboard below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Banner Image */}
        {event.bannerImage && (
          <div className="mb-6 h-64 w-full overflow-hidden rounded-lg bg-gray-100">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Event Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Registration Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm font-medium">
                {format(new Date(event.registrationStartAt), "MMM dd, yyyy")}
              </p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(event.registrationStartAt), "hh:mm a")}
              </p>
              <p className="text-muted-foreground py-1 text-xs">to</p>
              <p className="text-sm font-medium">
                {format(new Date(event.registrationEndAt), "MMM dd, yyyy")}
              </p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(event.registrationEndAt), "hh:mm a")}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Event Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm font-medium">
                {format(new Date(event.eventStartAt), "MMM dd, yyyy")}
              </p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(event.eventStartAt), "hh:mm a")}
              </p>
              <p className="text-muted-foreground py-1 text-xs">to</p>
              <p className="text-sm font-medium">
                {format(new Date(event.eventEndAt), "MMM dd, yyyy")}
              </p>
              <p className="text-muted-foreground text-xs">
                {format(new Date(event.eventEndAt), "hh:mm a")}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{event.participantCount}</p>
              {event.maxParticipants && (
                <p className="text-muted-foreground mt-1 text-sm">
                  of {event.maxParticipants} max
                  {event.spotsLeft !== null && event.spotsLeft > 0 && (
                    <span className="ml-2 text-xs">
                      ({event.spotsLeft} spots left)
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Entry Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-muted-foreground text-xs">
                  Registration Fee
                </p>
                <p className="text-lg font-bold">
                  {event.registrationFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Free
                    </span>
                  ) : (
                    `₹${event.registrationFee.toLocaleString("en-IN")}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">
                  Starting Balance
                </p>
                <p className="text-lg font-bold">
                  ₹{event.initialBalance.toLocaleString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration / Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isRegistered ? (
            <>
              <Button
                size="lg"
                onClick={handleGoToPortfolio}
                className="h-12 w-full bg-emerald-600 font-semibold hover:bg-emerald-700 sm:w-auto sm:min-w-60"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Go to Event Dashboard
              </Button>
              <Badge
                variant="outline"
                className="border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              >
                ✓ You're registered
              </Badge>
            </>
          ) : (
            <>
              {event.status === "REGISTRATION_OPEN" && !event.isFull ? (
                <Button
                  size="lg"
                  onClick={handleRegister}
                  className="bg-primary hover:bg-primary/90 h-12 w-full font-semibold sm:w-auto sm:min-w-60"
                >
                  {event.registrationFee === 0
                    ? "Register for Free"
                    : `Register Now - ₹${event.registrationFee.toLocaleString("en-IN")}`}
                </Button>
              ) : event.isFull ? (
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="px-4 py-2 text-base">
                    Event Full - Registration Closed
                  </Badge>
                </div>
              ) : event.status === "UPCOMING" ? (
                <Button
                  size="lg"
                  disabled
                  className="h-12 w-full sm:w-auto sm:min-w-60"
                >
                  Registration Opens Soon
                </Button>
              ) : event.status === "ACTIVE" ? (
                <Badge variant="secondary" className="px-4 py-2 text-base">
                  Event in progress - Registration closed
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-4 py-2 text-base">
                  Event Ended
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

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

      {/* Tabs */}
      <Tabs defaultValue="leaderboard" className="mt-8">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rules">Rules & Prizes</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          <EventLeaderboard
            leaderboard={leaderboard}
            userRank={userRank}
            eventStatus={event.status}
            prizes={event.prizes}
          />
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Rules</CardTitle>
              <CardDescription>
                Please read the rules carefully before participating
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.rules ? (
                <div className="prose max-w-none">
                  {typeof event.rules === "string" ? (
                    <p>{event.rules}</p>
                  ) : (
                    <pre>{JSON.stringify(event.rules, null, 2)}</pre>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No rules specified</p>
              )}
            </CardContent>
          </Card>

          {event.prizes && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Prizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {typeof event.prizes === "string" ? (
                    <p>{event.prizes}</p>
                  ) : (
                    <pre>{JSON.stringify(event.prizes, null, 2)}</pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
