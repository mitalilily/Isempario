import express from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { getProjectForUser, requireAdmin } from "../utils/projectAccess.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email createdAt")
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get("/available/:projectId", async (req, res, next) => {
  try {
    const { project, membership } = await getProjectForUser(req.params.projectId, req.user._id);
    requireAdmin(membership);
    const memberIds = project.members.map((member) => member.user._id.toString());
    const users = await User.find({ _id: { $nin: memberIds } })
      .select("name email createdAt")
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router;
