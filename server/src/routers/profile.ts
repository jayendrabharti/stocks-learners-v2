import { Router } from "express";
import multer from "multer";
import {
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
} from "../controllers/profile.js";
import validToken from "../middlewares/validToken.js";

const ProfileRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Upload profile picture
ProfileRouter.post(
  "/upload",
  validToken,
  upload.single("image"),
  uploadProfilePicture
);

// Get profile picture URL
ProfileRouter.get("/avatar/:userId", getProfilePicture);

// Delete profile picture
ProfileRouter.delete("/upload", validToken, deleteProfilePicture);

export default ProfileRouter;
