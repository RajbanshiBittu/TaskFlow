import express from "express";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { asyncHandler } from "../../utils/asyncHandler.util.js";
import { AppError } from "../../errors/AppError.js";
import { healthCheck } from "./health.controller.js";



const router = express.Router();

router.get("/", (req, res) => {
    return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Server is running successfully.",
    });
});

router.get(
    "/error-test",
    asyncHandler(async (req, res) => {
        throw new AppError(
            "This is a test error",
            HTTP_STATUS.BAD_REQUEST,
            "TEST_ERROR",
            { example: true }
        );
    })
);

// router.get("/", healthCheck);


export { router as healthRoutes};