import prisma from "../../config/database.js";

const projectSelect = {
    id: true,
    organizationId: true,
    name: true,
    description: true,
    createdAt: true,
    updatedAt: true,
};

export const findProjectById = (id) => prisma.project.findUnique({
    where: { id },
    select: projectSelect,
});

export const listProjects = async (organizationId, { skip, take }) => {
    const where = { organizationId };
    const [data, total] = await prisma.$transaction([
        prisma.project.findMany({
            where,
            select: projectSelect,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.project.count({ where }),
    ]);
    return { data, total };
};

export const createProject = (organizationId, data) => prisma.project.create({
    data: { ...data, organizationId },
    select: projectSelect,
});

export const updateProject = (id, organizationId, data) => prisma.project.update({
    where: { id, organizationId },
    data,
    select: projectSelect,
});

export const deleteProject = (id, organizationId) => prisma.project.delete({
    where: { id, organizationId },
});
