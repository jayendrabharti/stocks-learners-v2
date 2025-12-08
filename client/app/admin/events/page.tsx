"use client";

import ApiClient from "@/utils/ApiClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      toast.error("Failed to delete event");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "REGISTRATION_OPEN":
        return <Badge className="bg-emerald-600">Registration Open</Badge>;
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
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Events</div>
            <div className="mt-2 text-3xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Active Events</div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              {events.filter((e) => e.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Live Events</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              {events.filter((e) => e.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">
              Total Participants
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {events.reduce((sum, e) => sum + e.registrationCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted mb-4 rounded-full p-4">
              <Calendar className="text-muted-foreground h-10 w-10" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">No events yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-center">
              Create your first trading event to get started with event
              management
            </p>
            <Button
              onClick={() => router.push("/admin/events/create")}
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
            <CardDescription>
              Manage and monitor your trading events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="w-[180px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {event.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {getStatusBadge(event.status)}
                          {!event.isActive && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">
                            {format(
                              new Date(event.eventStartAt),
                              "MMM dd, yyyy",
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">to</p>
                          <p className="font-medium">
                            {format(new Date(event.eventEndAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="text-muted-foreground h-4 w-4" />
                          <span className="font-semibold">
                            {event.registrationCount}
                            {event.maxParticipants && (
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                / {event.maxParticipants}
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {event.registrationFee === 0
                            ? "Free"
                            : `₹${event.registrationFee.toLocaleString("en-IN")}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              router.push(`/admin/events/${event.id}`)
                            }
                            title="Edit Event"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              router.push(
                                `/admin/events/${event.id}/registrations`,
                              )
                            }
                            title="View Registrations"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => handleDelete(event.id)}
                            disabled={event.registrationCount > 0}
                            title={
                              event.registrationCount > 0
                                ? "Cannot delete event with registrations"
                                : "Delete Event"
                            }
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
