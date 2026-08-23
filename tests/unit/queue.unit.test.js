import { afterAll, describe, expect, it } from "vitest";

import {
    assignmentNotificationQueue,
    closeAssignmentQueues,
} from "../../src/queues/taskAssignment.queue.js";

describe("assignment notification queue", () => {
    it("uses three exponential attempts with a one-second base delay", () => {
        expect(assignmentNotificationQueue.opts.defaultJobOptions.attempts).toBe(3);
        expect(assignmentNotificationQueue.opts.defaultJobOptions.backoff).toEqual({
            type: "exponential",
            delay: 1000,
        });
    });
});

afterAll(async () => {
    await closeAssignmentQueues();
});
