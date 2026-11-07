import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate.middleware.js";

const generateSchema = z.object({
  topics: z
    .array(z.string().trim().min(1).max(120))
    .min(1, "Add at least one topic")
    .max(6, "You can add up to 6 topics"),
  duration: z.coerce
    .number({ error: "Enter your study time in minutes" })
    .int()
    .min(5, "Study time must be at least 5 minutes")
    .max(6000, "Study time must be under 6000 minutes"),
  pace: z.enum(["slow", "moderate", "fast"]),
  tone: z.enum(["beginner", "technical", "practical"]),
});

export const createRoadmapRoutes = ({ roadmapService, authenticate, limits }) => {
  const router = Router();
  router.use(authenticate);

  router.post("/generate", limits.ai, validateBody(generateSchema), async (req, res) => {
    const roadmap = await roadmapService.generate(req.user._id, req.body);
    res.status(201).json({ roadmap });
  });

  router.get("/current", async (req, res) => {
    res.json({ roadmap: await roadmapService.getCurrent(req.user._id) });
  });

  return router;
};
