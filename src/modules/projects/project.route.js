import express from "express";

import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/authorization.middleware.js";
import { validate, validateParams, validateQuery } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.util.js";
import { ROLES } from "../../constants/roles.js";
import * as controller from "./project.controller.js";
import {
    projectCreateSchema,
    projectIdSchema,
    projectListQuerySchema,
    projectTaskParamsSchema,
    projectUpdateSchema,
    taskCreateSchema,
    taskListQuerySchema,
} from "./project.validation.js";

const router = express.Router();
router.use(authenticateUser);

router.post("/", validate(projectCreateSchema), asyncHandler(controller.create));
router.get("/", validateQuery(projectListQuerySchema), asyncHandler(controller.list));
router.get("/:id", validateParams(projectIdSchema), asyncHandler(controller.get));
router.patch("/:id", validateParams(projectIdSchema), validate(projectUpdateSchema), asyncHandler(controller.update));
router.delete("/:id", validateParams(projectIdSchema), requireRole(ROLES.ORG_ADMIN), asyncHandler(controller.remove));
router.post("/:projectId/tasks", validateParams(projectTaskParamsSchema), validate(taskCreateSchema), asyncHandler(controller.createTask));
router.get("/:projectId/tasks", validateParams(projectTaskParamsSchema), validateQuery(taskListQuerySchema), asyncHandler(controller.listTasks));
router.get("/:id/dashboard", validateParams(projectIdSchema), asyncHandler(controller.dashboard));

export { router as projectRoutes };
