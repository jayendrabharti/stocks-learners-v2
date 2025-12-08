"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import eventsApi, { Event, LeaderboardEntry } from "@/services/eventsApi";
import EventLeaderboard from "@/components/events/EventLeaderboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy } from "lucide-react";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      const [eventData, leaderboardData] = await Promise.all([
        eventsApi.getEventDetails(eventId),
        eventsApi.getEventLeaderboard(eventId, 100), // Fetch top 100
      ]);
      setEvent(eventData);
      setLeaderboard(leaderboardData.leaderboard);
      setUserRank(leaderboardData.userRank);
    } catch (error) {
      // Error handled silently - user will see "event not found" state
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="bg-muted h-96 rounded" />
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/events/${event.slug}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Event
      </Button>

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
      </div>

      {/* Leaderboard Component */}
      <EventLeaderboard
        leaderboard={leaderboard}
        userRank={userRank}
        eventStatus={event.status}
        prizes={event.prizes}
      />
    </div>
  );
}
