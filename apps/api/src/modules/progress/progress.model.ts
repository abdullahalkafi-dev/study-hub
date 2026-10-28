import mongoose from "mongoose";

export const PARTS = ["recall", "math", "physics", "notes"] as const;

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  week: { type: Number, required: true, min: 1, max: 34 },
  day: { type: Number, required: true, min: 1, max: 6 },
  part: { type: String, required: true, enum: PARTS }
}, { timestamps: true });
schema.index({ userId: 1, week: 1, day: 1, part: 1 }, { unique: true });
export const Progress = mongoose.models.Progress || mongoose.model("Progress", schema);
