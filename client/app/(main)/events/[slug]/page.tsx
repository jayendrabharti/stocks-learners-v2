"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import eventsApi, { Event } from "@/services/eventsApi";
import EventLeaderboard from "@/components/events/EventLeaderboard";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Trophy, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
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
  const eventId = params.eventId as string;
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
      eventTitle: event.title
    });
    router.push("/portfolio");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Event not found</h2>
        <Button onClick={() => router.push("/events")}>Back to Events</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING": return "bg-blue-500";
      case "REGISTRATION_OPEN": return "bg-green-500";
      case "ACTIVE": return "bg-orange-500";
      case "ENDED": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/events")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
            <p className="text-muted-foreground text-lg">{event.description}</p>
          </div>
          <Badge className={getStatusColor(event.status)}>
            {event.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Banner Image */}
        {event.bannerImage && (
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-6">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {format(new Date(event.registrationStartAt), "MMM dd, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">to</p>
              <p className="text-sm">
                {format(new Date(event.registrationEndAt), "MMM dd, yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Event Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {format(new Date(event.eventStartAt), "MMM dd, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">to</p>
              <p className="text-sm">
                {format(new Date(event.eventEndAt), "MMM dd, yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{event.participantCount}</p>
              {event.maxParticipants && (
                <p className="text-sm text-muted-foreground">
                  of {event.maxParticipants} max
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Entry Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Fee: <span className="font-bold">₹{event.registrationFee}</span>
              </p>
              <p className="text-sm">
                Balance: <span className="font-bold">₹{event.initialBalance}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registration / Action Button */}
        {event.userRegistration?.status === "CONFIRMED" ? (
          <Button 
            size="lg" 
            onClick={handleGoToPortfolio} 
            className="w-full md:w-auto bg-green-600 hover:bg-green-700"
          >
            Go to Event Dashboard
          </Button>
        ) : (
          // User not registered - show register button
          <>
            {event.status === "REGISTRATION_OPEN" && !event.isFull && (
              <Button size="lg" onClick={handleRegister} className="w-full md:w-auto">
                Register for Event - ₹{event.registrationFee}
              </Button>
            )}

            {event.isFull && (
              <Badge variant="destructive" className="text-lg py-2 px-4">
                Event Full - Registration Closed
              </Badge>
            )}
          </>
        )}
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
