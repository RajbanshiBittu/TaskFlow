import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    assignmentNotificationQueue: { add: vi.fn() },
    createAssignment: vi.fn(),
    createTask: vi.fn(),
    deleteAssignment: vi.fn(),
    deleteAssignmentById: vi.fn(),
    deleteTask: vi.fn(),
    findMember: vi.fn(),
    findTaskById: vi.fn(),
    groupTaskStatuses: vi.fn(),
    listTasks: vi.fn(),
    updateTask: vi.fn(),
    userFindUnique: vi.fn(),
}));

vi.mock("../../src/config/database.js", () => ({ default: { user: { findUnique: mocks.userFindUnique } } }));
vi.mock("../../src/queues/taskAssignment.queue.js", () => ({ assignmentNotificationQueue: mocks.assignmentNotificationQueue }));
vi.mock("../../src/modules/projects/project.service.js", () => ({ assertProjectAccess: vi.fn() }));
vi.mock("../../src/modules/tasks/task.repository.js", () => ({
    createAssignment: mocks.createAssignment,
    createTask: mocks.createTask,
    deleteAssignment: mocks.deleteAssignment,
    deleteAssignmentById: mocks.deleteAssignmentById,
    deleteTask: mocks.deleteTask,
    findMember: mocks.findMember,
    findTaskById: mocks.findTaskById,
    groupTaskStatuses: mocks.groupTaskStatuses,
    listTasks: mocks.listTasks,
    updateTask: mocks.updateTask,
}));

const { assign, unassign } = await import("../../src/modules/tasks/task.service.js");

describe("task assignment service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.findTaskById.mockResolvedValue({ project: { organizationId: "org-a" } });
        mocks.findMember.mockResolvedValue({ userId: "user-b" });
        mocks.createAssignment.mockResolvedValue({ id: "assignment-1", taskId: "task-1", userId: "user-b" });
        mocks.assignmentNotificationQueue.add.mockResolvedValue({ id: "job-1" });
    });

    it("persists an assignment before enqueueing its notification", async () => {
        const result = await assign("task-1", "org-a", "user-b");
        expect(result.jobId).toBe("job-1");
        expect(mocks.createAssignment).toHaveBeenCalledWith("task-1", "user-b");
        expect(mocks.assignmentNotificationQueue.add).toHaveBeenCalledOnce();
    });

    it("compensates when enqueue fails", async () => {
        mocks.assignmentNotificationQueue.add.mockRejectedValue(new Error("Redis unavailable"));
        await expect(assign("task-1", "org-a", "user-b")).rejects.toMatchObject({ statusCode: 500 });
        expect(mocks.deleteAssignmentById).toHaveBeenCalledWith("assignment-1");
    });

    it("rejects a missing task", async () => {
        mocks.findTaskById.mockResolvedValue(null);
        await expect(assign("missing", "org-a", "user-b")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects a user outside the organization", async () => {
        mocks.findMember.mockResolvedValue(null);
        mocks.userFindUnique.mockResolvedValue({ id: "user-b" });
        await expect(assign("task-1", "org-a", "user-b")).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects a nonexistent user", async () => {
        mocks.findMember.mockResolvedValue(null);
        mocks.userFindUnique.mockResolvedValue(null);
        await expect(assign("task-1", "org-a", "missing-user")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("unassigns through the existing assignment key", async () => {
        await unassign("task-1", "org-a", "user-b");
        expect(mocks.deleteAssignment).toHaveBeenCalledWith("task-1", "user-b");
    });
});
