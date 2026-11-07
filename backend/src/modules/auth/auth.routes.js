import { Router } from "express";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
  emailSchema,
  googleSchema,
  loginSchema,
  otpSchema,
  registerSchema,
  resetSchema,
} from "./auth.schemas.js";

export const createAuthRoutes = ({ controller, authenticate, limits }) => {
  const router = Router();

  router.post("/register", limits.email, validateBody(registerSchema), controller.register);
  router.post("/login", limits.auth, validateBody(loginSchema), controller.login);
  router.post("/google", limits.auth, validateBody(googleSchema), controller.google);
  router.post("/verify-email", limits.auth, validateBody(otpSchema), controller.verifyEmail);
  router.post("/resend-otp", limits.email, validateBody(emailSchema), controller.resendOtp);
  router.post("/forgot-password", limits.email, validateBody(emailSchema), controller.forgotPassword);
  router.post("/verify-reset-otp", limits.auth, validateBody(otpSchema), controller.verifyResetOtp);
  router.post("/reset-password", limits.auth, validateBody(resetSchema), controller.resetPassword);

  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.post("/logout-all", authenticate, controller.logoutAll);
  router.get("/me", authenticate, controller.me);

  return router;
};
