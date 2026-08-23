import IORedis from "ioredis";
import { env } from "../config/env.js";

export const createBullMQConnection = () => {
    return new IORedis({
        host: env.redis.host,
        port: env.redis.port,
        db: env.redis.db,
        password: env.redis.password,

        maxRetriesPerRequest: null
    });
};