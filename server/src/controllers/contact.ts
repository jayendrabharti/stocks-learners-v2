import prisma from "@/database/client";
import { Request, Response } from "express";

// Submit contact form
export const submitContactForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, name, mobile, message } = req.body;

    // Validation
    if (!email || !name || !mobile || !message) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
      return;
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      res.status(400).json({
        success: false,
        message: "Mobile number must be 10 digits",
      });
      return;
    }

    // Create contact form entry
    const contactForm = await prisma.contactForm.create({
      data: {
        email,
        name,
        mobile,
        message,
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: {
        id: contactForm.id,
        createdAt: contactForm.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Submit contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all contact forms (Admin only)
export const getAllContactForms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    // Check if user is admin
    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { status, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [contactForms, total] = await Promise.all([
      prisma.contactForm.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.contactForm.count({ where }),
    ]);

    res.json({
      success: true,
      data: contactForms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Get contact forms error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single contact form (Admin only)
export const getContactForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Contact form ID is required",
      });
      return;
    }

    const contactForm = await prisma.contactForm.findUnique({
      where: { id },
    });

    if (!contactForm) {
      res.status(404).json({
        success: false,
        message: "Contact form not found",
      });
      return;
    }

    res.json({
      success: true,
      data: contactForm,
    });
  } catch (error: any) {
    console.error("Get contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update contact form status (Admin only)
export const updateContactFormStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Contact form ID is required",
      });
      return;
    }

    const { status, adminNotes } = req.body;

    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status",
      });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const contactForm = await prisma.contactForm.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Contact form updated successfully",
      data: contactForm,
    });
  } catch (error: any) {
    console.error("Update contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete contact form (Admin only)
export const deleteContactForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Contact form ID is required",
      });
      return;
    }

    await prisma.contactForm.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Contact form deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
