import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.middleware.js";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().max(60).optional(),
  city: z.string().trim().max(80).optional(),
  classStudying: z.string().trim().max(80).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const createDashboardRoutes = ({ dashboardService, authenticate }) => {
  const router = Router();
  router.use(authenticate);

  router.get("/", async (req, res) => {
    res.json(await dashboardService.getOverview(req.user));
  });

  router.put("/profile", validateBody(profileSchema), async (req, res) => {
    res.json({ user: await dashboardService.updateProfile(req.user, req.body) });
  });

  return router;
};
