import "dotenv/config";

const requiredEnv = [
    "DATABASE_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",

    port: Number(process.env.PORT) || 5000,

    databaseUrl: process.env.DATABASE_URL,

    redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        db: Number(process.env.REDIS_DB) || 0,
        password: process.env.REDIS_PASSWORD || undefined
    },

    bullmq: {
        prefix: process.env.BULLMQ_PREFIX || "taskflow"
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
    }
};