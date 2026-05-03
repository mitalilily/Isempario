import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";
import { publicUser, signToken } from "../utils/auth.js";

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      const error = new Error("Email is already registered");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash
    });

    res.status(201).json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() });
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;

    if (!valid) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    res.json({
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/admin-login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() });
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;

    if (!valid) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    const adminProject = await Project.findOne({
      members: {
        $elemMatch: {
          user: user._id,
          role: "Admin"
        }
      }
    });

    if (!adminProject) {
      const error = new Error("Admin login is only available to users who have created or administer a project");
      error.status = 403;
      throw error;
    }

    res.json({
      token: signToken(user),
      user: publicUser(user),
      adminProjectId: adminProject._id
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
