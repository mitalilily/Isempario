import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wand2
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "";
const emptyTask = { title: "", description: "", dueDate: "", priority: "Medium", assignedTo: "" };
const statuses = ["To Do", "In Progress", "Done"];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [memberUserId, setMemberUserId] = useState("");
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeMembership = useMemo(() => {
    return activeProject?.members?.find((member) => member.user._id === user?.id);
  }, [activeProject, user]);
  const isAdmin = activeMembership?.role === "Admin";

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.description} ${task.assignedTo?.name || ""}`.toLowerCase().includes(taskSearch.toLowerCase());
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, taskSearch, statusFilter]);

  const completion = dashboard?.totalTasks ? Math.round(((dashboard.byStatus?.Done || 0) / dashboard.totalTasks) * 100) : 0;

  async function api(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }

  function saveSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }

  function logout() {
    setToken("");
    setUser(null);
    setProjects([]);
    setActiveProject(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const endpoint = authMode === "signup" ? "signup" : authMode === "admin" ? "admin-login" : "login";
      const payload = authMode === "signup" ? authForm : { email: authForm.email, password: authForm.password };
      const data = await api(`/api/auth/${endpoint}`, { method: "POST", body: JSON.stringify(payload) });
      saveSession(data.token, data.user);
      if (data.adminProjectId) setActiveProjectId(data.adminProjectId);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    const data = await api("/api/projects");
    setProjects(data.projects);
    if (!activeProjectId && data.projects[0]) setActiveProjectId(data.projects[0]._id);
  }

  async function loadProject(projectId) {
    if (!projectId) return;
    const [projectData, dashboardData] = await Promise.all([
      api(`/api/projects/${projectId}`),
      api(`/api/dashboard/${projectId}`)
    ]);
    setActiveProject(projectData.project);
    setTasks(projectData.tasks);
    setDashboard(dashboardData);
    if (projectData.project.members.some((member) => member.user._id === user?.id && member.role === "Admin")) {
      const usersData = await api(`/api/users/available/${projectId}`);
      setAvailableUsers(usersData.users);
    } else {
      setAvailableUsers([]);
    }
  }

  useEffect(() => {
    if (token) loadProjects().catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    if (token && activeProjectId) loadProject(activeProjectId).catch((error) => setMessage(error.message));
  }, [token, activeProjectId]);

  async function createProject(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/api/projects", { method: "POST", body: JSON.stringify(projectForm) });
      setProjectForm({ name: "", description: "" });
      await loadProjects();
      setActiveProjectId(data.project._id);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addMember(event) {
    event.preventDefault();
    if (!memberUserId) return;
    setMessage("");
    try {
      await api(`/api/projects/${activeProjectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberUserId })
      });
      setMemberUserId("");
      await loadProject(activeProjectId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeMember(userId) {
    setMessage("");
    try {
      await api(`/api/projects/${activeProjectId}/members/${userId}`, { method: "DELETE" });
      await loadProject(activeProjectId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ ...taskForm, projectId: activeProjectId, assignedTo: taskForm.assignedTo || null })
      });
      setTaskForm(emptyTask);
      await loadProject(activeProjectId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateTask(taskId, updates) {
    setMessage("");
    try {
      await api(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(updates) });
      await loadProject(activeProjectId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteTask(taskId) {
    setMessage("");
    try {
      await api(`/api/tasks/${taskId}`, { method: "DELETE" });
      await loadProject(activeProjectId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!token) {
    return (
      <main className="auth-shell min-h-screen overflow-hidden text-white">
        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="aurora aurora-three" />
        <section className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              MERN collaborative workspace
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mt-6 max-w-3xl text-5xl font-black tracking-tight sm:text-7xl"
            >
              <span className="inline-flex items-center gap-4">
                <img src="/assets/isempario-logo.png" alt="Isempario logo" className="h-16 w-16 rounded-2xl shadow-2xl shadow-cyan-950/40 sm:h-20 sm:w-20" />
                Isempario
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mt-3 text-2xl font-black text-cyan-100 sm:text-3xl"
            >
              Turn team chaos into clear project momentum.
            </motion.p>
            <p className="mt-6 max-w-2xl text-lg text-cyan-50/85">
              A visual MERN workspace for creating project rooms, choosing existing teammates, assigning tasks, tracking deadlines, and giving every role the right level of control.
            </p>
            <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
              <Feature icon={ShieldCheck} label="Admin gate" />
              <Feature icon={Users} label="User picker" />
              <Feature icon={Activity} label="Live metrics" />
            </div>
            <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
              <StoryCard title="For project leads" text="Create projects, add members from registered users, assign owners, and keep overdue work visible." />
              <StoryCard title="For team members" text="See only relevant work, update progress quickly, and stay aligned without digging through long lists." />
            </div>
          </div>

          <motion.form
            onSubmit={handleAuth}
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="glass-panel p-6 text-white"
          >
            <div className="mb-5 grid grid-cols-3 rounded-lg bg-white/10 p-1 ring-1 ring-white/15">
              {[
                ["login", "User"],
                ["admin", "Admin"],
                ["signup", "Signup"]
              ].map(([mode, label]) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setAuthMode(mode)}
                  className={`rounded-md px-3 py-2 text-sm font-bold ${authMode === mode ? "bg-cyan-300 text-slate-950 shadow" : "text-cyan-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-5 rounded-lg border border-cyan-200/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              {authMode === "admin"
                ? "Admin login only works after this user has created or administers at least one project."
                : authMode === "signup"
                  ? "Create a user account, then create your first project to become Admin."
                  : "Members and admins can use the normal login to enter their project workspace."}
            </div>
            {authMode === "signup" && (
              <label className="field">
                Name
                <input value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
              </label>
            )}
            <label className="field">
              Email
              <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            </label>
            <label className="field">
              Password
              <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            </label>
            {message && <p className="mb-4 rounded-md border border-rose-200/25 bg-rose-400/15 px-3 py-2 text-sm font-semibold text-rose-100">{message}</p>}
            <button disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
              <Wand2 className="h-4 w-4" />
              {loading ? "Opening workspace..." : authMode === "signup" ? "Create account" : authMode === "admin" ? "Enter as admin" : "Enter workspace"}
            </button>
          </motion.form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/isempario-logo.png" alt="Isempario logo" className="h-12 w-12 rounded-xl shadow-lg shadow-cyan-950/30" />
            <div>
              <h1 className="text-xl font-black">Isempario</h1>
              <p className="text-sm text-cyan-100/80">Clear work. Faster teams. Welcome, {user?.name}</p>
            </div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-6">
          <Panel title="Existing Projects" icon={LayoutDashboard}>
            <div className="space-y-3">
              {projects.map((project) => {
                const role = project.members.find((member) => member.user._id === user?.id)?.role;
                return (
                  <button
                    key={project._id}
                    onClick={() => setActiveProjectId(project._id)}
                    className={`project-card ${activeProjectId === project._id ? "project-card-active" : ""}`}
                  >
                    <span className="font-bold">{project.name}</span>
                    <span className="text-xs opacity-75">{role} · {project.members.length} members</span>
                  </button>
                );
              })}
              {projects.length === 0 && <p className="text-sm text-cyan-50/80">No projects yet. Create one below.</p>}
            </div>
          </Panel>

          <Panel title="Create Project" icon={Plus}>
            <form onSubmit={createProject} className="space-y-3">
              <input className="input" placeholder="Project name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
              <textarea className="input min-h-20" placeholder="Description" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <button className="btn-primary flex w-full items-center justify-center gap-2"><Plus className="h-4 w-4" /> Create</button>
            </form>
          </Panel>
        </aside>

        <section className="space-y-6">
          {message && <p className="rounded-md border border-rose-200/25 bg-rose-400/15 px-4 py-3 text-sm font-semibold text-rose-100">{message}</p>}
          {!activeProject ? (
            <Panel title="Start your workspace" icon={Sparkles}>
              <p className="text-sm text-cyan-50/80">Create a project to unlock tasks, members, and dashboard metrics.</p>
            </Panel>
          ) : (
            <>
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="dashboard-hero"
              >
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white">
                    <ShieldCheck className="h-4 w-4" />
                    {activeMembership?.role}
                  </p>
                  <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">{activeProject.name}</h2>
                  <p className="mt-3 max-w-2xl text-cyan-50">{activeProject.description || "No description added."}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="hero-chip"><Users className="h-4 w-4" /> {activeProject.members.length} members</span>
                    <span className="hero-chip"><ListChecks className="h-4 w-4" /> {dashboard?.totalTasks || 0} tasks</span>
                    <span className="hero-chip"><CheckCircle2 className="h-4 w-4" /> {completion}% complete</span>
                  </div>
                </div>
                <div className="progress-orb">
                  <span>{completion}%</span>
                  <small>done</small>
                </div>
              </motion.section>

              <div className="grid gap-4 md:grid-cols-4">
                <Metric icon={ListChecks} label="Total tasks" value={dashboard?.totalTasks || 0} />
                <Metric icon={CircleDashed} label="To Do" value={dashboard?.byStatus?.["To Do"] || 0} />
                <Metric icon={Activity} label="In Progress" value={dashboard?.byStatus?.["In Progress"] || 0} />
                <Metric icon={CalendarDays} label="Overdue" value={dashboard?.overdue || 0} danger />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                <Panel title="Interactive Board" icon={ListChecks}>
                  <div className="mb-4 flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-cyan-100/60" />
                      <input className="input pl-9" placeholder="Search task, description, or assignee" value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} />
                    </div>
                    <select className="input md:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option>All</option>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {statuses.map((status) => (
                      <div key={status} className="task-column">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-black">{status}</h3>
                          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs font-bold text-cyan-50">{filteredTasks.filter((task) => task.status === status).length}</span>
                        </div>
                        <div className="space-y-3">
                          {filteredTasks.filter((task) => task.status === status).map((task) => (
                            <TaskCard key={task._id} task={task} isAdmin={isAdmin} onStatus={(nextStatus) => updateTask(task._id, { status: nextStatus })} onDelete={() => deleteTask(task._id)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="space-y-6">
                  {isAdmin && (
                    <Panel title="Create Task" icon={Plus}>
                      <form onSubmit={createTask} className="space-y-3">
                        <input className="input" placeholder="Title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                        <textarea className="input min-h-20" placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                        <input className="input" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} required />
                        <div className="grid grid-cols-2 gap-2">
                          <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                            <option>Low</option><option>Medium</option><option>High</option>
                          </select>
                          <select className="input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                            <option value="">Unassigned</option>
                            {activeProject.members.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
                          </select>
                        </div>
                        <button className="btn-primary flex w-full items-center justify-center gap-2"><Plus className="h-4 w-4" /> Create task</button>
                      </form>
                    </Panel>
                  )}

                  <Panel title="Members" icon={Users}>
                    <div className="space-y-3">
                      {activeProject.members.map((member) => (
                        <div key={member.user._id} className="member-row">
                          <div className="grid h-10 w-10 place-items-center rounded-md border border-white/15 bg-cyan-300/20 font-black text-cyan-50">
                            {member.user.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">{member.user.name}</p>
                            <p className="truncate text-xs text-cyan-50/70">{member.role} · {member.user.email}</p>
                          </div>
                          {isAdmin && member.user._id !== user.id && (
                            <button onClick={() => removeMember(member.user._id)} className="rounded-md p-2 text-rose-200 hover:bg-rose-400/15" title="Remove member">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {isAdmin && (
                      <form onSubmit={addMember} className="mt-4 space-y-2">
                        <select className="input" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
                          <option value="">Choose an existing registered user</option>
                          {availableUsers.map((nextUser) => <option key={nextUser._id} value={nextUser._id}>{nextUser.name} · {nextUser.email}</option>)}
                        </select>
                        <button className="btn-primary flex w-full items-center justify-center gap-2"><UserPlus className="h-4 w-4" /> Add selected user</button>
                      </form>
                    )}
                  </Panel>

                  <Panel title="Tasks Per User" icon={Users}>
                    <div className="space-y-2">
                      {Object.entries(dashboard?.perUser || {}).map(([name, count]) => (
                        <div key={name} className="flex items-center justify-between rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-cyan-50">
                          <span>{name}</span><strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, label }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} className="mini-pattern-card p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-200" />
      <p className="font-bold">{label}</p>
    </motion.div>
  );
}

function StoryCard({ title, text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="mini-pattern-card p-4"
    >
      <p className="font-black text-cyan-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-cyan-50/80">{text}</p>
    </motion.div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <motion.div layout className="pattern-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-black">
        {Icon && <Icon className="h-5 w-5 text-cyan-200" />}
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value, danger }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="metric-card">
      <Icon className={`h-5 w-5 ${danger ? "text-rose-200" : "text-cyan-200"}`} />
      <p className="mt-4 text-sm font-semibold text-cyan-50/75">{label}</p>
      <p className={`mt-1 text-3xl font-black ${danger ? "text-rose-200" : "text-white"}`}>{value}</p>
    </motion.div>
  );
}

function TaskCard({ task, isAdmin, onStatus, onDelete }) {
  const overdue = task.status !== "Done" && new Date(task.dueDate) < new Date();
  return (
    <motion.article layout whileHover={{ y: -3 }} className="task-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-black">{task.title}</h4>
          <p className="mt-1 text-sm text-cyan-50/75">{task.description || "No description."}</p>
        </div>
        {task.status === "Done" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="badge">{task.priority}</span>
        {overdue && <span className="badge-danger">Overdue</span>}
      </div>
      <p className="mt-3 text-xs font-semibold text-cyan-50/70">
        Due {new Date(task.dueDate).toLocaleDateString()} · {task.assignedTo?.name || "Unassigned"}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <select className="input" value={task.status} onChange={(e) => onStatus(e.target.value)}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        {isAdmin && (
          <button onClick={onDelete} className="rounded-md border border-rose-200/25 p-2 text-rose-200 hover:bg-rose-400/15" title="Delete task">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
