import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const COST = 11;
const LEGACY_SHA256 = /^[a-f0-9]{64}$/;

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const hashPassword = (password) => bcrypt.hash(password, COST);

/**
 * Checks a password against a bcrypt hash or an older unsalted SHA-256 hash.
 * needsRehash tells the caller to upgrade the stored hash after a legacy match.
 */
export const verifyPassword = async (password, storedHash) => {
  if (LEGACY_SHA256.test(storedHash)) {
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(sha256(password), "hex");
    return { valid: crypto.timingSafeEqual(actual, expected), needsRehash: true };
  }
  return { valid: await bcrypt.compare(password, storedHash), needsRehash: false };
};
