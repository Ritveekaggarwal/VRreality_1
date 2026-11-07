import { notFound } from "../../core/errors.js";

export const createRoadmapService = ({ Roadmap, ai }) => ({
  async generate(userId, { topics, duration, pace, tone }) {
    const chapters = await ai.generateRoadmap({ topics, duration, pace, tone });

    await Roadmap.updateMany({ userId, active: true }, { active: false });
    return Roadmap.create({
      userId,
      topics,
      durationMinutes: duration,
      pace,
      tone,
      chapters,
      active: true,
    });
  },

  async getCurrent(userId) {
    const roadmap = await Roadmap.findOne({ userId, active: true });
    if (!roadmap) throw notFound("No roadmap yet");
    return roadmap;
  },
});
