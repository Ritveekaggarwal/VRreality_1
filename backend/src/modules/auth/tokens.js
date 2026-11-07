import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TTL = "15m";
const ALGORITHM = "HS256";

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Refresh tokens are random strings. Only their hash is stored. */
export const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");

export const createTokenService = ({ secret }) => ({
  signAccessToken: (userId, sessionId) =>
    jwt.sign({ id: String(userId), sessionId: String(sessionId) }, secret, {
      expiresIn: ACCESS_TTL,
      algorithm: ALGORITHM,
      audience: "api",
    }),

  verifyAccessToken: (token) =>
    jwt.verify(token, secret, { algorithms: [ALGORITHM], audience: "api" }),
});
