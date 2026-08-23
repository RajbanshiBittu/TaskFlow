import worker from "./taskAssignment.worker.js";
import prisma from "../config/database.js";
import { closeAssignmentQueues } from "../queues/taskAssignment.queue.js";

console.log("TaskFlow worker started");

const shutdown = async (signal) => {
    console.log(
        `${signal} received. Shutting down worker...`
    );

    await worker.close();
    await closeAssignmentQueues();
    await prisma.$disconnect();

    console.log("Worker shutdown complete");

    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));