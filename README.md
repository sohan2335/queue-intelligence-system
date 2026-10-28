# Queue Intelligence System

Campus queue management with a React frontend, Express API, and MySQL 8.4 persistence.

## Run locally

Requirements: Node.js 24, npm, and MySQL 8.4.

```sh
npm run install:all
```

Copy `server/.env.example` to `server/.env`. Set the MySQL credentials, choose a new database name, configure your admin password, and set `JWT_SECRET` to at least 32 random characters.

```sh
npm run db:setup
npm run dev
```

The frontend runs on port 5173 and proxies `/api` to the backend port from `server/.env`. The backend defaults to port 3001. The verified local configuration uses port 3002 because port 3001 was occupied.

For the built application:

```sh
npm run build
npm start
```

Open the backend address, for example `http://localhost:3002`. Express serves both the built frontend and API, including direct frontend links. Restart after changing configuration or rebuilding the frontend.

## Database

`database/queue_intelligence_system_mysql.sql` contains the corrected schema and original sample data: 5 locations, 5 counters, 15 visitors, 15 queue entries, and 15 predictions. The original Oracle SQL is preserved separately for reference.

All four supplied MySQL downloads were identical. Their inline `REFERENCES` declarations did not enforce four intended relationships. This schema uses explicit InnoDB foreign keys, auto-increment IDs, nonnegative wait constraints, indexed queue lookups, unique active visitor tickets, and one calling ticket per counter per day.

`db:setup` refuses existing database names and never drops existing tables. MySQL DDL is not transactional; if setup fails partway, inspect that newly created database and choose a new name before retrying.

The repaired local app uses `queue_intelligence_app_20261028`. The original `queue_intelligence` database is preserved. Credentials exist only in ignored `server/.env`. Root access was used locally with permission; use a dedicated MySQL account with SELECT, INSERT, and UPDATE privileges for normal operation. Setup requires an account with schema creation privileges.

`USE_MOCK=false` requires MySQL and fails startup if it is unavailable. `USE_MOCK=true` explicitly enables nonpersistent demo data. There is no silent fallback. Dates and hours use `CAMPUS_TIMEZONE`, defaulting to `Asia/Kolkata`.

## Features

- Visitors sign in using campus ID and last name, for example `ID1001` / `Kumar`.
- Admin sign-in uses `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The demo-fill button uses `admin` / `admin123` and only works if these match the local configuration.
- Ticket creation validates visitor, counter, location, arrival time, opening hours, duplicate tickets, and queue capacity.
- Counter row locks make validation and writes atomic across concurrent requests. Database constraints add protection against duplicate tickets and multiple calling entries.
- Visitors track and cancel their own waiting tickets. Admins operate Call Next and Done controls. Calling the next ticket atomically completes the previous calling ticket.
- Live tickets, counters, board, dashboard, and queue refresh every ten seconds. Historical waiting records remain in history and do not occupy today's live queues.
- Digital passes use full entry IDs, printable layouts, and real QR codes containing token and counter. A camera scanner is not included.
- Locations, visitor directory and history drawers, queue filters, and prediction charts. SQL Explorer has been removed from the admin interface and its API endpoints are disabled.
- API role restrictions, mobile sign-out, built frontend routing, and database-backed `/api/health`.

Predictions are a heuristic based on historical waits, peak hours, and queue length, not a trained AI model. Recommended slots are clipped to counter hours. Estimated wait is not an exact countdown. Campus ID plus last name is the original classroom authentication scheme; use stronger authentication before a public deployment.

## Verification

```sh
npm test
npm --prefix client run lint
npm run build
```

Verified locally against MySQL 8.4.11 with API assertions covering authentication, permissions, read endpoints, disabled SQL Explorer routes, creation, duplicate rejection, concurrent requests, calling, completion, cancellation, and visitor privacy. Ticket records survived a backend restart. Five regression tests cover historical queues, validation, capacity, ownership, and token uniqueness.

The frontend production build passes. Package audits reported zero known vulnerabilities after compatible dependency patches. Lint reports only two existing Fast Refresh organization warnings in the context modules; undefined-component and unused-variable issues were fixed.

The local database includes feature-verification tickets in addition to the original samples. Runtime data and local credentials are excluded from Git.

## Structure

- `client/`: React, Vite, Tailwind CSS.
- `server/src/routes/`: authenticated REST endpoints.
- `server/src/services/`: queue rules and atomic ticket actions.
- `server/src/db/`: MySQL pool and data access.
- `server/test/`: regression tests.
- `database/`: corrected MySQL schema and original Oracle reference.

Never commit `.env`, database dumps, dependencies, or generated build output. The root `.gitignore` excludes secrets and generated files.
