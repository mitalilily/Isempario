import express from "express";
import { z } from "zod";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { getProjectForUser, requireAdmin } from "../utils/projectAccess.js";

const router = express.Router();

const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  description: z.string().optional().default("")
});

const memberSchema = z.object({
  email: z.string().email("Enter the member email").optional(),
  userId: z.string().optional()
}).refine((value) => value.email || value.userId, {
  message: "Choose an existing user or enter an email"
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id })
      .populate("members.user", "name email")
      .sort({ updatedAt: -1 });
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await Project.create({
      name: data.name,
      description: data.description,
      members: [{ user: req.user._id, role: "Admin" }]
    });
    await project.populate("members.user", "name email");
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.get("/:projectId", async (req, res, next) => {
  try {
    const { project } = await getProjectForUser(req.params.projectId, req.user._id);
    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });
    res.json({ project, tasks });
  } catch (error) {
    next(error);
  }
});

router.post("/:projectId/members", async (req, res, next) => {
  try {
    const data = memberSchema.parse(req.body);
    const { project, membership } = await getProjectForUser(req.params.projectId, req.user._id);
    requireAdmin(membership);

    const user = data.userId
      ? await User.findById(data.userId)
      : await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      const error = new Error("No user found with that email");
      error.status = 404;
      throw error;
    }

    if (project.members.some((member) => member.user._id.toString() === user._id.toString())) {
      const error = new Error("User is already a project member");
      error.status = 409;
      throw error;
    }

    project.members.push({ user: user._id, role: "Member" });
    await project.save();
    await project.populate("members.user", "name email");
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.delete("/:projectId/members/:userId", async (req, res, next) => {
  try {
    const { project, membership } = await getProjectForUser(req.params.projectId, req.user._id);
    requireAdmin(membership);

    if (req.params.userId === req.user._id.toString()) {
      const error = new Error("Admin cannot remove themselves");
      error.status = 400;
      throw error;
    }

    const before = project.members.length;
    project.members = project.members.filter((member) => member.user._id.toString() !== req.params.userId);
    if (project.members.length === before) {
      const error = new Error("Member not found in this project");
      error.status = 404;
      throw error;
    }

    await Task.updateMany({ project: project._id, assignedTo: req.params.userId }, { $set: { assignedTo: null } });
    await project.save();
    await project.populate("members.user", "name email");
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

export default router;
