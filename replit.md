# JobNearby

A location-aware job board that connects talent with local opportunities. Built as a MERN monorepo with a React + Vite frontend, Express + TypeScript backend, and MongoDB via Mongoose (with in-memory fallback for development).

## Run & Operate

- `pnpm dev` — start both client (port 5173) and server (port 8080) in development mode
- `pnpm --filter @workspace/client run dev` — client only
- `pnpm --filter @workspace/server run dev` — server only
- `pnpm run build` — typecheck + build all packages
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Wouter, Leaflet/react-leaflet
- Backend: Express 5, tsx (dev), esbuild (prod build)
- Database: MongoDB + Mongoose 8 (in-memory fallback via mongodb-memory-server — no Atlas needed in dev)
- Auth: JWT (jsonwebtoken + bcryptjs)
- Logging: Pino

## Where things live

- `apps/client/src/pages/` — page components (Home, MapExplorer, Auth, SeekerDashboard, RecruiterDashboard)
- `apps/client/src/components/` — shared UI components (JobMap, shadcn/ui)
- `apps/client/src/api/` — typed API service layer (auth, jobs, users)
- `apps/server/src/` — Express app, routes, models, config
- `apps/server/src/config/database.ts` — MongoDB connect with in-memory fallback
- `packages/` — shared libs: api-client-react, api-spec, api-zod, db

## Environment

- `JWT_SECRET` — set in .replit userenv (shared)
- `SESSION_SECRET` — available as Replit secret
- No external DB credentials needed in development (in-memory MongoDB fallback)

## Architecture decisions

- MongoDB in-memory fallback means the app works immediately with zero external setup
- Client proxies `/api` requests to `http://localhost:8080` via Vite dev server config
- Port 5173 → client, Port 8080 → server

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Server requires `PORT` env var to be set (handled by `scripts/dev.cjs`)
- After code changes to the server, tsx watch hot-reloads automatically

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
