import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { AppError } from "../errors/AppError.js";

export const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
        return next(new AppError(
            "You do not have permission to perform this action.",
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.FORBIDDEN,
        ));
    }

    next();
};
