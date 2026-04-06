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

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
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

- Admin: `admin@ledgerflow.io` / `admin`
- Accountant: `accountant@ledgerflow.io` / `accountant`
- Viewer: `viewer@ledgerflow.io` / `viewer`

## Important Note

If Docker is not running, backend cannot connect to PostgreSQL and will fail startup. Start Docker Desktop first, then run `npm run db:up`.
