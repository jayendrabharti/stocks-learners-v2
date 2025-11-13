import { Router } from "express";
import validToken from "../middlewares/validToken.js";
import {
  deleteContactForm,
  getAllContactForms,
  getContactForm,
  submitContactForm,
  updateContactFormStatus,
} from "@/controllers/contact.js";

const ContactRouter = Router();

// Public route - anyone can submit
ContactRouter.post("/submit", submitContactForm);

// Admin routes - require authentication and admin privileges
ContactRouter.get("/", validToken, getAllContactForms);
ContactRouter.get("/:id", validToken, getContactForm);
ContactRouter.put("/:id", validToken, updateContactFormStatus);
ContactRouter.delete("/:id", validToken, deleteContactForm);

export default ContactRouter;
