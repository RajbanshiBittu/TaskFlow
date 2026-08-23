import { z } from "zod";

const password = z.string().min(8).max(128);
const email = z.string().email().max(320).transform((value) => value.trim().toLowerCase());

export const registerSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email,
    password,
    organizationName: z.string().trim().min(1).max(120),
}).strict();

export const loginSchema = z.object({
    email,
    password,
}).strict();

export const refreshSchema = z.object({
    refreshToken: z.string().min(1),
}).strict();

export const logoutSchema = refreshSchema;
