import { Queue } from "bullmq";

import { env } from "../config/env.js";
import { createBullMQConnection } from "./queue.connection.js";
import { QUEUE_NAMES } from "./queue.constants.js";

export const assignmentNotificationQueue = new Queue(QUEUE_NAMES.ASSIGNMENT_NOTIFICATION, {
    connection: createBullMQConnection(),

    prefix: env.bullmq.prefix,

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 1000
        },

        removeOnComplete: {
            age: 3600,
            count: 1000
        },

        removeOnFail: {
            age: 24 * 3600,
            count: 5000
        }
    }
});

export const assignmentNotificationDeadLetterQueue = new Queue(
    QUEUE_NAMES.ASSIGNMENT_NOTIFICATION_DLQ,
    {
        connection: createBullMQConnection(),
        prefix: env.bullmq.prefix,
        defaultJobOptions: {
            removeOnComplete: false,
            removeOnFail: false,
        },
    },
);

export const closeAssignmentQueues = async () => {
    await assignmentNotificationQueue.close();
    await assignmentNotificationDeadLetterQueue.close();
};