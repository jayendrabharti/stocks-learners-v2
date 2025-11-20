import prisma from "@/database/client";
import {
  UserOrderByWithRelationInput,
  UserWhereInput,
} from "@/database/generated/models";
import { Request, Response } from "express";

export const getDashboardData = async (_req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const contactFormCount = await prisma.contactForm.count();
    const pendingContactFormCount = await prisma.contactForm.count({
      where: { status: "PENDING" },
    });

    res.status(200).json({
      userCount,
      adminCount,
      recentUsers,
      contactFormCount,
      pendingContactFormCount,
    });
  } catch (error) {
    console.error("Error retrieving dashboard data:", error);
    res
      .status(500)
      .json({ error: { message: "Error retrieving dashboard data" } });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const {
      search,
      isAdmin,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    // Build where clause for filtering
    const where: UserWhereInput = {};

    // Search filter - searches in email, name, and phone
    if (search && typeof search === "string") {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Admin filter
    if (isAdmin !== undefined && isAdmin !== "") {
      where.isAdmin = isAdmin === "true";
    }

    // Build order by clause for sorting
    const orderBy: UserOrderByWithRelationInput = {};
    const validSortFields = [
      "email",
      "name",
      "createdAt",
      "updatedAt",
      "isAdmin",
    ];

    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as keyof UserOrderByWithRelationInput] =
        sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch users with filters, sorting, and pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          dateOfBirth: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Error retrieving users" } });
  }
};
