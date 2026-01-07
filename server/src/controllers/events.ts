/**
 * User Events Controller
 * Handles event-related operations for regular users
 */

import { Request, Response } from "express";
import prisma from "@/database/client.js";
import { fromDecimal } from "@/utils/currency";
import { createPaymentLink, logPayment } from "@/services/razorpayService.js";
import {
  getEventStatus,
  checkRegistrationEligibility,
} from "@/services/eventService.js";
import { calculateEventLeaderboard } from "@/services/leaderboardService.js";

/**
 * Get active/upcoming events
 * GET /events
 */
export const getActiveEvents = async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const now = new Date();

    // Build where clause based on status filter
    let where: any = { isActive: true };

    if (status === "upcoming") {
      where.registrationStartAt = { gt: now };
    } else if (status === "registration_open") {
      where.AND = [
        { registrationStartAt: { lte: now } },
        { registrationEndAt: { gte: now } },
      ];
    } else if (status === "active") {
      where.AND = [
        { eventStartAt: { lte: now } },
        { eventEndAt: { gte: now } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch events
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          eventStartAt: "asc",
        },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: "CONFIRMED" },
              },
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // If user is logged in, fetch their registrations for these events
    let userRegistrationsMap = new Map();
    if (req.user?.id) {
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          userId: req.user.id,
          eventId: { in: events.map((e) => e.id) },
          status: "CONFIRMED",
        },
        select: {
          eventId: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          eventAccount: {
            select: { id: true },
          },
        },
      });

      registrations.forEach((reg) => {
        userRegistrationsMap.set(reg.eventId, reg);
      });
    }

    // Add status, spots info, and user registration to each event
    const eventsWithInfo = events.map((event) => {
      const userReg = userRegistrationsMap.get(event.id);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        slug: event.slug,
        bannerImage: event.bannerImage,
        registrationStartAt: event.registrationStartAt,
        registrationEndAt: event.registrationEndAt,
        eventStartAt: event.eventStartAt,
        eventEndAt: event.eventEndAt,
        registrationFee: event.registrationFee,
        initialBalance: event.initialBalance,
        maxParticipants: event.maxParticipants,
        prizes: event.prizes,
        status: getEventStatus(event),
        participantCount: event._count.registrations,
        spotsLeft: event.maxParticipants
          ? event.maxParticipants - event._count.registrations
          : null,
        isFull:
          event.maxParticipants !== null &&
          event._count.registrations >= event.maxParticipants,
        userRegistration: userReg
          ? {
              status: userReg.status,
              paymentStatus: userReg.paymentStatus,
              eventAccountId: userReg.eventAccount?.id || null,
              registeredAt: userReg.createdAt,
            }
          : null,
      };
    });

    return res.status(200).json({
      events: eventsWithInfo,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error retrieving events:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Error retrieving events",
      },
    });
  }
};

/**
 * Get event details
 * GET /events/:eventId
 */
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
    }

    // Check if eventId is a CUID (25 chars alphanumeric) or a slug
    const isCuid = /^c[a-z0-9]{24}$/.test(eventId);

    const whereClause = isCuid ? { id: eventId } : { slug: eventId };

    const event = await prisma.event.findUnique({
      where: whereClause,
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      });
    }

    // Check if user is registered
    let userRegistration = null;
    if (userId) {
      userRegistration = (await prisma.eventRegistration.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: event.id,
          },
          status: "CONFIRMED",
        },
        include: {
          eventAccount: true,
        },
      })) as any;
    }

    return res.status(200).json({
      ...event,
      status: getEventStatus(event),
      participantCount: event._count.registrations,
      spotsLeft: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
        : null,
      isFull:
        event.maxParticipants !== null &&
        event._count.registrations >= event.maxParticipants,
      userRegistration: userRegistration
        ? {
            id: userRegistration.id,
            status: userRegistration.status,
            paymentStatus: userRegistration.paymentStatus,
            eventAccountId: userRegistration.eventAccount?.id || null,
            registeredAt: userRegistration.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error retrieving event details:", error);
    return res.status(500).json({
      error: { message: "Error retrieving event details" },
    });
  }
};

/**
 * Register for event
 * POST /events/:eventId/register
 */
export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
    }

    // Check if eventId is a CUID or slug
    const isCuid = /^c[a-z0-9]{24}$/.test(eventId);
    const whereClause = isCuid ? { id: eventId } : { slug: eventId };

    // Get event
    const event = await prisma.event.findUnique({
      where: whereClause,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EVENT_NOT_FOUND",
          message: "Event not found",
        },
      });
    }

    // Check eligibility
    const eligibility = await checkRegistrationEligibility(userId, event.id);
    if (!eligibility.eligible) {
      return res.status(400).json({
        error: { message: eligibility.reason },
      });
    }

    const registrationFeeAmount = fromDecimal(event.registrationFee);

    // Handle FREE events (registration fee = 0)
    if (registrationFeeAmount === 0) {
      // Directly create registration without payment
      const registration = await prisma.eventRegistration.create({
        data: {
          userId,
          eventId: event.id,
          amountPaid: 0,
          paymentStatus: "COMPLETED",
          status: "CONFIRMED",
        },
      });

      // Create event account with initial balance
      await prisma.eventAccount.create({
        data: {
          registrationId: registration.id,
          cash: event.initialBalance,
          usedMargin: 0,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Successfully registered for free event",
        registration: {
          id: registration.id,
          status: registration.status,
        },
      });
    }

    // Get user details for payment link
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    if (!user || !user.email) {
      return res.status(400).json({
        error: {
          message: "User profile incomplete. Please update your email.",
        },
      });
    }

    // Generate unique reference ID for tracking
    const referenceId = `evt_${event.id.slice(-8)}_${userId.slice(
      -8
    )}_${Date.now().toString(36)}`;

    // Build callback URL - redirect back to app after payment
    const clientUrl = process.env.CLIENT_BASE_URL || "http://localhost:3000";
    const callbackUrl = `${clientUrl}/events/${event.slug}/register/callback`;

    // Create Razorpay Payment Link for paid events
    const paymentLink = await createPaymentLink({
      amount: registrationFeeAmount,
      description: `Registration for ${event.title}`,
      customer: {
        name: user.name || "User",
        email: user.email,
        contact: user.phone || undefined,
      },
      referenceId,
      callbackUrl,
      expireBy: Math.floor(Date.now() / 1000) + 60 * 30, // Expires in 30 minutes
      notes: {
        eventId: event.id,
        userId,
        eventTitle: event.title,
        eventSlug: event.slug,
      },
    });

    // Log payment intent with payment link ID
    await logPayment({
      userId,
      razorpayOrderId: paymentLink.paymentLinkId, // Using paymentLinkId as orderId field
      amount: registrationFeeAmount,
      status: "PENDING",
      purpose: "EVENT_REGISTRATION",
      referenceId,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        paymentLinkUrl: paymentLink.paymentLinkUrl,
        isPaymentLink: true,
      },
    });

    return res.status(200).json({
      message: "Payment link created",
      payment: {
        paymentLinkId: paymentLink.paymentLinkId,
        paymentUrl: paymentLink.paymentLinkUrl,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        referenceId,
      },
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    return res.status(500).json({
      error: { message: "Error registering for event" },
    });
  }
};

/**
 * Get user's event registrations
 * GET /events/my-registrations
 */
export const getUserEventRegistrations = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            bannerImage: true,
            eventStartAt: true,
            eventEndAt: true,
            registrationFee: true,
            initialBalance: true,
          },
        },
        eventAccount: {
          select: {
            id: true,
            cash: true,
            usedMargin: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add event status to each registration
    const registrationsWithStatus = registrations.map((reg) => ({
      ...reg,
      event: {
        ...reg.event,
        status: getEventStatus(reg.event as any),
      },
    }));

    return res.status(200).json({
      registrations: registrationsWithStatus,
    });
  } catch (error) {
    console.error("Error retrieving user registrations:", error);
    return res.status(500).json({
      error: { message: "Error retrieving registrations" },
    });
  }
};

/**
 * Get event leaderboard
 * GET /events/:eventId/leaderboard
 */
export const getEventLeaderboard = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { limit = "50" } = req.query;
    const userId = req.user?.id;

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
    }

    // Check if eventId is a CUID or slug
    const isCuid = /^c[a-z0-9]{24}$/.test(eventId);
    const whereClause = isCuid ? { id: eventId } : { slug: eventId };

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: whereClause,
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Calculate leaderboard
    const leaderboard = await calculateEventLeaderboard(event.id);

    // Apply limit
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const limitedLeaderboard = leaderboard.slice(0, limitNum);

    // Find user's rank if authenticated
    let userRank = null;
    if (userId) {
      const userEntry = leaderboard.find((entry) => entry.userId === userId);
      if (userEntry) {
        userRank = {
          rank: userEntry.rank,
          totalPnL: userEntry.totalPnL,
          totalPnLPercentage: userEntry.totalPnLPercentage,
        };
      }
    }

    return res.status(200).json({
      leaderboard: limitedLeaderboard,
      total: leaderboard.length,
      userRank,
    });
  } catch (error) {
    console.error("Error retrieving event leaderboard:", error);
    return res.status(500).json({
      error: { message: "Error retrieving event leaderboard" },
    });
  }
};
