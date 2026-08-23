import {
    beforeAll,
    afterAll,
    describe,
    expect,
    it
} from "vitest";
import { randomUUID } from "node:crypto";

const API_URL =
    process.env.TEST_API_URL || "http://localhost:5000";

const request = async (
    method,
    path,
    { token, body } = {}
) => {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            ...(body !== undefined
                ? { "Content-Type": "application/json" }
                : {}),
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {})
        },
        body:
            body !== undefined
                ? JSON.stringify(body)
                : undefined
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        // 204 responses may not contain JSON.
    }

    return {
        status: response.status,
        data
    };
};

const getAccessToken = (data) =>
    data?.data?.accessToken ??
    data?.accessToken ??
    data?.data?.token ??
    data?.token;

const getRefreshToken = (data) =>
    data?.data?.refreshToken ??
    data?.refreshToken;

const getId = (data) =>
    data?.data?.id ??
    data?.data?.project?.id ??
    data?.data?.task?.id ??
    data?.id;

const getJobId = (data) =>
    data?.data?.jobId ??
    data?.data?.job?.id ??
    data?.jobId ??
    data?.job?.id;

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJob(
    jobId,
    token,
    expectedStatus = "completed"
) {
    const timeout = 15_000;
    const interval = 500;
    const started = Date.now();

    let lastResponse = null;

    while (Date.now() - started < timeout) {
        lastResponse = await request(
            "GET",
            `/jobs/${jobId}`,
            { token }
        );

        const status =
            lastResponse.data?.data?.status ??
            lastResponse.data?.status;

        if (status === expectedStatus) {
            return lastResponse;
        }

        if (status === "failed") {
            throw new Error(
                `Job failed: ${JSON.stringify(
                    lastResponse.data
                )}`
            );
        }

        await sleep(interval);
    }

    throw new Error(
        `Timed out waiting for job ${jobId}. Last response: ${JSON.stringify(
            lastResponse?.data
        )}`
    );
}

describe("TaskFlow E2E smoke test", () => {
    const suffix = randomUUID().slice(0, 8);

    const admin = {
    email: `e2e-admin-${suffix}@example.test`,
    password: "TaskFlowE2E!2026",
    name: "E2E Admin",
    organizationName: `E2E Organization ${suffix}`
};

const member = {
    email: `e2e-member-${suffix}@example.test`,
    password: "TaskFlowE2E!2026",
    name: "E2E Member",
    organizationName: `E2E Member Organization ${suffix}`
};

    let adminToken;
    let refreshToken;

    let memberToken;

    let projectId;
    let taskId;
    let jobId;

    beforeAll(async () => {
        const health = await request("GET", "/health");

        expect(
            [200, 204],
            `Health check failed: ${JSON.stringify(
                health.data
            )}`
        ).toContain(health.status);
    });

    afterAll(async () => {
        /*
         * Cleanup only resources created by this test.
         *
         * Project deletion cascades its tasks, assignments
         * and comments according to the Prisma schema.
         */
        if (projectId && adminToken) {
            const response = await request(
                "DELETE",
                `/projects/${projectId}`,
                {
                    token: adminToken
                }
            );

            expect([204, 404]).toContain(
                response.status
            );
        }
    });

    it(
        "completes the core TaskFlow business flow",
        async () => {
            // --------------------------------------------------
            // 1. REGISTER ADMIN
            // --------------------------------------------------

            const registerAdmin = await request(
                "POST",
                "/auth/register",
                {
                    body: admin
                }
            );

            expect(
                [200, 201],
                `Admin registration failed: ${JSON.stringify(
                    registerAdmin.data
                )}`
            ).toContain(registerAdmin.status);

            // --------------------------------------------------
            // 2. LOGIN ADMIN
            // --------------------------------------------------

            const loginAdmin = await request(
                "POST",
                "/auth/login",
                {
                    body: {
                        email: admin.email,
                        password: admin.password
                    }
                }
            );

            expect(
                loginAdmin.status,
                `Admin login failed: ${JSON.stringify(
                    loginAdmin.data
                )}`
            ).toBe(200);

            adminToken = getAccessToken(
                loginAdmin.data
            );

            refreshToken = getRefreshToken(
                loginAdmin.data
            );

            expect(adminToken).toBeTruthy();
            expect(refreshToken).toBeTruthy();

            // --------------------------------------------------
            // 3. REFRESH TOKEN ROTATION
            // --------------------------------------------------

            const refresh = await request(
                "POST",
                "/auth/refresh",
                {
                    body: {
                        refreshToken
                    }
                }
            );

            expect(
                refresh.status,
                `Refresh failed: ${JSON.stringify(
                    refresh.data
                )}`
            ).toBe(200);

            const rotatedAccessToken =
                getAccessToken(refresh.data);

            const rotatedRefreshToken =
                getRefreshToken(refresh.data);

            expect(rotatedAccessToken).toBeTruthy();
            expect(rotatedRefreshToken).toBeTruthy();

            // Old token must be revoked.
            const reusedRefresh = await request(
                "POST",
                "/auth/refresh",
                {
                    body: {
                        refreshToken
                    }
                }
            );

            expect(reusedRefresh.status).toBe(401);

            adminToken = rotatedAccessToken;
            refreshToken = rotatedRefreshToken;

            // --------------------------------------------------
            // 4. REGISTER MEMBER
            // --------------------------------------------------

            const registerMember = await request(
                "POST",
                "/auth/register",
                {
                    body: member
                }
            );

            expect(
                [200, 201],
                `Member registration failed: ${JSON.stringify(
                    registerMember.data
                )}`
            ).toContain(registerMember.status);

            // --------------------------------------------------
            // 5. LOGIN MEMBER
            // --------------------------------------------------

            const loginMember = await request(
                "POST",
                "/auth/login",
                {
                    body: {
                        email: member.email,
                        password: member.password
                    }
                }
            );

            expect(
                loginMember.status,
                `Member login failed: ${JSON.stringify(
                    loginMember.data
                )}`
            ).toBe(200);

            memberToken = getAccessToken(
                loginMember.data
            );

            expect(memberToken).toBeTruthy();

            // --------------------------------------------------
            // 6. CREATE PROJECT
            // --------------------------------------------------

            const createProject = await request(
                "POST",
                "/projects",
                {
                    token: adminToken,
                    body: {
                        name: `E2E Project ${suffix}`,
                        description:
                            "Created by E2E smoke test"
                    }
                }
            );

            expect(
                createProject.status,
                `Project creation failed: ${JSON.stringify(
                    createProject.data
                )}`
            ).toBe(201);

            projectId = getId(
                createProject.data
            );

            expect(projectId).toBeTruthy();

            // --------------------------------------------------
            // 7. GET PROJECT
            // --------------------------------------------------

            const getProject = await request(
                "GET",
                `/projects/${projectId}`,
                {
                    token: adminToken
                }
            );

            expect(getProject.status).toBe(200);

            // --------------------------------------------------
            // 8. UPDATE PROJECT
            // --------------------------------------------------

            const updateProject = await request(
                "PATCH",
                `/projects/${projectId}`,
                {
                    token: adminToken,
                    body: {
                        name: `Updated E2E Project ${suffix}`
                    }
                }
            );

            expect(updateProject.status).toBe(200);

            // --------------------------------------------------
            // 9. CREATE TASK
            // --------------------------------------------------

            const createTask = await request(
                "POST",
                `/projects/${projectId}/tasks`,
                {
                    token: adminToken,
                    body: {
                        title: `E2E Task ${suffix}`,
                        description:
                            "Created by E2E smoke test",
                        status: "todo",
                        priority: "high"
                    }
                }
            );

            expect(
                createTask.status,
                `Task creation failed: ${JSON.stringify(
                    createTask.data
                )}`
            ).toBe(201);

            taskId = getId(createTask.data);

            expect(taskId).toBeTruthy();

            // --------------------------------------------------
            // 10. GET TASK
            // --------------------------------------------------

            const getTask = await request(
                "GET",
                `/tasks/${taskId}`,
                {
                    token: adminToken
                }
            );

            expect(getTask.status).toBe(200);

            // --------------------------------------------------
            // 11. UPDATE TASK
            // --------------------------------------------------

            const updateTask = await request(
                "PATCH",
                `/tasks/${taskId}`,
                {
                    token: adminToken,
                    body: {
                        status: "in_progress",
                        priority: "urgent"
                    }
                }
            );

            expect(updateTask.status).toBe(200);

            // --------------------------------------------------
            // 12. FILTER + PAGINATION
            // --------------------------------------------------

            const tasks = await request(
                "GET",
                `/projects/${projectId}/tasks?status=in_progress&priority=urgent&page=1&limit=20`,
                {
                    token: adminToken
                }
            );

            expect(
                tasks.status,
                `Task listing failed: ${JSON.stringify(
                    tasks.data
                )}`
            ).toBe(200);

            const pagination =
                tasks.data?.data ?? tasks.data;

            expect(pagination).toHaveProperty(
                "total"
            );

            expect(pagination).toHaveProperty(
                "page"
            );

            expect(pagination).toHaveProperty(
                "limit"
            );

            expect(pagination.page).toBe(1);
            expect(pagination.limit).toBe(20);

            // --------------------------------------------------
            // 13. DASHBOARD
            // --------------------------------------------------

            const dashboard = await request(
                "GET",
                `/projects/${projectId}/dashboard`,
                {
                    token: adminToken
                }
            );

            expect(
                dashboard.status,
                `Dashboard failed: ${JSON.stringify(
                    dashboard.data
                )}`
            ).toBe(200);

            const dashboardData =
                dashboard.data?.data ??
                dashboard.data;

            /*
             * Dashboard must expose every required status,
             * even when its count is zero.
             */
            for (const status of [
                "todo",
                "in_progress",
                "review",
                "done"
            ]) {
                expect(dashboardData).toHaveProperty(
                    status
                );
            }

            // --------------------------------------------------
            // 14. ASSIGN TASK
            // --------------------------------------------------

            const assignTask = await request(
                "POST",
                `/tasks/${taskId}/assign`,
                {
                    token: adminToken,
                    body: {
                        userId:
                            loginMember.data?.data
                                ?.user?.id ??
                            loginMember.data?.user?.id ??
                            loginMember.data?.data?.id ??
                            loginMember.data?.id
                    }
                }
            );

            expect(
                assignTask.status,
                `Task assignment failed: ${JSON.stringify(
                    assignTask.data
                )}`
            ).toBe(201);

            jobId = getJobId(assignTask.data);

            expect(jobId).toBeTruthy();

            // --------------------------------------------------
            // 15. VERIFY BACKGROUND JOB
            // --------------------------------------------------

            const job = await waitForJob(
                jobId,
                adminToken
            );

            expect(job.status).toBe(200);

            const jobData =
                job.data?.data ?? job.data;

            expect(jobData).toHaveProperty(
                "status"
            );

            expect(jobData.status).toBe(
                "completed"
            );

            // --------------------------------------------------
            // 16. UNASSIGN TASK
            // --------------------------------------------------

            const unassignTask = await request(
                "DELETE",
                `/tasks/${taskId}/assign`,
                {
                    token: adminToken,
                    body: {
                        userId:
                            loginMember.data?.data
                                ?.user?.id ??
                            loginMember.data?.user?.id ??
                            loginMember.data?.data?.id ??
                            loginMember.data?.id
                    }
                }
            );

            expect(
                [200, 204],
                `Task unassignment failed: ${JSON.stringify(
                    unassignTask.data
                )}`
            ).toContain(unassignTask.status);

            // --------------------------------------------------
            // 17. LOGOUT
            // --------------------------------------------------

            const logout = await request(
                "POST",
                "/auth/logout",
                {
                    token: adminToken,
                    body: {
                        refreshToken
                    }
                }
            );

            expect(
                [200, 204],
                `Logout failed: ${JSON.stringify(
                    logout.data
                )}`
            ).toContain(logout.status);

            // --------------------------------------------------
            // 18. VERIFY REFRESH TOKEN REVOCATION
            // --------------------------------------------------

            const refreshAfterLogout =
                await request(
                    "POST",
                    "/auth/refresh",
                    {
                        body: {
                            refreshToken
                        }
                    }
                );

            expect(
                refreshAfterLogout.status
            ).toBe(401);

            // --------------------------------------------------
            // SUCCESS
            // --------------------------------------------------

            expect(projectId).toBeTruthy();
            expect(taskId).toBeTruthy();
            expect(jobId).toBeTruthy();
        },
        30_000
    );
});