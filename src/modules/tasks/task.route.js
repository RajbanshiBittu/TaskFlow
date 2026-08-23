import express from "express";

import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { validate, validateParams } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.util.js";
import * as controller from "./task.controller.js";
import {
    assignmentParamsSchema,
    assignmentSchema,
    taskIdSchema,
    taskUpdateSchema,
} from "../projects/project.validation.js";

const router = express.Router();
router.use(authenticateUser);

router.get("/:id", validateParams(taskIdSchema), asyncHandler(controller.get));
router.patch("/:id", validateParams(taskIdSchema), validate(taskUpdateSchema), asyncHandler(controller.update));
router.delete("/:id", validateParams(taskIdSchema), asyncHandler(controller.remove));
router.post("/:id/assign", validateParams(taskIdSchema), validate(assignmentSchema), asyncHandler(controller.assign));
router.delete("/:id/assign/:userId", validateParams(assignmentParamsSchema), asyncHandler(controller.unassign));

export { router as taskRoutes };
