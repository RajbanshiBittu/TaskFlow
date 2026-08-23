import { Prisma } from "../../../generated/prisma/client.ts";

import { ERROR_CODES } from "../../errors/errorCodes.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { AppError } from "../../errors/AppError.js";
import {
    createProject,
    deleteProject,
    findProjectById,
    listProjects,
    updateProject,
} from "./project.repository.js";

const assertProjectAccess = async (id, organizationId) => {
    const project = await findProjectById(id);
    if (!project) {
        throw new AppError("Project not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (project.organizationId !== organizationId) {
        throw new AppError("You do not have access to this project.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }
    return project;
};

export const create = (organizationId, data) => createProject(organizationId, data);

export const list = (organizationId, pagination) => listProjects(organizationId, pagination);

export const get = (id, organizationId) => assertProjectAccess(id, organizationId);

export const update = async (id, organizationId, data) => {
    await assertProjectAccess(id, organizationId);
    return updateProject(id, organizationId, data);
};

export const remove = async (id, organizationId) => {
    await assertProjectAccess(id, organizationId);
    try {
        await deleteProject(id, organizationId);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new AppError("Project not found.", HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
        }
        throw error;
    }
};

export { assertProjectAccess };
