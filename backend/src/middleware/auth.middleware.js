import { unauthorized } from "../core/errors.js";

export const createAuthenticate = ({ tokens, User, Session }) =>
  async function authenticate(req, res, next) {
    const header = req.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw unauthorized("Please sign in", "NO_TOKEN");

    let claims;
    try {
      claims = tokens.verifyAccessToken(token);
    } catch {
      throw unauthorized("Your session needs refreshing", "TOKEN_INVALID");
    }

    const [session, user] = await Promise.all([
      Session.exists({ _id: claims.sessionId, revoked: false }),
      User.findById(claims.id).select("+password"),
    ]);

    if (!session || !user) throw unauthorized("Please sign in again", "SESSION_REVOKED");

    req.user = user;
    next();
  };
