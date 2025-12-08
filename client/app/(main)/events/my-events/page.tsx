"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import eventsApi, { EventRegistration } from "@/services/eventsApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function MyEventsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const response = await eventsApi.getUserRegistrations();
      setRegistrations(response.registrations);
    } catch (error) {
      console.error("Error loading registrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "REGISTRATION_OPEN":
        return <Badge className="bg-green-500">Registration Open</Badge>;
      case "ACTIVE":
        return <Badge className="bg-orange-500">Live Now</Badge>;
      case "ENDED":
        return <Badge className="bg-gray-500">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">My Events</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          View and manage your event registrations
        </p>
      </div>

      {/* Registrations List */}
      {registrations.length > 0 ? (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <Card key={registration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {registration.event.title}
                    </CardTitle>
                    <CardDescription>
                      {registration.event.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {getStatusBadge(registration.status)}
                    {getEventStatusBadge(registration.event.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Registered</p>
                      <p className="text-muted-foreground">
                        {registration.registeredAt 
                          ? format(new Date(registration.registeredAt), "MMM dd, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Initial Balance</p>
                      <p className="text-muted-foreground">
                        ₹{registration.event.initialBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Event Account</p>
                      <p className="text-muted-foreground">
                        {registration.eventAccountId ? "Active" : "Pending"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/events/${registration.event.id}`)}
                    variant="outline"
                  >
                    View Event
                  </Button>

                  {registration.status === "CONFIRMED" &&
                    registration.event.status === "ACTIVE" && (
                      <Button
                        onClick={() =>
                          router.push(`/events/${registration.event.id}/trade`)
                        }
                      >
                        Start Trading
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}

                  {registration.status === "CONFIRMED" && (
                    <Button
                      onClick={() =>
                        router.push(`/events/${registration.event.id}/leaderboard`)
                      }
                      variant="outline"
                    >
                      View Leaderboard
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No event registrations yet</h3>
          <p className="text-muted-foreground mb-6">
            Browse available events and register to start competing
          </p>
          <Button onClick={() => router.push("/events")}>
            Browse Events
          </Button>
        </div>
      )}
    </div>
  );
}
