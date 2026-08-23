import IORedis from "ioredis";

const redis = new IORedis({
    host: "172.31.146.129",
    port: 6379,
    password: undefined,

    connectTimeout: 5000,
    maxRetriesPerRequest: 1
});

redis.on("connect", () => {
    console.log("Redis: connecting");
});

redis.on("ready", () => {
    console.log("Redis: READY");
});

redis.on("error", (error) => {
    console.error("Redis ERROR:", error);
});

try {
    const result = await redis.ping();
    console.log("PING RESULT:", result);
} catch (error) {
    console.error("PING FAILED:", error);
} finally {
    await redis.quit();
}