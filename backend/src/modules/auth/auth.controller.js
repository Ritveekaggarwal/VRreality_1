import { REFRESH_TTL_MS } from "./tokens.js";
import { toPublicUser } from "./auth.service.js";

const COOKIE = "refreshToken";

export const createAuthController = ({ authService, isProduction }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    // The browser only ever talks to the frontend's own origin (see vercel.json),
    // so this is a first-party cookie and Lax works on every browser.
    sameSite: "lax",
    path: "/api/auth",
  };

  const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });

  const sendSession = (res, { user, accessToken, refreshToken }) => {
    if (refreshToken) {
      res.cookie(COOKIE, refreshToken, { ...cookieOptions, maxAge: REFRESH_TTL_MS });
    }
    res.json({ user, accessToken });
  };

  return {
    async register(req, res) {
      const result = await authService.register(req.body);
      res.status(201).json({ message: "Check your email for a code", ...result });
    },
    async login(req, res) {
      sendSession(res, await authService.login(req.body, meta(req)));
    },
    async google(req, res) {
      sendSession(res, await authService.googleLogin(req.body, meta(req)));
    },
    async verifyEmail(req, res) {
      sendSession(res, await authService.verifyEmail(req.body, meta(req)));
    },
    async resendOtp(req, res) {
      await authService.resendVerification(req.body);
      res.json({ message: "If that account needs verifying, a new code is on its way." });
    },
    async forgotPassword(req, res) {
      await authService.forgotPassword(req.body);
      res.json({ message: "If that account exists, a code is on its way." });
    },
    async verifyResetOtp(req, res) {
      await authService.checkResetCode(req.body);
      res.json({ message: "Code verified" });
    },
    async resetPassword(req, res) {
      await authService.resetPassword(req.body);
      res.json({ message: "Password updated. Please sign in." });
    },
    async refresh(req, res) {
      sendSession(res, await authService.refresh(req.cookies[COOKIE]));
    },
    me(req, res) {
      res.json({ user: toPublicUser(req.user) });
    },
    async logout(req, res) {
      await authService.logout(req.cookies[COOKIE]);
      res.clearCookie(COOKIE, cookieOptions);
      res.json({ message: "Signed out" });
    },
    async logoutAll(req, res) {
      await authService.logoutAll(req.user._id);
      res.clearCookie(COOKIE, cookieOptions);
      res.json({ message: "Signed out everywhere" });
    },
  };
};
