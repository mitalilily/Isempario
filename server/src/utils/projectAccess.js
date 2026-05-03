import Project from "../models/Project.js";

export async function getProjectForUser(projectId, userId) {
  const project = await Project.findById(projectId).populate("members.user", "name email");
  if (!project) {
    const error = new Error("Project not found");
    error.status = 404;
    throw error;
  }

  const membership = project.members.find((member) => member.user._id.toString() === userId.toString());
  if (!membership) {
    const error = new Error("You are not a member of this project");
    error.status = 403;
    throw error;
  }

  return { project, membership };
}

export function requireAdmin(membership) {
  if (membership.role !== "Admin") {
    const error = new Error("Admin access required");
    error.status = 403;
    throw error;
  }
}
