# JobNearby

A location-aware job board connecting talent with local opportunities. Full-stack MERN monorepo with a React + Vite frontend and Express + TypeScript backend.

## How to run

```bash
pnpm dev        # starts both client (port 5173 → preview) and server (port 8080)
pnpm install    # install all workspace dependencies
```

The dev server starts automatically via the **Dev** workflow. The preview pane maps port 5173 → port 80.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4 |
| UI | shadcn/ui, Radix UI, Framer Motion |
| Map | Leaflet / react-leaflet (OpenStreetMap) |
| Routing | Wouter |
| Backend | Express 5, TypeScript, tsx |
| Database | MongoDB / Mongoose 8 (in-memory fallback in dev) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Monorepo | pnpm workspaces |

## Project structure

```
apps/
  client/   — React + Vite frontend
  server/   — Express + TypeScript API
packages/
  api-client-react/   — React Query hooks (codegen)
  api-spec/           — OpenAPI spec
  api-zod/            — Zod schemas (codegen)
  db/                 — Mongoose models shared package
```

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Optional in dev | Falls back to in-memory MongoDB; required in production |
| `JWT_SECRET` | Set in userenv | Used for signing auth tokens |
| `SESSION_SECRET` | Set in Replit secrets | Session security |
| `PORT` | Auto-set | Injected by Replit for each service |

## Pages

| Path | Description |
|---|---|
| `/` | Landing page — animated hero, live map preview |
| `/explore` | Full-screen Map Explorer with GPS, job pins, radius filter |
| `/auth` | Login / Register (role: seeker or recruiter) |
| `/dashboard/seeker` | Job browsing, stats, tracker, alerts, resume, AI assistant |
| `/dashboard/recruiter` | Job posting, applicant management |

## User preferences
