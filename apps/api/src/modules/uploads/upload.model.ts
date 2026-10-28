import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  week: { type: Number, required: true },
  day: { type: Number, required: true },
  objectKey: { type: String, required: true },
  filename: { type: String, required: true },
  mime: { type: String, required: true },
  size: { type: Number, required: true }
}, { timestamps: true });
schema.index({ userId: 1, week: 1, day: 1 });
export const Upload = mongoose.models.Upload || mongoose.model("Upload", schema);
