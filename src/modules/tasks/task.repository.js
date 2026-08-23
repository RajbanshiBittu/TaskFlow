import prisma from "../../config/database.js";

const statusValues = { todo: "TODO", in_progress: "IN_PROGRESS", review: "REVIEW", done: "DONE" };
const priorityValues = { low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "URGENT" };
const userSelect = { id: true, name: true, email: true };
const taskSelect = {
    id: true,
    projectId: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    createdAt: true,
    updatedAt: true,
    assignments: {
        select: {
            id: true,
            assignedAt: true,
            user: { select: userSelect },
        },
    },
};

const serializeTask = (task) => ({
    ...task,
    status: task.status.toLowerCase(),
    priority: task.priority.toLowerCase(),
});

export const findTaskById = (id) => prisma.task.findUnique({
    where: { id },
    select: {
        ...taskSelect,
        project: { select: { organizationId: true } },
    },
}).then((task) => task && serializeTask(task));

export const listTasks = async (projectId, organizationId, filters, { skip, take }) => {
    const where = {
        projectId,
        project: { organizationId },
        ...(filters.status && { status: statusValues[filters.status] }),
        ...(filters.priority && { priority: priorityValues[filters.priority] }),
        ...(filters.assignee && { assignments: { some: { userId: filters.assignee } } }),
        ...((filters.dueFrom || filters.dueTo) && {
            dueDate: {
                ...(filters.dueFrom && { gte: filters.dueFrom }),
                ...(filters.dueTo && { lte: filters.dueTo }),
            },
        }),
    };
    const [data, total] = await prisma.$transaction([
        prisma.task.findMany({ where, select: taskSelect, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.task.count({ where }),
    ]);
    return { data: data.map(serializeTask), total };
};

export const createTask = (projectId, data) => prisma.task.create({
    data: {
        ...data,
        projectId,
        ...(data.status && { status: statusValues[data.status] }),
        ...(data.priority && { priority: priorityValues[data.priority] }),
    },
    select: taskSelect,
}).then(serializeTask);

export const updateTask = async (id, organizationId, data) => {
    const result = await prisma.task.updateMany({
        where: { id, project: { organizationId } },
        data: {
            ...data,
            ...(data.status && { status: statusValues[data.status] }),
            ...(data.priority && { priority: priorityValues[data.priority] }),
        },
    });
    if (result.count !== 1) return null;
    const task = await prisma.task.findUnique({ where: { id }, select: taskSelect });
    return task && serializeTask(task);
};

export const deleteTask = (id, organizationId) => prisma.task.deleteMany({
    where: { id, project: { organizationId } },
});

export const findMember = (organizationId, userId) => prisma.orgMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { userId: true },
});

export const createAssignment = (taskId, userId) => prisma.taskAssignment.create({
    data: { taskId, userId },
    select: {
        id: true,
        taskId: true,
        userId: true,
        assignedAt: true,
    },
});

export const deleteAssignment = (taskId, userId) => prisma.taskAssignment.delete({
    where: { taskId_userId: { taskId, userId } },
});

export const deleteAssignmentById = (id) => prisma.taskAssignment.delete({
    where: { id },
});

export const groupTaskStatuses = (projectId, organizationId) => prisma.task.groupBy({
    by: ["status"],
    where: { projectId, project: { organizationId } },
    _count: { _all: true },
});
