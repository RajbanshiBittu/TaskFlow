# TaskFlow

## Overview

TaskFlow is a multi-tenant project and task management API with JWT authentication, PostgreSQL persistence, and asynchronous assignment notifications.

## Architecture

HTTP requests follow:

```text
Route -> Controller -> Service -> Repository -> Prisma/PostgreSQL
```

Assignment notifications follow:

```text
API -> BullMQ -> Redis -> Worker -> Email service
```

## Technology Stack

- Node.js 22
- Express 5
- PostgreSQL
- Prisma 7
- Redis and IORedis
- BullMQ
- JWT
- bcrypt
- Zod
- Pino
- Vitest
- Docker Compose

## Project Structure

```text
src/config/                 Environment, database, Redis, logger
src/middlewares/            Authentication, authorization, validation, errors
src/modules/auth/           Authentication routes and services
src/modules/projects/       Project routes, services, repositories, validation
src/modules/tasks/          Task routes, services, repositories
src/modules/jobs/           Job status routes and services
src/queues/                 BullMQ queues and connections
src/workers/                Independent notification worker
src/services/email.service.js Mock email boundary
prisma/schema.prisma        Database schema
prisma/migrations/          Prisma migrations
tests/unit/                 Unit tests
tests/integration/          Isolated real-stack API tests
```

## Environment Variables

Copy `.env.example` to `.env` and provide local values. Never commit real secrets.

- `NODE_ENV`: `development`, `test`, or `production`
- `PORT`: API port, default `5000`
- `DATABASE_URL`: application PostgreSQL connection string
- `DATABASE_URL_TEST`: separate PostgreSQL database used by integration tests; defaults to `taskflow_test` derived from `DATABASE_URL`
- `JWT_ACCESS_SECRET`: access-token signing secret
- `JWT_REFRESH_SECRET`: refresh-token signing secret
- `JWT_ACCESS_EXPIRES_IN`: default `15m`
- `JWT_REFRESH_EXPIRES_IN`: default `7d`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`
- `BULLMQ_PREFIX`: BullMQ key prefix, default `taskflow`

## PostgreSQL and Prisma

Create the database and configure `DATABASE_URL`, then run:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db seed
```

The seed creates two organizations, five users, three projects, twelve tasks, assignments, and comments. All seeded users use the development-only password `TaskFlowDev!2026`.

## Development

Start the API:

```bash
npm run dev
```

Start the worker in a separate process:

```bash
npm run worker
```

The worker does not start an HTTP server.

## Authentication

- `POST /auth/register` creates a user and initial organization membership.
- `POST /auth/login` returns an access token and refresh token.
- `POST /auth/refresh` validates and rotates a persisted refresh token.
- `POST /auth/logout` revokes the supplied refresh token.

Access tokens expire after 15 minutes. Refresh tokens expire after 7 days and are stored only as SHA-256 hashes. Revoked refresh tokens cannot be reused.

Authentication endpoints are limited to 10 requests per minute per IP. The current limiter uses in-memory storage and is intended for the single-instance deployment; distributed deployments need shared limiter storage.

## RBAC

- `org_admin`: all member operations plus project deletion.
- `member`: read and create/update projects and tasks, and assign/unassign users within the current organization.

## Projects

- `POST /projects`
- `GET /projects?page=1&limit=20`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id` (org admin)
- `GET /projects/:id/dashboard`

## Tasks

- `POST /projects/:projectId/tasks`
- `GET /projects/:projectId/tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Task filters can be combined:

- `status=todo|in_progress|review|done`
- `priority=low|medium|high|urgent`
- `assignee=<userId>`
- `dueFrom=YYYY-MM-DD`
- `dueTo=YYYY-MM-DD`

All list endpoints use offset pagination:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

## Assignment

- `POST /tasks/:id/assign` with `{ "userId": "..." }`
- `DELETE /tasks/:id/assign/:userId`

The assignment endpoint persists the assignment before enqueueing a notification and returns only after the job is accepted.

## Background Jobs

Assignment notification jobs contain only `assignmentId`, `taskId`, and `userId`. The worker loads current task and user data from PostgreSQL and calls the mock email service.

BullMQ retries failed jobs three times with exponential delays of approximately 1, 2, and 4 seconds. Final failures are represented in `task-assignment-notification-dlq` with failure metadata.

PostgreSQL and Redis/BullMQ do not share an atomic transaction. Task assignment uses a database-first compensating strategy: if enqueue fails, the newly-created assignment is deleted. If compensation fails, the error is logged and the request still fails.

## Job Status

- `GET /jobs/:id`

Statuses are normalized to `pending`, `active`, `completed`, or `failed`. Job metadata is organization-checked through the task's project before being returned.

## Multi-tenancy

Organization context is derived from authenticated membership and JWT context. Client-provided `organizationId` or `org_id` never determines authorization. Project queries use the authenticated organization; task queries resolve through `task -> project -> organization`. Cross-tenant access returns `403` without returning resource data.

## Database Delete Decisions

- Organization -> memberships: cascade.
- Organization -> projects: restrict.
- Project -> tasks: cascade.
- Task -> assignments/comments: cascade.
- User -> memberships/assignments/comments: restrict to preserve attribution and membership integrity.
- User -> refresh tokens: cascade because refresh tokens are disposable credentials.

## Testing

Unit tests use Vitest:

```bash
npm run test:unit
```

Integration tests use the real Express, Prisma, PostgreSQL, and HTTP stack against a separate `DATABASE_URL_TEST` database:

```bash
npm run test:integration
```

Run all tests:

```bash
npm test
```

Integration setup applies migrations to the isolated database and truncates only that database between tests. It never resets the development database.

## Docker

Docker Compose provides PostgreSQL, Redis, API, and worker services:

```bash
docker compose up --build
```

The API waits for PostgreSQL and Redis healthchecks, applies `prisma migrate deploy`, and starts the HTTP server. The worker starts only `node src/workers/index.js`. Docker uses `postgres` and `redis` service hostnames rather than localhost.

Seed Docker data explicitly when needed:

```bash
docker compose exec api npx prisma db seed
```

## Technical Decisions

- Prisma/PostgreSQL provide relational constraints and tenant joins.
- Tasks resolve organization through their project rather than duplicating `organizationId`.
- Access and refresh JWTs use separate secrets and explicit token types.
- Refresh-token rotation is persisted and revocable.
- bcrypt uses cost factor 12.
- BullMQ provides asynchronous processing and retries; the mock email service is the replacement boundary for a real provider.
- Database-first assignment with compensation is used because PostgreSQL and Redis cannot participate in one transaction.
- Failed final notification attempts are retained in a DLQ.
- Offset pagination is used with a maximum limit of 100.
- Integration tests use a dedicated PostgreSQL database and reset only that database.
