import { Router } from "express";
import { z } from "zod";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import { streamNotesPdf } from "./notes.pdf.js";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const startSchema = z.object({
  roadmapId: objectId,
  chapterIndex: z.number().int().min(0),
});
const doubtSchema = z.object({
  question: z.string().trim().min(1, "Type your doubt first").max(2000),
});
const notesSchema = z.object({ force: z.boolean().default(false) });
const lessonParams = z.object({ lessonId: objectId });

export const createLessonRoutes = ({ lessonService, authenticate, limits }) => {
  const router = Router();

  // Opened from a phone by QR code. The signed token is the credential.
  router.get("/shared/:token", async (req, res) => {
    res.json(await lessonService.readShared(req.params.token));
  });
  router.get("/shared/:token/notes.pdf", async (req, res) => {
    streamNotesPdf(await lessonService.getSharedForNotesDownload(req.params.token), res);
  });

  router.use(authenticate);

  router.post("/start", limits.ai, validateBody(startSchema), async (req, res) => {
    res.json(await lessonService.start({ userId: req.user._id, ...req.body }));
  });

  const lesson = Router({ mergeParams: true });
  router.use("/:lessonId", validateParams(lessonParams), lesson);

  lesson.post("/complete", async (req, res) => {
    res.json(await lessonService.complete(req.user._id, req.params.lessonId));
  });
  lesson.post("/doubt", limits.ai, validateBody(doubtSchema), async (req, res) => {
    res.json(await lessonService.askDoubt(req.user._id, req.params.lessonId, req.body.question));
  });
  lesson.post("/notes", limits.ai, validateBody(notesSchema), async (req, res) => {
    res.json({
      notes: await lessonService.generateNotes(req.user._id, req.params.lessonId, req.body),
    });
  });
  lesson.get("/notes.pdf", async (req, res) => {
    streamNotesPdf(await lessonService.getForNotesDownload(req.user._id, req.params.lessonId), res);
  });
  lesson.post("/share", async (req, res) => {
    res.json(await lessonService.createShareLink(req.user._id, req.params.lessonId));
  });

  return router;
};
