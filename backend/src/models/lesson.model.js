import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const lessonSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap", required: true },
    chapterIndex: Number,
    topic: String,
    script: String,
    notes: { type: String, default: "" },
    doubts: { type: [doubtSchema], default: [] },
    conversationId: String,
    conversationUrl: String,
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonSchema.index({ userId: 1, roadmapId: 1, chapterIndex: 1 });

export default mongoose.model("Lesson", lessonSchema);
