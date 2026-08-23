import { sendSuccessResponse } from "../../utils/response.util.js";
import * as taskService from "./task.service.js";

const organizationId = (req) => req.auth.organizationId;

export const get = async (req, res) => sendSuccessResponse(res, {
    data: await taskService.get(req.params.id, organizationId(req)),
});

export const update = async (req, res) => sendSuccessResponse(res, {
    message: "Task updated.",
    data: await taskService.update(req.params.id, organizationId(req), req.body),
});

export const remove = async (req, res) => {
    await taskService.remove(req.params.id, organizationId(req));
    return res.status(204).send();
};

export const assign = async (req, res) => sendSuccessResponse(res, {
    statusCode: 201,
    message: "User assigned to task.",
    data: await taskService.assign(req.params.id, organizationId(req), req.body.userId),
});

export const unassign = async (req, res) => {
    await taskService.unassign(req.params.id, organizationId(req), req.params.userId);
    return res.status(204).send();
};
