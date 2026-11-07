import { badRequest, forbidden, notFound } from "../../core/errors.js";
import { completeChapter, isChapterUnlocked } from "./progression.js";

const toLessonView = (lesson) => ({
  id: String(lesson._id),
  roadmapId: String(lesson.roadmapId),
  chapterIndex: lesson.chapterIndex,
  topic: lesson.topic,
  script: lesson.script,
  notes: lesson.notes,
  doubts: lesson.doubts,
  conversationId: lesson.conversationId ?? null,
  conversationUrl: lesson.conversationUrl ?? null,
  completed: lesson.completed,
});

export const createLessonService = ({ Lesson, Roadmap, ai, tavus, shareTokens }) => {
  // One lesson start at a time per chapter, so a double click or a remounted
  // page cannot pay for two scripts and two Tavus conversations.
  const startsInProgress = new Map();

  const findOwned = async (userId, lessonId) => {
    const lesson = await Lesson.findOne({ _id: lessonId, userId });
    if (!lesson) throw notFound("Lesson not found");
    return lesson;
  };

  const hasLiveConversation = async (lesson) => {
    if (!lesson.conversationId || !lesson.conversationUrl) return false;
    try {
      const conversation = await tavus.getConversation(lesson.conversationId);
      return conversation.status === "active";
    } catch {
      return false;
    }
  };

  const connectTeacher = async (lesson) => {
    if (!tavus.isConfigured) {
      return { available: false, error: "The AI teacher is not set up." };
    }
    if (await hasLiveConversation(lesson)) return { available: true, error: null };

    try {
      const conversation = await tavus.createConversation({
        title: lesson.topic,
        script: lesson.script,
      });
      lesson.conversationId = conversation.conversation_id;
      lesson.conversationUrl = conversation.conversation_url;
      await lesson.save();
      return { available: true, error: null };
    } catch (error) {
      console.error("Tavus unavailable:", error.message);
      lesson.conversationId = undefined;
      lesson.conversationUrl = undefined;
      await lesson.save();
      return { available: false, error: "The AI teacher is unavailable right now." };
    }
  };

  const startLesson = async ({ userId, roadmapId, chapterIndex }) => {
    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
    if (!roadmap) throw notFound("Roadmap not found");

    const chapter = roadmap.chapters[chapterIndex];
    if (!chapter) throw notFound("Chapter not found");

    if (!isChapterUnlocked(roadmap.chapters, chapterIndex)) {
      throw forbidden("Finish the previous chapter first.", "CHAPTER_LOCKED");
    }

    let lesson = await Lesson.findOne({ userId, roadmapId, chapterIndex }).sort({ updatedAt: -1 });

    if (!lesson) {
      const script = await ai.generateScript({
        title: chapter.title,
        description: chapter.description,
        learning_objectives: chapter.learning_objectives,
        estimated_minutes: chapter.estimated_minutes || 10,
        pace: roadmap.pace,
        tone: roadmap.tone,
      });
      lesson = await Lesson.create({
        userId,
        roadmapId,
        chapterIndex,
        topic: chapter.title,
        script,
      });
    }

    const teacher = await connectTeacher(lesson);

    return {
      lesson: toLessonView(lesson),
      chapter: {
        title: chapter.title,
        description: chapter.description,
        estimatedMinutes: chapter.estimated_minutes,
      },
      tavusAvailable: teacher.available,
      tavusError: teacher.error,
    };
  };

  return {
    start(input) {
      const key = `${input.userId}:${input.roadmapId}:${input.chapterIndex}`;
      if (!startsInProgress.has(key)) {
        startsInProgress.set(
          key,
          startLesson(input).finally(() => startsInProgress.delete(key))
        );
      }
      return startsInProgress.get(key);
    },

    async complete(userId, lessonId) {
      const lesson = await findOwned(userId, lessonId);
      const roadmap = await Roadmap.findOne({ _id: lesson.roadmapId, userId });
      if (!roadmap?.chapters[lesson.chapterIndex]) throw notFound("Chapter not found");

      completeChapter(roadmap.chapters, lesson.chapterIndex);
      await roadmap.save();

      lesson.completed = true;
      await lesson.save();

      // Stops Tavus billing for a class that has ended.
      if (lesson.conversationId && tavus.isConfigured) {
        tavus.endConversation(lesson.conversationId).catch((error) => {
          console.error("Could not end Tavus conversation:", error.message);
        });
      }

      return { lesson: toLessonView(lesson), roadmap };
    },

    async askDoubt(userId, lessonId, question) {
      const lesson = await findOwned(userId, lessonId);
      const answer = await ai.answerDoubt({
        topic: lesson.topic,
        question,
        lesson_context: lesson.script ?? "",
      });
      lesson.doubts.push({ question, answer });
      await lesson.save();
      return { question, answer };
    },

    async generateNotes(userId, lessonId, { force = false } = {}) {
      const lesson = await findOwned(userId, lessonId);
      if (lesson.notes && !force) return lesson.notes;
      if (!lesson.script) throw badRequest("This lesson has no script yet.");

      lesson.notes = await ai.generateNotes({
        title: lesson.topic,
        script: lesson.script,
        doubts: lesson.doubts.map(({ question, answer }) => ({ question, answer })),
      });
      await lesson.save();
      return lesson.notes;
    },

    async getForNotesDownload(userId, lessonId) {
      const lesson = await findOwned(userId, lessonId);
      if (!lesson.notes) throw notFound("Notes are not ready yet.");
      return lesson;
    },

    async createShareLink(userId, lessonId) {
      const lesson = await findOwned(userId, lessonId);
      return shareTokens.sign(lesson._id);
    },

    async readShared(token) {
      const lesson = await Lesson.findById(shareTokens.verify(token));
      if (!lesson) throw notFound("Lesson not found");
      return {
        topic: lesson.topic,
        conversationUrl: lesson.conversationUrl ?? null,
        hasNotes: Boolean(lesson.notes),
      };
    },

    async getSharedForNotesDownload(token) {
      const lesson = await Lesson.findById(shareTokens.verify(token));
      if (!lesson?.notes) throw notFound("Notes are not ready yet.");
      return lesson;
    },
  };
};
