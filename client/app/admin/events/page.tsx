"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Calendar, Users, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  slug: string;
  registrationStartAt: string;
  registrationEndAt: string;
  eventStartAt: string;
  eventEndAt: string;
  registrationFee: number;
  initialBalance: number;
  maxParticipants: number | null;
  isActive: boolean;
  status: string;
  registrationCount: number;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await ApiClient.get("/admin/events");
      if (response.status === 200) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await ApiClient.delete(`/admin/events/${eventId}`);

      if (response.status === 200) {
        loadEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "REGISTRATION_OPEN":
        return <Badge className="bg-green-500">Registration Open</Badge>;
      case "ACTIVE":
        return <Badge className="bg-orange-500">Live</Badge>;
      case "ENDED":
        return <Badge className="bg-gray-500">Ended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Event Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage trading events
            </p>
          </div>
          <Button onClick={() => router.push("/admin/events/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Total Events</div>
          <div className="mt-2 text-2xl font-bold">{events.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Active Events</div>
          <div className="mt-2 text-2xl font-bold">
            {events.filter((e) => e.isActive).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Live Events</div>
          <div className="mt-2 text-2xl font-bold">
            {events.filter((e) => e.status === "ACTIVE").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-muted-foreground text-sm">Total Participants</div>
          <div className="mt-2 text-2xl font-bold">
            {events.reduce((sum, e) => sum + e.registrationCount, 0)}
          </div>
        </Card>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-xl font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first trading event to get started
          </p>
          <Button onClick={() => router.push("/admin/events/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>Manage your trading events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(event.status)}
                          {!event.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {format(new Date(event.eventStartAt), "MMM dd, yyyy")}
                          </p>
                          <p className="text-muted-foreground">to</p>
                          <p>
                            {format(new Date(event.eventEndAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.registrationCount}
                            {event.maxParticipants && ` / ${event.maxParticipants}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ₹{event.registrationFee}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/events/${event.id}`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/events/${event.id}/registrations`)
                            }
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            disabled={event.registrationCount > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
