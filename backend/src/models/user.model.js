import mongoose from "mongoose";

const requiredUnlessGoogle = function () {
  return !this.googleId;
};

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    dob: { type: Date, required: requiredUnlessGoogle },
    city: { type: String, trim: true },
    classStudying: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: requiredUnlessGoogle, trim: true },
    password: { type: String, required: requiredUnlessGoogle, select: false },
    // No default on purpose. A sparse index skips missing fields but not explicit
    // nulls, so `default: null` made the second email sign-up a duplicate key error.
    googleId: { type: String, unique: true, sparse: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 });

export default mongoose.model("User", userSchema);
