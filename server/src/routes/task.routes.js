import express from "express";
import { z } from "zod";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { getProjectForUser, requireAdmin } from "../utils/projectAccess.js";

const router = express.Router();

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional().default(""),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  assignedTo: z.string().optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["To Do", "In Progress", "Done"]).optional(),
  assignedTo: z.string().optional().nullable()
});

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);
    const { project, membership } = await getProjectForUser(data.projectId, req.user._id);
    requireAdmin(membership);

    if (data.assignedTo && !project.members.some((member) => member.user._id.toString() === data.assignedTo)) {
      const error = new Error("Assigned user must be a project member");
      error.status = 400;
      throw error;
    }

    const task = await Task.create({
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      priority: data.priority,
      project: project._id,
      assignedTo: data.assignedTo || null,
      createdBy: req.user._id
    });

    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

router.patch("/:taskId", async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.status = 404;
      throw error;
    }

    const { project, membership } = await getProjectForUser(task.project, req.user._id);
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (membership.role !== "Admin") {
      const allowedKeys = Object.keys(data);
      if (!isAssignee || allowedKeys.some((key) => key !== "status")) {
        const error = new Error("Members can update only the status of assigned tasks");
        error.status = 403;
        throw error;
      }
    }

    if (data.assignedTo && !project.members.some((member) => member.user._id.toString() === data.assignedTo)) {
      const error = new Error("Assigned user must be a project member");
      error.status = 400;
      throw error;
    }

    Object.assign(task, {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : task.dueDate,
      assignedTo: data.assignedTo === undefined ? task.assignedTo : data.assignedTo || null
    });

    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

router.delete("/:taskId", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.status = 404;
      throw error;
    }

    const { membership } = await getProjectForUser(task.project, req.user._id);
    requireAdmin(membership);
    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
