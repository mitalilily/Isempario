<div align="center">
  <img src="public/assets/isempario-logo.png" alt="Isempario logo" width="120" />

  # Isempario

  ### Turn team chaos into clear project momentum.

  A colorful MERN team task manager with animated dashboards, role-based access, project rooms, direct user assignment, and deployment-ready Railway setup.

  <br />

  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=0f172a" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Railway" src="https://img.shields.io/badge/Railway-Deployable-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" />
</div>

---

## What Is Isempario?

Isempario is a full-stack collaborative task management web app built for a Team Task Manager assignment. It lets users create project workspaces, invite registered teammates, assign tasks, track status, and view project-level progress from a colorful interactive dashboard.

Think of it as a compact Trello/Asana-style project manager with:

- Secure user authentication
- Project-level Admin and Member roles
- Task assignment and status tracking
- Animated dashboard metrics
- Direct existing-user picker for team building
- Railway-ready full-stack deployment

---

## Interactive Product Flow

```mermaid
flowchart TD
  A[Signup / Login] --> B{Login Type}
  B -->|User Login| C[Workspace]
  B -->|Admin Login| D{Has Admin Project?}
  D -->|Yes| C
  D -->|No| E[Blocked with Admin-only message]
  C --> F[Create or Select Project]
  F --> G{Role in Project}
  G -->|Admin| H[Manage Members + Create Tasks + Delete Tasks]
  G -->|Member| I[View Assigned Tasks + Update Status]
  H --> J[Dashboard Metrics]
  I --> J
  J --> K[Total Tasks, Status Counts, Per-user Tasks, Overdue Tasks]
```

---

## Screens And Experience

| Area | What It Does |
| --- | --- |
| Auth Screen | Animated patterned background, Isempario logo, User Login, Admin Login, Signup |
| Admin Login | Only allows users who already administer at least one project |
| Project Sidebar | Shows existing projects with role and member count |
| Dashboard Hero | Shows current project, role, members, total tasks, completion percentage |
| Interactive Board | Groups tasks into To Do, In Progress, Done |
| Filters | Search tasks and filter by status |
| Member Panel | Admin can add existing registered users directly |
| Task Panel | Admin creates tasks and assigns users; members update assigned task status |

---

## Feature Checklist

### Authentication

- Signup with name, email, password
- Login with JWT
- Password hashing using bcrypt
- Admin-only login route for users who already administer a project
- Protected API routes

### Project Management

- Create projects
- Creator automatically becomes Admin
- Members can view projects they belong to
- Admin can add existing registered users
- Admin can remove members

### Task Management

- Create tasks with title, description, due date, priority
- Assign tasks to users
- Status values: To Do, In Progress, Done
- Admin can delete tasks
- Members can update only the status of tasks assigned to them

### Dashboard

- Total tasks
- Tasks by status
- Tasks per user
- Overdue tasks
- Completion percentage

### UI Polish

- Generated colored logo
- Generated background image
- Patterned glass cards throughout the app
- Lucide icons
- Framer Motion animations
- Responsive Tailwind CSS layout

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Validation | Zod |
| Deployment | Railway single-service setup |

---

## Folder Structure

```txt
isempario/
  public/
    assets/
      isempario-bg.png
      isempario-logo.png
  server/
    index.js
    src/
      config/
      middleware/
      models/
      routes/
      utils/
  src/
    main.jsx
    styles.css
  .env.example
  package.json
  railway.json
  README.md
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
MONGO_URI="your MongoDB connection string"
JWT_SECRET="replace-this-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
PORT=4000
```

For Railway:

```env
MONGO_URI="your Railway MongoDB or MongoDB Atlas connection string"
JWT_SECRET="a long random production secret"
CLIENT_URL="https://your-deployed-railway-app-url"
```

`PORT` is usually injected automatically by Railway.

> Important: never commit your real `.env` file. This repo ignores `.env` by default.

---

## Run Locally

Install dependencies:

```bash
npm install
```

Start frontend and backend together:

```bash
npm run dev
```

Open:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Health:   http://localhost:4000/api/health
```

---

## Production Build

```bash
npm run build
npm start
```

After `npm run build`, Express serves:

- React frontend from `dist`
- REST API from `/api`

---

## Deployment

You do not need to deploy the client and backend separately.

This project is configured as one Railway web service:

```txt
Railway Web Service
  â”œâ”€ builds React with npm run build
  â”œâ”€ starts Express with npm start
  â”œâ”€ serves frontend from dist
  â””â”€ serves backend from /api

MongoDB
  â””â”€ deployed separately through Railway MongoDB or MongoDB Atlas
```

Railway uses `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

---

## API Routes

### Auth

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Normal user login |
| POST | `/api/auth/admin-login` | Admin-only login |
| GET | `/api/auth/me` | Current user |

### Projects

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/projects` | List joined projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:projectId` | Project detail with tasks |
| POST | `/api/projects/:projectId/members` | Add member |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove member |

### Tasks

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:taskId` | Update task or status |
| DELETE | `/api/tasks/:taskId` | Delete task |

### Dashboard

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard` | User summary |
| GET | `/api/dashboard/:projectId` | Project metrics |

---

## Role Rules

| Capability | Admin | Member |
| --- | --- | --- |
| View joined projects | Yes | Yes |
| Create project | Yes | Yes |
| Add/remove members | Yes | No |
| Create tasks | Yes | No |
| Assign tasks | Yes | No |
| Delete tasks | Yes | No |
| Update assigned task status | Yes | Yes |
| Edit full task details | Yes | No |

---

## Assignment Coverage

- User Authentication: complete
- Project Management: complete
- Task Management: complete
- Dashboard: complete
- Role-Based Access: complete
- RESTful APIs: complete
- MongoDB database relationships: complete
- Validations and error handling: complete
- Railway deployment config: complete
- README setup/deployment guide: complete

---

## Demo Script

Use this flow for a 2-5 minute demo video:

1. Signup as a new user.
2. Create a project.
3. Explain that the creator becomes Admin.
4. Signup/login as another user.
5. Return as Admin and add the second user from the existing-user picker.
6. Create and assign a task.
7. Login as Member and update task status.
8. Show dashboard metrics changing.
9. Show Admin Login gate.
10. Explain Railway single-service deployment and MongoDB env variables.

---

<div align="center">
  <strong>Isempario</strong>
  <br />
  Clear work. Faster teams. Better momentum.
</div>
