import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  learning_objectives: [String],
  difficulty: Number,
  cognitive_load: Number,
  estimated_minutes: Number,
  status: { type: String, enum: ["READY", "LOCKED", "COMPLETED"], default: "LOCKED" },
  prerequisites: [Number],
  completed: { type: Boolean, default: false },
});

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topics: [String],
    durationMinutes: Number,
    pace: String,
    tone: String,
    chapters: [chapterSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roadmapSchema.index({ userId: 1, active: 1 });

export default mongoose.model("Roadmap", roadmapSchema);
