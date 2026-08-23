import { ERROR_CODES } from "../../errors/errorCodes.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { AppError } from "../../errors/AppError.js";
import { findNotificationJob, findTaskOrganization } from "./job.repository.js";

const mapState = (state) => {
    if (["waiting", "delayed", "paused"].includes(state)) return "pending";
    if (state === "active") return "active";
    if (state === "completed") return "completed";
    return "failed";
};

export const getStatus = async (jobId, organizationId) => {
    const found = await findNotificationJob(jobId);
    if (!found) {
        throw new AppError("Job not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const task = await findTaskOrganization(found.job.data.taskId);
    if (!task) {
        throw new AppError("Job not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (task.project.organizationId !== organizationId) {
        throw new AppError("You do not have access to this job.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    const status = found.source === "dead-letter" ? "failed" : mapState(await found.job.getState());
    const metadata = {
        assignmentId: found.job.data.assignmentId,
        taskId: found.job.data.taskId,
        userId: found.job.data.userId,
    };
    if (status === "failed") {
        metadata.attempts = found.job.data.failure?.attempts || found.job.attemptsMade;
        metadata.reason = found.job.data.failure?.reason || found.job.failedReason;
    }

    return {
        jobId,
        status,
        metadata,
    };
};
