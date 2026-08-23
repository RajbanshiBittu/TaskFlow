import "dotenv/config";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "node:http";
import { Client } from "pg";
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import { resetAuthRateLimit } from "../../src/middlewares/rateLimit.middleware.js";

const testUrl = new URL(process.env.DATABASE_URL_TEST || process.env.DATABASE_URL);
if (!process.env.DATABASE_URL_TEST) testUrl.pathname = "/taskflow_test";
const testDatabaseName = decodeURIComponent(testUrl.pathname.slice(1));

let application;
let prisma;
let queue;
let deadLetterQueue;
let server;
let baseUrl;
let organizations;
let users;
let projects;
let tasks;

const request = async (method, path, body, token) => {
    const headers = {};
    if (body) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
};

const login = async (email) => {
    const response = await request("POST", "/auth/login", { email, password: "Integration!123" });
    expect(response.status).toBe(200);
    return response.body.data.accessToken;
};

const ensureTestDatabase = async () => {
    const adminUrl = new URL(testUrl);
    adminUrl.pathname = "/postgres";
    const client = new Client({ connectionString: adminUrl.toString() });
    await client.connect();
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [testDatabaseName]);
    if (existing.rowCount === 0) {
        await client.query(`CREATE DATABASE "${testDatabaseName.replaceAll('"', '""')}"`);
    }
    await client.end();
};

const ensureMigrationApplied = async () => {
    const client = new Client({ connectionString: testUrl.toString() });
    await client.connect();
    const result = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations'",
    );
    const applied = result.rowCount > 0 && (await client.query(
        "SELECT 1 FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL",
        ["20260823120000_init_multitenant"],
    )).rowCount > 0;
    await client.end();
    return applied;
};

const resetDatabase = async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "refresh_tokens", "comments", "task_assignments", "tasks", "projects", "org_members", "organizations", "users" CASCADE`);
};

const seedFixture = async () => {
    const passwordHash = await bcrypt.hash("Integration!123", 12);
    organizations = await Promise.all([
        prisma.organization.create({ data: { name: "Integration A", slug: `integration-a-${Date.now()}` } }),
        prisma.organization.create({ data: { name: "Integration B", slug: `integration-b-${Date.now()}` } }),
    ]);
    users = await Promise.all([
        prisma.user.create({ data: { name: "Admin A", email: `admin-a-${Date.now()}@test.local`, passwordHash } }),
        prisma.user.create({ data: { name: "Member A", email: `member-a-${Date.now()}@test.local`, passwordHash } }),
        prisma.user.create({ data: { name: "Admin B", email: `admin-b-${Date.now()}@test.local`, passwordHash } }),
    ]);
    await prisma.orgMember.createMany({ data: [
        { organizationId: organizations[0].id, userId: users[0].id, role: "ORG_ADMIN" },
        { organizationId: organizations[0].id, userId: users[1].id, role: "MEMBER" },
        { organizationId: organizations[1].id, userId: users[2].id, role: "ORG_ADMIN" },
    ] });
    projects = await Promise.all([
        prisma.project.create({ data: { organizationId: organizations[0].id, name: "Project A" } }),
        prisma.project.create({ data: { organizationId: organizations[1].id, name: "Project B" } }),
    ]);
    tasks = await Promise.all([
        prisma.task.create({ data: { projectId: projects[0].id, title: "A todo", status: "TODO", priority: "HIGH", dueDate: new Date("2026-08-10") } }),
        prisma.task.create({ data: { projectId: projects[0].id, title: "A urgent", status: "IN_PROGRESS", priority: "URGENT", dueDate: new Date("2026-08-20") } }),
        prisma.task.create({ data: { projectId: projects[1].id, title: "B task", status: "DONE", priority: "LOW" } }),
    ]);
};

beforeAll(async () => {
    await ensureTestDatabase();
    const migrationEnv = { ...process.env, DATABASE_URL: testUrl.toString() };
    if (!await ensureMigrationApplied()) {
        execFileSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
            cwd: process.cwd(),
            env: migrationEnv,
            stdio: "pipe",
            timeout: 60000,
        });
    }
    process.env.DATABASE_URL = testUrl.toString();
    ({ default: application } = await import("../../src/application.js"));
    ({ default: prisma } = await import("../../src/config/database.js"));
    ({ assignmentNotificationQueue: queue, assignmentNotificationDeadLetterQueue: deadLetterQueue } = await import("../../src/queues/taskAssignment.queue.js"));
    await resetDatabase();
    server = createServer(application);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(async () => {
    resetAuthRateLimit("::ffff:127.0.0.1");
    resetAuthRateLimit("127.0.0.1");
    await resetDatabase();
    await seedFixture();
});

afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (queue) await queue.close();
    if (deadLetterQueue) await deadLetterQueue.close();
    if (prisma) await prisma.$disconnect();
});

describe("TaskFlow real-stack integration", () => {
    it("registers, rejects duplicate email, logs in, rotates, and revokes refresh tokens", async () => {
        const email = `register-${Date.now()}@test.local`;
        const registration = await request("POST", "/auth/register", { name: "Registered", email, password: "Integration!123", organizationName: "Registered Org" });
        expect(registration.status).toBe(201);
        expect(registration.body.data.user.passwordHash).toBeUndefined();
        expect(registration.body.data.refreshToken).toBeTruthy();
        expect((await request("POST", "/auth/register", { name: "Duplicate", email, password: "Integration!123", organizationName: "Other" })).status).toBe(409);
        const loginResponse = await request("POST", "/auth/login", { email, password: "Integration!123" });
        expect(loginResponse.status).toBe(200);
        const rotated = await request("POST", "/auth/refresh", { refreshToken: loginResponse.body.data.refreshToken });
        expect(rotated.status).toBe(200);
        expect((await request("POST", "/auth/refresh", { refreshToken: loginResponse.body.data.refreshToken })).status).toBe(401);
        expect((await request("POST", "/auth/logout", { refreshToken: rotated.body.data.refreshToken })).status).toBe(200);
        expect((await request("POST", "/auth/refresh", { refreshToken: rotated.body.data.refreshToken })).status).toBe(401);
    });

    it("enforces project roles and cross-tenant project isolation", async () => {
        const adminToken = await login(users[0].email);
        const memberToken = await login(users[1].email);
        expect((await request("GET", "/projects", null, adminToken)).body.data.length).toBe(1);
        expect((await request("GET", `/projects/${projects[1].id}`, null, adminToken)).status).toBe(403);
        expect((await request("PATCH", `/projects/${projects[1].id}`, { name: "leak" }, adminToken)).status).toBe(403);
        expect((await request("DELETE", `/projects/${projects[0].id}`, null, memberToken)).status).toBe(403);
        expect((await request("DELETE", `/projects/${projects[0].id}`, null, adminToken)).status).toBe(204);
    });

    it("filters and paginates tasks, and protects task access", async () => {
        const token = await login(users[0].email);
        const filtered = await request("GET", `/projects/${projects[0].id}/tasks?page=1&limit=1&status=in_progress&priority=urgent`, null, token);
        expect(filtered.status).toBe(200);
        expect(filtered.body.total).toBe(1);
        expect(filtered.body.data[0].title).toBe("A urgent");
        expect(filtered.body.page).toBe(1);
        expect(filtered.body.limit).toBe(1);
        expect((await request("GET", `/tasks/${tasks[2].id}`, null, token)).status).toBe(403);
        expect((await request("PATCH", `/tasks/${tasks[2].id}`, { title: "leak" }, token)).status).toBe(403);
        expect((await request("DELETE", `/tasks/${tasks[2].id}`, null, token)).status).toBe(403);
    });

    it("assigns only organization members and exposes a pending job", async () => {
        const token = await login(users[0].email);
        const assigned = await request("POST", `/tasks/${tasks[0].id}/assign`, { userId: users[1].id }, token);
        expect(assigned.status).toBe(201);
        expect(assigned.body.data.jobId).toBeTruthy();
        const job = await request("GET", `/jobs/${assigned.body.data.jobId}`, null, token);
        expect(job.status).toBe(200);
        expect(["pending", "active", "completed"]).toContain(job.body.data.status);
        expect((await request("POST", `/tasks/${tasks[0].id}/assign`, { userId: users[2].id }, token)).status).toBe(403);
        expect((await request("POST", `/tasks/${tasks[0].id}/assign`, { userId: users[1].id }, token)).status).toBe(409);
    });

    it("rejects unauthenticated, invalid-id, and invalid-body requests", async () => {
        expect((await request("GET", "/projects")).status).toBe(401);
        expect((await request("GET", "/projects/not-a-uuid", null, await login(users[0].email))).status).toBe(400);
        expect((await request("POST", "/projects", { name: "" }, await login(users[0].email))).status).toBe(400);
    });

    it("limits authentication requests to ten per minute per IP", async () => {
        const responses = await Promise.all(Array.from({ length: 11 }, () => request(
            "POST",
            "/auth/login",
            { email: "missing@test.local", password: "wrong" },
        )));
        expect(responses.filter((response) => response.status === 429)).toHaveLength(1);
    });
});

