import prisma from "../../config/database.js";
import {
    assignmentNotificationDeadLetterQueue,
    assignmentNotificationQueue,
} from "../../queues/taskAssignment.queue.js";

export const findNotificationJob = async (jobId) => {
    const primaryJob = await assignmentNotificationQueue.getJob(jobId);
    if (primaryJob) return { job: primaryJob, source: "primary" };

    const deadLetterJob = await assignmentNotificationDeadLetterQueue.getJob(`dlq-${jobId}`);
    if (deadLetterJob) return { job: deadLetterJob, source: "dead-letter" };

    return null;
};

export const findTaskOrganization = (taskId) => prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { organizationId: true } } },
});
