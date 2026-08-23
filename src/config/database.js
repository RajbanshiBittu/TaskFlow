import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,

    log:
        process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
});

export const connectDatabase = async () => {
    try {
        await prisma.$connect();
        console.log("PostgreSQL connected");
    } catch (error) {
        console.error("PostgreSQL connection failed:", error);
        throw error;
    }
};

export const disconnectDatabase = async () => {
    await prisma.$disconnect();
    console.log("PostgreSQL disconnected");
};

export default prisma;