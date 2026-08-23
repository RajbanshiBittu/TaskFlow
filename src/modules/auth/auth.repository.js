import prisma from "../../config/database.js";

const safeUserSelect = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
};

export const findUserByEmail = (email) => prisma.user.findUnique({
    where: { email },
    select: {
        ...safeUserSelect,
        passwordHash: true,
        memberships: {
            orderBy: { createdAt: "asc" },
            include: { organization: true },
        },
    },
});

export const findUserWithMembership = (userId, membershipId, organizationId) => prisma.user.findUnique({
    where: { id: userId },
    select: {
        ...safeUserSelect,
        memberships: {
            where: {
                id: membershipId,
                organizationId,
            },
            include: { organization: true },
        },
    },
});

export const createRegistration = (tx, { user, organization, membership }) => tx.user.create({
    data: {
        ...user,
        memberships: {
            create: {
                ...membership,
                organization: { create: organization },
            },
        },
    },
    select: {
        ...safeUserSelect,
        memberships: {
            include: { organization: true },
        },
    },
});

export const createRefreshToken = (client, data) => client.refreshToken.create({ data });

export const findRefreshTokenByHash = (tokenHash) => prisma.refreshToken.findUnique({
    where: { tokenHash },
});

export const revokeRefreshToken = (client, id) => client.refreshToken.updateMany({
    where: { id, revoked: false },
    data: { revoked: true },
});

export const getSafeUserById = (userId) => prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
});
