import express from "express";

import { validate } from "../../middlewares/validation.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import * as authController from "./auth.controller.js";
import {
    loginSchema,
    logoutSchema,
    refreshSchema,
    registerSchema,
} from "./auth.validation.js";

const router = express.Router();

router.use(authRateLimiter);
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(logoutSchema), authController.logout);

export { router as authRoutes };
