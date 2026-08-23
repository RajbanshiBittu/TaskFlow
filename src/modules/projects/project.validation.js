import { z } from "zod";

const uuid = z.string().uuid();
const paginationFields = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const projectCreateSchema = z.object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().max(5000).nullable().optional(),
}).strict();

export const projectUpdateSchema = z.object({
    name: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: "At least one project field is required.",
});

export const projectIdSchema = z.object({ id: uuid });
export const projectListQuerySchema = z.object(paginationFields).strict();

export const taskCreateSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]).default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    dueDate: z.coerce.date().nullable().optional(),
}).strict();

export const taskUpdateSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.coerce.date().nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: "At least one task field is required.",
});

export const taskListQuerySchema = z.object({
    ...paginationFields,
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee: uuid.optional(),
    dueFrom: z.coerce.date().optional(),
    dueTo: z.coerce.date().optional(),
}).strict().refine((value) => !value.dueFrom || !value.dueTo || value.dueFrom <= value.dueTo, {
    message: "dueFrom must be before or equal to dueTo.",
    path: ["dueFrom"],
});

export const assignmentSchema = z.object({
    userId: uuid,
}).strict();

export const taskIdSchema = z.object({ id: uuid });
export const projectTaskParamsSchema = z.object({ projectId: uuid });
export const assignmentParamsSchema = z.object({ id: uuid, userId: uuid });
