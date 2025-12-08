/**
 * Admin Events Controller
 * Handles event management for administrators
 */

import { Request, Response } from "express";
import prisma from "@/database/client.js";
import {
  validateEventDates,
  generateSlug,
  ensureUniqueSlug,
  getEventStatus,
  getEventStatistics,
} from "@/services/eventService.js";
import { calculateEventLeaderboard } from "@/services/leaderboardService.js";

/**
 * Create new event
 * POST /admin/events
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      registrationStartAt,
      registrationEndAt,
      eventStartAt,
      eventEndAt,
      registrationFee,
      initialBalance,
      maxParticipants,
      bannerImage,
      rules,
      prizes,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !registrationStartAt ||
      !registrationEndAt ||
      !eventStartAt ||
      !eventEndAt ||
      registrationFee === undefined ||
      initialBalance === undefined
    ) {
      return res.status(400).json({
        error: { message: "Missing required fields" },
      });
    }

    // Convert dates
    const dates = {
      registrationStartAt: new Date(registrationStartAt),
      registrationEndAt: new Date(registrationEndAt),
      eventStartAt: new Date(eventStartAt),
      eventEndAt: new Date(eventEndAt),
    };

    // Validate dates
    const dateValidation = validateEventDates(dates);
    if (!dateValidation.valid) {
      return res.status(400).json({
        error: {
          message: "Invalid event dates",
          details: dateValidation.errors,
        },
      });
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        slug,
        registrationStartAt: dates.registrationStartAt,
        registrationEndAt: dates.registrationEndAt,
        eventStartAt: dates.eventStartAt,
        eventEndAt: dates.eventEndAt,
        registrationFee: Math.round(parseFloat(registrationFee) * 100) / 100,
        initialBalance: Math.round(parseFloat(initialBalance) * 100) / 100,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        bannerImage: bannerImage || null,
        rules: rules || null,
        prizes: prizes || null,
        isActive: true,
        createdBy: req.user?.id || "system",
      },
    });

    return res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      error: { message: "Error creating event" },
    });
  }
};

/**
 * Update event
 * PUT /admin/events/:eventId
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      registrationStartAt,
      registrationEndAt,
      eventStartAt,
      eventEndAt,
      registrationFee,
      initialBalance,
      maxParticipants,
      bannerImage,
      rules,
      prizes,
      isActive,
    } = req.body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Build update data
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      // Generate new slug if title changed
      if (title !== existingEvent.title) {
        const baseSlug = generateSlug(title);
        updateData.slug = await ensureUniqueSlug(baseSlug, eventId);
      }
    }

    if (description !== undefined) updateData.description = description;
    if (registrationFee !== undefined)
      updateData.registrationFee = Math.round(parseFloat(registrationFee) * 100) / 100;
    if (initialBalance !== undefined)
      updateData.initialBalance = Math.round(parseFloat(initialBalance) * 100) / 100;
    if (maxParticipants !== undefined)
      updateData.maxParticipants = maxParticipants
        ? parseInt(maxParticipants)
        : null;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (rules !== undefined) updateData.rules = rules;
    if (prizes !== undefined) updateData.prizes = prizes;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle date updates
    if (
      registrationStartAt ||
      registrationEndAt ||
      eventStartAt ||
      eventEndAt
    ) {
      const dates = {
        registrationStartAt: registrationStartAt
          ? new Date(registrationStartAt)
          : existingEvent.registrationStartAt,
        registrationEndAt: registrationEndAt
          ? new Date(registrationEndAt)
          : existingEvent.registrationEndAt,
        eventStartAt: eventStartAt
          ? new Date(eventStartAt)
          : existingEvent.eventStartAt,
        eventEndAt: eventEndAt ? new Date(eventEndAt) : existingEvent.eventEndAt,
      };

      // Validate dates
      const dateValidation = validateEventDates(dates);
      if (!dateValidation.valid) {
        return res.status(400).json({
          error: {
            message: "Invalid event dates",
            details: dateValidation.errors,
          },
        });
      }

      updateData.registrationStartAt = dates.registrationStartAt;
      updateData.registrationEndAt = dates.registrationEndAt;
      updateData.eventStartAt = dates.eventStartAt;
      updateData.eventEndAt = dates.eventEndAt;
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({
      error: { message: "Error updating event" },
    });
  }
};

/**
 * Delete event
 * DELETE /admin/events/:eventId
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Check if event has registrations
    if (event.registrations.length > 0) {
      return res.status(400).json({
        error: {
          message:
            "Cannot delete event with existing registrations. Deactivate it instead.",
        },
      });
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({
      error: { message: "Error deleting event" },
    });
  }
};

/**
 * Get all events (admin view)
 * GET /admin/events
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const {
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    // Build where clause
    const where: any = {};

    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Build order by
    const orderBy: any = {};
    const validSortFields = [
      "title",
      "createdAt",
      "eventStartAt",
      "eventEndAt",
      "registrationFee",
    ];

    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch events
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    // Add status to each event
    const eventsWithStatus = events.map((event) => ({
      ...event,
      status: getEventStatus(event),
      registrationCount: event._count.registrations,
    }));

    return res.status(200).json({
      events: eventsWithStatus,
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
      error: { message: "Error retrieving events" },
    });
  }
};

/**
 * Get event details
 * GET /admin/events/:eventId
 */
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Get statistics
    const stats = await getEventStatistics(eventId as string);

    return res.status(200).json({
      ...event,
      status: getEventStatus(event),
      statistics: stats,
    });
  } catch (error) {
    console.error("Error retrieving event details:", error);
    return res.status(500).json({
      error: { message: "Error retrieving event details" },
    });
  }
};

/**
 * Get event registrations
 * GET /admin/events/:eventId/registrations
 */
export const getEventRegistrations = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { page = "1", limit = "20", status } = req.query;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Build where clause
    const where: any = { eventId };

    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch registrations
    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
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
      }),
      prisma.eventRegistration.count({ where }),
    ]);

    return res.status(200).json({
      registrations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error retrieving event registrations:", error);
    return res.status(500).json({
      error: { message: "Error retrieving event registrations" },
    });
  }
};

/**
 * Get event leaderboard
 * GET /admin/events/:eventId/leaderboard
 */
export const getEventLeaderboard = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { limit = "50" } = req.query;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Calculate leaderboard
    const leaderboard = await calculateEventLeaderboard(eventId as string);

    // Apply limit
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const limitedLeaderboard = leaderboard.slice(0, limitNum);

    return res.status(200).json({
      leaderboard: limitedLeaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error("Error retrieving event leaderboard:", error);
    return res.status(500).json({
      error: { message: "Error retrieving event leaderboard" },
    });
  }
};
