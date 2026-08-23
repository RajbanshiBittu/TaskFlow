import express from "express";
// import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import prisma from "../src/config/database.js";

import { HTTP_STATUS } from "./constants/httpStatus.js";
import { logger } from "./config/logger.js";

import { healthRoutes } from "./modules/health/health.route.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { projectRoutes } from "./modules/projects/project.route.js";
import { taskRoutes } from "./modules/tasks/task.route.js";
import { jobRoutes } from "./modules/jobs/job.route.js";

import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";


const application = express();


application.use(helmet());
// application.use(cors());
application.use(express.json());
application.use(express.urlencoded({ extended: true }));

application.use(
    pinoHttp({
        logger,
    })
);

application.get("/", (req, res) => {
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Welcome to the TaskFlow API",
        version: "1.0.0",
    });
});

application.use("/health", healthRoutes);
application.use("/auth", authRoutes);
application.use("/projects", projectRoutes);
application.use("/tasks", taskRoutes);
application.use("/jobs", jobRoutes);
application.use(notFoundHandler);
application.use(errorHandler);


export default application;