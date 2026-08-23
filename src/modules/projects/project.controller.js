import { sendPaginatedResponse, sendSuccessResponse } from "../../utils/response.util.js";
import * as projectService from "./project.service.js";
import * as taskService from "../tasks/task.service.js";
import { parsePagination } from "../../utils/pagination.js";

const organizationId = (req) => req.auth.organizationId;

export const create = async (req, res) => sendSuccessResponse(res, {
    statusCode: 201,
    message: "Project created.",
    data: await projectService.create(organizationId(req), req.body),
});

export const list = async (req, res) => {
    const { page, limit, skip, take } = parsePagination(req.validatedQuery);
    const result = await projectService.list(organizationId(req), {
        skip,
        take,
    });
    return sendPaginatedResponse(res, { ...result, page, limit });
};

export const get = async (req, res) => sendSuccessResponse(res, {
    data: await projectService.get(req.params.id, organizationId(req)),
});

export const update = async (req, res) => sendSuccessResponse(res, {
    message: "Project updated.",
    data: await projectService.update(req.params.id, organizationId(req), req.body),
});

export const remove = async (req, res) => {
    await projectService.remove(req.params.id, organizationId(req));
    return res.status(204).send();
};

export const createTask = async (req, res) => sendSuccessResponse(res, {
    statusCode: 201,
    message: "Task created.",
    data: await taskService.create(req.params.projectId, organizationId(req), req.body),
});

export const listTasks = async (req, res) => {
    const { page, limit, skip, take, ...filters } = req.validatedQuery;
    const result = await taskService.list(req.params.projectId, organizationId(req), filters, {
        skip,
        take,
    });
    return sendPaginatedResponse(res, { ...result, page, limit });
};

export const dashboard = async (req, res) => sendSuccessResponse(res, {
    data: await taskService.dashboard(req.params.id, organizationId(req)),
});
