import { Request, Response } from "express";
import { put, del } from "@vercel/blob";
import prisma from "@/database/client";

interface AuthenticatedRequest extends Request {
  userId?: string; // userId from validToken middleware
}

export const uploadProfilePicture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          message: "User not authenticated",
        },
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: {
          message: "No file uploaded",
        },
      });
    }

    // Get current user to check if they already have an avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
        },
      });
    }

    // Delete old avatar if it exists
    if (user.avatar) {
      try {
        await del(user.avatar);
      } catch (error) {
        console.log("Error deleting old avatar:", error);
        // Continue even if deletion fails
      }
    }

    // Upload new avatar to Vercel Blob
    const filename = `avatars/${userId}-${Date.now()}.${file.originalname
      .split(".")
      .pop()}`;

    const blob = await put(filename, file.buffer, {
      access: "public",
      contentType: file.mimetype,
    });

    // Update user's avatar URL in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: blob.url },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      user: updatedUser,
      avatarUrl: blob.url,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({
      error: {
        message: "Internal server error",
      },
    });
  }
};

export const getProfilePicture = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: {
          message: "User ID is required",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
        },
      });
    }

    if (!user.avatar) {
      return res.status(404).json({
        error: {
          message: "No avatar",
        },
      });
    }

    return res.status(200).json({
      avatarUrl: user.avatar,
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Internal server error",
      },
    });
  }
};

export const deleteProfilePicture = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        error: {
          message: "User not authenticated",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found",
        },
      });
    }

    if (user.avatar) {
      // Delete from Vercel Blob
      try {
        await del(user.avatar);
      } catch (error) {
        console.log("Error deleting avatar from blob:", error);
      }

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      });
    }

    return res.status(200).json({
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return res.status(500).json({
      error: {
        message: "Internal server error",
      },
    });
  }
};
