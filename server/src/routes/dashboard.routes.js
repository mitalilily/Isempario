import express from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";
import { getProjectForUser } from "../utils/projectAccess.js";

const router = express.Router();

router.use(requireAuth);

router.get("/:projectId", async (req, res, next) => {
  try {
    await getProjectForUser(req.params.projectId, req.user._id);
    const tasks = await Task.find({ project: req.params.projectId }).populate("assignedTo", "name email");
    const now = new Date();

    const byStatus = {
      "To Do": 0,
      "In Progress": 0,
      Done: 0
    };
    const perUser = {};
    let overdue = 0;

    tasks.forEach((task) => {
      byStatus[task.status] += 1;
      if (task.status !== "Done" && task.dueDate < now) overdue += 1;
      const userName = task.assignedTo?.name || "Unassigned";
      perUser[userName] = (perUser[userName] || 0) + 1;
    });

    res.json({
      totalTasks: tasks.length,
      byStatus,
      perUser,
      overdue
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({ "members.user": req.user._id }).select("_id");
    const projectIds = projects.map((project) => project._id);
    const tasks = await Task.find({ project: { $in: projectIds } });
    const assigned = tasks.filter((task) => task.assignedTo?.toString() === req.user._id.toString());
    const overdue = assigned.filter((task) => task.status !== "Done" && task.dueDate < new Date()).length;

    res.json({
      projects: projects.length,
      totalTasks: tasks.length,
      assignedToMe: assigned.length,
      overdue
    });
  } catch (error) {
    next(error);
  }
});

export default router;
