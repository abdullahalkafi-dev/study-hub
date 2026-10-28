import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  week: { type: Number, required: true },
  day: { type: Number, required: true },
  text: { type: String, default: "", maxlength: 20000 }
}, { timestamps: true });
schema.index({ userId: 1, week: 1, day: 1 }, { unique: true });
export const Note = mongoose.models.Note || mongoose.model("Note", schema);
