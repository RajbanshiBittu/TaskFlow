import { Prisma } from "../../../generated/prisma/client.ts";

import prisma from "../../config/database.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { AppError } from "../../errors/AppError.js";
import { logger } from "../../config/logger.js";
import { assignmentNotificationQueue } from "../../queues/taskAssignment.queue.js";
import { JOB_NAMES } from "../../queues/queue.constants.js";
import { assertProjectAccess } from "../projects/project.service.js";
import {
    createAssignment,
    createTask,
    deleteAssignment,
    deleteAssignmentById,
    deleteTask,
    findMember,
    findTaskById,
    groupTaskStatuses,
    listTasks,
    updateTask,
} from "./task.repository.js";

const assertTaskAccess = async (id, organizationId) => {
    const task = await findTaskById(id);
    if (!task) throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    if (task.project.organizationId !== organizationId) {
        throw new AppError("You do not have access to this task.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    return task;
};

export const create = async (projectId, organizationId, data) => {
    await assertProjectAccess(projectId, organizationId);
    return createTask(projectId, data);
};

export const list = async (projectId, organizationId, filters, pagination) => {
    await assertProjectAccess(projectId, organizationId);
    return listTasks(projectId, organizationId, filters, pagination);
};

export const get = (id, organizationId) => assertTaskAccess(id, organizationId);

export const update = async (id, organizationId, data) => {
    await assertTaskAccess(id, organizationId);
    const task = await updateTask(id, organizationId, data);
    if (!task) throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    return task;
};

export const remove = async (id, organizationId) => {
    await assertTaskAccess(id, organizationId);
    await deleteTask(id, organizationId);
};

export const assign = async (taskId, organizationId, userId) => {
    await assertTaskAccess(taskId, organizationId);
    const member = await findMember(organizationId, userId);
    if (!member) {
        const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!userExists) throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
        throw new AppError("User is not a member of this organization.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    try {
        const assignment = await createAssignment(taskId, userId);

        try {
            const job = await assignmentNotificationQueue.add(
                JOB_NAMES.TASK_ASSIGNMENT_NOTIFICATION,
                {
                    assignmentId: assignment.id,
                    taskId: assignment.taskId,
                    userId: assignment.userId,
                },
                { jobId: `assignment-notification-${assignment.id}` },
            );

            return { ...assignment, jobId: job.id };
        } catch (error) {
            // PostgreSQL and Redis cannot share a transaction. Compensate the
            // committed assignment if BullMQ rejects the notification job.
            try {
                await deleteAssignmentById(assignment.id);
            } catch (compensationError) {
                logger.error(
                    { assignmentId: assignment.id, err: compensationError },
                    "Assignment compensation failed after notification enqueue failure",
                );
            }
            throw new AppError(
                "Assignment notification could not be queued.",
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
            );
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new AppError("User is already assigned to this task.", HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
        }
        throw error;
    }
};

export const unassign = async (taskId, organizationId, userId) => {
    await assertTaskAccess(taskId, organizationId);
    try {
        await deleteAssignment(taskId, userId);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new AppError("Assignment not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        throw error;
    }
};

export const dashboard = async (projectId, organizationId) => {
    await assertProjectAccess(projectId, organizationId);
    const grouped = await groupTaskStatuses(projectId, organizationId);
    const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
    for (const item of grouped) counts[item.status.toLowerCase()] = item._count._all;
    return counts;
};