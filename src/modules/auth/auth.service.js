import { randomUUID } from "node:crypto";
import { Prisma } from "../../../generated/prisma/client.ts";

import prisma from "../../config/database.js";
import { env } from "../../config/env.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ROLES } from "../../constants/roles.js";
import { AppError } from "../../errors/AppError.js";
import { comparePassword, hashPassword } from "../../utils/password.util.js";
import { hashToken } from "../../utils/crypto.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../../utils/jwt.util.js";
import {
    createRefreshToken,
    createRegistration,
    findRefreshTokenByHash,
    findUserByEmail,
    revokeRefreshToken,
} from "./auth.repository.js";

const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;

const slugify = (value) => {
    const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${slug || "organization"}-${randomUUID().slice(0, 8)}`;
};

const safeMembership = (membership) => ({
    id: membership.id,
    role: membership.role,
    organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
    },
});

const safeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
});

const buildAuthResult = async (client, user, membership) => {
    const jti = randomUUID();
    const context = {
        userId: user.id,
        organizationId: membership.organizationId,
        membershipId: membership.id,
        role: membership.role,
    };
    const accessToken = generateAccessToken({ ...context, type: "access" });
    const refreshToken = generateRefreshToken({ ...context, type: "refresh", jti });

    await createRefreshToken(client, {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshLifetimeMs),
    });

    return {
        user: safeUser(user),
        organization: safeMembership(membership).organization,
        role: membership.role,
        accessToken,
        refreshToken,
        expiresIn: env.jwt.accessExpiresIn,
    };
};

// Until organization switching exists, use the first membership ordered by creation time.
const selectMembership = (user) => user.memberships[0];

export const register = async ({ name, email, password, organizationName }) => {
    const passwordHash = await hashPassword(password);
    const membershipId = randomUUID();
    const userId = randomUUID();
    const organizationId = randomUUID();

    try {
        return await prisma.$transaction(async (tx) => {
            const user = await createRegistration(tx, {
                user: { id: userId, name, email, passwordHash },
                organization: { id: organizationId, name: organizationName, slug: slugify(organizationName) },
                membership: { id: membershipId, role: ROLES.ORG_ADMIN },
            });
            const membership = user.memberships[0];
            return buildAuthResult(tx, { ...user, id: userId }, { ...membership, organizationId });
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new AppError("An account with that email already exists.", HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
        }
        throw error;
    }
};

export const login = async ({ email, password }) => {
    const user = await findUserByEmail(email);
    const validPassword = user ? await comparePassword(password, user.passwordHash) : false;
    const membership = user && selectMembership(user);

    if (!user || !validPassword || !membership) {
        throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS);
    }

    return prisma.$transaction((tx) => buildAuthResult(tx, user, membership));
};

export const refresh = async (rawRefreshToken) => {
    let payload;
    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch (error) {
        const code = error.name === "TokenExpiredError" ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_TOKEN;
        throw new AppError("Invalid refresh token.", HTTP_STATUS.UNAUTHORIZED, code);
    }

    if (payload.type !== "refresh" || !payload.jti || !payload.userId || !payload.membershipId || !payload.organizationId) {
        throw new AppError("Invalid refresh token.", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_TOKEN);
    }

    const storedToken = await findRefreshTokenByHash(hashToken(rawRefreshToken));
    if (!storedToken || storedToken.revoked || storedToken.expiresAt <= new Date() || storedToken.userId !== payload.userId) {
        throw new AppError("Refresh token is revoked or invalid.", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.REFRESH_TOKEN_REVOKED);
    }

    return prisma.$transaction(async (tx) => {
        const revoked = await revokeRefreshToken(tx, storedToken.id);
        if (revoked.count !== 1) {
            throw new AppError("Refresh token is revoked or invalid.", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.REFRESH_TOKEN_REVOKED);
        }

        const user = await tx.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                memberships: {
                    where: { id: payload.membershipId, organizationId: payload.organizationId },
                    include: { organization: true },
                },
            },
        });
        const membership = user?.memberships[0];
        if (!user || !membership) {
            throw new AppError("Organization membership is no longer valid.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
        }

        return buildAuthResult(tx, user, membership);
    });
};

export const logout = async (rawRefreshToken) => {
    const count = await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(rawRefreshToken), revoked: false },
        data: { revoked: true },
    });
    return { revoked: count.count > 0 };
};
