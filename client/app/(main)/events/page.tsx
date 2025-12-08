"use client";

import { useEffect, useState } from "react";
import eventsApi, { Event } from "@/services/eventsApi";
import EventCard from "@/components/events/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Trophy } from "lucide-react";

export default function EventsPage() {
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string; myEvents?: boolean } = {};
      // Map tab values to API status values
      if (activeTab === "registration_open") {
        params.status = "REGISTRATION_OPEN";
      } else if (activeTab === "active") {
        params.status = "ACTIVE";
      } else if (activeTab === "upcoming") {
        params.status = "UPCOMING";
      } else if (activeTab === "my-events") {
        // Will show only user's registered events
        params.myEvents = true;
      }
      // "all" tab sends no status filter
      const response = await eventsApi.getActiveEvents(params);
      setLocalEvents(response.events);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = localEvents.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
            <Trophy className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Trading Events
          </h1>
        </div>
        <p className="text-muted-foreground text-base md:text-lg">
          Compete in isolated trading competitions and climb the leaderboard
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 md:inline-grid md:w-auto md:grid-cols-5">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="registration_open">Open</TabsTrigger>
          <TabsTrigger value="active">Live</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-96 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="border-muted-foreground/30 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed">
                <Trophy className="text-muted-foreground h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {searchQuery
                  ? "No events found"
                  : activeTab === "my-events"
                    ? "No registered events"
                    : activeTab === "registration_open"
                      ? "No events open for registration"
                      : activeTab === "active"
                        ? "No live events"
                        : activeTab === "upcoming"
                          ? "No upcoming events"
                          : "No events available"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : activeTab === "my-events"
                    ? "Register for an event to see it here"
                    : "Check back later for new events"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
