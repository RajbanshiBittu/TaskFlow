import IORedis from "ioredis";
import { env } from "./env.js";

export const redis = new IORedis({
    host: env.redis.host,
    port: env.redis.port,
    db: env.redis.db,
    password: env.redis.password,

    maxRetriesPerRequest: 20,

    enableReadyCheck: true
});

redis.on("connect", () => {
    console.log("Redis connecting...");
});

redis.on("ready", () => {
    console.log("Redis connected");
});

redis.on("error", (error) => {
    console.error("Redis error:", error.message);
});

redis.on("close", () => {
    console.log("Redis connection closed");
});

export const closeRedis = async () => {
    await redis.quit();

    console.log("Redis disconnected");
};