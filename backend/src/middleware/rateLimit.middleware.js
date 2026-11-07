import rateLimit from "express-rate-limit";

const limiter = (windowMinutes, limit, message, extra = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

export const createRateLimiters = ({ disabled = false } = {}) => {
  if (disabled) {
    const pass = (req, res, next) => next();
    return { general: pass, auth: pass, email: pass, ai: pass };
  }

  return {
    general: limiter(15, 600, "Too many requests. Please slow down."),
    auth: limiter(15, 30, "Too many attempts. Please try again in a few minutes."),
    email: limiter(15, 6, "Too many codes requested. Please try again later."),
    // Applied after authentication, so limits are per student rather than per IP.
    ai: limiter(10, 30, "You are going too fast. Please wait a moment.", {
      keyGenerator: (req) => String(req.user._id),
    }),
  };
};
