export const sendTaskAssignmentEmail = async ({ recipient, taskTitle, taskId }) => {
    // Phase 4 uses a mock sender; the worker remains the async integration boundary.
    console.log(`Mock assignment email queued for ${recipient}: task ${taskId} (${taskTitle})`);
};
