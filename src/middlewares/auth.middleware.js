import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { AppError } from "../errors/AppError.js";
import prisma from "../config/database.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";

export const authenticateUser = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(
            new AppError(
                ERROR_CODES.UNAUTHORIZED,
                "Authorization header is missing.",
                HTTP_STATUS.UNAUTHORIZED
            )
        );
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(
            new AppError(
                ERROR_CODES.INVALID_TOKEN,
                "Invalid authorization format.",
                HTTP_STATUS.UNAUTHORIZED
            )
        );
    }
    
    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch (error) {
        const code = error.name === "TokenExpiredError"
            ? ERROR_CODES.TOKEN_EXPIRED
            : ERROR_CODES.INVALID_TOKEN;
        return next(new AppError(
            code === ERROR_CODES.TOKEN_EXPIRED ? "Access token has expired." : "Invalid access token.",
            HTTP_STATUS.UNAUTHORIZED,
            code,
        ));
    }

    if (decoded.type !== "access" || !decoded.userId || !decoded.membershipId || !decoded.organizationId) {
        return next(new AppError("Invalid access token.", HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_TOKEN));
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true,
            name: true,
            email: true,
            memberships: {
                where: {
                    id: decoded.membershipId,
                    organizationId: decoded.organizationId,
                },
                include: { organization: true },
            },
        },
    });
    const membership = user?.memberships[0];

    if (!user || !membership) {
        return next(new AppError("You are not a member of this organization.", HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN));
    }

    req.user = user;
    req.organization = membership.organization;
    req.auth = {
        user,
        organization: membership.organization,
        membership,
        role: membership.role,
        userId: user.id,
        organizationId: membership.organizationId,
        membershipId: membership.id,
    };
    next();
});