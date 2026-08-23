import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { env } from "../../src/config/env.js";
import { hashToken } from "../../src/utils/crypto.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../src/utils/jwt.util.js";
import { comparePassword, hashPassword } from "../../src/utils/password.util.js";
import { loginSchema, refreshSchema } from "../../src/modules/auth/auth.validation.js";

describe("authentication primitives", () => {
    it("hashes passwords with bcrypt cost 12 and compares them", async () => {
        const passwordHash = await hashPassword("correct-password");
        expect(passwordHash.startsWith("$2b$12$")).toBe(true);
        expect(await comparePassword("correct-password", passwordHash)).toBe(true);
        expect(await comparePassword("wrong-password", passwordHash)).toBe(false);
    });

    it("validates login and refresh payloads", () => {
        expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
        expect(loginSchema.safeParse({ email: "user@test.local", password: "password" }).success).toBe(true);
        expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
    });

    it("generates typed access and refresh tokens with the configured lifetimes", () => {
        const accessToken = generateAccessToken({ userId: "user", type: "access" });
        const refreshToken = generateRefreshToken({ userId: "user", type: "refresh", jti: "token" });
        const accessPayload = jwt.verify(accessToken, env.jwt.accessSecret);
        const refreshPayload = verifyRefreshToken(refreshToken);

        expect(accessPayload.type).toBe("access");
        expect(accessPayload.exp - accessPayload.iat).toBe(15 * 60);
        expect(refreshPayload.type).toBe("refresh");
        expect(refreshPayload.exp - refreshPayload.iat).toBe(7 * 24 * 60 * 60);
        expect(hashToken(refreshToken)).not.toBe(refreshToken);
    });

    it("rejects an expired refresh token", () => {
        const token = jwt.sign(
            { userId: "user", type: "refresh", jti: "expired" },
            env.jwt.refreshSecret,
            { expiresIn: -1 },
        );
        expect(() => verifyRefreshToken(token)).toThrow();
    });

    it("uses the same bcrypt contract as the seed data", async () => {
        const hash = await bcrypt.hash("seed-password", 12);
        expect(await comparePassword("seed-password", hash)).toBe(true);
    });
});
