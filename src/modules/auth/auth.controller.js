import { asyncHandler } from "../../utils/asyncHandler.util.js";
import { sendSuccessResponse } from "../../utils/response.util.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return sendSuccessResponse(res, { statusCode: 201, message: "Registration successful.", data });
});

export const login = asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return sendSuccessResponse(res, { message: "Login successful.", data });
});

export const refresh = asyncHandler(async (req, res) => {
    const data = await authService.refresh(req.body.refreshToken);
    return sendSuccessResponse(res, { message: "Token refreshed successfully.", data });
});

export const logout = asyncHandler(async (req, res) => {
    const data = await authService.logout(req.body.refreshToken);
    return sendSuccessResponse(res, { message: "Logout successful.", data });
});
