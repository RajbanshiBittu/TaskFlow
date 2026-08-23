import application from "./application.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import prisma from "./config/database.js";
import { closeRedis } from "./config/redis.js";
import { closeAssignmentQueues } from "./queues/taskAssignment.queue.js";

const server = application.listen(env.port, () => {
    logger.info(
        {
            port: env.port,
            environment: env.nodeEnv,
        },
        "TaskFlow API server started"
    );
});

const shutdown = async (signal) => {
    logger.info(
        `${signal} received. Starting graceful shutdown...`
    );

    server.close(async () => {
        logger.info("HTTP server closed.");
        await closeAssignmentQueues();
        await closeRedis();
        await prisma.$disconnect();
        process.exit(0);
    });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));