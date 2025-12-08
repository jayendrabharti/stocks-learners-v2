"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useSession } from "@/providers/SessionProvider";
import eventsApi, { Event as ApiEvent, EventRegistration as ApiEventRegistration } from "@/services/eventsApi";

// Re-export types from API
export type Event = ApiEvent;
export type EventRegistration = ApiEventRegistration;

export type EventStatus =
  | "UPCOMING"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "ACTIVE"
  | "ENDED";

interface EventContextType {
  events: Event[];
  myRegistrations: EventRegistration[];
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  refreshEvents: () => Promise<void>;
  refreshMyRegistrations: () => Promise<void>;
  isLoading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getActiveEvents();
      setEvents(response.events);
    } catch (error) {
      console.error("Error refreshing events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMyRegistrations = useCallback(async () => {
    // Don't make API calls if user is not logged in
    if (!user) {
      setMyRegistrations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await eventsApi.getUserRegistrations();
      setMyRegistrations(response.registrations);
    } catch (error) {
      console.error("Error refreshing my registrations:", error);
      setMyRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <EventContext.Provider
      value={{
        events,
        myRegistrations,
        selectedEvent,
        setSelectedEvent,
        refreshEvents,
        refreshMyRegistrations,
        isLoading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
