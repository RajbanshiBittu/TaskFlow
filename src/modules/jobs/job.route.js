import express from "express";
import { z } from "zod";

import { authenticateUser } from "../../middlewares/auth.middleware.js";
import { validateParams } from "../../middlewares/validation.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.util.js";
import * as controller from "./job.controller.js";

const jobIdSchema = z.object({
    id: z.string().trim().min(1).max(200),
}).strict();

const router = express.Router();
router.use(authenticateUser);
router.get("/:id", validateParams(jobIdSchema), asyncHandler(controller.getStatus));

export { router as jobRoutes };
