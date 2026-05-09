# LedgerFlow Pro

Intelligent multi-tenant financial operating system for SMEs.

## Architecture

- `frontend/`: Next.js 16 + Tailwind + charts (UI preserved)
- `backend/`: Express + Prisma + PostgreSQL + accounting services
- `docker-compose.yml`: local Postgres container

## Core Modules Implemented

- Multi-tenant context (`x-tenant-slug` / `x-tenant-id`)
- Role-based authorization (`ADMIN`, `ACCOUNTANT`, `VIEWER`)
- Double-entry transaction posting
- Journal, account rollups, and audit logs
- Invoice and payment management
- Reports: Profit & Loss, Trial Balance, Balance Sheet, Cash Flow
- Analytics: forecast, anomaly detection, health score
- Bank reconciliation preview via CSV matching

## Quick Start

1. Install dependencies

```bash
npm install
npm --prefix frontend install --legacy-peer-deps
npm --prefix backend install
```

2. Create env files

Create `backend/.env` with at least:

```bash
DATABASE_URL=postgresql://ledgerflow:${POSTGRES_PASSWORD}@localhost:5432/ledgerflow
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
DEFAULT_TENANT_SLUG=demo-sme
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
DEMO_USER_PASSWORD=replace-with-a-strong-password
```

And a root .env file for Docker Compose:

```bash
POSTGRES_PASSWORD=replace-with-a-strong-password
```

3. Start PostgreSQL

```bash
npm run db:up
```

4. Generate Prisma client + push schema

```bash
npm run db:generate
npm run db:push
```

5. Start full stack

```bash
npm run dev:all
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Demo Credentials

Demo users are only seeded in non-production environments when `DEMO_USER_PASSWORD` is set.
All seeded demo users share that configured password.

## Important Note

If Docker is not running, backend cannot connect to PostgreSQL and will fail startup. Start Docker Desktop first, then run `npm run db:up`.
