import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Hashes a plain-text password.
export const hashPassword = async (password) => {
    return await bcrypt.hash(
        password,
        SALT_ROUNDS
    );
};

// Compares a plain-text password with a hashed password.
export const comparePassword = async (
    plainPassword,
    hashedPassword
) => {
    return await bcrypt.compare(
        plainPassword,
        hashedPassword
    );
};