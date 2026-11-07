import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    otpHash: { type: String, required: true },
    type: { type: String, enum: ["verify", "reset"], default: "verify" },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Codes delete themselves after 5 minutes.
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
otpSchema.index({ email: 1, type: 1 });

export default mongoose.model("otps", otpSchema);
