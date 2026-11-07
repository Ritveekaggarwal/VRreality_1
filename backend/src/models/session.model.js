import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    // Kept briefly after rotation so two tabs refreshing at once both succeed.
    previousTokenHash: { type: String, index: true },
    rotatedAt: { type: Date },
    ip: { type: String },
    userAgent: { type: String },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
