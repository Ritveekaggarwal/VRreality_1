import jwt from "jsonwebtoken";
import { AppError } from "../../core/errors.js";

const TTL_SECONDS = 6 * 60 * 60;
const AUDIENCE = "lesson-share";

/**
 * The QR code carries one of these instead of a lesson id. It expires, and it
 * only opens this one lesson, so a phone needs no sign-in but a guessed or
 * leaked lesson id gives nobody access.
 */
export const createShareTokens = ({ secret }) => ({
  sign(lessonId) {
    const token = jwt.sign({ lessonId: String(lessonId) }, secret, {
      expiresIn: TTL_SECONDS,
      algorithm: "HS256",
      audience: AUDIENCE,
    });
    return { token, expiresAt: new Date(Date.now() + TTL_SECONDS * 1000) };
  },

  verify(token) {
    try {
      return jwt.verify(token, secret, { algorithms: ["HS256"], audience: AUDIENCE }).lessonId;
    } catch {
      throw new AppError(
        410,
        "This QR code has expired. Please scan a fresh one from your classroom.",
        "SHARE_EXPIRED"
      );
    }
  },
});
