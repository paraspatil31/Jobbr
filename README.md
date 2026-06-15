# JobNearby

A location-aware job board that connects talent with local opportunities. Built as a production-ready MERN monorepo with a React + Vite frontend, Express + TypeScript backend, and MongoDB via Mongoose.

---

## Features

- **Interactive Map Explorer** — real OpenStreetMap with live GPS location, job pins, radius filter, and job list sidebar
- **Role-based auth** — JWT-secured register/login for Job Seekers and Recruiters
- **Seeker Dashboard** — browse jobs, track applications with timeline, manage alerts, and receive real-time job notifications
- **Recruiter Dashboard** — post and manage job listings, view applicants
- **Geolocation** — browser-based live location with configurable search radius
- **In-memory MongoDB fallback** — development works instantly without Atlas credentials

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| Map | Leaflet, react-leaflet, OpenStreetMap (CARTO tiles) |
| Routing | Wouter |
| Server | Express 5, TypeScript, tsx |
| Database | MongoDB, Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Logging | Pino |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
jobnearby/
├── apps/
│   ├── client/                  # React + Vite frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx           # Landing page with map preview
│   │       │   ├── MapExplorer.tsx    # Full-screen map + job explorer
│   │       │   ├── Auth.tsx           # Login / Register
│   │       │   ├── SeekerDashboard.tsx
│   │       │   └── RecruiterDashboard.tsx
│   │       ├── components/
│   │       │   ├── JobMap.tsx         # Reusable map background component
│   │       │   └── ui/                # shadcn/ui component library
│   │       └── api/                   # Typed API service layer
│   │           ├── client.ts
│   │           ├── auth.ts
│   │           ├── jobs.ts
│   │           └── users.ts
│   └── server/                  # Express + TypeScript API
│       └── src/
│           ├── config/
│           │   └── database.ts        # MongoDB connect with in-memory fallback
│           ├── models/
│           │   ├── user.model.ts
│           │   └── job.model.ts
│           ├── controllers/
│           │   ├── auth.controller.ts
│           │   ├── job.controller.ts
│           │   └── user.controller.ts
│           ├── routes/
│           │   ├── auth.routes.ts
│           │   ├── job.routes.ts
│           │   ├── user.routes.ts
│           │   └── health.routes.ts
│           └── middlewares/
│               ├── auth.middleware.ts
│               └── error.middleware.ts
└── artifacts/
    └── mockup-sandbox/          # Component preview server (design tooling)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 9+

### Install

```bash
pnpm install
```

### Run (development)

```bash
pnpm dev
```

This starts both the frontend (port `25351`) and the API server (port `8080`) concurrently.

- Frontend: `http://localhost:25351`
- API: `http://localhost:8080/api`

> **No MongoDB required to start.** If `MONGODB_URI` is not set, the server automatically uses an in-memory MongoDB instance for development. Data resets on each restart.

---

## Environment Variables

Create a `.env` file in `apps/server/` (or set these as Replit Secrets):

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Optional in dev | MongoDB Atlas connection string |
| `JWT_SECRET` | Required | Secret key for signing JWTs (64+ char hex recommended) |
| `PORT` | Set by platform | API server port (default managed by Replit) |

**Atlas connection string format:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/jobnearby?retryWrites=true&w=majority
```

> If your password contains special characters, URL-encode them (e.g. `@` → `%40`, `#` → `%23`).

---

## API Reference

All routes are prefixed with `/api`.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/healthz` | — | Server health check |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Login and receive a JWT |

**Register body:**
```json
{
  "role": "seeker | recruiter",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "location": "San Francisco, CA",
  "companyName": "Acme Corp"
}
```

**Auth response:**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "role": "seeker", "fullName": "Jane Doe", "email": "jane@example.com" }
}
```

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | — | List all users |
| `GET` | `/users/:id` | — | Get a user by ID |
| `POST` | `/users` | — | Create a user |
| `PUT` | `/users/:id` | Bearer JWT | Update a user |
| `DELETE` | `/users/:id` | Bearer JWT | Delete a user |

### Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/jobs` | — | List jobs (supports `?type=`, `?search=`, `?page=`, `?limit=`) |
| `GET` | `/jobs/:id` | — | Get a job by ID |
| `POST` | `/jobs` | Bearer JWT (recruiter) | Create a job listing |
| `PUT` | `/jobs/:id` | Bearer JWT (owner) | Update a job listing |
| `DELETE` | `/jobs/:id` | Bearer JWT (owner) | Delete a job listing |

**Create job body:**
```json
{
  "title": "Frontend Developer",
  "company": "TechHub SF",
  "type": "full-time",
  "location": "San Francisco, CA",
  "description": "Build amazing UIs...",
  "salary": "$90k–$120k",
  "skills": ["React", "TypeScript"],
  "radiusKm": 25
}
```

---

## Pages

| Path | Description |
|---|---|
| `/` | Landing page — animated hero, live map preview, profile section |
| `/explore` | Full-screen Map Explorer with live GPS, job pins, search, and radius filter |
| `/auth` | Login and Register (role: seeker or recruiter) |
| `/dashboard/seeker` | Job browsing, application tracker, alert settings |
| `/dashboard/recruiter` | Job posting, applicant management |

---

## Map Explorer

The `/explore` page is a split-panel experience:

- **Left panel** — search bar, radius slider (1–25 mi), type filter pills, and a scrollable job list
- **Right panel** — interactive OpenStreetMap with:
  - 📍 Your live GPS location (blue dot)
  - Dashed radius circle that updates with the slider
  - Coloured job pins — click to see details and an Apply button
  - Floating job card at the bottom of the map when a pin is selected

The Home page map section also uses a live map background and navigates to `/explore` on click.

---

## Scripts

From the monorepo root:

```bash
pnpm dev          # Start all apps in development mode
pnpm install      # Install all workspace dependencies
```

From a specific workspace:

```bash
pnpm --filter @workspace/client run dev
pnpm --filter @workspace/server run dev
```

---

## License

MIT
