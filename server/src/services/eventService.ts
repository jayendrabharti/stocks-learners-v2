/**
 * Event Service
 * Business logic for event management
 */

import prisma from "@/database/client.js";
import type { Event } from "@/database/generated/client.js";

/**
 * Event status based on current time
 */
export type EventStatus =
  | "UPCOMING" // Registration hasn't started
  | "REGISTRATION_OPEN" // Registration is open
  | "REGISTRATION_CLOSED" // Registration closed, event not started
  | "ACTIVE" // Event is currently running
  | "ENDED"; // Event has ended

/**
 * Get event status based on dates
 */
export function getEventStatus(event: Event): EventStatus {
  const now = new Date();

  if (now < event.registrationStartAt) {
    return "UPCOMING";
  }

  if (
    now >= event.registrationStartAt &&
    now <= event.registrationEndAt
  ) {
    return "REGISTRATION_OPEN";
  }

  if (now > event.registrationEndAt && now < event.eventStartAt) {
    return "REGISTRATION_CLOSED";
  }

  if (now >= event.eventStartAt && now <= event.eventEndAt) {
    return "ACTIVE";
  }

  return "ENDED";
}

/**
 * Validate event dates
 */
export function validateEventDates(dates: {
  registrationStartAt: Date;
  registrationEndAt: Date;
  eventStartAt: Date;
  eventEndAt: Date;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Registration start must be before registration end
  if (dates.registrationStartAt >= dates.registrationEndAt) {
    errors.push("Registration start must be before registration end");
  }

  // Registration end must be before event start
  if (dates.registrationEndAt >= dates.eventStartAt) {
    errors.push("Registration must end before event starts");
  }

  // Event start must be before event end
  if (dates.eventStartAt >= dates.eventEndAt) {
    errors.push("Event start must be before event end");
  }

  // All dates must be in the future (for new events)
  // Removed check for registrationStartAt < now to allow creating events that have already started registration
  /*
  const now = new Date();
  if (dates.registrationStartAt < now) {
    errors.push("Registration start must be in the future");
  }
  */

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if user can register for event
 */
export async function checkRegistrationEligibility(
  userId: string,
  eventId: string
): Promise<{ eligible: boolean; reason?: string }> {
  // Get event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        where: { status: "CONFIRMED" },
      },
    },
  });

  if (!event) {
    return { eligible: false, reason: "Event not found" };
  }

  if (!event.isActive) {
    return { eligible: false, reason: "Event is not active" };
  }

  // Check event status
  const status = getEventStatus(event);
  if (status !== "REGISTRATION_OPEN") {
    return { eligible: false, reason: "Registration is not open" };
  }

  // Check if user already registered
  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (existingRegistration) {
    return { eligible: false, reason: "Already registered for this event" };
  }

  // Check max participants
  if (event.maxParticipants) {
    const confirmedCount = event.registrations.length;
    if (confirmedCount >= event.maxParticipants) {
      return { eligible: false, reason: "Event is full" };
    }
  }

  return { eligible: true };
}

/**
 * Get event statistics
 */
export async function getEventStatistics(eventId: string) {
  const [totalRegistrations, confirmedRegistrations, event] =
    await Promise.all([
      prisma.eventRegistration.count({
        where: { eventId },
      }),
      prisma.eventRegistration.count({
        where: { eventId, status: "CONFIRMED" },
      }),
      prisma.event.findUnique({
        where: { id: eventId },
      }),
    ]);

  const spotsLeft = event?.maxParticipants
    ? event.maxParticipants - confirmedRegistrations
    : null;

  return {
    totalRegistrations,
    confirmedRegistrations,
    spotsLeft,
    isFull:
      event?.maxParticipants !== null &&
      event?.maxParticipants !== undefined &&
      confirmedRegistrations >= event.maxParticipants,
  };
}

/**
 * Generate unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug is unique
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  excludeEventId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.event.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === excludeEventId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
