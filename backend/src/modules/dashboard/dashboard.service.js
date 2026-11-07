import { conflict } from "../../core/errors.js";
import { toPublicUser } from "../auth/auth.service.js";

export const createDashboardService = ({ User, Roadmap, Lesson }) => ({
  async getOverview(user) {
    const roadmap = await Roadmap.findOne({ userId: user._id, active: true });
    const base = { user: toPublicUser(user) };

    if (!roadmap) {
      return { ...base, roadmap: null, lessons: [], completed: 0, total: 0, nextChapter: null };
    }

    const lessons = await Lesson.find({ userId: user._id, roadmapId: roadmap._id })
      .select("topic chapterIndex completed notes")
      .sort({ chapterIndex: 1 })
      .lean();

    // Progress comes from the roadmap, the single source of truth for chapters.
    const nextIndex = roadmap.chapters.findIndex((chapter) => !chapter.completed);

    return {
      ...base,
      roadmap: {
        id: String(roadmap._id),
        topics: roadmap.topics,
        chapterCount: roadmap.chapters.length,
      },
      lessons: lessons.map((lesson) => ({
        id: String(lesson._id),
        topic: lesson.topic,
        chapterIndex: lesson.chapterIndex,
        completed: lesson.completed,
        hasNotes: Boolean(lesson.notes),
      })),
      completed: roadmap.chapters.filter((chapter) => chapter.completed).length,
      total: roadmap.chapters.length,
      nextChapter:
        nextIndex === -1
          ? null
          : { index: nextIndex, title: roadmap.chapters[nextIndex].title },
    };
  },

  async updateProfile(user, changes) {
    if (changes.phone && changes.phone !== user.phone) {
      const taken = await User.exists({ phone: changes.phone, _id: { $ne: user._id } });
      if (taken) throw conflict("This phone number is already in use.");
    }
    Object.assign(user, changes);
    await user.save();
    return toPublicUser(user);
  },
});
