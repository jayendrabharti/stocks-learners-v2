"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import eventsApi, { Event } from "@/services/eventsApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trophy, TrendingUp, Loader2 } from "lucide-react";
import AuthGuard from "@/auth/AuthGuard";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const data = await eventsApi.getEventDetails(eventId);
      setEvent(data);
    } catch (error: any) {
      console.error("Error loading event:", error);
      const isNotFound = error?.response?.status === 404;
      toast.error(isNotFound ? "Event not found" : "Unable to load event", {
        description: isNotFound
          ? "This event may have been removed or the link is incorrect."
          : "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event) return;

    setIsProcessing(true);
    try {
      const response = await eventsApi.registerForEvent(event.id);

      if (response.registration) {
        toast.success("Successfully registered for the event!");
        router.push(`/events/${event.slug}`);
      }
    } catch (error: any) {
      console.error("Error registering for event:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to register for event";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
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

  if (event.userRegistration?.status === "CONFIRMED") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="mx-auto max-w-md">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold">Already Registered!</h2>
          <p className="text-muted-foreground mb-6">
            You are already registered for {event.title}. Good luck!
          </p>
          <Button onClick={() => router.push(`/events/${event.slug}`)}>
            Go to Event Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/events/${event.slug}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Event
      </Button>

      {/* Header - Visible to all */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Register for Event</h1>
        <p className="text-muted-foreground">{event.title}</p>
      </div>

      <AuthGuard>
        {/* Registration Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registration Summary</CardTitle>
            <CardDescription>
              Review the details before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b py-3">
              <div className="flex items-center gap-2">
                <Trophy className="text-muted-foreground h-5 w-5" />
                <span className="font-medium">Event</span>
              </div>
              <span>{event.title}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-muted-foreground h-5 w-5" />
                <span className="font-medium">Initial Trading Balance</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ₹{event.initialBalance}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Important Info */}
        <Alert className="mb-6">
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>A separate trading account will be created for this event</li>
              <li>
                You can switch between your main account and event accounts
              </li>
              <li>
                All trades in this event are isolated from your main account
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Register Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleRegister}
          disabled={isProcessing || event.isFull}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Trophy className="mr-2 h-5 w-5" />
              Register
            </>
          )}
        </Button>

        {event.isFull && (
          <p className="text-destructive mt-4 text-center">
            This event is full and no longer accepting registrations
          </p>
        )}
      </AuthGuard>
    </div>
  );
}
