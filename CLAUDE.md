# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

npm workspaces: `packages/*`, `backend`, `frontend`.

```
flow/
├── backend/          # Express API + Socket.IO + worker
├── frontend/         # React + Vite (early stage, default template)
├── packages/
│   └── shared/       # @flow/shared — Zod schemas + TS types
└── docker-compose.yml
```

## Commands

```bash
# Install all workspaces from root
npm install

# Backend dev server (port 3000)
npm run dev:back          # or: npm -w backend run dev

# Notification worker
npm run dev:worker        # or: npm -w backend run worker

# Frontend dev server
npm -w frontend run dev

# Prisma — run after schema changes or first setup
npm -w backend exec prisma generate

# Frontend lint
npm -w frontend run lint
```

## Infrastructure

Requires Redis (6379) and RabbitMQ (5672) running locally before starting the backend or worker.

```bash
docker compose up -d redis rabbitmq

# Worker in Docker (uses internal Docker hostnames)
docker compose up -d --build notification-worker
```

## Environment variables

**`.env` (root)** — shared infra vars, read by `docker-compose.yml` and `backend/infra/env.ts`:
- `RABBITMQ_USER`, `RABBITMQ_PASS`
- `RABBITMQ_URL` — `amqp://<user>:<pass>@localhost:5672`
- `REDIS_URL` — `redis://localhost:6379`
- `RABBITMQ_URL_DOCKER`, `REDIS_URL_DOCKER` — internal Docker hostnames for the compose network

**`backend/.env`** — app secrets:
- `DATABASE_URL` — MongoDB connection string
- `JWT_SECRET` — JWT signing key

`backend/infra/env.ts` loads both files (root first, then `backend/.env`) in non-production environments.

## Backend architecture

**Stack:** Express 5, Prisma (MongoDB), Socket.IO + Redis adapter, RabbitMQ (amqplib), JWT + bcrypt, Zod validation via `@flow/shared`.

**Path alias:** `@flow/*` in `backend/tsconfig.json` maps to `backend/*` itself (e.g., `@flow/services/auth.service` → `backend/services/auth.service`). This is distinct from the npm package `@flow/shared`.

**Layering:**
- Routes → Services → Repositories → Prisma
- Services contain all business logic; repositories are pure Prisma wrappers — services never import `@prisma/client` directly.
- Services use constructor-injected dependencies (no DI container).

**Error handling:** Throw typed exception classes from `backend/exceptions/` (e.g., `AuthException.Unauthorized()`, `NotificationException.NotificationNotFound()`). All extend `AppError`. `middleware/error.ts` converts them to HTTP responses uniformly.

**Auth:** JWT Bearer token, verified in `middleware/auth.ts`, which attaches `req.userId`. All routes except `POST /api/auth` require this middleware.

**Prisma generated output** lives in `backend/generated/` (gitignored). Must run `prisma generate` after schema changes.

## Notification flow

```
POST /api/notifications
  → NotificationService.create()
    → NotificationRepository.create()  (Prisma → MongoDB)
    → publish("notification.created", payload)  (RabbitMQ)

workers/notification.worker.ts
  ← consumes "notification.created"
  → pubClient.publish("socket:notifications", payload)  (Redis)

server.ts → setupRedisSocketForwarder()
  ← subClient receives "socket:notifications"
  → io.to(userId).emit("notification", payload)  (Socket.IO → client)
```

Socket.IO rooms: each connected client joins a room keyed by `userId` (passed as `socket.handshake.query.userId`).

## Shared package (`@flow/shared`)

Contains Zod schemas and TypeScript types for `auth`, `user`, and `notification` domains. Both backend and (eventually) frontend consume this package. The `main` field points directly to the TypeScript source — no build step required.

## Frontend

**Stack:** React 19, Vite 8, TypeScript, TanStack Router (file-based), TanStack Query, Axios, Tailwind CSS 4, shadcn/ui, Sonner (toast), Inter font.

**Structure:**
```
frontend/
├── src/
│   ├── main.tsx                  # Entry: ThemeProvider > QueryProvider > RouterProvider
│   ├── routes/
│   │   ├── __root.tsx            # Root layout: Outlet + Toaster + devtools
│   │   └── index.tsx             # "/" route
│   ├── api/
│   │   └── client.ts             # Axios instance: base URL, JWT interceptor, 401 redirect
│   └── providers/
│       └── query-provider.tsx    # QueryClient (staleTime 1m, retry 1)
├── components/ui/                # shadcn components
├── hooks/                        # shared hooks
└── lib/utils.ts                  # cn() helper
```

**Routing:** TanStack Router file-based routing. Add files to `src/routes/` — the Vite plugin auto-generates `src/routeTree.gen.ts` on dev start. File naming: `route.tsx` → `/route`, `route.$id.tsx` → `/route/:id`, `_layout.tsx` → layout wrapper.

**Data fetching:** Use TanStack Query hooks. Import `api` from `@/src/api/client` for HTTP calls. Auth token stored at `localStorage['flow:token']`.

**Theme:** Dark/light via `ThemeProvider` in `components/ui/theme-provider.tsx`. Access with `useTheme()` from same file. Default: `dark`.

**Shared types:** Import from `@flow/shared` — types for `User`, `AuthResponse`, `Notification`, enums (`USER_ROLE`, `NOTIFICATION_TYPE`), and `API_ENDPOINTS` constants.

**Dev:**
```bash
npm run dev:front        # Vite dev server
npm -w frontend run lint
```

**Env:** `frontend/.env.local` → `VITE_API_URL=http://localhost:3000`
