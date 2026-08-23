import prisma from "../../config/database.js";
import { redis } from "../../config/redis.js";

export const healthCheck = async (req, res) => {
    let database = "down";
    let redisStatus = "down";

    try {
        await prisma.$queryRaw`SELECT 1`;
        database = "up";
    } catch (error) {
        database = "down";
    }

    try {
        await redis.ping();
        redisStatus = "up";
    } catch (error) {
        redisStatus = "down";
    }

    const healthy =
        database === "up" &&
        redisStatus === "up";

    return res.status(healthy ? 200 : 503).json({
        success: healthy,

        data: {
            status: healthy ? "healthy" : "unhealthy",
            services: {
                database,
                redis: redisStatus
            }
        }
    });
};