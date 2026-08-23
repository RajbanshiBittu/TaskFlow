import { Worker } from "bullmq";

import { createBullMQConnection } from "../queues/queue.connection.js";
import { assignmentNotificationDeadLetterQueue } from "../queues/taskAssignment.queue.js";
import { JOB_NAMES, QUEUE_NAMES } from "../queues/queue.constants.js";
import { env } from "../config/env.js";
import prisma from "../config/database.js";
import { sendTaskAssignmentEmail } from "../services/email.service.js";

const worker = new Worker(
    QUEUE_NAMES.ASSIGNMENT_NOTIFICATION,

    async (job) => {
        if (job.name !== JOB_NAMES.TASK_ASSIGNMENT_NOTIFICATION) {
            throw new Error(`Unknown job type: ${job.name}`);
        }

        return handleTaskAssignmentNotification(job);
    },

    {
        connection: createBullMQConnection(),
        prefix: env.bullmq.prefix,

        concurrency: 5
    }
);

async function handleTaskAssignmentNotification(job) {
    const assignment = await prisma.taskAssignment.findUnique({
        where: { id: job.data.assignmentId },
        include: {
            user: { select: { id: true, email: true } },
            task: { select: { id: true, title: true } },
        },
    });

    if (!assignment || assignment.task.id !== job.data.taskId || assignment.user.id !== job.data.userId) {
        throw new Error(`Assignment ${job.data.assignmentId} not found or has changed`);
    }

    await sendTaskAssignmentEmail({
        recipient: assignment.user.email,
        taskTitle: assignment.task.title,
        taskId: assignment.task.id,
    });

    return { assignmentId: assignment.id, taskId: assignment.task.id };
}

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
        try {
            await assignmentNotificationDeadLetterQueue.add(
                `${JOB_NAMES.TASK_ASSIGNMENT_NOTIFICATION}.failed`,
                {
                    ...job.data,
                    failure: {
                        attempts: job.attemptsMade,
                        reason: error.message,
                        failedAt: new Date().toISOString(),
                    },
                },
                { jobId: `dlq-${job.id}` },
            );
        } catch (dlqError) {
            console.error(`Unable to record failed job ${job.id} in DLQ:`, dlqError.message);
        }
    }
});

worker.on("error", (error) => {
    console.error(
        "Worker error:",
        error.message
    );
});

export default worker;