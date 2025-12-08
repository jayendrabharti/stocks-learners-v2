/**
 * Events API Service
 * Client-side API calls for event operations
 */

import ApiClient from "@/utils/ApiClient";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  registrationStartAt: Date | string;
  registrationEndAt: Date | string;
  eventStartAt: Date | string;
  eventEndAt: Date | string;
  registrationFee: number;
  initialBalance: number;
  isActive: boolean;
  maxParticipants: number | null;
  bannerImage: string | null;
  rules: string | null;
  prizes: any;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  status: string;
  participantCount: number;
  spotsLeft: number | null;
  isFull: boolean;
  userRegistration?: {
    id: string;
    status: string;
    paymentStatus: string;
    eventAccountId: string | null;
    registeredAt: Date | string;
  } | null;
}

export interface EventRegistration {
  id: string;
  status: string;
  paymentStatus: string;
  eventAccountId: string | null;
  registeredAt: string;
  event: Event;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  totalPnL: number;
  totalPnLPercentage: number;
  portfolioValue: number;
  investedValue: number;
  totalPositions: number;
  profitablePositions: number;
}

/**
 * Get active/upcoming events
 */
export async function getActiveEvents(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ events: Event[]; pagination: any }> {
  const response = await ApiClient.get("/events", { params });
  return response.data;
}

/**
 * Get event details
 */
export async function getEventDetails(
  eventId: string
): Promise<Event> {
  const response = await ApiClient.get(`/events/${eventId}`);
  return response.data;
}

/**
 * Register for event
 */
export async function registerForEvent(eventId: string): Promise<{
  registration: { id: string; status: string };
  payment: { orderId: string; amount: number; currency: string };
}> {
  const response = await ApiClient.post(`/events/${eventId}/register`);
  return response.data;
}

/**
 * Get user's event registrations
 */
export async function getUserRegistrations(): Promise<{
  registrations: EventRegistration[];
}> {
  const response = await ApiClient.get("/events/my-registrations");
  return response.data;
}

/**
 * Get event leaderboard
 */
export async function getEventLeaderboard(
  eventId: string,
  limit?: number
): Promise<{
  leaderboard: LeaderboardEntry[];
  total: number;
  userRank: { rank: number; totalPnL: number; totalPnLPercentage: number } | null;
}> {
  const response = await ApiClient.get(`/events/${eventId}/leaderboard`, {
    params: { limit },
  });
  return response.data;
}

const eventsApi = {
  getActiveEvents,
  getEventDetails,
  registerForEvent,
  getUserRegistrations,
  getEventLeaderboard,
};

export default eventsApi;
